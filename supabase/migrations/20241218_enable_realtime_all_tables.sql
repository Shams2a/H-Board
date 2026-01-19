-- ============================================================================
-- Enable Realtime for All Tables
-- Adds RLS policies and Realtime publication for collaboration
-- ============================================================================

-- =====================================================
-- 1. Enable RLS on all tables
-- =====================================================

ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE elements ENABLE ROW LEVEL SECURITY;
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE kanban_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE kanban_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE database_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE database_rows ENABLE ROW LEVEL SECURITY;
ALTER TABLE database_views ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. Create RLS policies for anon role (SELECT only for Realtime)
-- =====================================================

-- Boards: Anyone can view
DROP POLICY IF EXISTS "Anyone can view boards" ON boards;
CREATE POLICY "Anyone can view boards"
  ON boards FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Anyone can insert boards" ON boards;
CREATE POLICY "Anyone can insert boards"
  ON boards FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update boards" ON boards;
CREATE POLICY "Anyone can update boards"
  ON boards FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "Anyone can delete boards" ON boards;
CREATE POLICY "Anyone can delete boards"
  ON boards FOR DELETE
  USING (true);

-- Elements: Anyone can view
DROP POLICY IF EXISTS "Anyone can view elements" ON elements;
CREATE POLICY "Anyone can view elements"
  ON elements FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Anyone can insert elements" ON elements;
CREATE POLICY "Anyone can insert elements"
  ON elements FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update elements" ON elements;
CREATE POLICY "Anyone can update elements"
  ON elements FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "Anyone can delete elements" ON elements;
CREATE POLICY "Anyone can delete elements"
  ON elements FOR DELETE
  USING (true);

-- Folders: Anyone can view
DROP POLICY IF EXISTS "Anyone can view folders" ON folders;
CREATE POLICY "Anyone can view folders"
  ON folders FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Anyone can insert folders" ON folders;
CREATE POLICY "Anyone can insert folders"
  ON folders FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update folders" ON folders;
CREATE POLICY "Anyone can update folders"
  ON folders FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "Anyone can delete folders" ON folders;
CREATE POLICY "Anyone can delete folders"
  ON folders FOR DELETE
  USING (true);

-- Kanban Columns: Anyone can view
DROP POLICY IF EXISTS "Anyone can view kanban_columns" ON kanban_columns;
CREATE POLICY "Anyone can view kanban_columns"
  ON kanban_columns FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Anyone can insert kanban_columns" ON kanban_columns;
CREATE POLICY "Anyone can insert kanban_columns"
  ON kanban_columns FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update kanban_columns" ON kanban_columns;
CREATE POLICY "Anyone can update kanban_columns"
  ON kanban_columns FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "Anyone can delete kanban_columns" ON kanban_columns;
CREATE POLICY "Anyone can delete kanban_columns"
  ON kanban_columns FOR DELETE
  USING (true);

-- Kanban Cards: Anyone can view
DROP POLICY IF EXISTS "Anyone can view kanban_cards" ON kanban_cards;
CREATE POLICY "Anyone can view kanban_cards"
  ON kanban_cards FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Anyone can insert kanban_cards" ON kanban_cards;
CREATE POLICY "Anyone can insert kanban_cards"
  ON kanban_cards FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update kanban_cards" ON kanban_cards;
CREATE POLICY "Anyone can update kanban_cards"
  ON kanban_cards FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "Anyone can delete kanban_cards" ON kanban_cards;
CREATE POLICY "Anyone can delete kanban_cards"
  ON kanban_cards FOR DELETE
  USING (true);

-- Database Properties: Anyone can view
DROP POLICY IF EXISTS "Anyone can view database_properties" ON database_properties;
CREATE POLICY "Anyone can view database_properties"
  ON database_properties FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Anyone can insert database_properties" ON database_properties;
CREATE POLICY "Anyone can insert database_properties"
  ON database_properties FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update database_properties" ON database_properties;
CREATE POLICY "Anyone can update database_properties"
  ON database_properties FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "Anyone can delete database_properties" ON database_properties;
CREATE POLICY "Anyone can delete database_properties"
  ON database_properties FOR DELETE
  USING (true);

-- Database Rows: Anyone can view
DROP POLICY IF EXISTS "Anyone can view database_rows" ON database_rows;
CREATE POLICY "Anyone can view database_rows"
  ON database_rows FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Anyone can insert database_rows" ON database_rows;
CREATE POLICY "Anyone can insert database_rows"
  ON database_rows FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update database_rows" ON database_rows;
CREATE POLICY "Anyone can update database_rows"
  ON database_rows FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "Anyone can delete database_rows" ON database_rows;
CREATE POLICY "Anyone can delete database_rows"
  ON database_rows FOR DELETE
  USING (true);

-- Database Views: Anyone can view
DROP POLICY IF EXISTS "Anyone can view database_views" ON database_views;
CREATE POLICY "Anyone can view database_views"
  ON database_views FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Anyone can insert database_views" ON database_views;
CREATE POLICY "Anyone can insert database_views"
  ON database_views FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update database_views" ON database_views;
CREATE POLICY "Anyone can update database_views"
  ON database_views FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "Anyone can delete database_views" ON database_views;
CREATE POLICY "Anyone can delete database_views"
  ON database_views FOR DELETE
  USING (true);

-- =====================================================
-- 3. Add all tables to Realtime publication
-- =====================================================

DO $$
BEGIN
    -- Boards
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
        AND tablename = 'boards'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE boards;
    END IF;

    -- Elements
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
        AND tablename = 'elements'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE elements;
    END IF;

    -- Folders
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
        AND tablename = 'folders'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE folders;
    END IF;

    -- Kanban Columns
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
        AND tablename = 'kanban_columns'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE kanban_columns;
    END IF;

    -- Kanban Cards
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
        AND tablename = 'kanban_cards'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE kanban_cards;
    END IF;

    -- Database Properties
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
        AND tablename = 'database_properties'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE database_properties;
    END IF;

    -- Database Rows
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
        AND tablename = 'database_rows'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE database_rows;
    END IF;

    -- Database Views
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
        AND tablename = 'database_views'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE database_views;
    END IF;
END $$;

-- =====================================================
-- 4. Comments for documentation
-- =====================================================
COMMENT ON POLICY "Anyone can view boards" ON boards IS 'Allow anonymous users to view boards for Realtime collaboration';
COMMENT ON POLICY "Anyone can view elements" ON elements IS 'Allow anonymous users to view elements for Realtime collaboration';
COMMENT ON POLICY "Anyone can view kanban_columns" ON kanban_columns IS 'Allow anonymous users to view kanban columns for Realtime collaboration';
COMMENT ON POLICY "Anyone can view kanban_cards" ON kanban_cards IS 'Allow anonymous users to view kanban cards for Realtime collaboration';
