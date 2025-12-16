/**
 * useKeyboardShortcuts Hook
 * Manages all keyboard shortcuts for the application
 */

import { useEffect, useCallback } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { useUIStore, useBoardStore, useElementStore } from '../store';
import type { ElementType } from '../types';

interface UseKeyboardShortcutsOptions {
  onShowHelp?: () => void;
}

export function useKeyboardShortcuts(options?: UseKeyboardShortcutsOptions) {
  const { setActiveTool, zoom, setZoom, gridEnabled, toggleGrid, panX, panY } = useUIStore();
  const { currentBoardId, createBoard } = useBoardStore();
  const {
    createElement,
    deleteElement,
    selectedElementId,
    elements,
    selectedIds,
    deleteElements,
    copy,
    paste,
    duplicate,
    selectAll,
    clearSelection,
    clipboard
  } = useElementStore();

  // Helper to check if we're in an input field
  const isInputActive = () => {
    const activeElement = document.activeElement;
    return (
      activeElement?.tagName === 'INPUT' ||
      activeElement?.tagName === 'TEXTAREA' ||
      activeElement?.getAttribute('contenteditable') === 'true' ||
      activeElement?.closest('.ProseMirror')
    );
  };

  // Helper to create a Note from external clipboard text
  const createNoteFromExternalPaste = useCallback(async (text: string) => {
    if (!currentBoardId) return;

    // Calculate center of viewport
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const centerX = (-panX + viewportWidth / 2) / zoom;
    const centerY = (-panY + viewportHeight / 2) / zoom;

    const gridSize = gridEnabled ? 8 : 1;
    const snappedX = Math.round(centerX / gridSize) * gridSize;
    const snappedY = Math.round(centerY / gridSize) * gridSize;

    const newNote = {
      id: crypto.randomUUID(),
      boardId: currentBoardId,
      type: 'note' as const,
      position: { x: snappedX, y: snappedY },
      size: { width: 300, height: 200 },
      zIndex: elements.length,
      locked: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      content: {
        text: text,
        textFormat: 'html' as const
      },
      style: { backgroundColor: '#FFFFFF' }
    };

    await createElement(newNote);
  }, [currentBoardId, panX, panY, zoom, gridEnabled, elements.length, createElement]);

  // Element creation helper
  const createElementShortcut = async (type: ElementType) => {
    if (isInputActive() || !currentBoardId) return;

    const centerX = 400;
    const centerY = 300;
    const gridSize = gridEnabled ? 8 : 1;
    const snappedX = Math.round(centerX / gridSize) * gridSize;
    const snappedY = Math.round(centerY / gridSize) * gridSize;

    const baseElement = {
      id: crypto.randomUUID(),
      boardId: currentBoardId,
      position: { x: snappedX, y: snappedY },
      zIndex: elements.length,
      locked: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    let element;

    switch (type) {
      case 'note':
        element = {
          ...baseElement,
          type: 'note' as const,
          size: { width: 300, height: 200 },
          content: { text: '', textFormat: 'html' as const },
          style: { backgroundColor: '#FFFFFF' }
        };
        break;

      case 'image':
        element = {
          ...baseElement,
          type: 'image' as const,
          size: { width: 400, height: 300 },
          content: { src: '', alt: '', originalName: '' },
          style: { backgroundColor: '#FFFFFF' }
        };
        break;

      case 'column':
        element = {
          ...baseElement,
          type: 'column' as const,
          size: { width: 350, height: 400 },
          content: { title: 'New Column', childrenIds: [], maxWidth: 800 },
          style: { backgroundColor: '#FFFFFF' }
        };
        break;

      case 'section':
        element = {
          ...baseElement,
          type: 'section' as const,
          size: { width: 400, height: 300 },
          content: { title: '' },
          style: { backgroundColor: '#F3F4F6', opacity: 0.5 }
        };
        break;

      case 'line':
        element = {
          ...baseElement,
          type: 'line' as const,
          size: { width: 200, height: 2 },
          content: {
            startPoint: { x: snappedX, y: snappedY },
            endPoint: { x: snappedX + 200, y: snappedY },
            lineStyle: 'solid' as const,
            arrowStart: false,
            arrowEnd: true
          },
          style: { borderColor: '#374151', borderWidth: 2 }
        };
        break;

      case 'drawing':
        element = {
          ...baseElement,
          type: 'drawing' as const,
          size: { width: 400, height: 300 },
          content: { paths: [] },
          style: { backgroundColor: '#FFFFFF' }
        };
        break;

      case 'link':
        element = {
          ...baseElement,
          type: 'link' as const,
          size: { width: 350, height: 120 },
          content: { url: '', title: '', description: '', favicon: '' },
          style: { backgroundColor: '#FFFFFF' }
        };
        break;

      case 'file':
        element = {
          ...baseElement,
          type: 'file' as const,
          size: { width: 300, height: 200 },
          content: { fileName: '', fileType: '', fileSize: 0, fileData: '' },
          style: { backgroundColor: '#FFFFFF' }
        };
        break;

      case 'todo':
        element = {
          ...baseElement,
          type: 'todo' as const,
          size: { width: 350, height: 250 },
          content: { items: [], showProgress: false },
          style: { backgroundColor: '#FFFFFF' }
        };
        break;

      case 'board': {
        // Create a new sub-board first
        const newBoardId = await createBoard('New Sub-Board', currentBoardId);

        // Then create a board link element
        element = {
          ...baseElement,
          type: 'board' as const,
          size: { width: 80, height: 100 },
          content: {
            linkedBoardId: newBoardId,
            title: 'New Sub-Board',
            description: '',
            elementCount: 0
          },
          style: { backgroundColor: '#DBEAFE' }
        };
        break;
      }

      case 'table':
        element = {
          ...baseElement,
          type: 'table' as const,
          size: { width: 600, height: 300 },
          content: {
            headers: ['Column 1', 'Column 2', 'Column 3'],
            rows: [[
              { value: '', type: 'text' as const },
              { value: '', type: 'text' as const },
              { value: '', type: 'text' as const }
            ]],
            columnWidths: []
          },
          style: { backgroundColor: '#FFFFFF' }
        };
        break;

      default:
        return;
    }

    await createElement(element);
  };

  // === ELEMENT CREATION SHORTCUTS ===

  // N - Create Note
  useHotkeys('n', () => createElementShortcut('note'), { enableOnFormTags: false });

  // I - Create Image
  useHotkeys('i', () => createElementShortcut('image'), { enableOnFormTags: false });

  // C - Create Column
  useHotkeys('c', () => createElementShortcut('column'), { enableOnFormTags: false });

  // B - Create Board (Sub-board)
  useHotkeys('b', () => createElementShortcut('board'), { enableOnFormTags: false });

  // S - Create Section
  useHotkeys('s', () => createElementShortcut('section'), { enableOnFormTags: false });

  // L - Create Line
  useHotkeys('l', () => createElementShortcut('line'), { enableOnFormTags: false });

  // D - Create Drawing
  useHotkeys('d', () => createElementShortcut('drawing'), { enableOnFormTags: false });

  // K - Create Link
  useHotkeys('k', () => createElementShortcut('link'), { enableOnFormTags: false });

  // F - Create File
  useHotkeys('f', () => createElementShortcut('file'), { enableOnFormTags: false });

  // T - Create Todo
  useHotkeys('t', () => createElementShortcut('todo'), { enableOnFormTags: false });

  // G - Create Table
  useHotkeys('g', () => createElementShortcut('table'), { enableOnFormTags: false });

  // === ELEMENT MANIPULATION ===

  // Delete - Remove selected elements
  useHotkeys('delete, backspace', (e) => {
    if (isInputActive()) return;
    e.preventDefault();
    if (selectedIds && selectedIds.length > 0) {
      deleteElements(selectedIds);
    } else if (selectedElementId) {
      deleteElement(selectedElementId);
    }
  }, { enableOnFormTags: false });

  // Copy - Ctrl+C (Cmd+C on Mac)
  // Copies to both internal clipboard AND system clipboard with a marker
  useHotkeys('mod+c', async (e) => {
    if (isInputActive()) return;
    e.preventDefault();
    if (selectedIds && selectedIds.length > 0) {
      copy();

      // Add marker to system clipboard to identify H-Board internal copy
      try {
        await navigator.clipboard.writeText('__H_BOARD_INTERNAL_COPY__');
      } catch (err) {
        // Clipboard write failed, internal clipboard still works
      }
    }
  }, { enableOnFormTags: false });

  // Native paste event handler for smart paste detection
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      // Ignore paste if we're in an input field
      const activeElement = document.activeElement;
      const isTyping = (
        activeElement?.tagName === 'INPUT' ||
        activeElement?.tagName === 'TEXTAREA' ||
        activeElement?.getAttribute('contenteditable') === 'true' ||
        activeElement?.closest('.ProseMirror')
      );

      if (isTyping) return;

      e.preventDefault();

      // Check if clipboard has text data
      const text = e.clipboardData?.getData('text/plain');

      // If it's our internal copy marker, use internal clipboard
      if (text === '__H_BOARD_INTERNAL_COPY__') {
        const { clipboard, paste } = useElementStore.getState();
        if (clipboard && clipboard.length > 0) {
          paste();
        }
        return;
      }

      // Otherwise, if there's text, create a Note from it
      if (text && text.trim()) {
        await createNoteFromExternalPaste(text);
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [createNoteFromExternalPaste]);

  // Duplicate - Ctrl+D (Cmd+D on Mac)
  useHotkeys('mod+d', (e) => {
    if (isInputActive()) return;
    e.preventDefault();
    if (selectedIds && selectedIds.length > 0) {
      duplicate(selectedIds);
    }
  }, { enableOnFormTags: false });

  // Select All - Ctrl+A (Cmd+A on Mac)
  useHotkeys('mod+a', (e) => {
    if (isInputActive()) return;
    e.preventDefault();
    selectAll();
  }, { enableOnFormTags: false });

  // Escape - Clear selection
  useHotkeys('escape', (e) => {
    if (isInputActive()) return;
    e.preventDefault();
    clearSelection();
    setActiveTool(null);
  }, { enableOnFormTags: true });

  // === VIEW CONTROLS ===

  // Ctrl+G - Toggle Grid
  useHotkeys('mod+g', (e) => {
    if (isInputActive()) return;
    e.preventDefault();
    toggleGrid();
  }, { enableOnFormTags: false });

  // Ctrl+0 - Reset Zoom
  useHotkeys('mod+0', (e) => {
    if (isInputActive()) return;
    e.preventDefault();
    setZoom(1);
  }, { enableOnFormTags: false });

  // Ctrl++ - Zoom In
  useHotkeys('mod+plus, mod+=', (e) => {
    if (isInputActive()) return;
    e.preventDefault();
    setZoom(Math.min(zoom + 0.1, 3));
  }, { enableOnFormTags: false });

  // Ctrl+- - Zoom Out
  useHotkeys('mod+minus', (e) => {
    if (isInputActive()) return;
    e.preventDefault();
    setZoom(Math.max(zoom - 0.1, 0.1));
  }, { enableOnFormTags: false });

  // === HELP ===

  // Ctrl+/ - Show Help
  useHotkeys('mod+slash, mod+shift+slash', (e) => {
    if (isInputActive()) return;
    e.preventDefault();
    options?.onShowHelp?.();
  }, { enableOnFormTags: false });
}

// Export keyboard shortcuts list for help modal
export const keyboardShortcuts = [
  {
    category: 'Element Creation',
    shortcuts: [
      { keys: ['N'], description: 'Create Note' },
      { keys: ['I'], description: 'Create Image' },
      { keys: ['C'], description: 'Create Column' },
      { keys: ['B'], description: 'Create Sub-Board' },
      { keys: ['S'], description: 'Create Section' },
      { keys: ['L'], description: 'Create Line/Arrow' },
      { keys: ['D'], description: 'Create Drawing' },
      { keys: ['K'], description: 'Create Link' },
      { keys: ['F'], description: 'Create File' },
      { keys: ['T'], description: 'Create Todo List' },
      { keys: ['G'], description: 'Create Table' },
    ]
  },
  {
    category: 'Element Manipulation',
    shortcuts: [
      { keys: ['Delete', 'Backspace'], description: 'Delete selected element(s)' },
      { keys: ['Ctrl', 'C'], description: 'Copy selected element(s)' },
      { keys: ['Ctrl', 'V'], description: 'Paste copied elements or create Note from clipboard text' },
      { keys: ['Ctrl', 'D'], description: 'Duplicate selected element(s)' },
      { keys: ['Ctrl', 'A'], description: 'Select all elements' },
      { keys: ['Escape'], description: 'Clear selection' },
    ]
  },
  {
    category: 'View',
    shortcuts: [
      { keys: ['Ctrl', '+'], description: 'Zoom in' },
      { keys: ['Ctrl', '-'], description: 'Zoom out' },
      { keys: ['Ctrl', '0'], description: 'Reset zoom' },
      { keys: ['Ctrl', 'G'], description: 'Toggle grid' },
    ]
  },
  {
    category: 'Help',
    shortcuts: [
      { keys: ['Ctrl', '/'], description: 'Show keyboard shortcuts' },
    ]
  }
];
