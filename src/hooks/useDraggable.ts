/**
 * useDraggable Hook
 * Handles drag and drop functionality for canvas elements
 */

import { useRef, useCallback } from 'react';
import { useElementStore, useUIStore, useDragStore } from '../store';
import type { Position } from '../types';

interface UseDraggableOptions {
  elementId: string;
  parentColumnId?: string | null;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

export function useDraggable({ elementId, parentColumnId = null, onDragStart, onDragEnd }: UseDraggableOptions) {
  const { updatePosition, getElementById } = useElementStore();
  const { gridEnabled, zoom } = useUIStore();
  const { setDraggedElement, clearDrag } = useDragStore();

  const isDragging = useRef(false);
  const startPos = useRef<Position>({ x: 0, y: 0 });
  const elementStartPos = useRef<Position>({ x: 0, y: 0 });
  const mouseMoveHandlerRef = useRef<((e: MouseEvent) => void) | null>(null);
  const mouseUpHandlerRef = useRef<((e: MouseEvent) => void) | null>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Only start drag on left click
    if (e.button !== 0) return;

    // Don't drag when clicking on interactive elements or inside editable content
    const target = e.target as HTMLElement;
    if (
      target.closest('button') ||
      target.closest('input') ||
      target.closest('textarea') ||
      target.closest('.ProseMirror') ||
      target.closest('a') ||
      target.closest('[contenteditable="true"]') ||
      target.tagName === 'H1' ||
      target.tagName === 'H2' ||
      target.tagName === 'H3' ||
      target.tagName === 'H4' ||
      target.tagName === 'H5' ||
      target.tagName === 'H6'
    ) {
      return;
    }

    e.stopPropagation();
    e.preventDefault();

    const element = getElementById(elementId);
    if (!element || element.locked) return;

    isDragging.current = true;
    startPos.current = { x: e.clientX, y: e.clientY };
    elementStartPos.current = { ...element.position };

    // Notify drag store
    setDraggedElement(elementId, parentColumnId);

    onDragStart?.();

    // Create handlers with current closure values
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;

      const element = getElementById(elementId);
      if (!element) return;

      // Calculate delta accounting for zoom
      const deltaX = (e.clientX - startPos.current.x) / zoom;
      const deltaY = (e.clientY - startPos.current.y) / zoom;

      // Calculate new position
      let newX = elementStartPos.current.x + deltaX;
      let newY = elementStartPos.current.y + deltaY;

      // Snap to grid if enabled
      if (gridEnabled) {
        const gridSize = 8;
        newX = Math.round(newX / gridSize) * gridSize;
        newY = Math.round(newY / gridSize) * gridSize;
      }

      // Update position
      updatePosition(elementId, { x: newX, y: newY });
    };

    const handleMouseUp = () => {
      if (!isDragging.current) return;

      isDragging.current = false;

      // Remove event listeners
      if (mouseMoveHandlerRef.current) {
        window.removeEventListener('mousemove', mouseMoveHandlerRef.current);
        mouseMoveHandlerRef.current = null;
      }
      if (mouseUpHandlerRef.current) {
        window.removeEventListener('mouseup', mouseUpHandlerRef.current);
        mouseUpHandlerRef.current = null;
      }

      // Reset cursor
      document.body.style.cursor = '';
      document.body.style.userSelect = '';

      // Clear drag store
      clearDrag();

      onDragEnd?.();
    };

    // Store handlers in refs
    mouseMoveHandlerRef.current = handleMouseMove;
    mouseUpHandlerRef.current = handleMouseUp;

    // Add event listeners to window for smooth dragging
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    // Change cursor
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
  }, [elementId, parentColumnId, onDragStart, onDragEnd, setDraggedElement, clearDrag, getElementById, updatePosition, zoom, gridEnabled]);

  return {
    handleMouseDown,
    isDragging: isDragging.current
  };
}
