/**
 * ContextMenu Component
 * Right-click context menu for quick actions
 */

import { useEffect, useRef } from 'react';
import { useElementStore, useBoardStore, useUIStore } from '../../store';
import {
  StickyNote,
  Columns,
  FolderPlus,
  Table,
  Copy,
  Clipboard,
  Trash2,
  CheckSquare2,
  Download
} from 'lucide-react';
import type { NoteElement, ColumnElement, BoardElement, TableElement } from '../../types';

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  canvasPosition: { x: number; y: number };
  onExport?: () => void;
}

export default function ContextMenu({ x, y, onClose, canvasPosition, onExport }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const { createElement, elements, selectedIds, copy, paste, deleteElements, selectAll, clipboard } = useElementStore();
  const { currentBoardId, createBoard } = useBoardStore();
  const { gridEnabled, zoom } = useUIStore();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // Calculate spawn position with grid snapping
  const getSpawnPosition = () => {
    const gridSize = gridEnabled ? 8 : 1;
    const snappedX = Math.round(canvasPosition.x / gridSize) * gridSize;
    const snappedY = Math.round(canvasPosition.y / gridSize) * gridSize;
    return { x: snappedX, y: snappedY };
  };

  const handleCreateNote = async () => {
    if (!currentBoardId) return;
    const pos = getSpawnPosition();

    const newNote: NoteElement = {
      id: crypto.randomUUID(),
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
    onClose();
  };

  const handleCreateColumn = async () => {
    if (!currentBoardId) return;
    const pos = getSpawnPosition();

    const newColumn: ColumnElement = {
      id: crypto.randomUUID(),
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
        backgroundColor: '#FFFFFF'
      }
    };
    await createElement(newColumn);
    onClose();
  };

  const handleCreateBoard = async () => {
    if (!currentBoardId) return;
    const pos = getSpawnPosition();

    const newBoardId = await createBoard('New Sub-Board', currentBoardId);

    const newBoardLink: BoardElement = {
      id: crypto.randomUUID(),
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
        title: 'New Sub-Board',
        description: '',
        elementCount: 0
      },
      style: {
        backgroundColor: '#DBEAFE'
      }
    };
    await createElement(newBoardLink);
    onClose();
  };

  const handleCreateTable = async () => {
    if (!currentBoardId) return;
    const pos = getSpawnPosition();

    const newTable: TableElement = {
      id: crypto.randomUUID(),
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
        backgroundColor: '#FFFFFF'
      }
    };
    await createElement(newTable);
    onClose();
  };

  const handleCopy = () => {
    copy();
    onClose();
  };

  const handlePaste = async () => {
    if (clipboard.length === 0) return;

    // Calculate the center of clipboard elements to position them at cursor
    const minX = Math.min(...clipboard.map(el => el.position.x));
    const minY = Math.min(...clipboard.map(el => el.position.y));

    // Offset to move elements so their top-left is at cursor position
    const offset = {
      x: canvasPosition.x - minX,
      y: canvasPosition.y - minY
    };

    await paste(offset);
    onClose();
  };

  const handleDelete = async () => {
    if (selectedIds.length > 0) {
      await deleteElements(selectedIds);
    }
    onClose();
  };

  const handleSelectAll = () => {
    selectAll();
    onClose();
  };

  const handleExport = () => {
    if (onExport) {
      onExport();
    }
    onClose();
  };

  const hasSelection = selectedIds.length > 0;
  const hasClipboard = clipboard.length > 0;

  const menuItems = [
    { type: 'header', label: 'Create' },
    { type: 'item', label: 'Note', icon: <StickyNote className="w-4 h-4" />, action: handleCreateNote, shortcut: 'N' },
    { type: 'item', label: 'Column', icon: <Columns className="w-4 h-4" />, action: handleCreateColumn, shortcut: 'C' },
    { type: 'item', label: 'Board', icon: <FolderPlus className="w-4 h-4" />, action: handleCreateBoard, shortcut: 'B' },
    { type: 'item', label: 'Table', icon: <Table className="w-4 h-4" />, action: handleCreateTable, shortcut: 'G' },
    { type: 'separator' },
    { type: 'item', label: 'Copy', icon: <Copy className="w-4 h-4" />, action: handleCopy, shortcut: 'Ctrl+C', disabled: !hasSelection },
    { type: 'item', label: 'Paste', icon: <Clipboard className="w-4 h-4" />, action: handlePaste, shortcut: 'Ctrl+V', disabled: !hasClipboard },
    { type: 'separator' },
    { type: 'item', label: 'Delete', icon: <Trash2 className="w-4 h-4" />, action: handleDelete, shortcut: 'Del', disabled: !hasSelection, danger: true },
    { type: 'item', label: 'Select All', icon: <CheckSquare2 className="w-4 h-4" />, action: handleSelectAll, shortcut: 'Ctrl+A' },
    { type: 'separator' },
    { type: 'item', label: 'Export', icon: <Download className="w-4 h-4" />, action: handleExport, shortcut: 'Ctrl+E' },
  ];

  return (
    <div
      ref={menuRef}
      className="fixed bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl py-1 z-[9999] min-w-[200px]"
      style={{
        left: `${x}px`,
        top: `${y}px`,
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {menuItems.map((item, index) => {
        if (item.type === 'separator') {
          return <div key={index} className="h-px bg-gray-200 dark:bg-gray-700 my-1" />;
        }

        if (item.type === 'header') {
          return (
            <div key={index} className="px-3 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
              {item.label}
            </div>
          );
        }

        return (
          <button
            key={index}
            onClick={(e) => {
              e.stopPropagation();
              if (!item.disabled && item.action) {
                item.action();
              }
            }}
            disabled={item.disabled}
            className={`
              w-full px-3 py-2 text-sm text-left flex items-center gap-3
              ${item.disabled
                ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                : item.danger
                  ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                  : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
              }
            `}
          >
            <span className={item.disabled ? 'opacity-50' : ''}>{item.icon}</span>
            <span className="flex-1">{item.label}</span>
            {item.shortcut && (
              <span className="text-xs text-gray-400 dark:text-gray-500">{item.shortcut}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
