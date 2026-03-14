/**
 * BoardCell Component
 * Select and link to a board (Canvas, Kanban, or Database)
 */

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Square, Trello, Database, ExternalLink, X } from 'lucide-react';
import { useBoardStore, selectBoards } from '../../../store';
import type { Board } from '../../../types';

interface BoardCellProps {
  value: string | null; // Board ID
  onChange: (value: string | null) => void;
}

export default function BoardCell({ value, onChange }: BoardCellProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const boards = useBoardStore(selectBoards);

  const selectedBoard = boards.find(b => b.id === value);

  useEffect(() => {
    if (showMenu && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setMenuPos({
        top: rect.bottom + 4,
        left: rect.left,
        width: Math.max(rect.width, 300),
      });
    }
  }, [showMenu]);

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
        ref={triggerRef}
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
              title="Ouvrir le projet"
            >
              <ExternalLink className="w-3.5 h-3.5 text-gray-500 dark:text-[#B1B9C4]" />
            </button>
            <button
              onClick={handleClear}
              className="p-1 hover:bg-gray-200 dark:hover:bg-[#2C333A] rounded"
              title="Effacer"
            >
              <X className="w-3.5 h-3.5 text-gray-500 dark:text-[#B1B9C4]" />
            </button>
          </div>
        ) : (
          <span className="text-gray-400 dark:text-[#6B7280] flex-1">Selectionner un projet...</span>
        )}
        <ChevronDown className="w-3.5 h-3.5 text-gray-400 dark:text-[#6B7280] ml-auto" />
      </div>

      {showMenu && menuPos && createPortal(
        <>
          <div
            className="fixed inset-0 z-[9998]"
            onClick={() => setShowMenu(false)}
          />
          <div
            className="fixed max-h-64 overflow-y-auto bg-white dark:bg-[#1E252B] border border-gray-200 dark:border-[#30363D] rounded-lg shadow-lg z-[9999] py-1"
            style={{ top: menuPos.top, left: menuPos.left, width: menuPos.width }}
          >
            {boards.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500 dark:text-[#B1B9C4] italic">
                Aucun projet disponible
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
                        {type === 'canvas' ? 'Projets Canvas' : type === 'kanban' ? 'Projets Kanban' : 'Projets Database'}
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
        </>,
        document.body
      )}
    </div>
  );
}
