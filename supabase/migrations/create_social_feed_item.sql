-- Create SocialFeedItem table to match Prisma schema
-- This table stores social media posts/tweets for agent context

CREATE TABLE IF NOT EXISTS "SocialFeedItem" (
  id TEXT PRIMARY KEY,
  "groupId" TEXT NOT NULL,
  "sourceId" TEXT,
  platform TEXT NOT NULL,
  handle TEXT NOT NULL,
  content TEXT NOT NULL,
  "postUrl" TEXT,
  "postId" TEXT NOT NULL,
  author TEXT,
  "publishedAt" TIMESTAMP(3) WITHOUT TIME ZONE NOT NULL,
  "fetchedAt" TIMESTAMP(3) WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "engagementScore" INTEGER NOT NULL DEFAULT 0,
  "replyCount" INTEGER NOT NULL DEFAULT 0,

  CONSTRAINT "SocialFeedItem_platform_postId_key" UNIQUE (platform, "postId")
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS "SocialFeedItem_groupId_publishedAt_idx"
  ON "SocialFeedItem"("groupId", "publishedAt" DESC);

CREATE INDEX IF NOT EXISTS "SocialFeedItem_sourceId_publishedAt_idx"
  ON "SocialFeedItem"("sourceId", "publishedAt" DESC);

CREATE INDEX IF NOT EXISTS "SocialFeedItem_platform_publishedAt_idx"
  ON "SocialFeedItem"(platform, "publishedAt" DESC);

-- Add foreign key constraint to SocialFeedSource
ALTER TABLE "SocialFeedItem"
  ADD CONSTRAINT "SocialFeedItem_sourceId_fkey"
  FOREIGN KEY ("sourceId")
  REFERENCES "SocialFeedSource"(id)
  ON DELETE SET NULL
  ON UPDATE CASCADE;

-- Note: RLS (Row Level Security) is not enabled on this table
-- to match the Prisma-managed schema which doesn't include RLS policies
-- If you need RLS, you can add it separately in Supabase dashboard
