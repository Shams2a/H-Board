/**
 * Toolbar Component
 * Bottom toolbar with creation tools and controls
 */

import { useUIStore, selectActiveTool, selectGridEnabled, selectPanX, selectPanY, selectZoom, useBoardStore, selectCurrentBoardId, useElementStore, selectElements } from '../../store';
import {
  StickyNote,
  Image,
  Columns as ColumnsIcon,
  FolderPlus,
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
import { v4 as uuidv4 } from 'uuid';
import type { ElementType, NoteElement, ImageElement, ColumnElement, LinkElement, TodoElement, FileElement, TableElement, LineElement, BoardElement, ShapeElement } from '../../types';

// Extended tool type to support board creation variants
type ToolType = ElementType | 'kanban-board' | 'database-board';

export default function Toolbar() {
  const activeTool = useUIStore(selectActiveTool);
  const gridEnabled = useUIStore(selectGridEnabled);
  const panX = useUIStore(selectPanX);
  const panY = useUIStore(selectPanY);
  const zoom = useUIStore(selectZoom);
  const setActiveTool = useUIStore(state => state.setActiveTool);
  const currentBoardId = useBoardStore(selectCurrentBoardId);
  const createBoard = useBoardStore(state => state.createBoard);
  const createElement = useElementStore(state => state.createElement);
  const elements = useElementStore(selectElements);

  const tools: Array<{ type: ToolType; icon: React.ReactNode; label: string; shortcut: string }> = [
    { type: 'note', icon: <StickyNote className="w-6 h-6" />, label: 'Note', shortcut: 'N' },
    { type: 'image', icon: <Image className="w-6 h-6" />, label: 'Image', shortcut: 'I' },
    { type: 'column', icon: <ColumnsIcon className="w-6 h-6" />, label: 'Column', shortcut: 'C' },
    { type: 'board', icon: <FolderPlus className="w-6 h-6" />, label: 'Canvas Board', shortcut: 'B' },
    { type: 'kanban-board', icon: <Trello className="w-6 h-6" />, label: 'Kanban Board', shortcut: 'K' },
    { type: 'database-board', icon: <Database className="w-6 h-6" />, label: 'Database Board', shortcut: '' },
    { type: 'shape', icon: <Shapes className="w-6 h-6" />, label: 'Shape', shortcut: 'H' },
    { type: 'line', icon: <ArrowRight className="w-6 h-6" />, label: 'Line', shortcut: 'L' },
    { type: 'arrow', icon: <MoveRight className="w-6 h-6" />, label: 'Arrow', shortcut: 'A' },
    { type: 'drawing', icon: <Pencil className="w-6 h-6" />, label: 'Drawing', shortcut: 'D' },
    { type: 'link', icon: <Link2 className="w-6 h-6" />, label: 'Link', shortcut: 'U' },
    { type: 'file', icon: <FileText className="w-6 h-6" />, label: 'File', shortcut: 'F' },
    { type: 'todo', icon: <CheckSquare className="w-6 h-6" />, label: 'Todo', shortcut: 'T' },
    { type: 'table', icon: <TableIcon className="w-6 h-6" />, label: 'Table', shortcut: 'G' }
  ];

  const handleToolClick = async (toolType: ToolType) => {
    if (!currentBoardId) return;

    // Special case for Arrow and Drawing tools - just activate/toggle the mode, don't create element
    if (toolType === 'arrow' || toolType === 'drawing') {
      setActiveTool(activeTool === toolType ? null : toolType);
      return;
    }

    // Calculate the center of the visible canvas area (in canvas coords)
    // Use the actual canvas rect to exclude sidebar/toolbar offsets
    const canvasRect = document.querySelector('.canvas-container')?.getBoundingClientRect();
    const cw = canvasRect?.width ?? window.innerWidth;
    const ch = canvasRect?.height ?? window.innerHeight;
    const viewportCenterX = cw / (2 * zoom) - panX;
    const viewportCenterY = ch / (2 * zoom) - panY;
    const gridSize = gridEnabled ? 8 : 1;

    // Helper: center an element of given size at viewport center
    const centerPos = (w: number, h: number) => ({
      x: Math.round((viewportCenterX - w / 2) / gridSize) * gridSize,
      y: Math.round((viewportCenterY - h / 2) / gridSize) * gridSize,
    });

    // Create element based on type
    switch (toolType) {
      case 'note': {
        const pos = centerPos(300, 200);
        const newNote: NoteElement = {
          id: uuidv4(),
          boardId: currentBoardId,
          type: 'note',
          position: pos,
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
        const pos = centerPos(400, 300);
        const newImage: ImageElement = {
          id: uuidv4(),
          boardId: currentBoardId,
          type: 'image',
          position: pos,
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
        const pos = centerPos(350, 400);
        const newColumn: ColumnElement = {
          id: uuidv4(),
          boardId: currentBoardId,
          type: 'column',
          position: pos,
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
        const pos = centerPos(350, 120);
        const newLink: LinkElement = {
          id: uuidv4(),
          boardId: currentBoardId,
          type: 'link',
          position: pos,
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
        const pos = centerPos(350, 250);
        const newTodo: TodoElement = {
          id: uuidv4(),
          boardId: currentBoardId,
          type: 'todo',
          position: pos,
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
        const pos = centerPos(300, 200);
        const newFile: FileElement = {
          id: uuidv4(),
          boardId: currentBoardId,
          type: 'file',
          position: pos,
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
        const pos = centerPos(600, 300);
        const newTable: TableElement = {
          id: uuidv4(),
          boardId: currentBoardId,
          type: 'table',
          position: pos,
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
        const pos = centerPos(200, 2);
        const newLine: LineElement = {
          id: uuidv4(),
          boardId: currentBoardId,
          type: 'line',
          position: pos,
          size: { width: 200, height: 2 },
          zIndex: elements.length,
          locked: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          content: {
            startPoint: { x: pos.x, y: pos.y },
            endPoint: { x: pos.x + 200, y: pos.y },
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

      case 'board': {
        const pos = centerPos(80, 100);
        const newBoardId = await createBoard('New Canvas Board', 'canvas', currentBoardId);

        const newBoardLink: BoardElement = {
          id: uuidv4(),
          boardId: currentBoardId,
          type: 'board',
          position: pos,
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
        const pos = centerPos(80, 100);
        const newBoardId = await createBoard('New Kanban Board', 'kanban', currentBoardId);

        const newKanbanLink: BoardElement = {
          id: uuidv4(),
          boardId: currentBoardId,
          type: 'board',
          position: pos,
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
        const pos = centerPos(80, 100);
        const newBoardId = await createBoard('New Database Board', 'database', currentBoardId);

        const newDatabaseLink: BoardElement = {
          id: uuidv4(),
          boardId: currentBoardId,
          type: 'board',
          position: pos,
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
        const pos = centerPos(200, 200);
        const newShape: ShapeElement = {
          id: uuidv4(),
          boardId: currentBoardId,
          type: 'shape',
          position: pos,
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
    <div className="absolute top-4 left-4 bg-white dark:bg-[#1E252B] border border-gray-200 dark:border-[#30363D] rounded-lg shadow-lg p-2 z-toolbar overflow-y-auto overflow-x-hidden scrollbar-thin" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
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
