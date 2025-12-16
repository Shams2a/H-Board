-- ============================================================================
-- Add Board Type Column
-- Adds the 'type' column to boards table to support Canvas, Kanban, and Database boards
-- ============================================================================

-- Add type column with default value 'canvas' (skip if already exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'boards' AND column_name = 'type') THEN
        ALTER TABLE boards ADD COLUMN type VARCHAR(20) DEFAULT 'canvas' NOT NULL;
    END IF;
END $$;

-- Add check constraint for valid board types (drop and recreate to avoid conflicts)
ALTER TABLE boards DROP CONSTRAINT IF EXISTS chk_boards_type;
ALTER TABLE boards
ADD CONSTRAINT chk_boards_type
CHECK (type IN ('canvas', 'kanban', 'database'));

-- Update existing boards to have 'canvas' type if NULL
UPDATE boards
SET type = 'canvas'
WHERE type IS NULL;

-- Create index for faster queries by type
CREATE INDEX IF NOT EXISTS idx_boards_type ON boards(type);

-- Comments for documentation
COMMENT ON COLUMN boards.type IS 'Type of board: canvas (infinite canvas), kanban (task board), or database (structured data)';
