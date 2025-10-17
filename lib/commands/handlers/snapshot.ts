import { createClient } from '@/lib/supabase/server';
import { CommandContext, CommandResult } from '../types';

export async function handleSnapshot(
  ctx: CommandContext,
  args: string[]
): Promise<CommandResult> {
  const limit = args[0] ? parseInt(args[0], 10) : 50;

  if (isNaN(limit) || limit < 1 || limit > 200) {
    return {
      status: 'error',
      message: 'Invalid limit',
      detail: 'Provide a number between 1-200',
    };
  }

  const supabase = await createClient();

  // Fetch last N messages
  const { data: messages, error } = await supabase
    .from('msg')
    .select('content, created_at')
    .eq('group_id', ctx.groupId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !messages || messages.length === 0) {
    return {
      status: 'error',
      message: 'No messages to snapshot',
    };
  }

  // Build snapshot text
  const snapshotText = messages
    .reverse()
    .map((m) => m.content)
    .join('\n\n');

  const title = `Chat Snapshot - ${new Date().toLocaleDateString()}`;

  // Insert into public_feed_item
  const { error: insertError } = await supabase.from('public_feed_item').insert({
    title,
    text: snapshotText.substring(0, 5000), // Limit length
    category: 'market', // Default to market
    source: 'internal_chat_snapshot',
    group_id: ctx.groupId,
    created_at: new Date().toISOString(),
  });

  if (insertError) {
    return {
      status: 'error',
      message: 'Failed to save snapshot',
      detail: insertError.message,
    };
  }

  return {
    status: 'ok',
    message: `📸 Snapshot saved (${messages.length} messages)`,
  };
}
