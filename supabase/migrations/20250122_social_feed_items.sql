-- Social Feed Items - Store posts/tweets for agent context
-- This table stores actual content from subscribed X/Reddit sources

CREATE TABLE IF NOT EXISTS social_feed_item (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL,
  source_id UUID REFERENCES social_feed_source(id) ON DELETE CASCADE,

  -- Platform and source info
  platform TEXT NOT NULL,              -- 'x' | 'reddit' | 'news'
  handle TEXT NOT NULL,                -- @handle, r/subreddit, or news source

  -- Post content
  content TEXT NOT NULL,               -- Tweet text, post content, or article summary
  post_url TEXT,                       -- Link to original post
  post_id TEXT,                        -- Platform-specific ID
  author TEXT,                         -- Original author if different from handle

  -- Metadata
  published_at TIMESTAMPTZ NOT NULL,  -- When post was originally published
  fetched_at TIMESTAMPTZ DEFAULT NOW(),

  -- Sentiment/engagement signals
  engagement_score INTEGER DEFAULT 0,  -- Likes, upvotes, etc.
  reply_count INTEGER DEFAULT 0,

  UNIQUE (platform, post_id)          -- Prevent duplicate posts
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_social_feed_item_group ON social_feed_item(group_id, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_social_feed_item_source ON social_feed_item(source_id, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_social_feed_item_platform ON social_feed_item(platform, published_at DESC);

-- Full-text search index for content
CREATE INDEX IF NOT EXISTS idx_social_feed_item_content_search ON social_feed_item USING gin(to_tsvector('english', content));

-- RLS Policies
ALTER TABLE social_feed_item ENABLE ROW LEVEL SECURITY;

-- Members can read their group's feed items
CREATE POLICY "Members can read group feed items"
  ON social_feed_item FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "Membership"
      WHERE "Membership"."groupId" = social_feed_item.group_id
      AND "Membership"."userId" = auth.uid()
    )
  );

-- System/service accounts can insert feed items
CREATE POLICY "Service can insert feed items"
  ON social_feed_item FOR INSERT
  WITH CHECK (true);

-- Cleanup old feed items (keep last 7 days)
-- This can be run as a scheduled job
CREATE OR REPLACE FUNCTION cleanup_old_feed_items()
RETURNS void AS $$
BEGIN
  DELETE FROM social_feed_item
  WHERE published_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
