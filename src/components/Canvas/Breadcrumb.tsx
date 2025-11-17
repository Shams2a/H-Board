/**
 * Breadcrumb Component
 * Shows the hierarchical path of the current board
 */

import { useBoardStore } from '../../store';
import { ChevronRight, Home, ArrowLeft } from 'lucide-react';

export default function Breadcrumb() {
  const { currentBoardId, getBoardPath, setCurrentBoard } = useBoardStore();

  if (!currentBoardId) {
    return (
      <div className="h-12 bg-white border-b border-border flex items-center px-4">
        <Home className="w-4 h-4 text-gray-500" />
        <span className="ml-2 text-sm text-text-tertiary">No board selected</span>
      </div>
    );
  }

  const path = getBoardPath(currentBoardId);
  const parentBoard = path.length > 1 ? path[path.length - 2] : null;

  const handleGoBack = () => {
    if (parentBoard) {
      setCurrentBoard(parentBoard.id);
    }
  };

  return (
    <div className="h-12 bg-white border-b border-border flex items-center px-4 gap-2">
      {/* Back button */}
      {parentBoard && (
        <button
          onClick={handleGoBack}
          className="p-1.5 hover:bg-gray-100 rounded transition-colors"
          aria-label="Go back to parent board"
          title={`Back to ${parentBoard.name}`}
        >
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </button>
      )}

      {/* Home icon */}
      <button
        onClick={() => {
          if (path.length > 0) {
            setCurrentBoard(path[0].id);
          }
        }}
        className="p-1 hover:bg-gray-100 rounded transition-colors"
        aria-label="Go to root board"
      >
        <Home className="w-4 h-4 text-gray-500" />
      </button>

      {/* Breadcrumb path */}
      <nav className="flex items-center gap-1 overflow-x-auto">
        {path.map((board, index) => {
          const isLast = index === path.length - 1;

          return (
            <div key={board.id} className="flex items-center gap-1">
              {index > 0 && (
                <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
              )}

              <button
                onClick={() => setCurrentBoard(board.id)}
                className={`
                  px-2 py-1 rounded text-sm transition-colors whitespace-nowrap
                  ${isLast
                    ? 'font-semibold text-text-primary bg-gray-100'
                    : 'text-text-secondary hover:bg-gray-100'
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
