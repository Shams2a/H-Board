/**
 * useResizable Hook
 * Handles element resizing with drag interaction
 */

import { useCallback, useRef } from 'react';
import { useElementStore, useUIStore } from '../store';

interface UseResizableProps {
  elementId: string;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
}

export function useResizable({
  elementId,
  minWidth = 200,
  minHeight = 100,
  maxWidth = 1200,
  maxHeight = 800
}: UseResizableProps) {
  const { updateSize, getElementById } = useElementStore();
  const { gridEnabled } = useUIStore();
  const startPosRef = useRef({ x: 0, y: 0 });
  const startSizeRef = useRef({ width: 0, height: 0 });

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

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startPosRef.current.x;
      const deltaY = moveEvent.clientY - startPosRef.current.y;

      let newWidth = startSizeRef.current.width + deltaX;
      let newHeight = startSizeRef.current.height + deltaY;

      // Apply constraints
      newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
      newHeight = Math.max(minHeight, Math.min(maxHeight, newHeight));

      // Grid snapping
      const gridSize = gridEnabled ? 8 : 1;
      if (gridSize > 1) {
        newWidth = Math.round(newWidth / gridSize) * gridSize;
        newHeight = Math.round(newHeight / gridSize) * gridSize;
      }

      // Update size in real-time
      updateSize(elementId, { width: newWidth, height: newHeight });
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
    };

    document.body.style.cursor = 'se-resize';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [elementId, getElementById, minWidth, minHeight, maxWidth, maxHeight, gridEnabled, updateSize]);

  return {
    handleMouseDown
  };
}
