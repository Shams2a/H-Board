/**
 * Sidebar Component
 * Left panel with boards list, search, and templates
 */

import { useEffect, useState } from 'react';
import { useBoardStore, selectBoards, useUIStore, selectSidebarOpen } from '../../store';
import BoardTree from './BoardTree';
import SearchBar from './SearchBar';
import FilterControls, { type FilterState } from './FilterControls';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

export default function Sidebar() {
  const sidebarOpen = useUIStore(selectSidebarOpen);
  const toggleSidebar = useUIStore(state => state.toggleSidebar);
  const boards = useBoardStore(selectBoards);
  const loadBoards = useBoardStore(state => state.loadBoards);
  const createBoard = useBoardStore(state => state.createBoard);
  const [_filters, setFilters] = useState<FilterState>({ types: [], tags: [] });

  useEffect(() => {
    loadBoards();
  }, [loadBoards]);

  const handleCreateBoard = async () => {
    const name = prompt('Enter board name:');
    if (name) {
      await createBoard(name);
    }
  };

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    // TODO: Apply filters to boards/elements display
    console.log('Filters changed:', newFilters);
  };

  if (!sidebarOpen) {
    return (
      <button
        onClick={toggleSidebar}
        className="fixed left-0 top-4 z-sidebar bg-white dark:bg-[#1E252B] p-2 rounded-r-lg shadow-lg hover:bg-gray-50 dark:hover:bg-[#252B32] transition-colors"
        aria-label="Open sidebar"
      >
        <ChevronRight className="w-5 h-5 text-gray-600 dark:text-[#B1B9C4]" />
      </button>
    );
  }

  return (
    <aside className="w-64 bg-white dark:bg-[#1E252B] border-r border-border dark:border-[#30363D] flex flex-col h-full slide-in-left">
      {/* Header */}
      <div className="p-4 border-b border-border dark:border-[#30363D] flex items-center justify-between">
        <h1 className="text-lg font-bold text-text-primary dark:text-[#E0E6ED]">H-Board</h1>
        <button
          onClick={toggleSidebar}
          className="p-1.5 hover:bg-gray-100 dark:hover:bg-[#252B32] rounded transition-colors"
          aria-label="Close sidebar"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-[#B1B9C4]" />
        </button>
      </div>

      {/* Search Bar */}
      <div className="p-4 border-b border-border dark:border-[#30363D]">
        <SearchBar />
      </div>

      {/* Filter Controls */}
      <div className="p-4 border-b border-border dark:border-[#30363D]">
        <FilterControls onFilterChange={handleFilterChange} />
      </div>

      {/* Boards Section */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-text-secondary dark:text-[#B1B9C4] uppercase tracking-wide">
            Boards
          </h2>
          <button
            onClick={handleCreateBoard}
            className="p-1 hover:bg-gray-100 dark:hover:bg-[#252B32] rounded transition-colors"
            aria-label="Create new board"
            title="Create new board"
          >
            <Plus className="w-4 h-4 text-gray-600 dark:text-[#B1B9C4]" />
          </button>
        </div>

        <BoardTree boards={boards} />
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border dark:border-[#30363D] text-xs text-text-tertiary dark:text-[#B1B9C4]">
        <p>H-Board v1.0.0</p>
        <p className="mt-1">Local creative workspace</p>
      </div>
    </aside>
  );
}
