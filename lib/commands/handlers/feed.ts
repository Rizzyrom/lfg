import { CommandContext, CommandResult } from '../types';

export async function handleFeed(
  ctx: CommandContext,
  args: string[]
): Promise<CommandResult> {
  if (args[0] !== 'refresh') {
    return {
      status: 'error',
      message: 'Invalid subcommand',
      detail: 'Use: /feed refresh',
    };
  }

  // Call n8n webhook to refresh feed
  const n8nUrl = process.env.N8N_WEBHOOK_URL;

  if (!n8nUrl) {
    return {
      status: 'error',
      message: 'Feed refresh not configured',
      detail: 'N8N_WEBHOOK_URL missing',
    };
  }

  try {
    const response = await fetch(n8nUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        groupId: ctx.groupId,
        trigger: 'manual',
      }),
    });

    if (!response.ok) {
      return {
        status: 'error',
        message: 'Feed refresh failed',
        detail: `HTTP ${response.status}`,
      };
    }

    return {
      status: 'ok',
      message: '🔄 Feed refresh triggered',
    };
  } catch (error: any) {
    return {
      status: 'error',
      message: 'Feed refresh failed',
      detail: error.message,
    };
  }
}
