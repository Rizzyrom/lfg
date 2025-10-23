/**
 * X/Twitter Feed Fetcher
 * Fetches recent tweets from subscribed accounts
 */

import { createClient } from '@/lib/supabase/server';

export interface FeedItem {
  group_id: string;
  source_id?: string;
  platform: string;
  handle: string;
  content: string;
  post_url?: string;
  post_id: string;
  author?: string;
  published_at: Date;
  engagement_score?: number;
  reply_count?: number;
}

interface XTweet {
  id: string;
  text: string;
  author_id: string;
  created_at: string;
  public_metrics?: {
    like_count: number;
    retweet_count: number;
    reply_count: number;
  };
}

interface XUser {
  id: string;
  username: string;
}

/**
 * Fetch tweets from a single X account
 */
async function fetchUserTweets(
  username: string,
  bearerToken: string
): Promise<XTweet[]> {
  try {
    // First, get user ID from username
    const userResponse = await fetch(
      `https://api.twitter.com/2/users/by/username/${username}`,
      {
        headers: {
          Authorization: `Bearer ${bearerToken}`,
        },
      }
    );

    if (!userResponse.ok) {
      console.error(`Failed to fetch user ${username}:`, userResponse.status);
      return [];
    }

    const userData = await userResponse.json();
    const user: XUser = userData.data;

    if (!user || !user.id) {
      console.error(`No user data for ${username}`);
      return [];
    }

    // Fetch user's recent tweets
    const tweetsResponse = await fetch(
      `https://api.twitter.com/2/users/${user.id}/tweets?max_results=10&tweet.fields=created_at,public_metrics&exclude=retweets,replies`,
      {
        headers: {
          Authorization: `Bearer ${bearerToken}`,
        },
      }
    );

    if (!tweetsResponse.ok) {
      console.error(`Failed to fetch tweets for ${username}:`, tweetsResponse.status);
      return [];
    }

    const tweetsData = await tweetsResponse.json();
    return tweetsData.data || [];
  } catch (error) {
    console.error(`Error fetching tweets for ${username}:`, error);
    return [];
  }
}

/**
 * Fetch tweets from all subscribed X accounts for a group
 */
export async function fetchXFeeds(groupId: string): Promise<FeedItem[]> {
  const bearerToken = process.env.X_BEARER_TOKEN;

  if (!bearerToken) {
    console.warn('X_BEARER_TOKEN not configured, skipping X feeds');
    return [];
  }

  const supabase = await createClient();

  // Get all X sources for this group
  const { data: sources, error } = await supabase
    .from('social_feed_source')
    .select('id, handle')
    .eq('group_id', groupId)
    .eq('platform', 'x')
    .execute();

  if (error || !sources || sources.length === 0) {
    console.log('No X sources found for group:', groupId);
    return [];
  }

  console.log(`Fetching X feeds for ${sources.length} accounts`);

  // Fetch tweets from all sources in parallel
  const feedItems: FeedItem[] = [];

  await Promise.all(
    sources.map(async (source: { id: string; handle: string }) => {
      const tweets = await fetchUserTweets(source.handle.replace('@', ''), bearerToken);

      tweets.forEach((tweet: XTweet) => {
        const engagementScore =
          (tweet.public_metrics?.like_count || 0) +
          (tweet.public_metrics?.retweet_count || 0) * 2;

        feedItems.push({
          group_id: groupId,
          source_id: source.id,
          platform: 'x',
          handle: source.handle,
          content: tweet.text,
          post_url: `https://x.com/${source.handle.replace('@', '')}/status/${tweet.id}`,
          post_id: tweet.id,
          published_at: new Date(tweet.created_at),
          engagement_score: engagementScore,
          reply_count: tweet.public_metrics?.reply_count || 0,
        });
      });
    })
  );

  console.log(`Fetched ${feedItems.length} tweets from X`);
  return feedItems;
}
