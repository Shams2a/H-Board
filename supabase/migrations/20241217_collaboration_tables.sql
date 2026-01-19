-- Migration for collaboration features
-- Tables for real-time presence and activity tracking

-- =====================================================
-- Table: presence
-- Tracks which users are currently active on each board
-- =====================================================
CREATE TABLE IF NOT EXISTS presence (
  board_id TEXT NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_email TEXT,
  user_color TEXT NOT NULL DEFAULT '#3B82F6',
  cursor_x FLOAT,
  cursor_y FLOAT,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (board_id, user_id)
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_presence_board ON presence(board_id);
CREATE INDEX IF NOT EXISTS idx_presence_last_seen ON presence(last_seen);

-- Auto-update last_seen on any change
CREATE OR REPLACE FUNCTION update_presence_last_seen()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_seen = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_presence_last_seen ON presence;
CREATE TRIGGER trigger_update_presence_last_seen
  BEFORE UPDATE ON presence
  FOR EACH ROW
  EXECUTE FUNCTION update_presence_last_seen();

-- =====================================================
-- Function: Cleanup stale presence
-- Removes presence records older than 2 minutes
-- =====================================================
CREATE OR REPLACE FUNCTION cleanup_stale_presence()
RETURNS void AS $$
BEGIN
  DELETE FROM presence WHERE last_seen < NOW() - INTERVAL '2 minutes';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Table: element_activity (optional, for editing indicators)
-- Tracks which user is currently editing which element
-- =====================================================
CREATE TABLE IF NOT EXISTS element_activity (
  element_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_color TEXT NOT NULL DEFAULT '#3B82F6',
  activity_type TEXT NOT NULL DEFAULT 'editing', -- 'editing', 'viewing', 'commenting'
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  PRIMARY KEY (element_id, user_id)
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_element_activity_element ON element_activity(element_id);
CREATE INDEX IF NOT EXISTS idx_element_activity_expires ON element_activity(expires_at);

-- Auto-cleanup expired activities
CREATE OR REPLACE FUNCTION cleanup_expired_activities()
RETURNS void AS $$
BEGIN
  DELETE FROM element_activity WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Enable Realtime for collaboration
-- =====================================================
DO $$
BEGIN
    -- Add presence table to publication if not already added
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
        AND tablename = 'presence'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE presence;
    END IF;

    -- Add element_activity table to publication if not already added
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
        AND tablename = 'element_activity'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE element_activity;
    END IF;
END $$;

-- =====================================================
-- Row Level Security (RLS)
-- =====================================================

-- Presence: Anyone can read, insert, update, delete their own
ALTER TABLE presence ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view presence" ON presence;
CREATE POLICY "Anyone can view presence"
  ON presence FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert their own presence" ON presence;
CREATE POLICY "Users can insert their own presence"
  ON presence FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update their own presence" ON presence;
CREATE POLICY "Users can update their own presence"
  ON presence FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "Users can delete their own presence" ON presence;
CREATE POLICY "Users can delete their own presence"
  ON presence FOR DELETE
  USING (true);

-- Element Activity: Anyone can read, users can manage their own
ALTER TABLE element_activity ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view element activity" ON element_activity;
CREATE POLICY "Anyone can view element activity"
  ON element_activity FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert their own activity" ON element_activity;
CREATE POLICY "Users can insert their own activity"
  ON element_activity FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update their own activity" ON element_activity;
CREATE POLICY "Users can update their own activity"
  ON element_activity FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "Users can delete their own activity" ON element_activity;
CREATE POLICY "Users can delete their own activity"
  ON element_activity FOR DELETE
  USING (true);

-- =====================================================
-- Comments for documentation
-- =====================================================
COMMENT ON TABLE presence IS 'Tracks real-time presence of users on boards';
COMMENT ON TABLE element_activity IS 'Tracks which users are actively editing elements';
COMMENT ON FUNCTION cleanup_stale_presence() IS 'Removes presence records older than 2 minutes';
COMMENT ON FUNCTION cleanup_expired_activities() IS 'Removes expired element activity records';
