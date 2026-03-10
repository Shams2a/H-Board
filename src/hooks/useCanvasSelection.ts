/**
 * useCanvasSelection Hook
 * Manages selection box state and mouse event handlers for multi-select on the Canvas.
 */

import { useState, useCallback } from 'react';
import type { Element } from '../types';

interface UseCanvasSelectionParams {
  canvasRef: React.RefObject<HTMLDivElement | null>;
  zoom: number;
  panX: number;
  panY: number;
  elements: Element[];
  selectedIds: string[];
  selectElement: (id: string, multi?: boolean) => void;
  clearSelection: () => void;
}

interface SelectionBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

export function useCanvasSelection({
  canvasRef,
  zoom,
  panX,
  panY,
  elements,
  selectedIds,
  selectElement,
  clearSelection,
}: UseCanvasSelectionParams) {
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState({ x: 0, y: 0 });
  const [selectionEnd, setSelectionEnd] = useState({ x: 0, y: 0 });
  const [didSelect, setDidSelect] = useState(false);

  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement;
      if (target.closest('.element-card')) return;
      if (e.button !== 0) return;

      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = (e.clientX - rect.left) / zoom - panX;
      const y = (e.clientY - rect.top) / zoom - panY;

      setIsSelecting(true);
      setSelectionStart({ x, y });
      setSelectionEnd({ x, y });
      setDidSelect(false);

      if (!e.ctrlKey && !e.metaKey) {
        clearSelection();
      }
    },
    [canvasRef, zoom, panX, panY, clearSelection]
  );

  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isSelecting) return;

      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = (e.clientX - rect.left) / zoom - panX;
      const y = (e.clientY - rect.top) / zoom - panY;

      setSelectionEnd({ x, y });

      const minX = Math.min(selectionStart.x, x);
      const maxX = Math.max(selectionStart.x, x);
      const minY = Math.min(selectionStart.y, y);
      const maxY = Math.max(selectionStart.y, y);

      elements.forEach((element) => {
        const elX = element.position.x;
        const elY = element.position.y;
        const elRight = elX + element.size.width;
        const elBottom = elY + element.size.height;

        const intersects = !(elRight < minX || elX > maxX || elBottom < minY || elY > maxY);

        if (intersects && !selectedIds.includes(element.id)) {
          selectElement(element.id, true);
          setDidSelect(true);
        }
      });
    },
    [isSelecting, canvasRef, zoom, panX, panY, selectionStart, elements, selectedIds, selectElement]
  );

  const handleCanvasMouseUp = useCallback(() => {
    setIsSelecting(false);
  }, []);

  const selectionBox: SelectionBox | null = isSelecting
    ? {
        left: Math.min(selectionStart.x, selectionEnd.x),
        top: Math.min(selectionStart.y, selectionEnd.y),
        width: Math.abs(selectionEnd.x - selectionStart.x),
        height: Math.abs(selectionEnd.y - selectionStart.y),
      }
    : null;

  return {
    selectionBox,
    didSelect,
    setDidSelect,
    handleCanvasMouseDown,
    handleCanvasMouseMove,
    handleCanvasMouseUp,
  };
}
