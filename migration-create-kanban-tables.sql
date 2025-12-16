-- ============================================================================
-- MIGRATION: Create Kanban tables
-- Date: 2025-12-16
-- Description: Creates tables for Kanban board functionality
-- ============================================================================

-- ============================================================================
-- KANBAN_COLUMNS TABLE
-- Stores columns for Kanban boards
-- ============================================================================
CREATE TABLE kanban_columns (
    id VARCHAR(36) PRIMARY KEY,
    board_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    color VARCHAR(7) DEFAULT '#9CA3AF', -- Monochrome+ gray-400
    position INTEGER NOT NULL,
    wip_limit INTEGER DEFAULT NULL, -- Work In Progress limit (optional)
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Foreign key to boards table
    CONSTRAINT fk_kanban_column_board FOREIGN KEY (board_id)
        REFERENCES boards(id) ON DELETE CASCADE
);

-- Indexes for kanban_columns
CREATE INDEX idx_kanban_columns_board ON kanban_columns(board_id);
CREATE INDEX idx_kanban_columns_position ON kanban_columns(board_id, position);

-- ============================================================================
-- KANBAN_CARDS TABLE
-- Stores cards for Kanban boards
-- ============================================================================
CREATE TABLE kanban_cards (
    id VARCHAR(36) PRIMARY KEY,
    board_id VARCHAR(36) NOT NULL,
    column_id VARCHAR(36) NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT, -- Rich text content
    position INTEGER NOT NULL,

    -- Metadata stored as JSONB
    tags JSONB DEFAULT '[]', -- Array of tags: ["tag1", "tag2"]
    priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high, urgent

    -- Dates
    due_date TIMESTAMP DEFAULT NULL,
    start_date TIMESTAMP DEFAULT NULL,

    -- Attachments
    cover_image TEXT, -- URL or base64 of cover image
    attachments JSONB DEFAULT '[]', -- Array of attachments: [{name, url, size, type}]

    -- Checklist stored as JSONB
    checklist JSONB DEFAULT '[]', -- Array of items: [{id, text, completed}]

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Foreign keys
    CONSTRAINT fk_kanban_card_board FOREIGN KEY (board_id)
        REFERENCES boards(id) ON DELETE CASCADE,
    CONSTRAINT fk_kanban_card_column FOREIGN KEY (column_id)
        REFERENCES kanban_columns(id) ON DELETE CASCADE,

    -- Validate priority
    CONSTRAINT chk_kanban_card_priority CHECK (
        priority IN ('low', 'medium', 'high', 'urgent')
    )
);

-- Indexes for kanban_cards
CREATE INDEX idx_kanban_cards_board ON kanban_cards(board_id);
CREATE INDEX idx_kanban_cards_column ON kanban_cards(column_id);
CREATE INDEX idx_kanban_cards_position ON kanban_cards(column_id, position);
CREATE INDEX idx_kanban_cards_priority ON kanban_cards(priority);
CREATE INDEX idx_kanban_cards_due_date ON kanban_cards(due_date);

-- GIN index for searching in tags (PostgreSQL)
CREATE INDEX idx_kanban_cards_tags ON kanban_cards USING GIN (tags);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- Automatically update updated_at field on record changes
-- ============================================================================

-- Trigger for kanban_columns
CREATE TRIGGER trigger_kanban_columns_updated_at
    BEFORE UPDATE ON kanban_columns
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for kanban_cards
CREATE TRIGGER trigger_kanban_cards_updated_at
    BEFORE UPDATE ON kanban_cards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- You can verify the tables were created with:
-- SELECT table_name FROM information_schema.tables
-- WHERE table_name IN ('kanban_columns', 'kanban_cards');
-- ============================================================================
