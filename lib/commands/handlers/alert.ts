import type { CommandContext, CommandResult } from '../types';
import { createClient } from '@/lib/supabase/server';

export async function handleAlert(
  ctx: CommandContext
): Promise<CommandResult> {
  const type = ctx.args[0]; // 'price' or 'keyword'
  const target = ctx.args[1];
  const threshold = ctx.args[2];

  if (!type || !target) {
    return {
      status: 'error',
      message: 'Usage: /alert <price|keyword> <target> [threshold]',
    };
  }

  const supabase = await createClient();

  const alertData: any = {
    groupId: ctx.groupId,
    userId: ctx.userId,
    alertType: type,
    isActive: true,
  };

  if (type === 'price' && threshold) {
    alertData.targetSymbol = target.toUpperCase();
    alertData.threshold = parseFloat(threshold);
    alertData.direction = 'above'; // Default
  } else if (type === 'keyword') {
    alertData.targetKeyword = target.toLowerCase();
  } else {
    return {
      status: 'error',
      message: 'Invalid alert type. Use "price" or "keyword"',
    };
  }

  const { error } = await supabase.from('ChatAlert').insert(alertData);

  if (error) {
    return {
      status: 'error',
      message: 'Failed to create alert',
      detail: error.message,
    };
  }

  return {
    status: 'ok',
    message: `${type} alert created for "${target}"`,
  };
}
