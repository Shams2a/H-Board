/**
 * Sidebar Component
 * Left panel with boards list, search, and templates
 */

import { useEffect } from 'react';
import { useBoardStore, useUIStore } from '../../store';
import BoardTree from './BoardTree';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

export default function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const { boards, loadBoards, createBoard } = useBoardStore();

  useEffect(() => {
    loadBoards();
  }, [loadBoards]);

  const handleCreateBoard = async () => {
    const name = prompt('Enter board name:');
    if (name) {
      await createBoard(name);
    }
  };

  if (!sidebarOpen) {
    return (
      <button
        onClick={toggleSidebar}
        className="fixed left-0 top-4 z-sidebar bg-white p-2 rounded-r-lg shadow-lg hover:bg-gray-50 transition-colors"
        aria-label="Open sidebar"
      >
        <ChevronRight className="w-5 h-5 text-gray-600" />
      </button>
    );
  }

  return (
    <aside className="w-64 bg-white border-r border-border flex flex-col h-full slide-in-left">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h1 className="text-lg font-bold text-text-primary">H-Board</h1>
        <button
          onClick={toggleSidebar}
          className="p-1.5 hover:bg-gray-100 rounded transition-colors"
          aria-label="Close sidebar"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Boards Section */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">
            Boards
          </h2>
          <button
            onClick={handleCreateBoard}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            aria-label="Create new board"
            title="Create new board"
          >
            <Plus className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        <BoardTree boards={boards} />
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border text-xs text-text-tertiary">
        <p>H-Board v1.0.0</p>
        <p className="mt-1">Local creative workspace</p>
      </div>
    </aside>
  );
}
