-- ============================================================================
-- Check RLS Policies
-- Verify that all necessary policies exist for the anon role
-- ============================================================================

-- Check if RLS is enabled on tables
SELECT
    schemaname,
    tablename,
    rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
    'boards', 'elements', 'folders',
    'kanban_columns', 'kanban_cards',
    'database_properties', 'database_rows', 'database_views',
    'presence', 'element_activity'
)
ORDER BY tablename;

-- List all policies on our tables
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd AS operation,
    qual AS using_expression,
    with_check AS with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN (
    'boards', 'elements', 'folders',
    'kanban_columns', 'kanban_cards',
    'database_properties', 'database_rows', 'database_views',
    'presence', 'element_activity'
)
ORDER BY tablename, policyname;
