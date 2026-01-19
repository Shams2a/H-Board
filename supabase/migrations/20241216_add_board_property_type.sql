-- ============================================================================
-- Add 'board' property type to database_properties constraint
-- Allows linking to Canvas, Kanban, and Database boards
-- ============================================================================

-- Idempotent update of constraint to include 'board' type
DO $$
BEGIN
    -- Drop constraint if it exists
    IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'chk_database_properties_type'
    ) THEN
        ALTER TABLE database_properties DROP CONSTRAINT chk_database_properties_type;
    END IF;

    -- Recreate with 'board' included
    ALTER TABLE database_properties
    ADD CONSTRAINT chk_database_properties_type
    CHECK (type IN (
        'title', 'text', 'number', 'select', 'multi_select', 'date',
        'checkbox', 'url', 'email', 'phone', 'board', 'file', 'person',
        'formula', 'relation', 'rollup', 'created_time', 'created_by',
        'last_edited_time', 'last_edited_by'
    ));
END $$;

-- Update comment
COMMENT ON COLUMN database_properties.type IS 'Property type: title, text, number, select, multi_select, date, checkbox, url, email, phone, board, file, person, formula, relation, rollup, created_time, created_by, last_edited_time, last_edited_by';
