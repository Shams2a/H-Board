-- ============================================================================
-- Database Board Tables Migration
-- Creates tables for Database board functionality (Notion-like)
-- ============================================================================

-- database_properties table
CREATE TABLE IF NOT EXISTS database_properties (
    id VARCHAR(36) PRIMARY KEY,
    board_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    config JSONB DEFAULT '{}'::jsonb,
    position INTEGER NOT NULL,
    required BOOLEAN DEFAULT false,
    width INTEGER DEFAULT 200,
    visible BOOLEAN DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE
);

-- Check constraint for valid property types (idempotent)
DO $$
BEGIN
    -- Drop constraint if it exists
    IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'chk_database_properties_type'
    ) THEN
        ALTER TABLE database_properties DROP CONSTRAINT chk_database_properties_type;
    END IF;

    -- Add constraint (includes 'board' type)
    ALTER TABLE database_properties
    ADD CONSTRAINT chk_database_properties_type
    CHECK (type IN (
        'title', 'text', 'number', 'select', 'multi_select', 'date',
        'checkbox', 'url', 'email', 'phone', 'board', 'file', 'person',
        'formula', 'relation', 'rollup', 'created_time', 'created_by',
        'last_edited_time', 'last_edited_by'
    ));
END $$;

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_database_properties_board_id ON database_properties(board_id);
CREATE INDEX IF NOT EXISTS idx_database_properties_position ON database_properties(board_id, position);

-- database_rows table
CREATE TABLE IF NOT EXISTS database_rows (
    id VARCHAR(36) PRIMARY KEY,
    board_id VARCHAR(36) NOT NULL,
    properties JSONB NOT NULL DEFAULT '{}'::jsonb,
    position INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(36),
    last_edited_by VARCHAR(36),
    FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_database_rows_board_id ON database_rows(board_id);
CREATE INDEX IF NOT EXISTS idx_database_rows_position ON database_rows(board_id, position);

-- database_views table
CREATE TABLE IF NOT EXISTS database_views (
    id VARCHAR(36) PRIMARY KEY,
    board_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    filters JSONB DEFAULT '[]'::jsonb,
    sorts JSONB DEFAULT '[]'::jsonb,
    group_by VARCHAR(36),
    visible_properties JSONB DEFAULT '[]'::jsonb,
    config JSONB DEFAULT '{}'::jsonb,
    position INTEGER NOT NULL,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE
);

-- Check constraint for valid view types (idempotent)
DO $$
BEGIN
    -- Drop constraint if it exists
    IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'chk_database_views_type'
    ) THEN
        ALTER TABLE database_views DROP CONSTRAINT chk_database_views_type;
    END IF;

    -- Add constraint
    ALTER TABLE database_views
    ADD CONSTRAINT chk_database_views_type
    CHECK (type IN ('table', 'list', 'board', 'calendar', 'gallery'));
END $$;

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_database_views_board_id ON database_views(board_id);
CREATE INDEX IF NOT EXISTS idx_database_views_position ON database_views(board_id, position);

-- Trigger to update updated_at timestamp on database_properties
CREATE OR REPLACE FUNCTION update_database_property_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_database_property_updated_at ON database_properties;
CREATE TRIGGER trigger_update_database_property_updated_at
    BEFORE UPDATE ON database_properties
    FOR EACH ROW
    EXECUTE FUNCTION update_database_property_updated_at();

-- Trigger to update updated_at timestamp on database_rows
CREATE OR REPLACE FUNCTION update_database_row_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_database_row_updated_at ON database_rows;
CREATE TRIGGER trigger_update_database_row_updated_at
    BEFORE UPDATE ON database_rows
    FOR EACH ROW
    EXECUTE FUNCTION update_database_row_updated_at();

-- Trigger to update updated_at timestamp on database_views
CREATE OR REPLACE FUNCTION update_database_view_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_database_view_updated_at ON database_views;
CREATE TRIGGER trigger_update_database_view_updated_at
    BEFORE UPDATE ON database_views
    FOR EACH ROW
    EXECUTE FUNCTION update_database_view_updated_at();

-- Comments for documentation
COMMENT ON TABLE database_properties IS 'Stores property definitions for Database boards';
COMMENT ON TABLE database_rows IS 'Stores row data for Database boards with flexible schema';
COMMENT ON TABLE database_views IS 'Stores view configurations for Database boards';

COMMENT ON COLUMN database_properties.type IS 'Property type: title, text, number, select, multi_select, date, checkbox, url, email, phone, board, file, person, formula, relation, rollup, created_time, created_by, last_edited_time, last_edited_by';
COMMENT ON COLUMN database_properties.config IS 'Type-specific configuration (e.g., select options, number format, date format)';
COMMENT ON COLUMN database_rows.properties IS 'Cell values as key-value pairs {propertyId: value}';
COMMENT ON COLUMN database_views.filters IS 'Array of filter objects {propertyId, operator, value}';
COMMENT ON COLUMN database_views.sorts IS 'Array of sort objects {propertyId, direction}';
COMMENT ON COLUMN database_views.visible_properties IS 'Array of property IDs to show in this view';
