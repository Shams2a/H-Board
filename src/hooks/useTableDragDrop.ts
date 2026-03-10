/**
 * Custom hook for table row and column drag & drop reordering.
 * Manages drag state and handlers for both row and column reordering.
 */

import { useState, useCallback, useRef } from 'react';
import type { TableElement } from '../types';
import { useElementStore } from '../store';

interface UseTableDragDropOptions {
  element: TableElement;
}

export function useTableDragDrop({ element }: UseTableDragDropOptions) {
  const updateElement = useElementStore(state => state.updateElement);

  // Row drag & drop state
  const [draggedRowIndex, setDraggedRowIndex] = useState<number | null>(null);
  const [dragOverRowIndex, setDragOverRowIndex] = useState<number | null>(null);

  // Column drag & drop state
  const [draggedColIndex, setDraggedColIndex] = useState<number | null>(null);
  const [dragOverColIndex, setDragOverColIndex] = useState<number | null>(null);

  // Use ref to get latest element in async handlers
  const elementRef = useRef(element);
  elementRef.current = element;

  // --- Row drag handlers ---

  const handleRowDragStart = useCallback((e: React.DragEvent, rowIndex: number) => {
    e.stopPropagation();
    setDraggedRowIndex(rowIndex);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', ''); // Required for Firefox
  }, []);

  const handleRowDragOver = useCallback((e: React.DragEvent, rowIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    setDragOverRowIndex(rowIndex);
  }, []);

  const handleRowDragLeave = useCallback(() => {
    setDragOverRowIndex(null);
  }, []);

  const handleRowDrop = useCallback(async (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    e.stopPropagation();

    // Read current draggedRowIndex from state via a ref-like approach
    setDraggedRowIndex(prev => {
      if (prev === null || prev === targetIndex) {
        setDragOverRowIndex(null);
        return null;
      }

      const el = elementRef.current;
      const rows = el.content.rows || [];
      const newRows = [...rows];
      const [draggedRow] = newRows.splice(prev, 1);
      newRows.splice(targetIndex, 0, draggedRow);

      updateElement(el.id, {
        content: {
          ...el.content,
          rows: newRows
        }
      });

      setDragOverRowIndex(null);
      return null;
    });
  }, [updateElement]);

  const handleRowDragEnd = useCallback(() => {
    setDraggedRowIndex(null);
    setDragOverRowIndex(null);
  }, []);

  // --- Column drag handlers ---

  const handleColDragStart = useCallback((e: React.DragEvent, colIndex: number) => {
    e.stopPropagation();
    setDraggedColIndex(colIndex);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', '');
  }, []);

  const handleColDragOver = useCallback((e: React.DragEvent, colIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColIndex(colIndex);
  }, []);

  const handleColDragLeave = useCallback(() => {
    setDragOverColIndex(null);
  }, []);

  const handleColDrop = useCallback(async (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    e.stopPropagation();

    setDraggedColIndex(prev => {
      if (prev === null || prev === targetIndex) {
        setDragOverColIndex(null);
        return null;
      }

      const el = elementRef.current;
      const headers = el.content.headers || [];
      const columnTypes = el.content.columnTypes || headers.map(() => 'text' as const);
      const columnWidths = el.content.columnWidths || headers.map(() => 150);
      const rows = el.content.rows || [];
      const columnDropdownOptions = el.content.columnDropdownOptions || {};

      // Reorder all column-related arrays
      const newHeaders = [...headers];
      const newColumnTypes = [...columnTypes];
      const newColumnWidths = [...columnWidths];

      const [draggedHeader] = newHeaders.splice(prev, 1);
      const [draggedType] = newColumnTypes.splice(prev, 1);
      const [draggedWidth] = newColumnWidths.splice(prev, 1);

      newHeaders.splice(targetIndex, 0, draggedHeader);
      newColumnTypes.splice(targetIndex, 0, draggedType);
      newColumnWidths.splice(targetIndex, 0, draggedWidth);

      // Reorder cells in all rows
      const newRows = rows.map(row => {
        const newRow = [...row];
        const [draggedCell] = newRow.splice(prev, 1);
        newRow.splice(targetIndex, 0, draggedCell);
        return newRow;
      });

      // Reorder dropdown options
      const newColumnDropdownOptions: Record<number, string[]> = {};
      Object.keys(columnDropdownOptions).forEach(key => {
        const idx = parseInt(key);
        let newIdx = idx;

        if (idx === prev) {
          newIdx = targetIndex;
        } else if (prev < targetIndex && idx > prev && idx <= targetIndex) {
          newIdx = idx - 1;
        } else if (prev > targetIndex && idx >= targetIndex && idx < prev) {
          newIdx = idx + 1;
        }

        newColumnDropdownOptions[newIdx] = columnDropdownOptions[idx];
      });

      updateElement(el.id, {
        content: {
          ...el.content,
          headers: newHeaders,
          columnTypes: newColumnTypes,
          columnWidths: newColumnWidths,
          columnDropdownOptions: newColumnDropdownOptions,
          rows: newRows
        }
      });

      setDragOverColIndex(null);
      return null;
    });
  }, [updateElement]);

  const handleColDragEnd = useCallback(() => {
    setDraggedColIndex(null);
    setDragOverColIndex(null);
  }, []);

  return {
    // Row state
    draggedRowIndex,
    dragOverRowIndex,
    // Column state
    draggedColIndex,
    dragOverColIndex,
    // Row handlers
    handleRowDragStart,
    handleRowDragOver,
    handleRowDragLeave,
    handleRowDrop,
    handleRowDragEnd,
    // Column handlers
    handleColDragStart,
    handleColDragOver,
    handleColDragLeave,
    handleColDrop,
    handleColDragEnd,
  };
}
