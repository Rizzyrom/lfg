import type { CommandContext, CommandResult } from '../types';
import { createClient } from '@/lib/supabase/server';

export async function handleSnapshot(
  ctx: CommandContext
): Promise<CommandResult> {
  const limitArg = ctx.args[0];
  const limit = limitArg ? parseInt(limitArg, 10) : 20;

  if (isNaN(limit) || limit < 1 || limit > 100) {
    return {
      status: 'error',
      message: 'Invalid limit. Use a number between 1 and 100.',
    };
  }

  // TODO: Implement snapshot functionality when public_feed_item table is added
  return {
    status: 'ok',
    message: `Snapshot feature not yet implemented. Will save last ${limit} messages to public feed.`,
  };
}
