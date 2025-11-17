/**
 * useDraggable Hook
 * Handles drag and drop functionality for canvas elements
 */

import { useRef, useCallback } from 'react';
import { useElementStore, useUIStore } from '../store';
import type { Position } from '../types';

interface UseDraggableOptions {
  elementId: string;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

export function useDraggable({ elementId, onDragStart, onDragEnd }: UseDraggableOptions) {
  const { updatePosition, getElementById } = useElementStore();
  const { gridEnabled, zoom } = useUIStore();

  const isDragging = useRef(false);
  const startPos = useRef<Position>({ x: 0, y: 0 });
  const elementStartPos = useRef<Position>({ x: 0, y: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Only start drag on left click and if not clicking on interactive elements
    if (e.button !== 0) return;

    const target = e.target as HTMLElement;
    if (
      target.closest('button') ||
      target.closest('.ProseMirror') ||
      target.closest('input') ||
      target.closest('textarea')
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

    onDragStart?.();

    // Add event listeners to window for smooth dragging
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    // Change cursor
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
  }, [elementId, onDragStart]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
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
  }, [elementId, zoom, gridEnabled, updatePosition]);

  const handleMouseUp = useCallback(() => {
    if (!isDragging.current) return;

    isDragging.current = false;

    // Remove event listeners
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);

    // Reset cursor
    document.body.style.cursor = '';
    document.body.style.userSelect = '';

    onDragEnd?.();
  }, [onDragEnd]);

  return {
    handleMouseDown,
    isDragging: isDragging.current
  };
}
