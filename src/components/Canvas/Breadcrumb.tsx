/**
 * Breadcrumb Component
 * Shows the hierarchical path of the current board
 */

import { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBoardStore, selectCurrentBoardId, useDragStore } from '../../store';
import { ChevronRight, Home } from 'lucide-react';

export default function Breadcrumb() {
  const navigate = useNavigate();
  const currentBoardId = useBoardStore(selectCurrentBoardId);
  const getBoardPath = useBoardStore(state => state.getBoardPath);
  const draggedElementId = useDragStore(state => state.draggedElementId);
  const dropTargetBoardId = useDragStore(state => state.dropTargetBoardId);
  const isDropReady = useDragStore(state => state.isDropReady);
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Clear timer on unmount
  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
      }
    };
  }, []);

  const handleDragEnter = (boardId: string) => {
    if (draggedElementId && boardId !== currentBoardId) {
      useDragStore.getState().setDropTargetBoard(boardId);
      hoverTimerRef.current = setTimeout(() => {
        useDragStore.getState().setDropReady(true);
      }, 1000);
    }
  };

  const handleDragLeave = (boardId: string) => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    if (dropTargetBoardId === boardId) {
      useDragStore.getState().setDropTargetBoard(null);
    }
  };

  if (!currentBoardId) {
    return (
      <div className="h-12 bg-white dark:bg-[#1E252B] border-b border-border dark:border-[#30363D] flex items-center px-4">
        <Home className="w-4 h-4 text-gray-500 dark:text-[#B1B9C4]" />
        <span className="ml-2 text-sm text-text-tertiary dark:text-[#B1B9C4]">No board selected</span>
      </div>
    );
  }

  const path = getBoardPath(currentBoardId);

  return (
    <div className="h-12 bg-white dark:bg-[#1E252B] border-b border-border dark:border-[#30363D] flex items-center px-4 gap-2">
      {/* Home icon */}
      <button
        onClick={() => {
          if (path.length > 0) {
            navigate(`/board/${path[0].id}`);
          }
        }}
        className="p-1 hover:bg-gray-100 dark:hover:bg-[#252B32] rounded transition-colors"
        aria-label="Go to root board"
      >
        <Home className="w-4 h-4 text-gray-500 dark:text-[#B1B9C4]" />
      </button>

      {/* Breadcrumb path */}
      <nav className="flex items-center gap-1 overflow-x-auto">
        {path.map((board, index) => {
          const isLast = index === path.length - 1;

          return (
            <div key={board.id} className="flex items-center gap-1">
              {index > 0 && (
                <ChevronRight className="w-4 h-4 text-gray-400 dark:text-[#6B7280] flex-shrink-0" />
              )}

              <button
                onClick={() => navigate(`/board/${board.id}`)}
                onMouseEnter={() => !isLast && handleDragEnter(board.id)}
                onMouseLeave={() => !isLast && handleDragLeave(board.id)}
                className={`
                  px-2 py-1 rounded text-sm transition-colors whitespace-nowrap
                  ${isLast
                    ? 'font-semibold text-text-primary dark:text-[#E0E6ED] bg-gray-100 dark:bg-[#252B32]'
                    : 'text-text-secondary dark:text-[#B1B9C4] hover:bg-gray-100 dark:hover:bg-[#252B32]'
                  }
                  ${!isLast && dropTargetBoardId === board.id && isDropReady
                    ? 'ring-2 ring-green-500 bg-green-50 dark:bg-green-900/20'
                    : ''
                  }
                  ${!isLast && dropTargetBoardId === board.id && !isDropReady
                    ? 'ring-2 ring-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                    : ''
                  }
                `}
                aria-current={isLast ? 'page' : undefined}
              >
                {board.name}
              </button>
            </div>
          );
        })}
      </nav>
    </div>
  );
}
