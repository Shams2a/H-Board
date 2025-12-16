/**
 * DatabaseToolbar Component
 * Toolbar for database board with actions (add property, add row, filters, etc.)
 */

import { Plus, Filter, ArrowUpDown } from 'lucide-react';
import { useDatabaseStore } from '../../store/databaseStore';
import { getMVPPropertyTypes } from '../../types/database';
import { useState } from 'react';
import FilterModal from './FilterModal';
import SortModal from './SortModal';
import type { DatabaseFilter, DatabaseSort } from '../../types';

interface DatabaseToolbarProps {
  boardId: string;
}

export default function DatabaseToolbar({ boardId }: DatabaseToolbarProps) {
  const { createProperty, createRow, properties, rows, views, currentViewId, updateView } = useDatabaseStore();
  const [showPropertyMenu, setShowPropertyMenu] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);

  const boardProperties = properties[boardId] || [];
  const boardRows = rows[boardId] || [];
  const boardViews = views[boardId] || [];
  const activeViewId = currentViewId[boardId];
  const activeView = boardViews.find(v => v.id === activeViewId);

  const handleAddProperty = async (type: string) => {
    const propertyTypes = getMVPPropertyTypes();
    const typeInfo = propertyTypes.find(pt => pt.type === type);

    if (typeInfo) {
      await createProperty(boardId, `New ${typeInfo.label}`, type as any);
    }
    setShowPropertyMenu(false);
  };

  const handleAddRow = async () => {
    await createRow(boardId);
  };

  const handleSaveFilters = async (filters: DatabaseFilter[]) => {
    if (activeView) {
      await updateView(activeView.id, { filters });
    }
  };

  const handleSaveSorts = async (sorts: DatabaseSort[]) => {
    if (activeView) {
      await updateView(activeView.id, { sorts });
    }
  };

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 flex items-center gap-3">
      {/* Add Row Button */}
      <button
        onClick={handleAddRow}
        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
      >
        <Plus className="w-4 h-4" />
        New Row
      </button>

      {/* Add Property Button */}
      <div className="relative">
        <button
          onClick={() => setShowPropertyMenu(!showPropertyMenu)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Property
        </button>

        {/* Property Type Menu */}
        {showPropertyMenu && (
          <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 py-1 max-h-96 overflow-y-auto">
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
              Property Types
            </div>
            {getMVPPropertyTypes().map((typeInfo) => (
              <button
                key={typeInfo.type}
                onClick={() => handleAddProperty(typeInfo.type)}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3"
              >
                <span className="text-lg">{typeInfo.icon}</span>
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {typeInfo.label}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {typeInfo.description}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="h-6 w-px bg-gray-200 dark:bg-gray-700" />

      {/* Filter Button */}
      <button
        onClick={() => setShowFilterModal(true)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors relative"
        title="Filters"
      >
        <Filter className="w-4 h-4" />
        Filter
        {activeView && activeView.filters.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
            {activeView.filters.length}
          </span>
        )}
      </button>

      {/* Sort Button */}
      <button
        onClick={() => setShowSortModal(true)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors relative"
        title="Sort"
      >
        <ArrowUpDown className="w-4 h-4" />
        Sort
        {activeView && activeView.sorts.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
            {activeView.sorts.length}
          </span>
        )}
      </button>

      {/* Stats */}
      <div className="ml-auto flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
        <span>{boardProperties.length} properties</span>
        <span>{boardRows.length} rows</span>
      </div>

      {/* Click outside to close menu */}
      {showPropertyMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowPropertyMenu(false)}
        />
      )}

      {/* Filter Modal */}
      {showFilterModal && activeView && (
        <FilterModal
          properties={boardProperties}
          filters={activeView.filters}
          onClose={() => setShowFilterModal(false)}
          onSave={handleSaveFilters}
        />
      )}

      {/* Sort Modal */}
      {showSortModal && activeView && (
        <SortModal
          properties={boardProperties}
          sorts={activeView.sorts}
          onClose={() => setShowSortModal(false)}
          onSave={handleSaveSorts}
        />
      )}
    </div>
  );
}
