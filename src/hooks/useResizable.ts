/**
 * useResizable Hook
 * Handles resize functionality for canvas elements
 */

import { useRef, useCallback } from 'react';
import { useElementStore, useUIStore } from '../store';
import type { Size } from '../types';

interface UseResizableOptions {
  elementId: string;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  onResizeStart?: () => void;
  onResizeEnd?: () => void;
}

export function useResizable({
  elementId,
  minWidth = 200,
  minHeight = 100,
  maxWidth = 1200,
  maxHeight = 1200,
  onResizeStart,
  onResizeEnd
}: UseResizableOptions) {
  const { updateSize, getElementById } = useElementStore();
  const { gridEnabled, zoom } = useUIStore();

  const isResizing = useRef(false);
  const startPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const elementStartSize = useRef<Size>({ width: 0, height: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Only start resize on left click
    if (e.button !== 0) return;

    e.stopPropagation();
    e.preventDefault();

    const element = getElementById(elementId);
    if (!element || element.locked) return;

    isResizing.current = true;
    startPos.current = { x: e.clientX, y: e.clientY };
    elementStartSize.current = { ...element.size };

    onResizeStart?.();

    // Add event listeners to window for smooth resizing
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    // Change cursor
    document.body.style.cursor = 'se-resize';
    document.body.style.userSelect = 'none';
  }, [elementId, onResizeStart]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing.current) return;

    const element = getElementById(elementId);
    if (!element) return;

    // Calculate delta accounting for zoom
    const deltaX = (e.clientX - startPos.current.x) / zoom;
    const deltaY = (e.clientY - startPos.current.y) / zoom;

    // Calculate new size
    let newWidth = elementStartSize.current.width + deltaX;
    let newHeight = elementStartSize.current.height + deltaY;

    // Apply constraints
    newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
    newHeight = Math.max(minHeight, Math.min(maxHeight, newHeight));

    // Snap to grid if enabled
    if (gridEnabled) {
      const gridSize = 8;
      newWidth = Math.round(newWidth / gridSize) * gridSize;
      newHeight = Math.round(newHeight / gridSize) * gridSize;
    }

    // Update size
    updateSize(elementId, { width: newWidth, height: newHeight });
  }, [elementId, zoom, gridEnabled, minWidth, minHeight, maxWidth, maxHeight, updateSize]);

  const handleMouseUp = useCallback(() => {
    if (!isResizing.current) return;

    isResizing.current = false;

    // Remove event listeners
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);

    // Reset cursor
    document.body.style.cursor = '';
    document.body.style.userSelect = '';

    onResizeEnd?.();
  }, [onResizeEnd]);

  return {
    handleMouseDown,
    isResizing: isResizing.current
  };
}
