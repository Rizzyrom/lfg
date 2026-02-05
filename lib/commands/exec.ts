import { createClient } from '@/lib/supabase/server';
import { CommandContext, CommandResult, RateLimitStatus } from './types';
import { parseCommand } from './parse';
import { findCommand } from './registry';
import * as handlers from './handlers';

// In-memory rate limit store (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMIT_WINDOW = 5 * 60 * 1000; // 5 minutes
const RATE_LIMIT_MAX = 10; // 10 commands per window

/**
 * Check rate limit for user in group
 */
async function checkRateLimit(
  userId: string,
  groupId: string
): Promise<RateLimitStatus> {
  const key = `${userId}:${groupId}`;
  const now = Date.now();

  const entry = rateLimitStore.get(key);

  if (!entry || entry.resetAt < now) {
    // Create new window
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW,
    });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1 };
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(entry.resetAt),
    };
  }

  entry.count++;
  return {
    allowed: true,
    remaining: RATE_LIMIT_MAX - entry.count,
  };
}

/**
 * Log system event to database
 */
async function logSystemEvent(
  ctx: CommandContext,
  command: string,
  args: any,
  status: 'ok' | 'error',
  detail?: string
) {
  try {
    const supabase = await createClient();
    await supabase.from('SystemEvent').insert({
      groupId: ctx.groupId,
      userId: ctx.userId,
      command,
      args,
      status,
      detail,
    });
  } catch (error) {
    console.error('Failed to log system event:', error);
  }
}

/**
 * Execute a command
 */
export async function executeCommand(
  ctx: CommandContext
): Promise<CommandResult> {
  // Parse command
  const parsed = parseCommand(ctx.raw);

  if (!parsed) {
    return {
      status: 'error',
      message: 'Invalid command format',
    };
  }

  // Find command metadata
  const cmdMeta = findCommand(parsed.command);

  if (!cmdMeta) {
    return {
      status: 'error',
      message: `Unknown command: ${parsed.command}`,
      detail: 'Type /help to see available commands',
    };
  }

  // Check rate limit
  const rateLimit = await checkRateLimit(ctx.userId, ctx.groupId);

  if (!rateLimit.allowed) {
    await logSystemEvent(
      ctx,
      parsed.command,
      parsed.args,
      'error',
      'Rate limited'
    );
    return {
      status: 'error',
      message: 'Rate limit exceeded',
      detail: `Try again at ${rateLimit.resetAt?.toLocaleTimeString()}`,
    };
  }

  // Verify group membership
  const supabase = await createClient();
  const { data: membership } = await supabase
    .from('Membership')
    .select('role')
    .eq('groupId', ctx.groupId)
    .eq('userId', ctx.userId)
    .single();

  if (!membership) {
    return {
      status: 'error',
      message: 'Access denied',
    };
  }

  // Check permission
  if (cmdMeta.perm === 'admin' && membership.role !== 'admin' && membership.role !== 'owner') {
    return {
      status: 'error',
      message: 'Admin permission required',
    };
  }

  if (cmdMeta.perm === 'owner' && membership.role !== 'owner') {
    return {
      status: 'error',
      message: 'Owner permission required',
    };
  }

  // Route to handler
  let result: CommandResult;

  try {
    switch (parsed.command) {
      case 'help':
      case '?':
        result = await handlers.handleHelp(ctx, parsed.args);
        break;
      case 'summarize':
      case 'sum':
        result = await handlers.handleSummarize(ctx, parsed.args);
        break;
      case 'analyze':
      case 'a':
        result = await handlers.handleAnalyze(ctx, parsed.args);
        break;
      case 'alert':
        result = await handlers.handleAlert(ctx, parsed.args);
        break;
      case 'pin':
        result = await handlers.handlePin(ctx, parsed.args);
        break;
      default:
        result = {
          status: 'error',
          message: `Unknown command: ${parsed.command}`,
        };
    }
  } catch (error: any) {
    console.error('Command execution error:', error);
    result = {
      status: 'error',
      message: 'Command failed',
      detail: error.message,
    };
  }

  // Log event
  await logSystemEvent(
    ctx,
    parsed.command,
    parsed.args,
    result.status,
    result.detail
  );

  return result;
}
