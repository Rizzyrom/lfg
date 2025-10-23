-- EMERGENCY SCRIPT: Recreate SocialFeedItem table
-- Use this in Supabase SQL Editor if table needs to be recreated
-- WARNING: This will drop existing data!

-- Drop table if exists (be careful!)
-- DROP TABLE IF EXISTS "SocialFeedItem" CASCADE;

-- Create SocialFeedItem table to match Prisma schema
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

-- Verify table was created
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'SocialFeedItem'
ORDER BY ordinal_position;
