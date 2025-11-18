/**
 * useKeyboardShortcuts Hook
 * Global keyboard shortcuts for canvas operations
 */

import { useHotkeys } from 'react-hotkeys-hook';
import { useElementStore } from '../store';

export function useKeyboardShortcuts() {
  const {
    selectedIds,
    deleteElements,
    copy,
    paste,
    duplicate,
    selectAll,
    clearSelection
  } = useElementStore();

  // Delete - Remove selected elements
  useHotkeys('delete, backspace', (e) => {
    e.preventDefault();
    if (selectedIds.length > 0) {
      // Don't delete if user is typing in an input/textarea
      const activeElement = document.activeElement;
      if (
        activeElement?.tagName === 'INPUT' ||
        activeElement?.tagName === 'TEXTAREA' ||
        activeElement?.getAttribute('contenteditable') === 'true'
      ) {
        return;
      }
      deleteElements(selectedIds);
    }
  }, { enableOnFormTags: false });

  // Copy - Ctrl+C (Cmd+C on Mac)
  useHotkeys('mod+c', (e) => {
    e.preventDefault();
    if (selectedIds.length > 0) {
      copy();
    }
  }, { enableOnFormTags: false });

  // Paste - Ctrl+V (Cmd+V on Mac)
  useHotkeys('mod+v', (e) => {
    e.preventDefault();
    paste();
  }, { enableOnFormTags: false });

  // Duplicate - Ctrl+D (Cmd+D on Mac)
  useHotkeys('mod+d', (e) => {
    e.preventDefault();
    if (selectedIds.length > 0) {
      duplicate(selectedIds);
    }
  }, { enableOnFormTags: false });

  // Select All - Ctrl+A (Cmd+A on Mac)
  useHotkeys('mod+a', (e) => {
    // Don't select all if user is typing in an input/textarea
    const activeElement = document.activeElement;
    if (
      activeElement?.tagName === 'INPUT' ||
      activeElement?.tagName === 'TEXTAREA' ||
      activeElement?.getAttribute('contenteditable') === 'true'
    ) {
      return;
    }
    e.preventDefault();
    selectAll();
  }, { enableOnFormTags: false });

  // Escape - Clear selection
  useHotkeys('escape', (e) => {
    e.preventDefault();
    clearSelection();
  }, { enableOnFormTags: true });

  // TODO: Implement undo/redo
  // useHotkeys('mod+z', handleUndo, { enableOnFormTags: false });
  // useHotkeys('mod+y, mod+shift+z', handleRedo, { enableOnFormTags: false });
}
