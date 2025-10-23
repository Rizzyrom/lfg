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

  try {
    // Call internal feed polling API
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/feed/poll`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        groupId: ctx.groupId,
      }),
    });

    if (!response.ok) {
      return {
        status: 'error',
        message: 'Feed refresh failed',
        detail: `HTTP ${response.status}`,
      };
    }

    const data = await response.json();

    // Also trigger n8n webhook if configured (for backward compatibility)
    const n8nUrl = process.env.N8N_WEBHOOK_URL;
    if (n8nUrl) {
      fetch(n8nUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId: ctx.groupId, trigger: 'manual' }),
      }).catch((err) => console.error('n8n webhook error:', err));
    }

    return {
      status: 'ok',
      message: `🔄 Feed refreshed: ${data.stats.x} X, ${data.stats.reddit} Reddit, ${data.stats.news} News`,
    };
  } catch (error: any) {
    return {
      status: 'error',
      message: 'Feed refresh failed',
      detail: error.message,
    };
  }
}
