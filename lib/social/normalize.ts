/**
 * Normalize and validate social links
 */

import * as x from './x';
import * as reddit from './reddit';

export interface SocialSource {
  platform: 'x' | 'reddit';
  handle: string;
  url: string;
  displayName?: string;
}

/**
 * Detect and normalize social links from text
 */
export async function detectSocialLinks(
  text: string
): Promise<SocialSource[]> {
  const sources: SocialSource[] = [];

  // X (Twitter) links
  const xHandles = x.extractHandles(text);
  for (const handle of xHandles) {
    const normalized = x.normalizeHandle(handle);
    const user = await x.validateHandle(normalized);

    if (user) {
      sources.push({
        platform: 'x',
        handle: normalized,
        url: x.buildProfileUrl(normalized),
        displayName: user.name,
      });
    } else {
      // Add anyway if validation fails (no API key)
      sources.push({
        platform: 'x',
        handle: normalized,
        url: x.buildProfileUrl(normalized),
      });
    }
  }

  // Reddit links
  const redditLinks = reddit.extractRedditLinks(text);
  for (const link of redditLinks) {
    const target = reddit.extractSubredditOrUser(link);
    if (target) {
      const valid = await reddit.validateRedditTarget(target);
      if (valid) {
        sources.push({
          platform: 'reddit',
          handle: reddit.getHandle(target),
          url: reddit.buildRedditUrl(target),
        });
      }
    }
  }

  return sources;
}

/**
 * Validate a single social handle/URL
 */
export async function validateSocialSource(
  platform: 'x' | 'reddit',
  handleOrUrl: string
): Promise<SocialSource | null> {
  if (platform === 'x') {
    const normalized = x.normalizeHandle(handleOrUrl);
    const user = await x.validateHandle(normalized);

    if (user || !process.env.X_BEARER_TOKEN) {
      return {
        platform: 'x',
        handle: normalized,
        url: x.buildProfileUrl(normalized),
        displayName: user?.name,
      };
    }

    return null;
  }

  if (platform === 'reddit') {
    // Try parsing as notation (r/sub or u/user)
    let target = reddit.parseRedditNotation(handleOrUrl);

    // Try parsing as URL
    if (!target) {
      target = reddit.extractSubredditOrUser(handleOrUrl);
    }

    if (!target) {
      return null;
    }

    const valid = await reddit.validateRedditTarget(target);

    if (valid) {
      return {
        platform: 'reddit',
        handle: reddit.getHandle(target),
        url: reddit.buildRedditUrl(target),
      };
    }

    return null;
  }

  return null;
}
