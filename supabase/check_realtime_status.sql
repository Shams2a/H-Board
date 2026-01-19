-- ============================================================================
-- Check Realtime Status
-- Verify which tables are in the supabase_realtime publication
-- ============================================================================

-- List all tables in the supabase_realtime publication
SELECT
    schemaname,
    tablename,
    pubname
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;

-- If the query returns no rows or missing tables, run this:
-- (Uncomment the lines below and run them)

/*
ALTER PUBLICATION supabase_realtime ADD TABLE boards;
ALTER PUBLICATION supabase_realtime ADD TABLE elements;
ALTER PUBLICATION supabase_realtime ADD TABLE folders;
ALTER PUBLICATION supabase_realtime ADD TABLE kanban_columns;
ALTER PUBLICATION supabase_realtime ADD TABLE kanban_cards;
ALTER PUBLICATION supabase_realtime ADD TABLE database_properties;
ALTER PUBLICATION supabase_realtime ADD TABLE database_rows;
ALTER PUBLICATION supabase_realtime ADD TABLE database_views;
ALTER PUBLICATION supabase_realtime ADD TABLE presence;
ALTER PUBLICATION supabase_realtime ADD TABLE element_activity;
*/
