import type { CommandContext, CommandResult } from '../types';
import { createClient } from '@/lib/supabase/server';

export async function handleContext(
  ctx: CommandContext
): Promise<CommandResult> {
  const action = ctx.args[0]; // 'on' or 'off'

  if (!action || (action !== 'on' && action !== 'off')) {
    return {
      status: 'error',
      message: 'Usage: /context <on|off>',
    };
  }

  const supabase = await createClient();
  const enabled = action === 'on';

  const { error } = await supabase.from('ChatContextSetting').upsert({
    groupId: ctx.groupId,
    contextEnabled: enabled,
  });

  if (error) {
    return {
      status: 'error',
      message: 'Failed to update context setting',
      detail: error.message,
    };
  }

  return {
    status: 'ok',
    message: `Agent context ${enabled ? 'enabled' : 'disabled'}`,
  };
}
