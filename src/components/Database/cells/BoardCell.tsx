/**
 * BoardCell Component
 * Select and link to a board (Canvas, Kanban, or Database)
 */

import { useState } from 'react';
import { ChevronDown, Square, Trello, Database, ExternalLink, X } from 'lucide-react';
import { useBoardStore, selectBoards } from '../../../store';
import type { Board } from '../../../types';

interface BoardCellProps {
  value: string | null; // Board ID
  onChange: (value: string | null) => void;
}

export default function BoardCell({ value, onChange }: BoardCellProps) {
  const [showMenu, setShowMenu] = useState(false);
  const boards = useBoardStore(selectBoards);

  const selectedBoard = boards.find(b => b.id === value);

  const handleSelect = (boardId: string) => {
    onChange(boardId);
    setShowMenu(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setShowMenu(false);
  };

  const handleOpenBoard = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedBoard) {
      window.open(`/board/${selectedBoard.id}`, '_blank');
    }
  };

  const getBoardIcon = (board: Board) => {
    switch (board.type) {
      case 'kanban':
        return <Trello className="w-4 h-4 text-blue-600" />;
      case 'database':
        return <Database className="w-4 h-4 text-amber-600" />;
      case 'canvas':
      default:
        return <Square className="w-4 h-4 text-primary-600" />;
    }
  };

  const getBoardTypeLabel = (board: Board) => {
    switch (board.type) {
      case 'kanban':
        return 'Kanban';
      case 'database':
        return 'Database';
      case 'canvas':
      default:
        return 'Canvas';
    }
  };

  return (
    <div className="relative w-full">
      <div
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 px-2 py-1 text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-[#252B32]/50 rounded min-h-[28px]"
      >
        {selectedBoard ? (
          <div className="flex items-center gap-2 flex-1">
            {getBoardIcon(selectedBoard)}
            <span className="text-gray-900 dark:text-[#E0E6ED] font-medium truncate">
              {selectedBoard.name}
            </span>
            <span className="text-xs text-gray-500 dark:text-[#B1B9C4]">
              ({getBoardTypeLabel(selectedBoard)})
            </span>
            <button
              onClick={handleOpenBoard}
              className="ml-auto p-1 hover:bg-gray-200 dark:hover:bg-[#2C333A] rounded"
              title="Open board"
            >
              <ExternalLink className="w-3.5 h-3.5 text-gray-500 dark:text-[#B1B9C4]" />
            </button>
            <button
              onClick={handleClear}
              className="p-1 hover:bg-gray-200 dark:hover:bg-[#2C333A] rounded"
              title="Clear"
            >
              <X className="w-3.5 h-3.5 text-gray-500 dark:text-[#B1B9C4]" />
            </button>
          </div>
        ) : (
          <span className="text-gray-400 dark:text-[#6B7280] flex-1">Select a board...</span>
        )}
        <ChevronDown className="w-3.5 h-3.5 text-gray-400 dark:text-[#6B7280] ml-auto" />
      </div>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute top-full left-0 mt-1 w-full min-w-[300px] max-h-64 overflow-y-auto bg-white dark:bg-[#1E252B] border border-gray-200 dark:border-[#30363D] rounded-lg shadow-lg z-50 py-1">
            {boards.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500 dark:text-[#B1B9C4] italic">
                No boards available
              </div>
            ) : (
              <>
                {/* Group boards by type */}
                {['canvas', 'kanban', 'database'].map((type) => {
                  const filteredBoards = boards.filter(b => b.type === type);
                  if (filteredBoards.length === 0) return null;

                  return (
                    <div key={type}>
                      <div className="px-3 py-1 text-xs font-semibold text-gray-500 dark:text-[#B1B9C4] uppercase border-t first:border-t-0 border-gray-200 dark:border-[#30363D] mt-1 first:mt-0">
                        {type === 'canvas' ? 'Canvas Boards' : type === 'kanban' ? 'Kanban Boards' : 'Database Boards'}
                      </div>
                      {filteredBoards.map((board) => (
                        <button
                          key={board.id}
                          onClick={() => handleSelect(board.id)}
                          className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-[#252B32] flex items-center gap-2 ${
                            selectedBoard?.id === board.id ? 'bg-primary-50 dark:bg-primary-900/20' : ''
                          }`}
                        >
                          {getBoardIcon(board)}
                          <span className="flex-1 truncate text-gray-900 dark:text-[#E0E6ED]">
                            {board.name}
                          </span>
                          {selectedBoard?.id === board.id && (
                            <span className="text-primary-600 dark:text-primary-400">✓</span>
                          )}
                        </button>
                      ))}
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
