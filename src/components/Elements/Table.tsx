/**
 * Table Component
 * Editable spreadsheet-style table with rows and columns
 */

import { useRef, useState } from 'react';
import type { TableElement, TableCell } from '../../types';
import { useElementStore, useDragStore } from '../../store';
import { useDraggable } from '../../hooks/useDraggable';
import { useResizable } from '../../hooks/useResizable';
import { useDarkModeColor } from '../../hooks/useDarkModeColor';
import {
  Plus,
  Trash2,
  GripVertical
} from 'lucide-react';

interface TableProps {
  element: TableElement;
  isSelected?: boolean;
  onSelect?: () => void;
  parentColumnId?: string;
}

export default function Table({ element, isSelected, onSelect, parentColumnId }: TableProps) {
  const { updateElement } = useElementStore();
  const { draggedElementId, justFinishedDrag } = useDragStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
  const [editValue, setEditValue] = useState('');

  const isBeingDragged = draggedElementId === element.id;

  // Get dark mode adapted background color
  const backgroundColor = useDarkModeColor(element.style.backgroundColor || '#FFFFFF');

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

  const handleCellChange = async (rowIndex: number, colIndex: number, newValue: string) => {
    const newRows = [...rows];
    if (!newRows[rowIndex]) {
      newRows[rowIndex] = [];
    }
    if (!newRows[rowIndex][colIndex]) {
      newRows[rowIndex][colIndex] = { value: '', type: 'text' };
    }
    newRows[rowIndex][colIndex] = { ...newRows[rowIndex][colIndex], value: newValue };

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
    const newRow: TableCell[] = headers.map(() => ({ value: '', type: 'text' }));
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
    const newRows = rows.map(row => [...row, { value: '', type: 'text' }]);

    await updateElement(element.id, {
      content: {
        ...element.content,
        headers: newHeaders,
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
    const newRows = rows.map(row => row.filter((_, index) => index !== colIndex));

    await updateElement(element.id, {
      content: {
        ...element.content,
        headers: newHeaders,
        rows: newRows
      }
    });
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
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="w-8 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600"></th>
              {headers.map((header, colIndex) => (
                <th
                  key={colIndex}
                  className="relative bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 p-2 font-medium text-gray-700 dark:text-gray-200 group"
                >
                  <input
                    type="text"
                    value={header}
                    onChange={(e) => handleHeaderChange(colIndex, e.target.value)}
                    className="w-full bg-transparent text-center focus:outline-none focus:ring-2 focus:ring-primary-500 rounded px-2 py-1 dark:text-gray-200"
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    disabled={element.locked}
                  />
                  {isSelected && !element.locked && headers.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteColumn(colIndex);
                      }}
                      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 hover:text-red-500 bg-white rounded shadow-sm transition-opacity"
                      title="Delete column"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
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
                <tr key={rowIndex} className="group">
                  <td className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-center text-gray-500 dark:text-gray-400 text-sm relative">
                    <div className="flex items-center justify-center gap-1 px-1">
                      <GripVertical className="w-3 h-3 text-gray-300" />
                      <span>{rowIndex + 1}</span>
                      {isSelected && !element.locked && rows.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteRow(rowIndex);
                          }}
                          className="absolute right-1 opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 hover:text-red-500 bg-white rounded shadow-sm transition-opacity"
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

                    return (
                      <td
                        key={colIndex}
                        className="border border-gray-200 dark:border-gray-600 p-0 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        {isEditing ? (
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
                                // Move to next cell
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
                              }
                            }}
                            autoFocus
                            className="w-full h-full px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            onClick={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <div
                            className="px-3 py-2 cursor-text min-h-[2.5rem] flex items-center text-gray-900 dark:text-gray-100"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!element.locked) {
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
                            {cell.value?.toString() || <span className="text-gray-300 dark:text-gray-600">&nbsp;</span>}
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
