import { createClient } from '@/lib/supabase/server';
import { CommandContext, CommandResult } from '../types';

export async function handleAlert(
  ctx: CommandContext,
  args: string[]
): Promise<CommandResult> {
  if (args.length < 2) {
    return {
      status: 'error',
      message: 'Invalid syntax',
      detail: 'Usage: /alert SYMBOL >PRICE or /alert SYMBOL keyword:WORD',
    };
  }

  const symbol = args[0].toUpperCase();
  const conditionArg = args.slice(1).join(' ');

  // Parse condition
  let kind: 'price' | 'keyword';
  let condition: any;

  if (conditionArg.startsWith('>')) {
    kind = 'price';
    const price = parseFloat(conditionArg.substring(1));
    if (isNaN(price)) {
      return {
        status: 'error',
        message: 'Invalid price',
        detail: 'Use format: >900',
      };
    }
    condition = { gt: price };
  } else if (conditionArg.startsWith('<')) {
    kind = 'price';
    const price = parseFloat(conditionArg.substring(1));
    if (isNaN(price)) {
      return {
        status: 'error',
        message: 'Invalid price',
        detail: 'Use format: <900',
      };
    }
    condition = { lt: price };
  } else if (conditionArg.startsWith('keyword:')) {
    kind = 'keyword';
    const keyword = conditionArg.substring(8).trim();
    if (!keyword) {
      return {
        status: 'error',
        message: 'Invalid keyword',
        detail: 'Use format: keyword:earnings',
      };
    }
    condition = { keyword };
  } else {
    return {
      status: 'error',
      message: 'Invalid condition',
      detail: 'Use >PRICE, <PRICE, or keyword:WORD',
    };
  }

  const supabase = await createClient();

  // Create alert
  const { error } = await supabase.from('chat_alert').insert({
    group_id: ctx.groupId,
    user_id: ctx.userId,
    symbol,
    kind,
    condition,
    active: true,
  });

  if (error) {
    return {
      status: 'error',
      message: 'Failed to create alert',
      detail: error.message,
    };
  }

  let message = `✅ Alert created for **${symbol}**\n`;
  if (kind === 'price') {
    const op = condition.gt ? '>' : '<';
    const price = condition.gt || condition.lt;
    message += `Trigger: Price ${op} $${price}`;
  } else {
    message += `Trigger: Keyword "${condition.keyword}"`;
  }

  return {
    status: 'ok',
    message,
  };
}
