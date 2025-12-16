-- ============================================================================
-- Kanban Tables Migration
-- Creates tables for Kanban boards functionality
-- ============================================================================

-- kanban_columns table
CREATE TABLE IF NOT EXISTS kanban_columns (
    id VARCHAR(36) PRIMARY KEY,
    board_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    color VARCHAR(7) DEFAULT '#9CA3AF',
    position INTEGER NOT NULL,
    wip_limit INTEGER DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_kanban_columns_board_id ON kanban_columns(board_id);
CREATE INDEX IF NOT EXISTS idx_kanban_columns_position ON kanban_columns(board_id, position);

-- kanban_cards table
CREATE TABLE IF NOT EXISTS kanban_cards (
    id VARCHAR(36) PRIMARY KEY,
    board_id VARCHAR(36) NOT NULL,
    column_id VARCHAR(36) NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    position INTEGER NOT NULL,
    tags JSONB DEFAULT '[]'::jsonb,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    due_date TIMESTAMP DEFAULT NULL,
    start_date TIMESTAMP DEFAULT NULL,
    cover_image TEXT,
    attachments JSONB DEFAULT '[]'::jsonb,
    checklist JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE,
    FOREIGN KEY (column_id) REFERENCES kanban_columns(id) ON DELETE CASCADE
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_kanban_cards_board_id ON kanban_cards(board_id);
CREATE INDEX IF NOT EXISTS idx_kanban_cards_column_id ON kanban_cards(column_id);
CREATE INDEX IF NOT EXISTS idx_kanban_cards_position ON kanban_cards(column_id, position);

-- Trigger to update updated_at timestamp on kanban_columns
CREATE OR REPLACE FUNCTION update_kanban_column_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_kanban_column_updated_at ON kanban_columns;
CREATE TRIGGER trigger_update_kanban_column_updated_at
    BEFORE UPDATE ON kanban_columns
    FOR EACH ROW
    EXECUTE FUNCTION update_kanban_column_updated_at();

-- Trigger to update updated_at timestamp on kanban_cards
CREATE OR REPLACE FUNCTION update_kanban_card_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_kanban_card_updated_at ON kanban_cards;
CREATE TRIGGER trigger_update_kanban_card_updated_at
    BEFORE UPDATE ON kanban_cards
    FOR EACH ROW
    EXECUTE FUNCTION update_kanban_card_updated_at();

-- Comments for documentation
COMMENT ON TABLE kanban_columns IS 'Stores Kanban board columns';
COMMENT ON TABLE kanban_cards IS 'Stores Kanban cards with metadata';
COMMENT ON COLUMN kanban_cards.tags IS 'Array of tag strings';
COMMENT ON COLUMN kanban_cards.attachments IS 'Array of attachment objects with id, name, url, size, type, uploadedAt';
COMMENT ON COLUMN kanban_cards.checklist IS 'Array of checklist items with id, text, completed';
