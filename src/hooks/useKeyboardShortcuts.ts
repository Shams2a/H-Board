/**
 * useKeyboardShortcuts Hook
 * Handles keyboard shortcuts for canvas operations
 */

import { useEffect } from 'react';
import { useUIStore } from '../store';

interface KeyboardShortcutsProps {
  onDelete?: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
  onDuplicate?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
}

export function useKeyboardShortcuts({
  onDelete,
  onCopy,
  onPaste,
  onDuplicate,
  onUndo,
  onRedo,
}: KeyboardShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input/textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true'
      ) {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const ctrlKey = isMac ? e.metaKey : e.ctrlKey;

      // Delete
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        onDelete?.();
        return;
      }

      // Copy (Ctrl/Cmd + C)
      if (ctrlKey && e.key === 'c') {
        e.preventDefault();
        onCopy?.();
        return;
      }

      // Paste (Ctrl/Cmd + V)
      if (ctrlKey && e.key === 'v') {
        e.preventDefault();
        onPaste?.();
        return;
      }

      // Duplicate (Ctrl/Cmd + D)
      if (ctrlKey && e.key === 'd') {
        e.preventDefault();
        onDuplicate?.();
        return;
      }

      // Undo (Ctrl/Cmd + Z)
      if (ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        onUndo?.();
        return;
      }

      // Redo (Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y)
      if ((ctrlKey && e.key === 'z' && e.shiftKey) || (ctrlKey && e.key === 'y')) {
        e.preventDefault();
        onRedo?.();
        return;
      }

      // Deselect all (Escape)
      if (e.key === 'Escape') {
        const { setSelectedElements } = useUIStore.getState();
        setSelectedElements([]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onDelete, onCopy, onPaste, onDuplicate, onUndo, onRedo]);
}
