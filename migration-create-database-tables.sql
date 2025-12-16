-- ============================================================================
-- MIGRATION: Create Database tables
-- Date: 2025-12-16
-- Description: Creates tables for Database board functionality (Notion-like)
-- ============================================================================

-- ============================================================================
-- DATABASE_PROPERTIES TABLE
-- Stores property definitions for Database boards
-- ============================================================================
CREATE TABLE database_properties (
    id VARCHAR(36) PRIMARY KEY,
    board_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- text, number, select, multi-select, date, checkbox, url, email, file, formula, created-time, last-edited-time
    config JSONB NOT NULL DEFAULT '{}',
    -- Config structure examples by type:
    -- select/multi-select: {"options": [{"id": "uuid", "name": "Option 1", "color": "#60A5FA"}]}
    -- number: {"format": "number|percent|currency", "decimals": 2}
    -- date: {"format": "YYYY-MM-DD|DD/MM/YYYY|relative", "includeTime": false}
    -- formula: {"formula": "prop('Price') * prop('Quantity')"}

    position INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Foreign key to boards table
    CONSTRAINT fk_database_property_board FOREIGN KEY (board_id)
        REFERENCES boards(id) ON DELETE CASCADE,

    -- Validate property type
    CONSTRAINT chk_database_property_type CHECK (
        type IN ('text', 'number', 'select', 'multi-select', 'date', 'checkbox',
                 'url', 'email', 'file', 'formula', 'created-time', 'last-edited-time')
    )
);

-- Indexes for database_properties
CREATE INDEX idx_database_properties_board ON database_properties(board_id);
CREATE INDEX idx_database_properties_position ON database_properties(board_id, position);

-- ============================================================================
-- DATABASE_ROWS TABLE
-- Stores rows (entries) for Database boards
-- ============================================================================
CREATE TABLE database_rows (
    id VARCHAR(36) PRIMARY KEY,
    board_id VARCHAR(36) NOT NULL,

    -- Values stored as JSONB: {propertyId: value}
    -- Example: {"prop-1": "Task name", "prop-2": "high", "prop-3": ["tag1", "tag2"]}
    values JSONB NOT NULL DEFAULT '{}',

    position INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Foreign key to boards table
    CONSTRAINT fk_database_row_board FOREIGN KEY (board_id)
        REFERENCES boards(id) ON DELETE CASCADE
);

-- Indexes for database_rows
CREATE INDEX idx_database_rows_board ON database_rows(board_id);
CREATE INDEX idx_database_rows_position ON database_rows(board_id, position);

-- GIN index for searching in values (PostgreSQL)
CREATE INDEX idx_database_rows_values ON database_rows USING GIN (values);

-- ============================================================================
-- DATABASE_VIEWS TABLE
-- Stores view configurations for Database boards
-- ============================================================================
CREATE TABLE database_views (
    id VARCHAR(36) PRIMARY KEY,
    board_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL, -- table, kanban, gallery, calendar, list

    -- View configuration stored as JSONB
    config JSONB NOT NULL DEFAULT '{}',
    -- Config structure by view type:
    -- table: {"visibleProperties": ["prop-1", "prop-2"], "propertyOrder": [...]}
    -- kanban: {"groupByProperty": "prop-id", "cardCoverProperty": "prop-id"}
    -- gallery: {"cardSize": "small|medium|large", "coverProperty": "prop-id"}
    -- calendar: {"dateProperty": "prop-id", "colorByProperty": "prop-id"}

    -- Filters stored as JSONB array
    filters JSONB DEFAULT '[]',
    -- Filters structure: [{"property": "prop-id", "operator": "contains", "value": "text"}]

    -- Sorts stored as JSONB array
    sorts JSONB DEFAULT '[]',
    -- Sorts structure: [{"property": "prop-id", "direction": "asc|desc"}]

    position INTEGER NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Foreign key to boards table
    CONSTRAINT fk_database_view_board FOREIGN KEY (board_id)
        REFERENCES boards(id) ON DELETE CASCADE,

    -- Validate view type
    CONSTRAINT chk_database_view_type CHECK (
        type IN ('table', 'kanban', 'gallery', 'calendar', 'list')
    )
);

-- Indexes for database_views
CREATE INDEX idx_database_views_board ON database_views(board_id);
CREATE INDEX idx_database_views_position ON database_views(board_id, position);
CREATE INDEX idx_database_views_default ON database_views(board_id, is_default);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- Automatically update updated_at field on record changes
-- ============================================================================

-- Trigger for database_rows
CREATE TRIGGER trigger_database_rows_updated_at
    BEFORE UPDATE ON database_rows
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- You can verify the tables were created with:
-- SELECT table_name FROM information_schema.tables
-- WHERE table_name IN ('database_properties', 'database_rows', 'database_views');
-- ============================================================================
