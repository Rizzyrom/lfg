/**
 * X (Twitter) social helpers
 */

export interface Tweet {
  id: string;
  text: string;
  author_id: string;
}

export interface XUser {
  id: string;
  username: string;
  name: string;
  description?: string;
  verified?: boolean;
  profile_image_url?: string;
}

/**
 * Extract tweet IDs from text
 */
export function extractTweetIds(text: string): string[] {
  const regex = /(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/gi;
  const matches = [...text.matchAll(regex)];
  return matches.map((m) => m[1]);
}

/**
 * Extract Twitter handles from text
 */
export function extractHandles(text: string): string[] {
  const urlRegex = /(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]+)/gi;
  const mentionRegex = /@([a-zA-Z0-9_]+)/g;

  const urlMatches = [...text.matchAll(urlRegex)];
  const mentionMatches = [...text.matchAll(mentionRegex)];

  const handles = [
    ...urlMatches.map((m) => m[1]),
    ...mentionMatches.map((m) => m[1]),
  ];

  // Filter out "status", "i", "home" etc.
  const filtered = handles.filter(
    (h) => !['status', 'i', 'home', 'explore', 'notifications', 'messages'].includes(h.toLowerCase())
  );

  return [...new Set(filtered)]; // Dedupe
}

/**
 * Normalize handle (remove @ prefix, lowercase)
 */
export function normalizeHandle(urlOrHandle: string): string {
  // If it's a URL, extract username
  const urlMatch = urlOrHandle.match(/(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]+)/i);
  if (urlMatch) {
    return urlMatch[1].toLowerCase();
  }

  // Remove @ if present
  return urlOrHandle.replace(/^@/, '').toLowerCase();
}

/**
 * Validate handle using X API
 * Requires X_BEARER_TOKEN env var
 */
export async function validateHandle(username: string): Promise<XUser | null> {
  const token = process.env.X_BEARER_TOKEN;

  if (!token) {
    console.warn('X_BEARER_TOKEN not configured, skipping validation');
    return null;
  }

  try {
    const response = await fetch(
      `https://api.twitter.com/2/users/by/username/${username}?user.fields=description,verified,profile_image_url`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`X API error: ${response.status}`);
    }

    const data = await response.json();
    return data.data || null;
  } catch (error) {
    console.error('Failed to validate X handle:', error);
    return null;
  }
}

/**
 * Validate tweet IDs using X API
 * Returns valid tweets and invalid IDs
 */
export async function validateTweetIds(
  ids: string[]
): Promise<{ valid: Tweet[]; invalid: string[] }> {
  const token = process.env.X_BEARER_TOKEN;

  if (!token || ids.length === 0) {
    return { valid: [], invalid: ids };
  }

  try {
    const response = await fetch(
      `https://api.twitter.com/2/tweets?ids=${ids.join(',')}&tweet.fields=author_id`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`X API error: ${response.status}`);
    }

    const data = await response.json();
    const valid = data.data || [];
    const validIds = new Set(valid.map((t: Tweet) => t.id));
    const invalid = ids.filter((id) => !validIds.has(id));

    return { valid, invalid };
  } catch (error) {
    console.error('Failed to validate tweet IDs:', error);
    return { valid: [], invalid: ids };
  }
}

/**
 * Build canonical profile URL
 */
export function buildProfileUrl(username: string): string {
  return `https://x.com/${normalizeHandle(username)}`;
}
