import { createClient } from '@/lib/supabase/server';
import { CommandContext, CommandResult } from '../types';

export async function handleContext(
  ctx: CommandContext,
  args: string[]
): Promise<CommandResult> {
  if (args.length === 0) {
    return {
      status: 'error',
      message: 'Missing argument',
      detail: 'Use: /context on or /context off',
    };
  }

  const setting = args[0].toLowerCase();

  if (setting !== 'on' && setting !== 'off') {
    return {
      status: 'error',
      message: 'Invalid argument',
      detail: 'Use: on or off',
    };
  }

  const enabled = setting === 'on';

  const supabase = await createClient();

  // Upsert context setting
  const { error } = await supabase.from('chat_context_setting').upsert(
    {
      group_id: ctx.groupId,
      context_enabled: enabled,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: 'group_id',
    }
  );

  if (error) {
    return {
      status: 'error',
      message: 'Failed to update context setting',
      detail: error.message,
    };
  }

  const message = enabled
    ? '✅ Context enabled - Agent will use chat history'
    : '✅ Context disabled - Agent will use public data only';

  return {
    status: 'ok',
    message,
  };
}
