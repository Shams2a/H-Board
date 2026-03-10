/**
 * Table Component
 * Editable spreadsheet-style table with rows and columns
 */

import React, { useRef, useState, useMemo, memo } from 'react';
import type { TableElement, TableCell, CellType } from '../../types';
import { useElementStore, useDragStore } from '../../store';
import { useDraggable } from '../../hooks/useDraggable';
import { useResizable } from '../../hooks/useResizable';
import { useDarkModeColor } from '../../hooks/useDarkModeColor';
import { useTableResize } from '../../hooks/useTableResize';
import { useTableDragDrop } from '../../hooks/useTableDragDrop';
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

const Table = memo(function Table({ element, isSelected, onSelect: _onSelect, parentColumnId }: TableProps) {
  const updateElement = useElementStore(state => state.updateElement);
  const draggedElementId = useDragStore(state => state.draggedElementId);
  const justFinishedDrag = useDragStore(state => state.justFinishedDrag);
  const containerRef = useRef<HTMLDivElement>(null);
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
  const [editValue, setEditValue] = useState('');

  // Custom hooks for resize and drag/drop
  const { resizingColIndex: _resizingColIndex, handleResizeStart } = useTableResize({ element });
  const {
    draggedRowIndex, dragOverRowIndex,
    draggedColIndex, dragOverColIndex,
    handleRowDragStart, handleRowDragOver, handleRowDragLeave, handleRowDrop, handleRowDragEnd,
    handleColDragStart, handleColDragOver, handleColDragLeave, handleColDrop, handleColDragEnd,
  } = useTableDragDrop({ element });

  const isBeingDragged = draggedElementId === element.id;

  // Get dark mode adapted background color
  const backgroundColor = useDarkModeColor(element.style.backgroundColor || '#FFFFFF');

  const headers = element.content.headers || ['Column 1', 'Column 2', 'Column 3'];
  const rows = element.content.rows || [];
  const columnTypes = element.content.columnTypes || headers.map(() => 'text' as CellType);
  const columnDropdownOptions = element.content.columnDropdownOptions || {};
  const columnWidths = element.content.columnWidths || headers.map(() => 150);

  const DEFAULT_COL_WIDTH = 150;

  // Calculate adaptive column widths based on available space
  const adaptiveColumnWidths = useMemo(() => {
    const baseColumnWidths = element.content.columnWidths || (element.content.headers || []).map(() => 150);
    const MIN_ROW_HEADER_WIDTH = 32;
    const totalBaseWidth = baseColumnWidths.reduce((sum: number, w: number) => sum + w, 0);
    const availableWidth = element.size.width - MIN_ROW_HEADER_WIDTH - 4;

    if (totalBaseWidth <= availableWidth) {
      return baseColumnWidths;
    }
    const scaleFactor = availableWidth / totalBaseWidth;
    return baseColumnWidths.map((w: number) => Math.max(w * scaleFactor, 60));
  }, [element.content.headers, element.content.columnWidths, element.size.width]);

  const { handleMouseDown } = useDraggable({
    elementId: element.id,
    parentColumnId
  });

  const { handleMouseDown: handleResizeMouseDownSE } = useResizable({
    elementId: element.id,
    minWidth: 400, minHeight: 200, maxWidth: 1600, maxHeight: 1200, direction: 'se'
  });

  const { handleMouseDown: handleResizeMouseDownNW } = useResizable({
    elementId: element.id,
    minWidth: 400, minHeight: 200, maxWidth: 1600, maxHeight: 1200, direction: 'nw'
  });

  // --- Cell editing handlers ---

  const handleHeaderChange = async (colIndex: number, newValue: string) => {
    const newHeaders = [...headers];
    newHeaders[colIndex] = newValue;
    await updateElement(element.id, { content: { ...element.content, headers: newHeaders } });
  };

  const handleCellChange = async (rowIndex: number, colIndex: number, newValue: any) => {
    const columnType = columnTypes[colIndex];
    const newRows = [...rows];
    if (!newRows[rowIndex]) newRows[rowIndex] = [];
    if (!newRows[rowIndex][colIndex]) newRows[rowIndex][colIndex] = { value: '', type: columnType };

    let processedValue = newValue;
    if (columnType === 'number') processedValue = parseFloat(newValue) || 0;
    else if (columnType === 'checkbox') processedValue = !!newValue;

    newRows[rowIndex][colIndex] = { ...newRows[rowIndex][colIndex], type: columnType, value: processedValue };
    await updateElement(element.id, { content: { ...element.content, rows: newRows } });
    setEditingCell(null);
    setEditValue('');
  };

  const handleAddRow = async () => {
    const newRow: TableCell[] = headers.map((_, colIndex) => ({
      value: getDefaultCellValue(columnTypes[colIndex]),
      type: columnTypes[colIndex]
    }));
    await updateElement(element.id, { content: { ...element.content, rows: [...rows, newRow] } });
  };

  const handleAddColumn = async () => {
    await updateElement(element.id, {
      content: {
        ...element.content,
        headers: [...headers, `Column ${headers.length + 1}`],
        columnTypes: [...columnTypes, 'text' as CellType],
        columnWidths: [...columnWidths, DEFAULT_COL_WIDTH],
        rows: rows.map(row => [...row, { value: '', type: 'text' as const }])
      }
    });
  };

  const handleDeleteRow = async (rowIndex: number) => {
    await updateElement(element.id, { content: { ...element.content, rows: rows.filter((_, i) => i !== rowIndex) } });
  };

  const handleDeleteColumn = async (colIndex: number) => {
    const newColumnDropdownOptions: Record<number, string[]> = {};
    Object.keys(columnDropdownOptions).forEach(key => {
      const idx = parseInt(key);
      if (idx < colIndex) newColumnDropdownOptions[idx] = columnDropdownOptions[idx];
      else if (idx > colIndex) newColumnDropdownOptions[idx - 1] = columnDropdownOptions[idx];
    });

    await updateElement(element.id, {
      content: {
        ...element.content,
        headers: headers.filter((_, i) => i !== colIndex),
        columnTypes: columnTypes.filter((_, i) => i !== colIndex),
        columnWidths: columnWidths.filter((_, i) => i !== colIndex),
        columnDropdownOptions: newColumnDropdownOptions,
        rows: rows.map(row => row.filter((_, i) => i !== colIndex))
      }
    });
  };

  const moveToNextCell = (rowIndex: number, colIndex: number) => {
    const nextCol = colIndex + 1;
    if (nextCol < headers.length) {
      setEditingCell({ row: rowIndex, col: nextCol });
      setEditValue(rows[rowIndex]?.[nextCol]?.value?.toString() || '');
    } else if (rowIndex + 1 < rows.length) {
      setEditingCell({ row: rowIndex + 1, col: 0 });
      setEditValue(rows[rowIndex + 1]?.[0]?.value?.toString() || '');
    }
  };

  // --- Cell rendering ---

  const renderCellInput = (cell: TableCell, rowIndex: number, colIndex: number) => {
    const columnType = columnTypes[colIndex];
    const commonKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleCellChange(rowIndex, colIndex, editValue);
      else if (e.key === 'Escape') { setEditingCell(null); setEditValue(''); }
      else if (e.key === 'Tab') { e.preventDefault(); handleCellChange(rowIndex, colIndex, editValue); moveToNextCell(rowIndex, colIndex); }
    };
    const stopEvents = { onClick: (e: React.MouseEvent) => e.stopPropagation(), onMouseDown: (e: React.MouseEvent) => e.stopPropagation() };
    const inputClass = "w-full h-full px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100";

    switch (columnType) {
      case 'checkbox':
        return (
          <div className="w-full h-full px-3 py-2 flex items-center justify-center">
            <input type="checkbox" checked={!!cell.value}
              onChange={(e) => { e.stopPropagation(); handleCellChange(rowIndex, colIndex, e.target.checked); }}
              {...stopEvents}
              className="w-4 h-4 text-primary-600 bg-white border-gray-300 rounded focus:ring-primary-500 focus:ring-2 cursor-pointer"
              disabled={element.locked} />
          </div>
        );
      case 'number':
        return <input type="number" value={editValue} onChange={(e) => setEditValue(e.target.value)}
          onBlur={() => handleCellChange(rowIndex, colIndex, editValue)} onKeyDown={commonKeyDown} autoFocus className={inputClass} {...stopEvents} />;
      case 'date':
        return <input type="date" value={formatDateToISO(editValue)} onChange={(e) => setEditValue(e.target.value)}
          onBlur={() => handleCellChange(rowIndex, colIndex, editValue)} onKeyDown={commonKeyDown} autoFocus className={inputClass} {...stopEvents} />;
      case 'dropdown':
        const options = columnDropdownOptions[colIndex] || [];
        return (
          <select value={editValue}
            onChange={(e) => { setEditValue(e.target.value); handleCellChange(rowIndex, colIndex, e.target.value); }}
            onKeyDown={(e) => { if (e.key === 'Escape') { setEditingCell(null); setEditValue(''); } else if (e.key === 'Tab') { e.preventDefault(); moveToNextCell(rowIndex, colIndex); } }}
            autoFocus className={inputClass + " cursor-pointer"} {...stopEvents}>
            <option value="">Select...</option>
            {options.map((option, idx) => <option key={idx} value={option}>{option}</option>)}
          </select>
        );
      case 'text':
      default:
        return <input type="text" value={editValue} onChange={(e) => setEditValue(e.target.value)}
          onBlur={() => handleCellChange(rowIndex, colIndex, editValue)} onKeyDown={commonKeyDown} autoFocus className={inputClass} {...stopEvents} />;
    }
  };

  const renderCellDisplay = (cell: TableCell, rowIndex: number, colIndex: number) => {
    const columnType = columnTypes[colIndex];
    switch (columnType) {
      case 'checkbox':
        return (
          <div className="w-full h-full px-3 py-2 flex items-center justify-center">
            <input type="checkbox" checked={!!cell.value}
              onChange={(e) => { e.stopPropagation(); handleCellChange(rowIndex, colIndex, e.target.checked); }}
              onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}
              className="w-4 h-4 text-primary-600 bg-white border-gray-300 rounded focus:ring-primary-500 focus:ring-2 cursor-pointer"
              disabled={element.locked} />
          </div>
        );
      case 'number':
        return <span>{formatNumber(cell.value)}</span>;
      case 'date':
        return <span>{formatDateToDisplay(cell.value as string | null)}</span>;
      case 'dropdown':
      case 'text':
      default:
        return <span>{cell.value?.toString() || <span className="text-gray-300 dark:text-gray-600">&nbsp;</span>}</span>;
    }
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
        if (justFinishedDrag) return;
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
                    {isSelected && !element.locked && (
                      <div draggable onDragStart={(e) => handleColDragStart(e, colIndex)} onDragEnd={handleColDragEnd}
                        onMouseDown={(e) => e.stopPropagation()}
                        className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded flex-shrink-0"
                        title="Drag to reorder column">
                        <GripVertical className="w-3 h-3 text-gray-400 rotate-90" />
                      </div>
                    )}
                    <input type="text" value={header} onChange={(e) => handleHeaderChange(colIndex, e.target.value)}
                      className="flex-1 bg-transparent text-center focus:outline-none focus:ring-2 focus:ring-primary-500 rounded px-2 py-1 dark:text-gray-200"
                      onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()} disabled={element.locked} />
                    {isSelected && !element.locked && headers.length > 1 && (
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteColumn(colIndex); }}
                        onMouseDown={(e) => e.stopPropagation()}
                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all flex-shrink-0"
                        title="Delete column">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  {isSelected && !element.locked && (
                    <div className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary-500 transition-colors z-20"
                      onMouseDown={(e) => handleResizeStart(colIndex, e)} title="Drag to resize column" />
                  )}
                </th>
              ))}
              {isSelected && !element.locked && (
                <th className="w-12 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                  <button onClick={(e) => { e.stopPropagation(); handleAddColumn(); }}
                    className="w-full h-full flex items-center justify-center text-gray-400 hover:text-primary-600 transition-colors" title="Add column">
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
                <tr key={rowIndex}
                  onDragOver={(e) => handleRowDragOver(e, rowIndex)}
                  onDragLeave={handleRowDragLeave}
                  onDrop={(e) => handleRowDrop(e, rowIndex)}
                  className={`group ${draggedRowIndex === rowIndex ? 'opacity-50' : ''} ${dragOverRowIndex === rowIndex ? 'border-t-2 border-primary-500' : ''}`}>
                  <td className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-center text-gray-500 dark:text-gray-400 text-sm relative">
                    <div className="flex flex-col items-center justify-center py-1">
                      {isSelected && !element.locked && (
                        <div draggable onDragStart={(e) => handleRowDragStart(e, rowIndex)} onDragEnd={handleRowDragEnd}
                          onMouseDown={(e) => e.stopPropagation()}
                          className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded" title="Drag to reorder">
                          <GripVertical className="w-3 h-3 text-gray-400" />
                        </div>
                      )}
                      <span className="text-xs">{rowIndex + 1}</span>
                      {isSelected && !element.locked && rows.length > 1 && (
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteRow(rowIndex); }}
                          onMouseDown={(e) => e.stopPropagation()}
                          className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all mt-1"
                          title="Delete row">
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
                      <td key={colIndex} className="border border-gray-200 dark:border-gray-600 p-0 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        style={{ width: `${adaptiveColumnWidths[colIndex]}px`, minWidth: '60px' }}>
                        {isEditing && !isCheckbox ? renderCellInput(cell, rowIndex, colIndex) : (
                          <div className={`${isCheckbox ? '' : 'px-3 py-2 cursor-text'} min-h-[2.5rem] flex items-center text-gray-900 dark:text-gray-100`}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!element.locked && !isCheckbox) {
                                if (!isSelected) { const { selectElement } = useElementStore.getState(); selectElement(element.id, false); }
                                setEditingCell({ row: rowIndex, col: colIndex });
                                setEditValue(cell.value?.toString() || '');
                              }
                            }}
                            onMouseDown={(e) => e.stopPropagation()}>
                            {renderCellDisplay(cell, rowIndex, colIndex)}
                          </div>
                        )}
                      </td>
                    );
                  })}
                  {isSelected && !element.locked && <td className="border border-gray-200 dark:border-gray-600"></td>}
                </tr>
              ))
            )}
            {isSelected && !element.locked && (
              <tr>
                <td colSpan={headers.length + 2} className="border border-gray-200 dark:border-gray-600 p-0">
                  <button onClick={(e) => { e.stopPropagation(); handleAddRow(); }}
                    className="w-full py-2 text-gray-400 dark:text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-1 text-sm">
                    <Plus className="w-4 h-4" /> Add row
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
          <div className="absolute top-0 left-0 w-4 h-4 bg-primary-500 rounded-br cursor-nw-resize hover:bg-primary-600 transition-colors z-10"
            onMouseDown={(e) => { e.stopPropagation(); handleResizeMouseDownNW(e); }} title="Drag to resize" />
          <div className="absolute bottom-0 right-0 w-4 h-4 bg-primary-500 rounded-tl cursor-se-resize hover:bg-primary-600 transition-colors z-10"
            onMouseDown={(e) => { e.stopPropagation(); handleResizeMouseDownSE(e); }} title="Drag to resize" />
        </>
      )}
    </div>
  );
});

export default Table;
