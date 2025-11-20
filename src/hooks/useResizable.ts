/**
 * useResizable Hook
 * Handles element resizing with drag interaction
 */

import { useCallback, useRef } from 'react';
import { useElementStore, useUIStore } from '../store';

type ResizeDirection = 'se' | 'nw' | 'ne' | 'sw';

interface UseResizableProps {
  elementId: string;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  direction?: ResizeDirection;
}

export function useResizable({
  elementId,
  minWidth = 200,
  minHeight = 100,
  maxWidth = 1200,
  maxHeight = 800,
  direction = 'se'
}: UseResizableProps) {
  const { updateSize, updatePosition, getElementById } = useElementStore();
  const { gridEnabled } = useUIStore();
  const startPosRef = useRef({ x: 0, y: 0 });
  const startSizeRef = useRef({ width: 0, height: 0 });
  const startElementPosRef = useRef({ x: 0, y: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const element = getElementById(elementId);
    if (!element) return;

    startPosRef.current = { x: e.clientX, y: e.clientY };
    startSizeRef.current = {
      width: element.size.width,
      height: element.size.height
    };
    startElementPosRef.current = {
      x: element.position.x,
      y: element.position.y
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startPosRef.current.x;
      const deltaY = moveEvent.clientY - startPosRef.current.y;

      let newWidth = startSizeRef.current.width;
      let newHeight = startSizeRef.current.height;
      let newX = startElementPosRef.current.x;
      let newY = startElementPosRef.current.y;

      // Calculate new size and position based on direction
      switch (direction) {
        case 'se': // Bottom-right
          newWidth = startSizeRef.current.width + deltaX;
          newHeight = startSizeRef.current.height + deltaY;
          break;
        case 'nw': // Top-left
          newWidth = startSizeRef.current.width - deltaX;
          newHeight = startSizeRef.current.height - deltaY;
          newX = startElementPosRef.current.x + deltaX;
          newY = startElementPosRef.current.y + deltaY;
          break;
        case 'ne': // Top-right
          newWidth = startSizeRef.current.width + deltaX;
          newHeight = startSizeRef.current.height - deltaY;
          newY = startElementPosRef.current.y + deltaY;
          break;
        case 'sw': // Bottom-left
          newWidth = startSizeRef.current.width - deltaX;
          newHeight = startSizeRef.current.height + deltaY;
          newX = startElementPosRef.current.x + deltaX;
          break;
      }

      // Apply constraints
      const constrainedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
      const constrainedHeight = Math.max(minHeight, Math.min(maxHeight, newHeight));

      // Adjust position if size was constrained (for nw, ne, sw directions)
      if (direction === 'nw' || direction === 'sw') {
        newX = startElementPosRef.current.x + (startSizeRef.current.width - constrainedWidth);
      }
      if (direction === 'nw' || direction === 'ne') {
        newY = startElementPosRef.current.y + (startSizeRef.current.height - constrainedHeight);
      }

      // Grid snapping
      const gridSize = gridEnabled ? 8 : 1;
      if (gridSize > 1) {
        newWidth = Math.round(constrainedWidth / gridSize) * gridSize;
        newHeight = Math.round(constrainedHeight / gridSize) * gridSize;
        newX = Math.round(newX / gridSize) * gridSize;
        newY = Math.round(newY / gridSize) * gridSize;
      } else {
        newWidth = constrainedWidth;
        newHeight = constrainedHeight;
      }

      // Update size and position in real-time
      updateSize(elementId, { width: newWidth, height: newHeight });
      if (direction !== 'se') {
        updatePosition(elementId, { x: newX, y: newY }, true);
      }
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
    };

    const cursorMap = {
      se: 'se-resize',
      nw: 'nw-resize',
      ne: 'ne-resize',
      sw: 'sw-resize'
    };
    document.body.style.cursor = cursorMap[direction];
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [elementId, getElementById, minWidth, minHeight, maxWidth, maxHeight, gridEnabled, updateSize, updatePosition, direction]);

  return {
    handleMouseDown
  };
}
