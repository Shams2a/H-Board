-- ============================================================================
-- MIGRATION: Add board type support
-- Date: 2025-12-16
-- Description: Adds 'type' column to boards table to support multiple board types
-- ============================================================================

-- Add type column to boards table
ALTER TABLE boards
ADD COLUMN type VARCHAR(20) DEFAULT 'canvas';

-- Add constraint to validate board type
ALTER TABLE boards
ADD CONSTRAINT chk_board_type CHECK (
    type IN ('canvas', 'kanban', 'database')
);

-- Create index for faster queries by type
CREATE INDEX idx_boards_type ON boards(type);

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- You can verify the column was added with:
-- SELECT column_name, data_type, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'boards' AND column_name = 'type';
-- ============================================================================
