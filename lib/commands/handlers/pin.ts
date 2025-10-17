import { createClient } from '@/lib/supabase/server';
import { CommandContext, CommandResult } from '../types';

export async function handlePin(
  ctx: CommandContext,
  args: string[]
): Promise<CommandResult> {
  if (!ctx.messageId) {
    return {
      status: 'error',
      message: 'No message selected',
      detail: 'Use this command on a specific message',
    };
  }

  const supabase = await createClient();

  // Check if already pinned
  const { data: existing } = await supabase
    .from('chat_pin')
    .select('id')
    .eq('group_id', ctx.groupId)
    .eq('message_id', ctx.messageId)
    .single();

  if (existing) {
    return {
      status: 'error',
      message: 'Message already pinned',
    };
  }

  // Create pin
  const { error } = await supabase.from('chat_pin').insert({
    group_id: ctx.groupId,
    message_id: ctx.messageId,
    user_id: ctx.userId,
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
    message: '📌 Message pinned',
  };
}
