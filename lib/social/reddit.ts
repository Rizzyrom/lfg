/**
 * Reddit social helpers
 */

export interface RedditTarget {
  type: 'subreddit' | 'user';
  name: string;
}

/**
 * Extract subreddit or user from URL
 */
export function extractSubredditOrUser(url: string): RedditTarget | null {
  // Subreddit: reddit.com/r/subreddit or reddit.com/r/subreddit/...
  const subredditMatch = url.match(/reddit\.com\/r\/([a-zA-Z0-9_]+)/i);
  if (subredditMatch) {
    return {
      type: 'subreddit',
      name: subredditMatch[1],
    };
  }

  // User: reddit.com/u/username or reddit.com/user/username
  const userMatch = url.match(/reddit\.com\/(?:u|user)\/([a-zA-Z0-9_-]+)/i);
  if (userMatch) {
    return {
      type: 'user',
      name: userMatch[1],
    };
  }

  return null;
}

/**
 * Parse r/subreddit or u/username notation
 */
export function parseRedditNotation(text: string): RedditTarget | null {
  const subredditMatch = text.match(/^r\/([a-zA-Z0-9_]+)$/i);
  if (subredditMatch) {
    return {
      type: 'subreddit',
      name: subredditMatch[1],
    };
  }

  const userMatch = text.match(/^u\/([a-zA-Z0-9_-]+)$/i);
  if (userMatch) {
    return {
      type: 'user',
      name: userMatch[1],
    };
  }

  return null;
}

/**
 * Validate Reddit target (subreddit or user) exists
 */
export async function validateRedditTarget(
  target: RedditTarget
): Promise<boolean> {
  try {
    let url: string;

    if (target.type === 'subreddit') {
      url = `https://www.reddit.com/r/${target.name}/about.json`;
    } else {
      url = `https://www.reddit.com/user/${target.name}/about.json`;
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'LFG-App/1.0',
      },
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();

    // Check if we got valid data
    if (data.kind === 't5' && target.type === 'subreddit') {
      return true;
    }

    if (data.kind === 't2' && target.type === 'user') {
      return true;
    }

    return false;
  } catch (error) {
    console.error('Failed to validate Reddit target:', error);
    return false;
  }
}

/**
 * Build canonical URL for Reddit target
 */
export function buildRedditUrl(target: RedditTarget): string {
  if (target.type === 'subreddit') {
    return `https://www.reddit.com/r/${target.name}`;
  } else {
    return `https://www.reddit.com/user/${target.name}`;
  }
}

/**
 * Extract Reddit links from text
 */
export function extractRedditLinks(text: string): string[] {
  const regex = /https?:\/\/(?:www\.)?reddit\.com\/\S+/gi;
  return [...text.matchAll(regex)].map((m) => m[0]);
}

/**
 * Get handle from target for storage
 */
export function getHandle(target: RedditTarget): string {
  if (target.type === 'subreddit') {
    return `r/${target.name}`;
  } else {
    return `u/${target.name}`;
  }
}
