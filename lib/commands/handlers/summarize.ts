import { createClient } from '@/lib/supabase/server';
import { CommandContext, CommandResult } from '../types';

export async function handleSummarize(
  ctx: CommandContext,
  args: string[]
): Promise<CommandResult> {
  const limit = args[0] ? parseInt(args[0], 10) : 100;

  if (isNaN(limit) || limit < 1 || limit > 1000) {
    return {
      status: 'error',
      message: 'Invalid limit',
      detail: 'Provide a number between 1-1000',
    };
  }

  const supabase = await createClient();

  // Fetch last N messages (metadata only, privacy-safe)
  const { data: messages, error } = await supabase
    .from('msg')
    .select('id, content, created_at')
    .eq('group_id', ctx.groupId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !messages) {
    return {
      status: 'error',
      message: 'Failed to fetch messages',
      detail: error?.message,
    };
  }

  if (messages.length === 0) {
    return {
      status: 'ok',
      message: 'No messages to summarize',
    };
  }

  // Extract key topics (simple keyword extraction)
  const allText = messages.map((m) => m.content).join(' ');
  const words = allText
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 4); // Filter short words

  const wordFreq = new Map<string, number>();
  words.forEach((word) => {
    wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
  });

  // Top 10 keywords
  const topKeywords = Array.from(wordFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word, count]) => `${word} (${count})`);

  // Time range
  const oldest = messages[messages.length - 1].created_at;
  const newest = messages[0].created_at;

  const summary = `
## Chat Summary (Last ${messages.length} messages)

**Time Range:** ${new Date(oldest).toLocaleString()} - ${new Date(newest).toLocaleString()}

**Top Topics:**
${topKeywords.map((k) => `• ${k}`).join('\n')}

**Total Messages:** ${messages.length}
  `.trim();

  return {
    status: 'ok',
    message: summary,
  };
}
