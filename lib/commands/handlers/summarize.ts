import type { CommandContext, CommandResult } from '../types';

export async function handleSummarize(
  ctx: CommandContext
): Promise<CommandResult> {
  const countArg = ctx.args[0];
  const count = countArg ? parseInt(countArg, 10) : 10;

  if (isNaN(count) || count < 1 || count > 100) {
    return {
      status: 'error',
      message: 'Invalid count. Use a number between 1 and 100.',
    };
  }

  // TODO: Implement summarization when message decryption is available
  return {
    status: 'ok',
    message: `Summarize feature not yet implemented. Will analyze last ${count} messages.`,
  };
}
