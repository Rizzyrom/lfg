-- Chat Enhancements Migration
-- System events, commands, alerts, pins, social sources, and context settings

-- System events / command audit
CREATE TABLE IF NOT EXISTS system_event (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL,
  user_id UUID NOT NULL,
  command TEXT NOT NULL,
  args JSONB,
  status TEXT NOT NULL DEFAULT 'ok',  -- 'ok' | 'error'
  detail TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_event_group ON system_event(group_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_event_user ON system_event(user_id, created_at DESC);

-- Chat-level context settings (per group)
CREATE TABLE IF NOT EXISTS chat_context_setting (
  group_id UUID PRIMARY KEY,
  context_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Social feed sources discovered from chat (X, Reddit)
CREATE TABLE IF NOT EXISTS social_feed_source (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL,
  platform TEXT NOT NULL,             -- 'x' | 'reddit'
  handle TEXT,                        -- @handle or subreddit
  url TEXT,                           -- canonical profile/url
  added_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (group_id, platform, handle)
);

CREATE INDEX IF NOT EXISTS idx_social_feed_source_group ON social_feed_source(group_id, created_at DESC);

-- Alerts requested in chat (price/keyword)
CREATE TABLE IF NOT EXISTS chat_alert (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL,
  user_id UUID NOT NULL,
  symbol TEXT NOT NULL,               -- TSLA, BTC
  kind TEXT NOT NULL,                 -- 'price' | 'keyword'
  condition JSONB NOT NULL,           -- { "gt": 900 } or { "keyword": "earnings" }
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_alert_group ON chat_alert(group_id, active, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_alert_user ON chat_alert(user_id, active, created_at DESC);

-- Pins (bookmark messages)
CREATE TABLE IF NOT EXISTS chat_pin (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL,
  message_id UUID NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (group_id, message_id)
);

CREATE INDEX IF NOT EXISTS idx_chat_pin_group ON chat_pin(group_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_pin_user ON chat_pin(user_id, created_at DESC);

-- RLS Policies
-- Enable RLS
ALTER TABLE system_event ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_context_setting ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_feed_source ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_alert ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_pin ENABLE ROW LEVEL SECURITY;

-- system_event: members can read their group's events
CREATE POLICY IF NOT EXISTS "Members can read group system events"
  ON system_event FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_member gm
      WHERE gm.group_id = system_event.group_id
      AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "Members can insert system events"
  ON system_event FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_member gm
      WHERE gm.group_id = system_event.group_id
      AND gm.user_id = auth.uid()
    )
  );

-- chat_context_setting: members can read/update
CREATE POLICY IF NOT EXISTS "Members can read group context settings"
  ON chat_context_setting FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_member gm
      WHERE gm.group_id = chat_context_setting.group_id
      AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "Members can upsert group context settings"
  ON chat_context_setting FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_member gm
      WHERE gm.group_id = chat_context_setting.group_id
      AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "Members can update group context settings"
  ON chat_context_setting FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM group_member gm
      WHERE gm.group_id = chat_context_setting.group_id
      AND gm.user_id = auth.uid()
    )
  );

-- social_feed_source: members can read/write their group's sources
CREATE POLICY IF NOT EXISTS "Members can read group social sources"
  ON social_feed_source FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_member gm
      WHERE gm.group_id = social_feed_source.group_id
      AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "Members can add social sources"
  ON social_feed_source FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_member gm
      WHERE gm.group_id = social_feed_source.group_id
      AND gm.user_id = auth.uid()
    )
  );

-- chat_alert: members can manage their own alerts
CREATE POLICY IF NOT EXISTS "Users can read their own alerts"
  ON chat_alert FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Users can create alerts"
  ON chat_alert FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Users can update their own alerts"
  ON chat_alert FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Users can delete their own alerts"
  ON chat_alert FOR DELETE
  USING (user_id = auth.uid());

-- chat_pin: members can manage their own pins
CREATE POLICY IF NOT EXISTS "Users can read their group's pins"
  ON chat_pin FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_member gm
      WHERE gm.group_id = chat_pin.group_id
      AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "Users can create pins"
  ON chat_pin FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Users can delete their own pins"
  ON chat_pin FOR DELETE
  USING (user_id = auth.uid());
