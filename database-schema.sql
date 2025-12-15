-- H-Board Application Database Schema
-- Database: PostgreSQL (compatible with MySQL with minor adjustments)
-- Description: SQL schema mirroring the IndexedDB structure for H-Board application
-- Features: Boards, Elements (12 types), Folders, Tags, and hierarchical relationships

-- ============================================================================
-- FOLDERS TABLE
-- Manages folder hierarchy for organizing boards
-- ============================================================================
CREATE TABLE folders (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    color VARCHAR(7), -- Hex color code (e.g., #FF5733)
    parent_folder_id VARCHAR(36) DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Self-referential foreign key for folder hierarchy
    CONSTRAINT fk_folder_parent FOREIGN KEY (parent_folder_id)
        REFERENCES folders(id) ON DELETE CASCADE,

    -- Prevent circular references
    CONSTRAINT chk_folder_not_self_parent CHECK (id != parent_folder_id)
);

-- Indexes for folder queries
CREATE INDEX idx_folders_parent ON folders(parent_folder_id);
CREATE INDEX idx_folders_created_at ON folders(created_at DESC);

-- ============================================================================
-- BOARDS TABLE
-- Stores board information with settings and hierarchical relationships
-- ============================================================================
CREATE TABLE boards (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    folder_id VARCHAR(36) DEFAULT NULL,
    parent_id VARCHAR(36) DEFAULT NULL, -- For board-to-board linking

    -- Board settings stored as JSONB (better performance and supports operators)
    settings JSONB NOT NULL DEFAULT '{"backgroundColor":"#FFFFFF","gridEnabled":true,"gridSize":20,"snapToGrid":false}',
    -- Example settings structure:
    -- {
    --   "backgroundColor": "#FFFFFF",
    --   "gridEnabled": true,
    --   "gridSize": 20,
    --   "snapToGrid": false
    -- }

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Foreign key constraints
    CONSTRAINT fk_board_folder FOREIGN KEY (folder_id)
        REFERENCES folders(id) ON DELETE SET NULL,
    CONSTRAINT fk_board_parent FOREIGN KEY (parent_id)
        REFERENCES boards(id) ON DELETE SET NULL,

    -- Prevent self-reference
    CONSTRAINT chk_board_not_self_parent CHECK (id != parent_id)
);

-- Indexes for board queries
CREATE INDEX idx_boards_folder ON boards(folder_id);
CREATE INDEX idx_boards_parent ON boards(parent_id);
CREATE INDEX idx_boards_created_at ON boards(created_at DESC);
CREATE INDEX idx_boards_updated_at ON boards(updated_at DESC);

-- ============================================================================
-- TAGS TABLE
-- Stores tags for boards (many-to-many relationship)
-- ============================================================================
CREATE TABLE tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- BOARD_TAGS TABLE
-- Junction table for board-tag many-to-many relationship
-- ============================================================================
CREATE TABLE board_tags (
    board_id VARCHAR(36) NOT NULL,
    tag_id INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (board_id, tag_id),

    CONSTRAINT fk_board_tags_board FOREIGN KEY (board_id)
        REFERENCES boards(id) ON DELETE CASCADE,
    CONSTRAINT fk_board_tags_tag FOREIGN KEY (tag_id)
        REFERENCES tags(id) ON DELETE CASCADE
);

-- Indexes for tag queries
CREATE INDEX idx_board_tags_board ON board_tags(board_id);
CREATE INDEX idx_board_tags_tag ON board_tags(tag_id);

-- ============================================================================
-- ELEMENTS TABLE
-- Stores all board elements (12 types) with polymorphic content storage
-- ============================================================================
CREATE TABLE elements (
    id VARCHAR(36) PRIMARY KEY,
    board_id VARCHAR(36) NOT NULL,
    type VARCHAR(20) NOT NULL, -- note, image, column, board, section, line, arrow, drawing, link, file, todo, table, shape

    -- Position stored as JSONB: {x: number, y: number}
    position JSONB NOT NULL DEFAULT '{"x":0,"y":0}',

    -- Size stored as JSONB: {width: number, height: number}
    size JSONB NOT NULL DEFAULT '{"width":200,"height":150}',

    -- Style properties stored as JSONB
    style JSONB NOT NULL DEFAULT '{"backgroundColor":"#FFFFFF"}',
    -- Example style structure:
    -- {
    --   "backgroundColor": "#FFFFFF",
    --   "borderColor": "#000000",
    --   "borderWidth": 1,
    --   "borderStyle": "solid",
    --   "opacity": 1,
    --   "rotation": 0
    -- }

    -- Element-specific content stored as JSONB (varies by type)
    content JSONB NOT NULL DEFAULT '{}',
    -- Content structure examples by type:
    -- note: {"text": "string"}
    -- image: {"src": "string", "alt": "string", "originalName": "string"}
    -- column: {"title": "string", "items": [{"id": "string", "title": "string", "description": "string"}]}
    -- board: {"boardId": "string", "boardName": "string"}
    -- section: {"title": "string"}
    -- line: {"points": [{"x": number, "y": number}], "strokeColor": "string", "strokeWidth": number}
    -- arrow: {"startElementId": "string", "endElementId": "string", "startAnchor": "top|right|bottom|left|center", "endAnchor": "top|right|bottom|left|center", "pathType": "straight|curved|elbow|step", "lineStyle": "solid|dashed|dotted", "arrowHeadStart": "none|triangle|triangle-filled|diamond|circle|bar", "arrowHeadEnd": "triangle-filled", "label": "string", "animated": boolean, "color": "#3B82F6", "thickness": 2}
    -- drawing: {"paths": [{"points": [...], "strokeColor": "string", "strokeWidth": number}], "strokeColor": "string", "strokeWidth": number}
    -- link: {"url": "string", "title": "string", "description": "string", "favicon": "string"}
    -- file: {"name": "string", "size": number, "type": "string", "data": "string", "uploadedAt": "timestamp"}
    -- todo: {"title": "string", "items": [{"id": "string", "text": "string", "completed": boolean}]}
    -- table: {"headers": ["string"], "rows": [["string"]]}
    -- shape: {"shapeType": "circle|rectangle|triangle", "fillColor": "string", "strokeColor": "string", "strokeWidth": number}

    z_index INTEGER NOT NULL DEFAULT 0,
    locked BOOLEAN NOT NULL DEFAULT FALSE,
    parent_id VARCHAR(36) DEFAULT NULL, -- For nested elements (e.g., cards in columns)

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Foreign key constraints
    CONSTRAINT fk_element_board FOREIGN KEY (board_id)
        REFERENCES boards(id) ON DELETE CASCADE,
    CONSTRAINT fk_element_parent FOREIGN KEY (parent_id)
        REFERENCES elements(id) ON DELETE CASCADE,

    -- Prevent self-reference
    CONSTRAINT chk_element_not_self_parent CHECK (id != parent_id),

    -- Validate element type
    CONSTRAINT chk_element_type CHECK (
        type IN ('note', 'image', 'column', 'board', 'section', 'line', 'arrow', 'drawing', 'link', 'file', 'todo', 'table', 'shape')
    )
);

-- Indexes for element queries
CREATE INDEX idx_elements_board ON elements(board_id);
CREATE INDEX idx_elements_type ON elements(type);
CREATE INDEX idx_elements_parent ON elements(parent_id);
CREATE INDEX idx_elements_z_index ON elements(z_index);
CREATE INDEX idx_elements_created_at ON elements(created_at DESC);
CREATE INDEX idx_elements_updated_at ON elements(updated_at DESC);

-- Composite index for common queries
CREATE INDEX idx_elements_board_type ON elements(board_id, type);
CREATE INDEX idx_elements_board_z_index ON elements(board_id, z_index DESC);

-- ============================================================================
-- SYNC_OPERATIONS TABLE (Optional - for future sync functionality)
-- Tracks changes for synchronization between clients
-- ============================================================================
CREATE TABLE sync_operations (
    id SERIAL PRIMARY KEY,
    entity_type VARCHAR(20) NOT NULL, -- 'board', 'element', 'folder'
    entity_id VARCHAR(36) NOT NULL,
    operation VARCHAR(10) NOT NULL, -- 'create', 'update', 'delete'
    data JSONB, -- Snapshot of the entity data
    user_id VARCHAR(36), -- For multi-user support
    synced BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_sync_operation CHECK (
        operation IN ('create', 'update', 'delete')
    ),
    CONSTRAINT chk_sync_entity_type CHECK (
        entity_type IN ('board', 'element', 'folder')
    )
);

-- Indexes for sync queries
CREATE INDEX idx_sync_operations_entity ON sync_operations(entity_type, entity_id);
CREATE INDEX idx_sync_operations_synced ON sync_operations(synced);
CREATE INDEX idx_sync_operations_created_at ON sync_operations(created_at DESC);

-- ============================================================================
-- CACHE_METADATA TABLE (Optional - for LRU cache management)
-- Tracks cache entries for performance optimization
-- ============================================================================
CREATE TABLE cache_metadata (
    key VARCHAR(255) PRIMARY KEY,
    entity_type VARCHAR(20) NOT NULL,
    entity_id VARCHAR(36) NOT NULL,
    size_bytes INTEGER NOT NULL,
    last_accessed TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_cache_entity_type CHECK (
        entity_type IN ('board', 'element', 'folder')
    )
);

-- Indexes for cache queries
CREATE INDEX idx_cache_last_accessed ON cache_metadata(last_accessed ASC);
CREATE INDEX idx_cache_entity ON cache_metadata(entity_type, entity_id);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT TIMESTAMPS
-- Automatically update updated_at field on record changes
-- ============================================================================

-- Trigger function for updating updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to folders table
CREATE TRIGGER trigger_folders_updated_at
    BEFORE UPDATE ON folders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to boards table
CREATE TRIGGER trigger_boards_updated_at
    BEFORE UPDATE ON boards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to elements table
CREATE TRIGGER trigger_elements_updated_at
    BEFORE UPDATE ON elements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- UTILITY VIEWS
-- Convenient views for common queries
-- ============================================================================

-- View: Board with tag names
CREATE VIEW boards_with_tags AS
SELECT
    b.id,
    b.name,
    b.description,
    b.folder_id,
    b.parent_id,
    b.settings,
    b.created_at,
    b.updated_at,
    COALESCE(
        JSONB_AGG(t.name) FILTER (WHERE t.name IS NOT NULL),
        '[]'::jsonb
    ) AS tags
FROM boards b
LEFT JOIN board_tags bt ON b.id = bt.board_id
LEFT JOIN tags t ON bt.tag_id = t.id
GROUP BY b.id, b.name, b.description, b.folder_id, b.parent_id, b.settings, b.created_at, b.updated_at;

-- View: Elements with board information
CREATE VIEW elements_with_board AS
SELECT
    e.*,
    b.name AS board_name,
    b.folder_id AS board_folder_id
FROM elements e
INNER JOIN boards b ON e.board_id = b.id;

-- View: Folder hierarchy (with path)
CREATE VIEW folder_hierarchy AS
WITH RECURSIVE folder_path AS (
    -- Base case: root folders
    SELECT
        id,
        name,
        color,
        parent_folder_id,
        created_at,
        updated_at,
        name::TEXT AS path,
        0 AS depth
    FROM folders
    WHERE parent_folder_id IS NULL

    UNION ALL

    -- Recursive case: child folders
    SELECT
        f.id,
        f.name,
        f.color,
        f.parent_folder_id,
        f.created_at,
        f.updated_at,
        fp.path || ' > ' || f.name AS path,
        fp.depth + 1 AS depth
    FROM folders f
    INNER JOIN folder_path fp ON f.parent_folder_id = fp.id
)
SELECT * FROM folder_path;

-- ============================================================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================================================

-- Insert sample folder
-- INSERT INTO folders (id, name, color) VALUES
-- ('folder-1', 'My Projects', '#3B82F6');

-- Insert sample board
-- INSERT INTO boards (id, name, description, folder_id, settings) VALUES
-- ('board-1', 'Welcome Board', 'A sample board to get started', 'folder-1',
--  '{"backgroundColor":"#F9FAFB","gridEnabled":true,"gridSize":20,"snapToGrid":false}');

-- Insert sample tag
-- INSERT INTO tags (name) VALUES ('work'), ('personal'), ('important');

-- Link board to tag
-- INSERT INTO board_tags (board_id, tag_id) VALUES
-- ('board-1', 1);

-- Insert sample element (note)
-- INSERT INTO elements (id, board_id, type, position, size, style, content) VALUES
-- ('element-1', 'board-1', 'note',
--  '{"x":100,"y":100}',
--  '{"width":200,"height":150}',
--  '{"backgroundColor":"#FEF3C7"}',
--  '{"text":"Welcome to H-Board!"}');

-- ============================================================================
-- NOTES FOR MYSQL COMPATIBILITY
-- ============================================================================
-- If using MySQL instead of PostgreSQL, make the following adjustments:
-- 1. Change SERIAL to INT AUTO_INCREMENT
-- 2. Change VARCHAR(36) to CHAR(36) for UUID fields
-- 3. Change JSONB to JSON (MySQL uses JSON, not JSONB)
-- 4. Change JSONB_AGG to JSON_ARRAYAGG
-- 5. Change CURRENT_TIMESTAMP to NOW() in some contexts
-- 6. Replace trigger function syntax with MySQL trigger syntax
-- 7. Recursive CTEs require MySQL 8.0+

-- ============================================================================
-- PERFORMANCE RECOMMENDATIONS
-- ============================================================================
-- 1. Consider partitioning elements table by board_id for large datasets
-- 2. Use connection pooling for better performance
-- 3. Implement caching layer (Redis) for frequently accessed boards
-- 4. Regular VACUUM/ANALYZE (PostgreSQL) or OPTIMIZE TABLE (MySQL)
-- 5. Monitor slow queries and add indexes as needed
-- 6. Consider JSONB indexing for frequently queried JSONB fields (PostgreSQL GIN indexes)

-- Example: Create GIN index for JSONB content search (PostgreSQL only)
-- CREATE INDEX idx_elements_content_gin ON elements USING GIN (content);
-- CREATE INDEX idx_boards_settings_gin ON boards USING GIN (settings);

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
