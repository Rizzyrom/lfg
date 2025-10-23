/**
 * Feed Polling API
 * Background job to refresh social and news feeds
 * Can be triggered manually or via cron
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { fetchXFeeds } from '@/lib/feed/x-fetcher';
import { fetchRedditFeeds } from '@/lib/feed/reddit-fetcher';
import { fetchNewsFeeds } from '@/lib/feed/news-fetcher';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify auth (optional - can allow cron jobs without auth)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Get groupId from request or fetch all groups
    const body = await req.json();
    const { groupId } = body;

    if (!groupId) {
      return NextResponse.json(
        { error: 'groupId is required' },
        { status: 400 }
      );
    }

    // Verify user is member of group if auth is present
    if (user) {
      const { data: membership } = await supabase
        .from('Membership')
        .select('role')
        .eq('groupId', groupId)
        .eq('userId', user.id)
        .single();

      if (!membership) {
        return NextResponse.json(
          { error: 'Not a member of this group' },
          { status: 403 }
        );
      }
    }

    console.log(`Starting feed poll for group: ${groupId}`);

    // Fetch from all sources in parallel
    const [xItems, redditItems, newsItems] = await Promise.all([
      fetchXFeeds(groupId),
      fetchRedditFeeds(groupId),
      fetchNewsFeeds(groupId),
    ]);

    const allItems = [...xItems, ...redditItems, ...newsItems];

    console.log(`Total feed items fetched: ${allItems.length}`);

    if (allItems.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No feed items to update',
        stats: {
          x: 0,
          reddit: 0,
          news: 0,
          total: 0,
        },
      });
    }

    // Upsert feed items (dedupe by platform + post_id)
    let inserted = 0;
    let updated = 0;

    for (const item of allItems) {
      const { error } = await supabase
        .from('social_feed_item')
        .upsert(
          {
            group_id: item.group_id,
            source_id: item.source_id,
            platform: item.platform,
            handle: item.handle,
            content: item.content,
            post_url: item.post_url,
            post_id: item.post_id,
            author: item.author,
            published_at: item.published_at.toISOString(),
            engagement_score: item.engagement_score,
            reply_count: item.reply_count,
            fetched_at: new Date().toISOString(),
          },
          {
            onConflict: 'platform,post_id',
          }
        );

      if (error) {
        console.error('Error upserting feed item:', error);
      } else {
        inserted++;
      }
    }

    // Clean up old items (older than 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { error: cleanupError } = await supabase
      .from('social_feed_item')
      .delete()
      .eq('group_id', groupId)
      .lt('published_at', sevenDaysAgo.toISOString());

    if (cleanupError) {
      console.error('Error cleaning up old feed items:', cleanupError);
    }

    // Log system event
    await supabase.from('system_event').insert({
      group_id: groupId,
      user_id: user?.id || null,
      command: 'feed_poll',
      args: {
        x_count: xItems.length,
        reddit_count: redditItems.length,
        news_count: newsItems.length,
      },
      status: 'ok',
    });

    return NextResponse.json({
      success: true,
      message: 'Feed poll completed',
      stats: {
        x: xItems.length,
        reddit: redditItems.length,
        news: newsItems.length,
        total: allItems.length,
        inserted,
      },
    });
  } catch (error: any) {
    console.error('Feed poll error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal error' },
      { status: 500 }
    );
  }
}

// GET endpoint for manual triggering or cron
export async function GET(req: NextRequest) {
  // Allow GET requests from cron jobs
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // If CRON_SECRET is set, require it for GET requests
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // For cron jobs, fetch all active groups
  // For now, return instructions
  return NextResponse.json({
    message: 'Use POST with groupId to poll feeds',
    example: {
      method: 'POST',
      body: { groupId: 'uuid-here' },
    },
  });
}
