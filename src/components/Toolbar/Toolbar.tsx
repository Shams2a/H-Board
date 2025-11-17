/**
 * Toolbar Component
 * Bottom toolbar with creation tools and controls
 */

import { useUIStore } from '../../store';
import {
  StickyNote,
  Image,
  Columns,
  FolderPlus,
  Square,
  ArrowRight,
  Pencil,
  Link2,
  FileText,
  CheckSquare,
  Table,
  ZoomIn,
  ZoomOut,
  Maximize,
  Grid,
  Undo,
  Redo
} from 'lucide-react';
import type { ElementType } from '../../types';

export default function Toolbar() {
  const { activeTool, setActiveTool, zoom, setZoom, gridEnabled, toggleGrid, resetView } = useUIStore();

  const tools: Array<{ type: ElementType; icon: React.ReactNode; label: string; shortcut: string }> = [
    { type: 'note', icon: <StickyNote className="w-5 h-5" />, label: 'Note', shortcut: 'N' },
    { type: 'image', icon: <Image className="w-5 h-5" />, label: 'Image', shortcut: 'I' },
    { type: 'column', icon: <Columns className="w-5 h-5" />, label: 'Column', shortcut: 'C' },
    { type: 'board', icon: <FolderPlus className="w-5 h-5" />, label: 'Board', shortcut: 'B' },
    { type: 'section', icon: <Square className="w-5 h-5" />, label: 'Section', shortcut: 'S' },
    { type: 'line', icon: <ArrowRight className="w-5 h-5" />, label: 'Line', shortcut: 'L' },
    { type: 'drawing', icon: <Pencil className="w-5 h-5" />, label: 'Drawing', shortcut: 'D' },
    { type: 'link', icon: <Link2 className="w-5 h-5" />, label: 'Link', shortcut: 'K' },
    { type: 'file', icon: <FileText className="w-5 h-5" />, label: 'File', shortcut: 'F' },
    { type: 'todo', icon: <CheckSquare className="w-5 h-5" />, label: 'Todo', shortcut: 'T' },
    { type: 'table', icon: <Table className="w-5 h-5" />, label: 'Table', shortcut: 'G' }
  ];

  const handleZoomIn = () => setZoom(zoom + 0.1);
  const handleZoomOut = () => setZoom(zoom - 0.1);

  return (
    <div className="h-16 bg-white border-t border-border flex items-center justify-between px-4 z-toolbar">
      {/* Creation Tools */}
      <div className="flex items-center gap-1">
        {tools.map(tool => (
          <button
            key={tool.type}
            onClick={() => setActiveTool(activeTool === tool.type ? null : tool.type)}
            className={`
              toolbar-button
              ${activeTool === tool.type ? 'active' : ''}
            `}
            title={`${tool.label} (${tool.shortcut})`}
            aria-label={tool.label}
          >
            {tool.icon}
          </button>
        ))}
      </div>

      {/* View Controls */}
      <div className="flex items-center gap-4">
        {/* Grid Toggle */}
        <button
          onClick={toggleGrid}
          className={`toolbar-button ${gridEnabled ? 'active' : ''}`}
          title="Toggle Grid"
          aria-label="Toggle grid"
        >
          <Grid className="w-5 h-5" />
        </button>

        {/* Zoom Controls */}
        <div className="flex items-center gap-2 px-2 py-1 bg-gray-50 rounded">
          <button
            onClick={handleZoomOut}
            className="p-1 hover:bg-gray-200 rounded"
            title="Zoom Out"
            aria-label="Zoom out"
            disabled={zoom <= 0.25}
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <span className="text-sm font-mono min-w-[3rem] text-center">
            {Math.round(zoom * 100)}%
          </span>

          <button
            onClick={handleZoomIn}
            className="p-1 hover:bg-gray-200 rounded"
            title="Zoom In"
            aria-label="Zoom in"
            disabled={zoom >= 2}
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <button
            onClick={resetView}
            className="p-1 hover:bg-gray-200 rounded ml-1"
            title="Reset View (Ctrl+0)"
            aria-label="Reset view"
          >
            <Maximize className="w-4 h-4" />
          </button>
        </div>

        {/* Undo/Redo */}
        <div className="flex items-center gap-1">
          <button
            className="toolbar-button"
            title="Undo (Ctrl+Z)"
            aria-label="Undo"
          >
            <Undo className="w-5 h-5" />
          </button>

          <button
            className="toolbar-button"
            title="Redo (Ctrl+Y)"
            aria-label="Redo"
          >
            <Redo className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
