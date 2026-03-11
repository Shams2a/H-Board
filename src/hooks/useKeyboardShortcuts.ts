/**
 * useKeyboardShortcuts Hook
 * Manages all keyboard shortcuts for the application
 */

import { useEffect, useCallback } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { generateId } from '../utils/uuid';
import { useUIStore, selectZoom, selectGridEnabled, selectPanX, selectPanY, selectActiveTool, useBoardStore, selectCurrentBoardId, useElementStore, selectElements, selectSelectedIds } from '../store';
import type { Element } from '../types';
import type { ElementType } from '../types';

interface UseKeyboardShortcutsOptions {
  onShowHelp?: () => void;
}

export function useKeyboardShortcuts(options?: UseKeyboardShortcutsOptions) {
  const zoom = useUIStore(selectZoom);
  const gridEnabled = useUIStore(selectGridEnabled);
  const panX = useUIStore(selectPanX);
  const panY = useUIStore(selectPanY);
  const activeTool = useUIStore(selectActiveTool);
  const setActiveTool = useUIStore(state => state.setActiveTool);
  const setZoom = useUIStore(state => state.setZoom);
  const zoomToFit = useUIStore(state => state.zoomToFit);
  const zoomToSelection = useUIStore(state => state.zoomToSelection);
  const toggleGrid = useUIStore(state => state.toggleGrid);
  const currentBoardId = useBoardStore(selectCurrentBoardId);
  const createBoard = useBoardStore(state => state.createBoard);
  const createElement = useElementStore(state => state.createElement);
  const elements = useElementStore(selectElements);
  const selectedIds = useElementStore(selectSelectedIds);
  const deleteElements = useElementStore(state => state.deleteElements);
  const updateElement = useElementStore(state => state.updateElement);
  const copy = useElementStore(state => state.copy);
  const duplicate = useElementStore(state => state.duplicate);
  const selectAll = useElementStore(state => state.selectAll);
  const clearSelection = useElementStore(state => state.clearSelection);

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
      id: generateId(),
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

    // Calculate true viewport center in canvas coordinates
    const viewportCenterX = (-panX + window.innerWidth / 2) / zoom;
    const viewportCenterY = (-panY + window.innerHeight / 2) / zoom;
    const gridSize = gridEnabled ? 8 : 1;

    // Center an element of given size at viewport center
    const centerPos = (w: number, h: number) => ({
      x: Math.round((viewportCenterX - w / 2) / gridSize) * gridSize,
      y: Math.round((viewportCenterY - h / 2) / gridSize) * gridSize,
    });

    const baseElement = {
      id: generateId(),
      boardId: currentBoardId,
      position: centerPos(300, 200), // default, overridden per type
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
          position: centerPos(400, 300),
          size: { width: 400, height: 300 },
          content: { src: '', alt: '', originalName: '' },
          style: { backgroundColor: '#FFFFFF' }
        };
        break;

      case 'column':
        element = {
          ...baseElement,
          type: 'column' as const,
          position: centerPos(350, 400),
          size: { width: 350, height: 400 },
          content: { title: 'New Column', childrenIds: [], maxWidth: 800 },
          style: { backgroundColor: '#FFFFFF' }
        };
        break;

      case 'line': {
        const linePos = centerPos(200, 2);
        element = {
          ...baseElement,
          type: 'line' as const,
          position: linePos,
          size: { width: 200, height: 2 },
          content: {
            startPoint: { x: linePos.x, y: linePos.y },
            endPoint: { x: linePos.x + 200, y: linePos.y },
            lineStyle: 'solid' as const,
            arrowStart: false,
            arrowEnd: true
          },
          style: { borderColor: '#374151', borderWidth: 2 }
        };
        break;
      }

      case 'link':
        element = {
          ...baseElement,
          type: 'link' as const,
          position: centerPos(350, 120),
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
          position: centerPos(350, 250),
          size: { width: 350, height: 250 },
          content: { items: [], showProgress: false },
          style: { backgroundColor: '#FFFFFF' }
        };
        break;

      case 'board': {
        const newBoardId = await createBoard('New Sub-Board', currentBoardId as any);

        element = {
          ...baseElement,
          type: 'board' as const,
          position: centerPos(80, 100),
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
          position: centerPos(600, 300),
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

  // L - Create Line
  useHotkeys('l', () => createElementShortcut('line'), { enableOnFormTags: false });

  // D - Toggle Drawing Mode
  useHotkeys('d', () => {
    if (isInputActive()) return;
    setActiveTool(activeTool === 'drawing' ? null : 'drawing');
  }, { enableOnFormTags: false });

  // K - Create Link
  useHotkeys('k', () => createElementShortcut('link'), { enableOnFormTags: false });

  // F - Create File
  useHotkeys('f', () => createElementShortcut('file'), { enableOnFormTags: false });

  // T - Create Todo
  useHotkeys('t', () => createElementShortcut('todo'), { enableOnFormTags: false });

  // G - Create Table
  useHotkeys('g', () => createElementShortcut('table'), { enableOnFormTags: false });

  // === ELEMENT MOVEMENT (Arrow Keys) ===

  // Arrow keys — move selected elements (1px, or grid-snapped; Shift = 10x)
  const moveSelected = (dx: number, dy: number) => {
    if (isInputActive() || !selectedIds || selectedIds.length === 0) return;
    const step = gridEnabled ? 8 : 1;
    for (const id of selectedIds) {
      const el = (elements as Element[]).find(e => e.id === id);
      if (el && !el.locked) {
        updateElement(id, {
          position: {
            x: el.position.x + dx * step,
            y: el.position.y + dy * step,
          },
        });
      }
    }
  };

  useHotkeys('up', (e) => { e.preventDefault(); moveSelected(0, -1); }, { enableOnFormTags: false });
  useHotkeys('down', (e) => { e.preventDefault(); moveSelected(0, 1); }, { enableOnFormTags: false });
  useHotkeys('left', (e) => { e.preventDefault(); moveSelected(-1, 0); }, { enableOnFormTags: false });
  useHotkeys('right', (e) => { e.preventDefault(); moveSelected(1, 0); }, { enableOnFormTags: false });

  // Shift+Arrow — larger movement (10x step)
  useHotkeys('shift+up', (e) => { e.preventDefault(); moveSelected(0, -10); }, { enableOnFormTags: false });
  useHotkeys('shift+down', (e) => { e.preventDefault(); moveSelected(0, 10); }, { enableOnFormTags: false });
  useHotkeys('shift+left', (e) => { e.preventDefault(); moveSelected(-10, 0); }, { enableOnFormTags: false });
  useHotkeys('shift+right', (e) => { e.preventDefault(); moveSelected(10, 0); }, { enableOnFormTags: false });

  // === ELEMENT MANIPULATION ===

  // Delete - Remove selected elements
  useHotkeys('delete, backspace', (e) => {
    if (isInputActive()) return;
    e.preventDefault();
    if (selectedIds && selectedIds.length > 0) {
      deleteElements(selectedIds);
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

  // Shift+1 - Zoom to Fit (show all elements)
  useHotkeys('shift+1', (e) => {
    if (isInputActive()) return;
    e.preventDefault();
    zoomToFit(elements as Element[]);
  }, { enableOnFormTags: false });

  // Shift+2 - Zoom to Selection
  useHotkeys('shift+2', (e) => {
    if (isInputActive()) return;
    e.preventDefault();
    if (selectedIds && selectedIds.length > 0) {
      const selectedElements = (elements as Element[]).filter(el => selectedIds.includes(el.id));
      zoomToSelection(selectedElements);
    }
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
      { keys: ['L'], description: 'Create Line/Arrow' },
      { keys: ['D'], description: 'Toggle Drawing Mode' },
      { keys: ['K'], description: 'Create Link' },
      { keys: ['F'], description: 'Create File' },
      { keys: ['T'], description: 'Create Todo List' },
      { keys: ['G'], description: 'Create Table' },
    ]
  },
  {
    category: 'Element Manipulation',
    shortcuts: [
      { keys: ['Arrow Keys'], description: 'Move selected element(s)' },
      { keys: ['Shift', 'Arrow Keys'], description: 'Move selected element(s) (large step)' },
      { keys: ['Delete', 'Backspace'], description: 'Delete selected element(s)' },
      { keys: ['Ctrl', 'C'], description: 'Copy selected element(s)' },
      { keys: ['Ctrl', 'V'], description: 'Paste copied elements or create Note from clipboard text' },
      { keys: ['Ctrl', 'D'], description: 'Duplicate selected element(s)' },
      { keys: ['Ctrl', 'A'], description: 'Select all elements' },
      { keys: ['Escape'], description: 'Clear selection / exit tool' },
    ]
  },
  {
    category: 'View',
    shortcuts: [
      { keys: ['Ctrl', '+'], description: 'Zoom in' },
      { keys: ['Ctrl', '-'], description: 'Zoom out' },
      { keys: ['Ctrl', '0'], description: 'Reset zoom (100%)' },
      { keys: ['Ctrl', 'Scroll'], description: 'Zoom at cursor (or pinch trackpad)' },
      { keys: ['Shift', '1'], description: 'Zoom to fit all elements' },
      { keys: ['Shift', '2'], description: 'Zoom to selection' },
      { keys: ['Ctrl', 'G'], description: 'Toggle grid' },
      { keys: ['Shift', 'Scroll'], description: 'Horizontal pan' },
    ]
  },
  {
    category: 'Help',
    shortcuts: [
      { keys: ['Ctrl', '/'], description: 'Show keyboard shortcuts' },
    ]
  }
];
