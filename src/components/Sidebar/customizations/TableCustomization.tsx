/**
 * TableCustomization Component
 * Customization options for Table elements
 */

import { useState } from 'react';
import { useElementStore } from '../../../store';
import type { TableElement, CellType } from '../../../types';
import { Type, Hash, Calendar, CheckSquare, ChevronDown, Plus, X } from 'lucide-react';

interface TableCustomizationProps {
  element: TableElement;
}

const COLORS = [
  { name: 'White', value: '#FFFFFF' },
  { name: 'Light Gray', value: '#F3F4F6' },
  { name: 'Gray', value: '#E5E7EB' },
  { name: 'Blue', value: '#DBEAFE' },
  { name: 'Green', value: '#D1FAE5' },
  { name: 'Yellow', value: '#FEF3C7' }
];

const CELL_TYPES: Array<{ type: CellType; label: string; icon: React.ReactNode }> = [
  { type: 'text', label: 'Text', icon: <Type className="w-4 h-4" /> },
  { type: 'number', label: 'Number', icon: <Hash className="w-4 h-4" /> },
  { type: 'date', label: 'Date', icon: <Calendar className="w-4 h-4" /> },
  { type: 'checkbox', label: 'Checkbox', icon: <CheckSquare className="w-4 h-4" /> },
  { type: 'dropdown', label: 'Dropdown', icon: <ChevronDown className="w-4 h-4" /> }
];

export default function TableCustomization({ element }: TableCustomizationProps) {
  const updateElement = useElementStore(state => state.updateElement);
  const [selectedColumnIndex, setSelectedColumnIndex] = useState<number>(0);
  const [newDropdownOption, setNewDropdownOption] = useState('');

  const headers = element.content.headers || [];
  const columnTypes = element.content.columnTypes || headers.map(() => 'text' as CellType);
  const columnDropdownOptions = element.content.columnDropdownOptions || {};

  const handleColorChange = (color: string) => {
    updateElement(element.id, {
      style: {
        ...element.style,
        backgroundColor: color
      }
    });
  };

  const handleColumnTypeChange = (colIndex: number, newType: CellType) => {
    const newColumnTypes = [...columnTypes];
    newColumnTypes[colIndex] = newType;

    // Update all cells in this column to match the new type
    const newRows = element.content.rows.map(row => {
      const newRow = [...row];
      if (newRow[colIndex]) {
        newRow[colIndex] = {
          ...newRow[colIndex],
          type: newType,
          value: getDefaultValueForType(newType, newRow[colIndex].value)
        };
      }
      return newRow;
    });

    updateElement(element.id, {
      content: {
        ...element.content,
        columnTypes: newColumnTypes,
        rows: newRows
      }
    });
  };

  const getDefaultValueForType = (type: CellType, currentValue: any): any => {
    switch (type) {
      case 'checkbox':
        return !!currentValue;
      case 'number':
        const num = parseFloat(currentValue);
        return isNaN(num) ? 0 : num;
      case 'date':
        return currentValue || new Date().toISOString().split('T')[0];
      case 'text':
      case 'dropdown':
      default:
        return currentValue?.toString() || '';
    }
  };

  const handleAddDropdownOption = () => {
    if (!newDropdownOption.trim()) return;

    const newOptions = { ...columnDropdownOptions };
    if (!newOptions[selectedColumnIndex]) {
      newOptions[selectedColumnIndex] = [];
    }
    newOptions[selectedColumnIndex] = [...newOptions[selectedColumnIndex], newDropdownOption.trim()];

    updateElement(element.id, {
      content: {
        ...element.content,
        columnDropdownOptions: newOptions
      }
    });

    setNewDropdownOption('');
  };

  const handleRemoveDropdownOption = (optionIndex: number) => {
    const newOptions = { ...columnDropdownOptions };
    newOptions[selectedColumnIndex] = newOptions[selectedColumnIndex].filter((_, idx) => idx !== optionIndex);

    updateElement(element.id, {
      content: {
        ...element.content,
        columnDropdownOptions: newOptions
      }
    });
  };

  const selectedColumnType = columnTypes[selectedColumnIndex] || 'text';
  const selectedColumnOptions = columnDropdownOptions[selectedColumnIndex] || [];

  return (
    <div className="space-y-4">
      {/* Background Color */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Background Color</h4>
        <div className="grid grid-cols-3 gap-2">
          {COLORS.map((color) => (
            <button
              key={color.value}
              onClick={(e) => {
                e.stopPropagation();
                handleColorChange(color.value);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              className={`
                w-full aspect-square rounded border-2 transition-all
                ${(element.style.backgroundColor || '#FFFFFF') === color.value
                  ? 'border-primary-500 ring-2 ring-primary-200 dark:ring-primary-800'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                }
              `}
              style={{ backgroundColor: color.value }}
              title={color.name}
            />
          ))}
        </div>
      </div>

      {/* Column Configuration */}
      {headers.length > 0 && (
        <>
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Column Configuration</h4>

            {/* Column Selector */}
            <select
              value={selectedColumnIndex}
              onChange={(e) => setSelectedColumnIndex(parseInt(e.target.value))}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              className="w-full px-3 py-2 mb-3 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {headers.map((header, idx) => (
                <option key={idx} value={idx}>
                  {header || `Column ${idx + 1}`}
                </option>
              ))}
            </select>

            {/* Column Type Selector */}
            <div className="grid grid-cols-2 gap-2">
              {CELL_TYPES.map((cellType) => (
                <button
                  key={cellType.type}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleColumnTypeChange(selectedColumnIndex, cellType.type);
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  className={`
                    p-2 rounded border-2 transition-all flex items-center gap-2
                    ${selectedColumnType === cellType.type
                      ? 'border-primary-500 bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-600 dark:text-gray-400'
                    }
                  `}
                  title={cellType.label}
                >
                  {cellType.icon}
                  <span className="text-sm">{cellType.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Dropdown Options (only shown for dropdown columns) */}
          {selectedColumnType === 'dropdown' && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Dropdown Options</h4>

              {/* Existing Options */}
              <div className="space-y-2 mb-3">
                {selectedColumnOptions.length === 0 ? (
                  <p className="text-xs text-gray-400 dark:text-gray-500 italic">No options yet. Add some below.</p>
                ) : (
                  selectedColumnOptions.map((option, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded text-sm text-gray-700 dark:text-gray-300"
                    >
                      <span>{option}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveDropdownOption(idx);
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                        title="Remove option"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Add New Option */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newDropdownOption}
                  onChange={(e) => setNewDropdownOption(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddDropdownOption();
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  placeholder="New option..."
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddDropdownOption();
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  className="px-3 py-2 bg-primary-500 text-white rounded hover:bg-primary-600 transition-colors flex items-center gap-1"
                  title="Add option"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
