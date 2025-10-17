import type { CommandContext, CommandResult } from '../types';
import { createClient } from '@/lib/supabase/server';

export async function handlePin(
  ctx: CommandContext,
  args: string[]
): Promise<CommandResult> {
  const messageId = args[0];

  if (!messageId) {
    return {
      status: 'error',
      message: 'Usage: /pin <message_id>',
    };
  }

  const supabase = await createClient();

  // Insert pin
  const { error } = await supabase.from('ChatPin').insert({
    groupId: ctx.groupId,
    messageId,
    pinnedBy: ctx.userId,
  });

  if (error) {
    return {
      status: 'error',
      message: 'Failed to pin message',
      detail: error.message,
    };
  }

  return {
    status: 'ok',
    message: 'Message pinned successfully',
  };
}
