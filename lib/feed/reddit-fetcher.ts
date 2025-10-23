/**
 * Reddit Feed Fetcher
 * Fetches recent posts from subscribed subreddits and users
 */

import { createClient } from '@/lib/supabase/server';
import type { FeedItem } from './x-fetcher';

interface RedditPost {
  data: {
    id: string;
    title: string;
    selftext: string;
    author: string;
    created_utc: number;
    permalink: string;
    url: string;
    score: number;
    num_comments: number;
    subreddit: string;
  };
}

interface RedditListing {
  data: {
    children: RedditPost[];
  };
}

/**
 * Fetch posts from a subreddit
 */
async function fetchSubredditPosts(subreddit: string): Promise<RedditPost[]> {
  try {
    const response = await fetch(
      `https://www.reddit.com/r/${subreddit}/hot.json?limit=10`,
      {
        headers: {
          'User-Agent': 'LFG-App/1.0',
        },
      }
    );

    if (!response.ok) {
      console.error(`Failed to fetch r/${subreddit}:`, response.status);
      return [];
    }

    const data: RedditListing = await response.json();
    return data.data.children || [];
  } catch (error) {
    console.error(`Error fetching r/${subreddit}:`, error);
    return [];
  }
}

/**
 * Fetch posts from a Reddit user
 */
async function fetchUserPosts(username: string): Promise<RedditPost[]> {
  try {
    const response = await fetch(
      `https://www.reddit.com/user/${username}/submitted.json?limit=10`,
      {
        headers: {
          'User-Agent': 'LFG-App/1.0',
        },
      }
    );

    if (!response.ok) {
      console.error(`Failed to fetch u/${username}:`, response.status);
      return [];
    }

    const data: RedditListing = await response.json();
    return data.data.children || [];
  } catch (error) {
    console.error(`Error fetching u/${username}:`, error);
    return [];
  }
}

/**
 * Fetch posts from all subscribed Reddit sources for a group
 */
export async function fetchRedditFeeds(groupId: string): Promise<FeedItem[]> {
  const supabase = await createClient();

  // Get all Reddit sources for this group
  const { data: sources, error } = await supabase
    .from('social_feed_source')
    .select('id, handle')
    .eq('group_id', groupId)
    .eq('platform', 'reddit')
    .execute();

  if (error || !sources || sources.length === 0) {
    console.log('No Reddit sources found for group:', groupId);
    return [];
  }

  console.log(`Fetching Reddit feeds for ${sources.length} sources`);

  const feedItems: FeedItem[] = [];

  // Fetch posts from all sources in parallel
  await Promise.all(
    sources.map(async (source: { id: string; handle: string }) => {
      let posts: RedditPost[] = [];

      // Determine if it's a subreddit or user
      if (source.handle.startsWith('r/')) {
        const subreddit = source.handle.replace('r/', '');
        posts = await fetchSubredditPosts(subreddit);
      } else if (source.handle.startsWith('u/')) {
        const username = source.handle.replace('u/', '');
        posts = await fetchUserPosts(username);
      }

      posts.forEach((post) => {
        const postData = post.data;

        // Combine title and selftext for content
        const content = postData.selftext
          ? `${postData.title}\n\n${postData.selftext.slice(0, 500)}`
          : postData.title;

        feedItems.push({
          group_id: groupId,
          source_id: source.id,
          platform: 'reddit',
          handle: source.handle,
          content,
          post_url: `https://www.reddit.com${postData.permalink}`,
          post_id: postData.id,
          author: postData.author,
          published_at: new Date(postData.created_utc * 1000),
          engagement_score: postData.score,
          reply_count: postData.num_comments,
        });
      });
    })
  );

  console.log(`Fetched ${feedItems.length} posts from Reddit`);
  return feedItems;
}
