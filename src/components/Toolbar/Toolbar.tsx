/**
 * Toolbar Component
 * Bottom toolbar with creation tools and controls
 */

import { useUIStore, useBoardStore, useElementStore } from '../../store';
import {
  StickyNote,
  Image,
  Columns as ColumnsIcon,
  FolderPlus,
  Square,
  ArrowRight,
  MoveRight,
  Pencil,
  Link2,
  FileText,
  CheckSquare,
  Table as TableIcon,
  Shapes,
  Trello,
  Database
} from 'lucide-react';
import type { ElementType, NoteElement, ImageElement, ColumnElement, LinkElement, TodoElement, FileElement, TableElement, LineElement, DrawingElement, BoardElement, ShapeElement } from '../../types';

// Extended tool type to support board creation variants
type ToolType = ElementType | 'kanban-board' | 'database-board';

export default function Toolbar() {
  const { activeTool, setActiveTool, gridEnabled, panX, panY, zoom } = useUIStore();
  const { currentBoardId, createBoard } = useBoardStore();
  const { createElement, elements } = useElementStore();

  const tools: Array<{ type: ToolType; icon: React.ReactNode; label: string; shortcut: string }> = [
    { type: 'note', icon: <StickyNote className="w-6 h-6" />, label: 'Note', shortcut: 'N' },
    { type: 'image', icon: <Image className="w-6 h-6" />, label: 'Image', shortcut: 'I' },
    { type: 'column', icon: <ColumnsIcon className="w-6 h-6" />, label: 'Column', shortcut: 'C' },
    { type: 'board', icon: <FolderPlus className="w-6 h-6" />, label: 'Canvas Board', shortcut: 'B' },
    { type: 'kanban-board', icon: <Trello className="w-6 h-6" />, label: 'Kanban Board', shortcut: 'K' },
    { type: 'database-board', icon: <Database className="w-6 h-6" />, label: 'Database Board', shortcut: 'D' },
    { type: 'section', icon: <Square className="w-6 h-6" />, label: 'Section', shortcut: 'S' },
    { type: 'shape', icon: <Shapes className="w-6 h-6" />, label: 'Shape', shortcut: 'H' },
    { type: 'line', icon: <ArrowRight className="w-6 h-6" />, label: 'Line', shortcut: 'L' },
    { type: 'arrow', icon: <MoveRight className="w-6 h-6" />, label: 'Arrow', shortcut: 'A' },
    { type: 'drawing', icon: <Pencil className="w-6 h-6" />, label: 'Drawing', shortcut: 'P' },
    { type: 'link', icon: <Link2 className="w-6 h-6" />, label: 'Link', shortcut: 'U' },
    { type: 'file', icon: <FileText className="w-6 h-6" />, label: 'File', shortcut: 'F' },
    { type: 'todo', icon: <CheckSquare className="w-6 h-6" />, label: 'Todo', shortcut: 'T' },
    { type: 'table', icon: <TableIcon className="w-6 h-6" />, label: 'Table', shortcut: 'G' }
  ];

  const handleToolClick = async (toolType: ToolType) => {
    if (!currentBoardId) return;

    // Special case for Arrow tool - just activate the mode, don't create element
    if (toolType === 'arrow') {
      setActiveTool(activeTool === 'arrow' ? null : 'arrow');
      return;
    }

    // Calculate center position based on current viewport
    // Convert viewport center to canvas coordinates
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Calculate the center of the visible canvas area
    const centerX = (-panX + viewportWidth / 2) / zoom;
    const centerY = (-panY + viewportHeight / 2) / zoom;

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
            backgroundColor: '#FFFFFF'
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
            backgroundColor: '#FAFAFA'
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
            backgroundColor: '#FFFFFF',
            borderColor: '#E5E7EB',
            borderWidth: 1
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

      case 'file': {
        const newFile: FileElement = {
          id: crypto.randomUUID(),
          boardId: currentBoardId,
          type: 'file',
          position: { x: snappedX, y: snappedY },
          size: { width: 300, height: 200 },
          zIndex: elements.length,
          locked: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          content: {
            fileName: '',
            fileType: '',
            fileSize: 0,
            fileData: ''
          },
          style: {
            backgroundColor: '#FFFFFF'
          }
        };
        await createElement(newFile);
        break;
      }

      case 'table': {
        const newTable: TableElement = {
          id: crypto.randomUUID(),
          boardId: currentBoardId,
          type: 'table',
          position: { x: snappedX, y: snappedY },
          size: { width: 600, height: 300 },
          zIndex: elements.length,
          locked: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          content: {
            headers: ['Column 1', 'Column 2', 'Column 3'],
            rows: [
              [
                { value: '', type: 'text' },
                { value: '', type: 'text' },
                { value: '', type: 'text' }
              ]
            ],
            columnWidths: []
          },
          style: {
            backgroundColor: '#FAFAFA'
          }
        };
        await createElement(newTable);
        break;
      }

      case 'line': {
        const newLine: LineElement = {
          id: crypto.randomUUID(),
          boardId: currentBoardId,
          type: 'line',
          position: { x: snappedX, y: snappedY },
          size: { width: 200, height: 2 },
          zIndex: elements.length,
          locked: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          content: {
            startPoint: { x: snappedX, y: snappedY },
            endPoint: { x: snappedX + 200, y: snappedY },
            lineStyle: 'solid',
            arrowStart: false,
            arrowEnd: true
          },
          style: {
            borderColor: '#D1D5DB',
            borderWidth: 2
          }
        };
        await createElement(newLine);
        break;
      }

      case 'drawing': {
        const newDrawing: DrawingElement = {
          id: crypto.randomUUID(),
          boardId: currentBoardId,
          type: 'drawing',
          position: { x: snappedX, y: snappedY },
          size: { width: 400, height: 300 },
          zIndex: elements.length,
          locked: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          content: {
            paths: []
          },
          style: {
            backgroundColor: '#FFFFFF'
          }
        };
        await createElement(newDrawing);
        break;
      }

      case 'board': {
        // Create a new canvas sub-board
        const newBoardId = await createBoard('New Canvas Board', 'canvas', currentBoardId);

        // Create a board link element that links to the new sub-board
        const newBoardLink: BoardElement = {
          id: crypto.randomUUID(),
          boardId: currentBoardId,
          type: 'board',
          position: { x: snappedX, y: snappedY },
          size: { width: 80, height: 100 },
          zIndex: elements.length,
          locked: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          content: {
            linkedBoardId: newBoardId,
            title: 'New Canvas Board',
            description: '',
            elementCount: 0
          },
          style: {
            backgroundColor: '#F5F5F5'
          }
        };
        await createElement(newBoardLink);
        break;
      }

      case 'kanban-board': {
        // Create a new Kanban sub-board
        const newBoardId = await createBoard('New Kanban Board', 'kanban', currentBoardId);

        // Create a board link element that links to the new Kanban board
        const newKanbanLink: BoardElement = {
          id: crypto.randomUUID(),
          boardId: currentBoardId,
          type: 'board',
          position: { x: snappedX, y: snappedY },
          size: { width: 80, height: 100 },
          zIndex: elements.length,
          locked: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          content: {
            linkedBoardId: newBoardId,
            title: 'New Kanban Board',
            description: '',
            elementCount: 0
          },
          style: {
            backgroundColor: '#DBEAFE'
          }
        };
        await createElement(newKanbanLink);
        break;
      }

      case 'database-board': {
        // Create a new Database sub-board
        const newBoardId = await createBoard('New Database Board', 'database', currentBoardId);

        // Create a board link element that links to the new Database board
        const newDatabaseLink: BoardElement = {
          id: crypto.randomUUID(),
          boardId: currentBoardId,
          type: 'board',
          position: { x: snappedX, y: snappedY },
          size: { width: 80, height: 100 },
          zIndex: elements.length,
          locked: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          content: {
            linkedBoardId: newBoardId,
            title: 'New Database Board',
            description: '',
            elementCount: 0
          },
          style: {
            backgroundColor: '#FEF3C7'
          }
        };
        await createElement(newDatabaseLink);
        break;
      }

      case 'shape': {
        const newShape: ShapeElement = {
          id: crypto.randomUUID(),
          boardId: currentBoardId,
          type: 'shape',
          position: { x: snappedX, y: snappedY },
          size: { width: 200, height: 200 },
          zIndex: elements.length,
          locked: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          content: {
            shapeType: 'rectangle'
          },
          style: {
            backgroundColor: 'transparent',
            borderColor: '#9CA3AF',
            borderWidth: 2
          }
        };
        await createElement(newShape);
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
    <div className="absolute top-20 left-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2 z-toolbar">
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
