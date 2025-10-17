import { CommandContext, CommandResult } from '../types';

export async function handleAsk(
  ctx: CommandContext,
  args: string[]
): Promise<CommandResult> {
  if (args.length === 0) {
    return {
      status: 'error',
      message: 'Missing question',
      detail: 'Use: /ask <your question>',
    };
  }

  const question = args.join(' ');

  // Call agent API
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/agent/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question,
        groupId: ctx.groupId,
        userId: ctx.userId,
      }),
    });

    if (!response.ok) {
      return {
        status: 'error',
        message: 'Agent request failed',
        detail: `HTTP ${response.status}`,
      };
    }

    const data = await response.json();

    return {
      status: 'ok',
      message: data.answer || 'No response from agent',
      data: data.sources,
    };
  } catch (error: any) {
    return {
      status: 'error',
      message: 'Agent failed',
      detail: error.message,
    };
  }
}
