-- ============================================================================
-- MIGRATION: Add 'arrow' element type support
-- Date: 2025-12-15
-- Description: Updates the elements table constraint to support the new 'arrow' type
-- ============================================================================

-- Drop the existing constraint
ALTER TABLE elements
DROP CONSTRAINT IF EXISTS chk_element_type;

-- Add the new constraint with 'arrow' included
ALTER TABLE elements
ADD CONSTRAINT chk_element_type CHECK (
    type IN ('note', 'image', 'column', 'board', 'section', 'line', 'arrow', 'drawing', 'link', 'file', 'todo', 'table', 'shape')
);

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- You can verify the constraint was updated with:
-- SELECT constraint_name, check_clause
-- FROM information_schema.check_constraints
-- WHERE constraint_name = 'chk_element_type';
-- ============================================================================
