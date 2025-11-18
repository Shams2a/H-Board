/**
 * Toolbar Component
 * Bottom toolbar with creation tools and controls
 */

import { useUIStore, useBoardStore, useElementStore } from '../../store';
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
import type { ElementType, NoteElement, ImageElement, ColumnElement, LinkElement } from '../../types';

export default function Toolbar() {
  const { activeTool, setActiveTool, zoom, setZoom, gridEnabled, toggleGrid, resetView } = useUIStore();
  const { currentBoardId } = useBoardStore();
  const { createElement, elements } = useElementStore();

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

  const handleToolClick = async (toolType: ElementType) => {
    if (!currentBoardId) return;

    // Calculate center position (accounting for typical window size)
    // Position at center of visible canvas area
    const centerX = 400;
    const centerY = 300;

    // Grid snapping
    const gridSize = gridEnabled ? 8 : 1;
    const snappedX = Math.round(centerX / gridSize) * gridSize;
    const snappedY = Math.round(centerY / gridSize) * gridSize;

    // Create element based on type
    switch (toolType) {
      case 'note': {
        const newNote: NoteElement = {
          id: crypto.randomUUID(),
          boardId: currentBoardId,
          type: 'note',
          position: { x: snappedX, y: snappedY },
          size: { width: 300, height: 200 },
          zIndex: elements.length,
          locked: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          content: {
            text: '',
            textFormat: 'html'
          },
          style: {
            backgroundColor: '#FFFFFF'
          }
        };
        await createElement(newNote);
        break;
      }

      case 'image': {
        const newImage: ImageElement = {
          id: crypto.randomUUID(),
          boardId: currentBoardId,
          type: 'image',
          position: { x: snappedX, y: snappedY },
          size: { width: 400, height: 300 },
          zIndex: elements.length,
          locked: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          content: {
            src: '',
            alt: '',
            originalName: ''
          },
          style: {
            backgroundColor: '#F9FAFB'
          }
        };
        await createElement(newImage);
        break;
      }

      case 'column': {
        const newColumn: ColumnElement = {
          id: crypto.randomUUID(),
          boardId: currentBoardId,
          type: 'column',
          position: { x: snappedX, y: snappedY },
          size: { width: 350, height: 400 },
          zIndex: elements.length,
          locked: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          content: {
            title: 'New Column',
            childrenIds: [],
            maxWidth: 800
          },
          style: {
            backgroundColor: '#FFFFFF'
          }
        };
        await createElement(newColumn);
        break;
      }

      case 'link': {
        const newLink: LinkElement = {
          id: crypto.randomUUID(),
          boardId: currentBoardId,
          type: 'link',
          position: { x: snappedX, y: snappedY },
          size: { width: 350, height: 120 },
          zIndex: elements.length,
          locked: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          content: {
            url: '',
            title: '',
            description: '',
            favicon: ''
          },
          style: {
            backgroundColor: '#FFFFFF'
          }
        };
        await createElement(newLink);
        break;
      }

      default:
        // For other types, just set active tool for now
        setActiveTool(activeTool === toolType ? null : toolType);
        return;
    }

    // Clear active tool after creation
    setActiveTool(null);
  };

  return (
    <div className="w-16 bg-white border-r border-border flex flex-col items-center py-4 z-toolbar">
      {/* Creation Tools */}
      <div className="flex flex-col items-center gap-2 flex-1">
        {tools.map(tool => (
          <button
            key={tool.type}
            onClick={() => handleToolClick(tool.type)}
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
      <div className="flex flex-col items-center gap-2 border-t border-gray-200 pt-4 mt-4">
        {/* Grid Toggle */}
        <button
          onClick={toggleGrid}
          className={`toolbar-button ${gridEnabled ? 'active' : ''}`}
          title="Toggle Grid"
          aria-label="Toggle grid"
        >
          <Grid className="w-5 h-5" />
        </button>

        {/* Zoom Out */}
        <button
          onClick={handleZoomOut}
          className="toolbar-button"
          title="Zoom Out"
          aria-label="Zoom out"
          disabled={zoom <= 0.25}
        >
          <ZoomOut className="w-5 h-5" />
        </button>

        {/* Zoom In */}
        <button
          onClick={handleZoomIn}
          className="toolbar-button"
          title="Zoom In"
          aria-label="Zoom in"
          disabled={zoom >= 2}
        >
          <ZoomIn className="w-5 h-5" />
        </button>

        {/* Reset View */}
        <button
          onClick={resetView}
          className="toolbar-button"
          title="Reset View (Ctrl+0)"
          aria-label="Reset view"
        >
          <Maximize className="w-5 h-5" />
        </button>

        {/* Undo */}
        <button
          className="toolbar-button"
          title="Undo (Ctrl+Z)"
          aria-label="Undo"
        >
          <Undo className="w-5 h-5" />
        </button>

        {/* Redo */}
        <button
          className="toolbar-button"
          title="Redo (Ctrl+Y)"
          aria-label="Redo"
        >
          <Redo className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
