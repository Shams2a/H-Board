/**
 * SortModal Component
 * Modal for managing view sorts
 */

import { useState } from 'react';
import { X, Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { generateId } from '../../utils/uuid';
import type { DatabaseProperty, DatabaseSort } from '../../types';

interface SortModalProps {
  properties: DatabaseProperty[];
  sorts: DatabaseSort[];
  onClose: () => void;
  onSave: (sorts: DatabaseSort[]) => void;
}

export default function SortModal({ properties, sorts, onClose, onSave }: SortModalProps) {
  const [localSorts, setLocalSorts] = useState<DatabaseSort[]>(sorts);

  const handleAddSort = () => {
    if (properties.length === 0) return;

    const newSort: DatabaseSort = {
      id: generateId(),
      propertyId: properties[0].id,
      direction: 'asc'
    };

    setLocalSorts([...localSorts, newSort]);
  };

  const handleUpdateSort = (id: string, field: keyof DatabaseSort, value: any) => {
    setLocalSorts(localSorts.map((sort) =>
      sort.id === id ? { ...sort, [field]: value } : sort
    ));
  };

  const handleDeleteSort = (id: string) => {
    setLocalSorts(localSorts.filter((s) => s.id !== id));
  };

  const handleSave = () => {
    onSave(localSorts);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-xl mx-4 max-h-[80vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Sort
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {localSorts.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 italic text-center py-8">
              No sorts yet. Click "Add Sort" to create one.
            </p>
          ) : (
            localSorts.map((sort, index) => {
              properties.find((p) => p.id === sort.propertyId);

              return (
                <div key={sort.id!} className="flex items-center gap-2">
                  {/* Sort number */}
                  <span className="text-sm text-gray-500 dark:text-gray-400 w-6">
                    {index + 1}.
                  </span>

                  {/* Property selector */}
                  <select
                    value={sort.propertyId}
                    onChange={(e) => handleUpdateSort(sort.id!, 'propertyId', e.target.value)}
                    className="flex-1 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-900 dark:text-gray-100"
                  >
                    {properties.map((prop) => (
                      <option key={prop.id} value={prop.id}>
                        {prop.name}
                      </option>
                    ))}
                  </select>

                  {/* Direction selector */}
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleUpdateSort(sort.id!, 'direction', 'asc')}
                      className={`p-2 rounded border transition-colors ${
                        sort.direction === 'asc'
                          ? 'bg-primary-100 dark:bg-primary-900/30 border-primary-500 dark:border-primary-400 text-primary-700 dark:text-primary-300'
                          : 'border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                      title="Ascending"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleUpdateSort(sort.id!, 'direction', 'desc')}
                      className={`p-2 rounded border transition-colors ${
                        sort.direction === 'desc'
                          ? 'bg-primary-100 dark:bg-primary-900/30 border-primary-500 dark:border-primary-400 text-primary-700 dark:text-primary-300'
                          : 'border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                      title="Descending"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={() => handleDeleteSort(sort.id!)}
                    className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 p-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })
          )}

          {/* Add sort button */}
          <button
            onClick={handleAddSort}
            disabled={properties.length === 0}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm border-2 border-dashed border-gray-300 dark:border-gray-600 rounded hover:border-primary-500 dark:hover:border-primary-400 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            Add Sort
          </button>

          {localSorts.length > 0 && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Sorts are applied in order from top to bottom
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm bg-primary-600 text-white rounded hover:bg-primary-700 dark:hover:bg-primary-500 transition-colors"
          >
            Apply Sort
          </button>
        </div>
      </div>
    </div>
  );
}
