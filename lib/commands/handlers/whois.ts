import { createClient } from '@/lib/supabase/server';
import { CommandContext, CommandResult } from '../types';
import { validateSocialSource } from '@/lib/social/normalize';

export async function handleWhois(
  ctx: CommandContext,
  args: string[]
): Promise<CommandResult> {
  if (args.length === 0) {
    return {
      status: 'error',
      message: 'Missing argument',
      detail: 'Provide a handle like @username or r/subreddit',
    };
  }

  const input = args.join(' ');

  // Detect platform
  let platform: 'x' | 'reddit';

  if (input.startsWith('@') || input.includes('twitter.com') || input.includes('x.com')) {
    platform = 'x';
  } else if (input.startsWith('r/') || input.startsWith('u/') || input.includes('reddit.com')) {
    platform = 'reddit';
  } else {
    return {
      status: 'error',
      message: 'Unknown platform',
      detail: 'Use @handle for X or r/sub for Reddit',
    };
  }

  // Validate and normalize
  const source = await validateSocialSource(platform, input);

  if (!source) {
    return {
      status: 'error',
      message: `${platform === 'x' ? 'X' : 'Reddit'} account not found`,
      detail: input,
    };
  }

  const supabase = await createClient();

  // Upsert into social_feed_source
  const { error } = await supabase.from('social_feed_source').upsert(
    {
      group_id: ctx.groupId,
      platform: source.platform,
      handle: source.handle,
      url: source.url,
      added_by: ctx.userId,
    },
    {
      onConflict: 'group_id,platform,handle',
    }
  );

  if (error) {
    return {
      status: 'error',
      message: 'Failed to add source',
      detail: error.message,
    };
  }

  let message = `✅ Added **${source.handle}** to social sources\n`;
  message += `Platform: ${platform === 'x' ? 'X (Twitter)' : 'Reddit'}\n`;
  if (source.displayName) {
    message += `Name: ${source.displayName}\n`;
  }
  message += `\n[View Profile](${source.url})`;

  return {
    status: 'ok',
    message,
    data: source,
  };
}
