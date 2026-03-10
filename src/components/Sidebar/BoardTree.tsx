/**
 * BoardTree Component
 * Hierarchical list of boards
 */

import { useState } from 'react';
import { useBoardStore, selectCurrentBoardId } from '../../store';
import type { Board } from '../../types';
import { ChevronRight, ChevronDown, Folder, FolderOpen } from 'lucide-react';

interface BoardTreeProps {
  boards: Board[];
  parentId?: string | null;
  level?: number;
}

export default function BoardTree({ boards, parentId = null, level = 0 }: BoardTreeProps) {
  const currentBoardId = useBoardStore(selectCurrentBoardId);
  const setCurrentBoard = useBoardStore(state => state.setCurrentBoard);
  const getChildBoards = useBoardStore(state => state.getChildBoards);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const filteredBoards = boards.filter(board => board.parentId === parentId);

  const toggleExpand = (boardId: string) => {
    setExpandedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(boardId)) {
        newSet.delete(boardId);
      } else {
        newSet.add(boardId);
      }
      return newSet;
    });
  };

  if (filteredBoards.length === 0 && level === 0) {
    return (
      <div className="text-sm text-text-tertiary text-center py-8">
        No boards yet. Create your first board!
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      {filteredBoards.map(board => {
        const children = getChildBoards(board.id);
        const hasChildren = children.length > 0;
        const isExpanded = expandedIds.has(board.id);
        const isActive = currentBoardId === board.id;

        return (
          <div key={board.id}>
            <div
              className={`
                sidebar-item flex items-center gap-2
                ${isActive ? 'active' : ''}
              `}
              style={{ paddingLeft: `${level * 12 + 12}px` }}
            >
              {hasChildren ? (
                <button
                  onClick={() => toggleExpand(board.id)}
                  className="p-0.5 hover:bg-gray-200 rounded"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
              ) : (
                <div className="w-5" />
              )}

              <button
                onClick={() => setCurrentBoard(board.id)}
                className="flex-1 flex items-center gap-2 text-left"
              >
                {isExpanded ? (
                  <FolderOpen className="w-4 h-4 text-primary-500" />
                ) : (
                  <Folder className="w-4 h-4 text-gray-500" />
                )}
                <span className="text-sm truncate">{board.name}</span>
              </button>
            </div>

            {hasChildren && isExpanded && (
              <BoardTree
                boards={boards}
                parentId={board.id}
                level={level + 1}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
