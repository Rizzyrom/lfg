import type { CommandContext, CommandResult } from '../types';
import { createClient } from '@/lib/supabase/server';
import { validateSocialSource } from '../../social/normalize';

export async function handleWhois(
  ctx: CommandContext
): Promise<CommandResult> {
  const input = ctx.args[0];

  if (!input) {
    return {
      status: 'error',
      message: 'Usage: /whois <@username|url>',
    };
  }

  // Detect platform
  let platform: 'x' | 'reddit' = 'x';
  let handle = input;

  if (input.includes('reddit.com')) {
    platform = 'reddit';
  } else if (input.startsWith('@')) {
    handle = input.slice(1);
  }

  const source = await validateSocialSource(platform, handle);

  if (!source) {
    return {
      status: 'error',
      message: `Could not find ${platform} account: ${handle}`,
    };
  }

  const supabase = await createClient();

  // Auto-subscribe
  const { error } = await supabase.from('SocialFeedSource').upsert({
    groupId: ctx.groupId,
    platform: source.platform,
    handle: source.handle,
    platformId: null,
    addedById: ctx.userId,
  });

  if (error) {
    return {
      status: 'error',
      message: 'Failed to subscribe',
      detail: error.message,
    };
  }

  return {
    status: 'ok',
    message: `Subscribed to ${source.platform}/${source.handle}`,
    detail: source.url,
  };
}
