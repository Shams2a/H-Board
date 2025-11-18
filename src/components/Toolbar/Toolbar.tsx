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
  Table
} from 'lucide-react';
import type { ElementType, NoteElement, ImageElement, ColumnElement, LinkElement, TodoElement } from '../../types';

export default function Toolbar() {
  const { activeTool, setActiveTool, gridEnabled } = useUIStore();
  const { currentBoardId } = useBoardStore();
  const { createElement, elements } = useElementStore();

  const tools: Array<{ type: ElementType; icon: React.ReactNode; label: string; shortcut: string }> = [
    { type: 'note', icon: <StickyNote className="w-6 h-6" />, label: 'Note', shortcut: 'N' },
    { type: 'image', icon: <Image className="w-6 h-6" />, label: 'Image', shortcut: 'I' },
    { type: 'column', icon: <Columns className="w-6 h-6" />, label: 'Column', shortcut: 'C' },
    { type: 'board', icon: <FolderPlus className="w-6 h-6" />, label: 'Board', shortcut: 'B' },
    { type: 'section', icon: <Square className="w-6 h-6" />, label: 'Section', shortcut: 'S' },
    { type: 'line', icon: <ArrowRight className="w-6 h-6" />, label: 'Line', shortcut: 'L' },
    { type: 'drawing', icon: <Pencil className="w-6 h-6" />, label: 'Drawing', shortcut: 'D' },
    { type: 'link', icon: <Link2 className="w-6 h-6" />, label: 'Link', shortcut: 'K' },
    { type: 'file', icon: <FileText className="w-6 h-6" />, label: 'File', shortcut: 'F' },
    { type: 'todo', icon: <CheckSquare className="w-6 h-6" />, label: 'Todo', shortcut: 'T' },
    { type: 'table', icon: <Table className="w-6 h-6" />, label: 'Table', shortcut: 'G' }
  ];

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

      case 'todo': {
        const newTodo: TodoElement = {
          id: crypto.randomUUID(),
          boardId: currentBoardId,
          type: 'todo',
          position: { x: snappedX, y: snappedY },
          size: { width: 350, height: 250 },
          zIndex: elements.length,
          locked: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          content: {
            items: [],
            showProgress: false
          },
          style: {
            backgroundColor: '#FFFFFF'
          }
        };
        await createElement(newTodo);
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
    <div className="absolute top-20 left-4 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-toolbar">
      {/* Creation Tools */}
      <div className="flex flex-col items-center gap-2">
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
    </div>
  );
}
