/**
 * Table Component
 * Editable spreadsheet-style table with rows and columns
 */

import { useRef, useState } from 'react';
import type { TableElement, TableCell, CellType } from '../../types';
import { useElementStore, useDragStore } from '../../store';
import { useDraggable } from '../../hooks/useDraggable';
import { useResizable } from '../../hooks/useResizable';
import { useDarkModeColor } from '../../hooks/useDarkModeColor';
import {
  Plus,
  Trash2,
  GripVertical
} from 'lucide-react';

// Date formatting helpers
const formatDateToDisplay = (isoDate: string | null | undefined): string => {
  if (!isoDate) return '';
  try {
    const date = new Date(isoDate);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return '';
  }
};

const formatDateToISO = (dateValue: any): string => {
  if (!dateValue) return new Date().toISOString().split('T')[0];
  if (typeof dateValue === 'string' && dateValue.includes('-')) {
    return dateValue; // Already ISO format
  }
  return new Date().toISOString().split('T')[0];
};

// Number formatting helper
const formatNumber = (value: any): string => {
  const num = parseFloat(value);
  if (isNaN(num)) return '';
  return num.toLocaleString('fr-FR');
};

// Get default value for cell type
const getDefaultCellValue = (type: CellType): any => {
  switch (type) {
    case 'checkbox':
      return false;
    case 'number':
      return 0;
    case 'date':
      return new Date().toISOString().split('T')[0];
    case 'text':
    case 'dropdown':
    default:
      return '';
  }
};

interface TableProps {
  element: TableElement;
  isSelected?: boolean;
  onSelect?: () => void;
  parentColumnId?: string;
}

export default function Table({ element, isSelected, onSelect: _onSelect, parentColumnId }: TableProps) {
  const { updateElement } = useElementStore();
  const { draggedElementId, justFinishedDrag } = useDragStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
  const [editValue, setEditValue] = useState('');

  // Column resizing state
  const [resizingColIndex, setResizingColIndex] = useState<number | null>(null);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);

  // Row drag & drop state
  const [draggedRowIndex, setDraggedRowIndex] = useState<number | null>(null);
  const [dragOverRowIndex, setDragOverRowIndex] = useState<number | null>(null);

  // Column drag & drop state
  const [draggedColIndex, setDraggedColIndex] = useState<number | null>(null);
  const [dragOverColIndex, setDragOverColIndex] = useState<number | null>(null);

  const isBeingDragged = draggedElementId === element.id;

  // Get dark mode adapted background color
  const backgroundColor = useDarkModeColor(element.style.backgroundColor || '#FFFFFF');

  // Calculate adaptive column widths based on available space
  const calculateAdaptiveWidths = () => {
    const headers = element.content.headers || [];
    const baseColumnWidths = element.content.columnWidths || headers.map(() => 150);

    // Calculate total width needed at base size
    const MIN_ROW_HEADER_WIDTH = 32;
    const totalBaseWidth = baseColumnWidths.reduce((sum, w) => sum + w, 0);
    const availableWidth = element.size.width - MIN_ROW_HEADER_WIDTH - 4; // -4 for borders

    // If table fits, use base widths; otherwise scale proportionally
    if (totalBaseWidth <= availableWidth) {
      return baseColumnWidths;
    }

    // Scale all columns proportionally to fit
    const scaleFactor = availableWidth / totalBaseWidth;
    return baseColumnWidths.map(w => Math.max(w * scaleFactor, 60)); // Min 60px per column
  };

  const adaptiveColumnWidths = calculateAdaptiveWidths();

  const { handleMouseDown } = useDraggable({
    elementId: element.id,
    parentColumnId
  });

  const { handleMouseDown: handleResizeMouseDownSE } = useResizable({
    elementId: element.id,
    minWidth: 400,
    minHeight: 200,
    maxWidth: 1600,
    maxHeight: 1200,
    direction: 'se'
  });

  const { handleMouseDown: handleResizeMouseDownNW } = useResizable({
    elementId: element.id,
    minWidth: 400,
    minHeight: 200,
    maxWidth: 1600,
    maxHeight: 1200,
    direction: 'nw'
  });

  const headers = element.content.headers || ['Column 1', 'Column 2', 'Column 3'];
  const rows = element.content.rows || [];
  const columnTypes = element.content.columnTypes || headers.map(() => 'text' as CellType);
  const columnDropdownOptions = element.content.columnDropdownOptions || {};
  const columnWidths = element.content.columnWidths || headers.map(() => 150); // Default 150px per column

  const DEFAULT_COL_WIDTH = 150;
  const MIN_COL_WIDTH = 60;

  const handleHeaderChange = async (colIndex: number, newValue: string) => {
    const newHeaders = [...headers];
    newHeaders[colIndex] = newValue;

    await updateElement(element.id, {
      content: {
        ...element.content,
        headers: newHeaders
      }
    });
  };

  const handleCellChange = async (rowIndex: number, colIndex: number, newValue: any) => {
    const columnType = columnTypes[colIndex];
    const newRows = [...rows];
    if (!newRows[rowIndex]) {
      newRows[rowIndex] = [];
    }
    if (!newRows[rowIndex][colIndex]) {
      newRows[rowIndex][colIndex] = { value: '', type: columnType };
    }

    // Process value based on column type
    let processedValue = newValue;
    if (columnType === 'number') {
      processedValue = parseFloat(newValue) || 0;
    } else if (columnType === 'checkbox') {
      processedValue = !!newValue;
    }

    newRows[rowIndex][colIndex] = {
      ...newRows[rowIndex][colIndex],
      type: columnType,
      value: processedValue
    };

    await updateElement(element.id, {
      content: {
        ...element.content,
        rows: newRows
      }
    });

    setEditingCell(null);
    setEditValue('');
  };

  const handleAddRow = async () => {
    const newRow: TableCell[] = headers.map((_, colIndex) => ({
      value: getDefaultCellValue(columnTypes[colIndex]),
      type: columnTypes[colIndex]
    }));
    const newRows = [...rows, newRow];

    await updateElement(element.id, {
      content: {
        ...element.content,
        rows: newRows
      }
    });
  };

  const handleAddColumn = async () => {
    const newHeaders = [...headers, `Column ${headers.length + 1}`];
    const newColumnTypes = [...columnTypes, 'text' as CellType];
    const newColumnWidths = [...columnWidths, DEFAULT_COL_WIDTH];
    const newRows = rows.map(row => [...row, { value: '', type: 'text' as const }]);

    await updateElement(element.id, {
      content: {
        ...element.content,
        headers: newHeaders,
        columnTypes: newColumnTypes,
        columnWidths: newColumnWidths,
        rows: newRows
      }
    });
  };

  const handleDeleteRow = async (rowIndex: number) => {
    const newRows = rows.filter((_, index) => index !== rowIndex);

    await updateElement(element.id, {
      content: {
        ...element.content,
        rows: newRows
      }
    });
  };

  const handleDeleteColumn = async (colIndex: number) => {
    const newHeaders = headers.filter((_, index) => index !== colIndex);
    const newColumnTypes = columnTypes.filter((_, index) => index !== colIndex);
    const newColumnWidths = columnWidths.filter((_, index) => index !== colIndex);
    const newRows = rows.map(row => row.filter((_, index) => index !== colIndex));

    // Remove dropdown options for deleted column and reindex remaining columns
    const newColumnDropdownOptions: Record<number, string[]> = {};
    Object.keys(columnDropdownOptions).forEach(key => {
      const idx = parseInt(key);
      if (idx < colIndex) {
        newColumnDropdownOptions[idx] = columnDropdownOptions[idx];
      } else if (idx > colIndex) {
        newColumnDropdownOptions[idx - 1] = columnDropdownOptions[idx];
      }
    });

    await updateElement(element.id, {
      content: {
        ...element.content,
        headers: newHeaders,
        columnTypes: newColumnTypes,
        columnWidths: newColumnWidths,
        columnDropdownOptions: newColumnDropdownOptions,
        rows: newRows
      }
    });
  };

  // Render cell input based on column type
  const renderCellInput = (cell: TableCell, rowIndex: number, colIndex: number) => {
    const columnType = columnTypes[colIndex];

    switch (columnType) {
      case 'checkbox':
        return (
          <div className="w-full h-full px-3 py-2 flex items-center justify-center">
            <input
              type="checkbox"
              checked={!!cell.value}
              onChange={(e) => {
                e.stopPropagation();
                handleCellChange(rowIndex, colIndex, e.target.checked);
              }}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              className="w-4 h-4 text-primary-600 bg-white border-gray-300 rounded focus:ring-primary-500 focus:ring-2 cursor-pointer"
              disabled={element.locked}
            />
          </div>
        );

      case 'number':
        return (
          <input
            type="number"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={() => handleCellChange(rowIndex, colIndex, editValue)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleCellChange(rowIndex, colIndex, editValue);
              } else if (e.key === 'Escape') {
                setEditingCell(null);
                setEditValue('');
              } else if (e.key === 'Tab') {
                e.preventDefault();
                handleCellChange(rowIndex, colIndex, editValue);
                moveToNextCell(rowIndex, colIndex);
              }
            }}
            autoFocus
            className="w-full h-full px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          />
        );

      case 'date':
        return (
          <input
            type="date"
            value={formatDateToISO(editValue)}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={() => handleCellChange(rowIndex, colIndex, editValue)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleCellChange(rowIndex, colIndex, editValue);
              } else if (e.key === 'Escape') {
                setEditingCell(null);
                setEditValue('');
              } else if (e.key === 'Tab') {
                e.preventDefault();
                handleCellChange(rowIndex, colIndex, editValue);
                moveToNextCell(rowIndex, colIndex);
              }
            }}
            autoFocus
            className="w-full h-full px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          />
        );

      case 'dropdown':
        const options = columnDropdownOptions[colIndex] || [];
        return (
          <select
            value={editValue}
            onChange={(e) => {
              setEditValue(e.target.value);
              handleCellChange(rowIndex, colIndex, e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setEditingCell(null);
                setEditValue('');
              } else if (e.key === 'Tab') {
                e.preventDefault();
                moveToNextCell(rowIndex, colIndex);
              }
            }}
            autoFocus
            className="w-full h-full px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 cursor-pointer"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <option value="">Select...</option>
            {options.map((option, idx) => (
              <option key={idx} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case 'text':
      default:
        return (
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={() => handleCellChange(rowIndex, colIndex, editValue)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleCellChange(rowIndex, colIndex, editValue);
              } else if (e.key === 'Escape') {
                setEditingCell(null);
                setEditValue('');
              } else if (e.key === 'Tab') {
                e.preventDefault();
                handleCellChange(rowIndex, colIndex, editValue);
                moveToNextCell(rowIndex, colIndex);
              }
            }}
            autoFocus
            className="w-full h-full px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          />
        );
    }
  };

  // Render cell display based on column type
  const renderCellDisplay = (cell: TableCell, rowIndex: number, colIndex: number) => {
    const columnType = columnTypes[colIndex];

    switch (columnType) {
      case 'checkbox':
        return (
          <div className="w-full h-full px-3 py-2 flex items-center justify-center">
            <input
              type="checkbox"
              checked={!!cell.value}
              onChange={(e) => {
                e.stopPropagation();
                handleCellChange(rowIndex, colIndex, e.target.checked);
              }}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              className="w-4 h-4 text-primary-600 bg-white border-gray-300 rounded focus:ring-primary-500 focus:ring-2 cursor-pointer"
              disabled={element.locked}
            />
          </div>
        );

      case 'number':
        return <span>{formatNumber(cell.value)}</span>;

      case 'date':
        return <span>{formatDateToDisplay(cell.value)}</span>;

      case 'dropdown':
      case 'text':
      default:
        return <span>{cell.value?.toString() || <span className="text-gray-300 dark:text-gray-600">&nbsp;</span>}</span>;
    }
  };

  // Move to next cell helper
  const moveToNextCell = (rowIndex: number, colIndex: number) => {
    const nextCol = colIndex + 1;
    if (nextCol < headers.length) {
      setEditingCell({ row: rowIndex, col: nextCol });
      const nextCell = rows[rowIndex]?.[nextCol];
      setEditValue(nextCell?.value?.toString() || '');
    } else if (rowIndex + 1 < rows.length) {
      setEditingCell({ row: rowIndex + 1, col: 0 });
      const nextCell = rows[rowIndex + 1]?.[0];
      setEditValue(nextCell?.value?.toString() || '');
    }
  };

  // Column resizing handlers
  const handleResizeStart = (colIndex: number, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setResizingColIndex(colIndex);
    setStartX(e.clientX);
    setStartWidth(columnWidths[colIndex] || DEFAULT_COL_WIDTH);

    // Add global mouse move and mouse up listeners
    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
  };

  const handleResizeMove = (e: MouseEvent) => {
    if (resizingColIndex === null) return;

    const diff = e.clientX - startX;
    const newWidth = Math.max(MIN_COL_WIDTH, startWidth + diff);

    // Update width immediately for visual feedback
    const newColumnWidths = [...columnWidths];
    newColumnWidths[resizingColIndex] = newWidth;

    // Update element temporarily (optimistic update)
    updateElement(element.id, {
      content: {
        ...element.content,
        columnWidths: newColumnWidths
      }
    });
  };

  const handleResizeEnd = () => {
    setResizingColIndex(null);
    document.removeEventListener('mousemove', handleResizeMove);
    document.removeEventListener('mouseup', handleResizeEnd);
  };

  // Row drag & drop handlers
  const handleRowDragStart = (e: React.DragEvent, rowIndex: number) => {
    e.stopPropagation();
    setDraggedRowIndex(rowIndex);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', ''); // Required for Firefox
  };

  const handleRowDragOver = (e: React.DragEvent, rowIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    setDragOverRowIndex(rowIndex);
  };

  const handleRowDragLeave = () => {
    setDragOverRowIndex(null);
  };

  const handleRowDrop = async (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    e.stopPropagation();

    if (draggedRowIndex === null || draggedRowIndex === targetIndex) {
      setDraggedRowIndex(null);
      setDragOverRowIndex(null);
      return;
    }

    // Reorder rows
    const newRows = [...rows];
    const [draggedRow] = newRows.splice(draggedRowIndex, 1);
    newRows.splice(targetIndex, 0, draggedRow);

    await updateElement(element.id, {
      content: {
        ...element.content,
        rows: newRows
      }
    });

    setDraggedRowIndex(null);
    setDragOverRowIndex(null);
  };

  const handleRowDragEnd = () => {
    setDraggedRowIndex(null);
    setDragOverRowIndex(null);
  };

  // Column drag & drop handlers
  const handleColDragStart = (e: React.DragEvent, colIndex: number) => {
    e.stopPropagation();
    setDraggedColIndex(colIndex);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', '');
  };

  const handleColDragOver = (e: React.DragEvent, colIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColIndex(colIndex);
  };

  const handleColDragLeave = () => {
    setDragOverColIndex(null);
  };

  const handleColDrop = async (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    e.stopPropagation();

    if (draggedColIndex === null || draggedColIndex === targetIndex) {
      setDraggedColIndex(null);
      setDragOverColIndex(null);
      return;
    }

    // Reorder all column-related arrays
    const newHeaders = [...headers];
    const newColumnTypes = [...columnTypes];
    const newColumnWidths = [...columnWidths];

    // Extract dragged column data
    const [draggedHeader] = newHeaders.splice(draggedColIndex, 1);
    const [draggedType] = newColumnTypes.splice(draggedColIndex, 1);
    const [draggedWidth] = newColumnWidths.splice(draggedColIndex, 1);

    // Insert at target position
    newHeaders.splice(targetIndex, 0, draggedHeader);
    newColumnTypes.splice(targetIndex, 0, draggedType);
    newColumnWidths.splice(targetIndex, 0, draggedWidth);

    // Reorder cells in all rows
    const newRows = rows.map(row => {
      const newRow = [...row];
      const [draggedCell] = newRow.splice(draggedColIndex, 1);
      newRow.splice(targetIndex, 0, draggedCell);
      return newRow;
    });

    // Reorder dropdown options
    const newColumnDropdownOptions: Record<number, string[]> = {};
    Object.keys(columnDropdownOptions).forEach(key => {
      const idx = parseInt(key);
      let newIdx = idx;

      // If this column was the dragged one
      if (idx === draggedColIndex) {
        newIdx = targetIndex;
      }
      // If this column is between source and target
      else if (draggedColIndex < targetIndex && idx > draggedColIndex && idx <= targetIndex) {
        newIdx = idx - 1;
      }
      else if (draggedColIndex > targetIndex && idx >= targetIndex && idx < draggedColIndex) {
        newIdx = idx + 1;
      }

      newColumnDropdownOptions[newIdx] = columnDropdownOptions[idx];
    });

    await updateElement(element.id, {
      content: {
        ...element.content,
        headers: newHeaders,
        columnTypes: newColumnTypes,
        columnWidths: newColumnWidths,
        columnDropdownOptions: newColumnDropdownOptions,
        rows: newRows
      }
    });

    setDraggedColIndex(null);
    setDragOverColIndex(null);
  };

  const handleColDragEnd = () => {
    setDraggedColIndex(null);
    setDragOverColIndex(null);
  };

  return (
    <div
      ref={containerRef}
      data-element-id={element.id}
      className={`
        element-card ${(parentColumnId && !isBeingDragged) ? 'relative' : 'absolute'} cursor-move overflow-hidden
        ${isSelected ? 'selected ring-2 ring-primary-500' : ''}
        ${element.locked ? 'cursor-not-allowed' : ''}
        ${parentColumnId && !isBeingDragged ? 'border border-gray-300 dark:border-gray-500 shadow-none' : ''}
      `}
      style={{
        ...((parentColumnId && !isBeingDragged) ? {} : {
          left: `${element.position.x}px`,
          top: `${element.position.y}px`,
        }),
        width: (parentColumnId && !isBeingDragged) ? '100%' : `${element.size.width}px`,
        height: `${element.size.height}px`,
        backgroundColor,
        zIndex: element.zIndex,
        pointerEvents: isBeingDragged ? 'none' : 'auto'
      }}
      onClick={(e) => {
        e.stopPropagation();
        // Don't change selection if we just finished dragging
        if (justFinishedDrag) {
          return;
        }
        const isMultiSelect = e.ctrlKey || e.metaKey;
        const { selectElement } = useElementStore.getState();
        selectElement(element.id, isMultiSelect);
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="h-full overflow-auto">
        <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
          <thead>
            <tr>
              <th className="w-8 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600"></th>
              {headers.map((header, colIndex) => (
                <th
                  key={colIndex}
                  onDragOver={(e) => handleColDragOver(e, colIndex)}
                  onDragLeave={handleColDragLeave}
                  onDrop={(e) => handleColDrop(e, colIndex)}
                  className={`
                    relative bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 p-2 font-medium text-gray-700 dark:text-gray-200 group
                    ${draggedColIndex === colIndex ? 'opacity-50' : ''}
                    ${dragOverColIndex === colIndex ? 'border-l-2 border-primary-500' : ''}
                  `}
                  style={{ width: `${adaptiveColumnWidths[colIndex]}px`, minWidth: '60px' }}
                >
                  <div className="flex items-center gap-1">
                    {/* Column drag handle */}
                    {isSelected && !element.locked && (
                      <div
                        draggable
                        onDragStart={(e) => handleColDragStart(e, colIndex)}
                        onDragEnd={handleColDragEnd}
                        onMouseDown={(e) => e.stopPropagation()}
                        className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded flex-shrink-0"
                        title="Drag to reorder column"
                      >
                        <GripVertical className="w-3 h-3 text-gray-400 rotate-90" />
                      </div>
                    )}
                    {/* Column header input */}
                    <input
                      type="text"
                      value={header}
                      onChange={(e) => handleHeaderChange(colIndex, e.target.value)}
                      className="flex-1 bg-transparent text-center focus:outline-none focus:ring-2 focus:ring-primary-500 rounded px-2 py-1 dark:text-gray-200"
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      disabled={element.locked}
                    />
                    {/* Delete column button */}
                    {isSelected && !element.locked && headers.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteColumn(colIndex);
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all flex-shrink-0"
                        title="Delete column"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  {/* Column resize handle */}
                  {isSelected && !element.locked && (
                    <div
                      className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary-500 transition-colors z-20"
                      onMouseDown={(e) => handleResizeStart(colIndex, e)}
                      title="Drag to resize column"
                    />
                  )}
                </th>
              ))}
              {isSelected && !element.locked && (
                <th className="w-12 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddColumn();
                    }}
                    className="w-full h-full flex items-center justify-center text-gray-400 hover:text-primary-600 transition-colors"
                    title="Add column"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={headers.length + (isSelected ? 2 : 1)} className="text-center py-8 text-gray-400 text-sm">
                  No data yet. Click "+" to add rows.
                </td>
              </tr>
            ) : (
              rows.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  onDragOver={(e) => handleRowDragOver(e, rowIndex)}
                  onDragLeave={handleRowDragLeave}
                  onDrop={(e) => handleRowDrop(e, rowIndex)}
                  className={`
                    group
                    ${draggedRowIndex === rowIndex ? 'opacity-50' : ''}
                    ${dragOverRowIndex === rowIndex ? 'border-t-2 border-primary-500' : ''}
                  `}
                >
                  <td className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-center text-gray-500 dark:text-gray-400 text-sm relative">
                    <div className="flex flex-col items-center justify-center py-1">
                      {/* Drag handle - separate from row number */}
                      {isSelected && !element.locked && (
                        <div
                          draggable
                          onDragStart={(e) => handleRowDragStart(e, rowIndex)}
                          onDragEnd={handleRowDragEnd}
                          onMouseDown={(e) => e.stopPropagation()}
                          className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                          title="Drag to reorder"
                        >
                          <GripVertical className="w-3 h-3 text-gray-400" />
                        </div>
                      )}
                      {/* Row number */}
                      <span className="text-xs">{rowIndex + 1}</span>
                      {/* Delete button - separate position */}
                      {isSelected && !element.locked && rows.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteRow(rowIndex);
                          }}
                          onMouseDown={(e) => e.stopPropagation()}
                          className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all mt-1"
                          title="Delete row"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </td>
                  {headers.map((_, colIndex) => {
                    const cell = row[colIndex] || { value: '', type: 'text' };
                    const isEditing = editingCell?.row === rowIndex && editingCell?.col === colIndex;

                    const columnType = columnTypes[colIndex];
                    const isCheckbox = columnType === 'checkbox';

                    return (
                      <td
                        key={colIndex}
                        className="border border-gray-200 dark:border-gray-600 p-0 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        style={{ width: `${adaptiveColumnWidths[colIndex]}px`, minWidth: '60px' }}
                      >
                        {isEditing && !isCheckbox ? (
                          renderCellInput(cell, rowIndex, colIndex)
                        ) : (
                          <div
                            className={`${isCheckbox ? '' : 'px-3 py-2 cursor-text'} min-h-[2.5rem] flex items-center text-gray-900 dark:text-gray-100`}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!element.locked && !isCheckbox) {
                                // Select the element if not selected
                                if (!isSelected) {
                                  const { selectElement } = useElementStore.getState();
                                  selectElement(element.id, false);
                                }
                                setEditingCell({ row: rowIndex, col: colIndex });
                                setEditValue(cell.value?.toString() || '');
                              }
                            }}
                            onMouseDown={(e) => e.stopPropagation()}
                          >
                            {renderCellDisplay(cell, rowIndex, colIndex)}
                          </div>
                        )}
                      </td>
                    );
                  })}
                  {isSelected && !element.locked && (
                    <td className="border border-gray-200 dark:border-gray-600"></td>
                  )}
                </tr>
              ))
            )}
            {isSelected && !element.locked && (
              <tr>
                <td colSpan={headers.length + 2} className="border border-gray-200 dark:border-gray-600 p-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddRow();
                    }}
                    className="w-full py-2 text-gray-400 dark:text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-1 text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Add row
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Resize handles */}
      {isSelected && !element.locked && (
        <>
          {/* Top-left resize handle */}
          <div
            className="absolute top-0 left-0 w-4 h-4 bg-primary-500 rounded-br cursor-nw-resize hover:bg-primary-600 transition-colors z-10"
            onMouseDown={(e) => {
              e.stopPropagation();
              handleResizeMouseDownNW(e);
            }}
            title="Drag to resize"
          />
          {/* Bottom-right resize handle */}
          <div
            className="absolute bottom-0 right-0 w-4 h-4 bg-primary-500 rounded-tl cursor-se-resize hover:bg-primary-600 transition-colors z-10"
            onMouseDown={(e) => {
              e.stopPropagation();
              handleResizeMouseDownSE(e);
            }}
            title="Drag to resize"
          />
        </>
      )}
    </div>
  );
}
