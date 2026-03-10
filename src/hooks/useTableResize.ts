/**
 * Custom hook for table column resizing logic.
 * Manages resize state and mouse event handlers for column width adjustment.
 */

import { useState, useCallback, useRef } from 'react';
import type { TableElement } from '../types';
import { useElementStore } from '../store';

const MIN_COL_WIDTH = 60;
const DEFAULT_COL_WIDTH = 150;

interface UseTableResizeOptions {
  element: TableElement;
}

export function useTableResize({ element }: UseTableResizeOptions) {
  const updateElement = useElementStore(state => state.updateElement);

  const [resizingColIndex, setResizingColIndex] = useState<number | null>(null);

  // Use refs to avoid stale closures in document event listeners
  const resizingColIndexRef = useRef<number | null>(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);
  const elementRef = useRef(element);
  elementRef.current = element;

  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (resizingColIndexRef.current === null) return;

    const diff = e.clientX - startXRef.current;
    const newWidth = Math.max(MIN_COL_WIDTH, startWidthRef.current + diff);

    const currentElement = elementRef.current;
    const columnWidths = currentElement.content.columnWidths || currentElement.content.headers.map(() => DEFAULT_COL_WIDTH);
    const newColumnWidths = [...columnWidths];
    newColumnWidths[resizingColIndexRef.current] = newWidth;

    updateElement(currentElement.id, {
      content: {
        ...currentElement.content,
        columnWidths: newColumnWidths
      }
    });
  }, [updateElement]);

  const handleResizeEnd = useCallback(() => {
    resizingColIndexRef.current = null;
    setResizingColIndex(null);
    document.removeEventListener('mousemove', handleResizeMove);
    document.removeEventListener('mouseup', handleResizeEnd);
  }, [handleResizeMove]);

  const handleResizeStart = useCallback((colIndex: number, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const columnWidths = elementRef.current.content.columnWidths || elementRef.current.content.headers.map(() => DEFAULT_COL_WIDTH);

    resizingColIndexRef.current = colIndex;
    setResizingColIndex(colIndex);
    startXRef.current = e.clientX;
    startWidthRef.current = columnWidths[colIndex] || DEFAULT_COL_WIDTH;

    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
  }, [handleResizeMove, handleResizeEnd]);

  return {
    resizingColIndex,
    handleResizeStart,
  };
}
