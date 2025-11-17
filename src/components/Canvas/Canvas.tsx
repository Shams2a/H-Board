/**
 * Canvas Component
 * Main workspace for placing and manipulating elements
 */

import { useEffect } from 'react';
import { useBoardStore, useElementStore, useUIStore } from '../../store';

export default function Canvas() {
  const { currentBoardId, getCurrentBoard } = useBoardStore();
  const { loadElements, elements } = useElementStore();
  const { zoom, panX, panY, gridEnabled } = useUIStore();

  const currentBoard = getCurrentBoard();

  useEffect(() => {
    if (currentBoardId) {
      loadElements(currentBoardId);
    }
  }, [currentBoardId, loadElements]);

  if (!currentBoard) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background-canvas">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-text-primary mb-2">
            Welcome to H-Board
          </h2>
          <p className="text-text-secondary">
            Create a new board or select one from the sidebar to get started
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`
        flex-1 overflow-hidden relative
        ${gridEnabled ? 'canvas-grid' : ''}
      `}
      style={{
        backgroundColor: currentBoard.settings.backgroundColor || '#F5F5F5'
      }}
    >
      {/* Canvas content with zoom and pan */}
      <div
        style={{
          transform: `scale(${zoom}) translate(${panX}px, ${panY}px)`,
          transformOrigin: 'center center',
          width: '100%',
          height: '100%',
          transition: 'transform 0.1s ease-out'
        }}
      >
        {/* Placeholder for elements */}
        {elements.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                {currentBoard.name}
              </h3>
              <p className="text-text-secondary">
                This board is empty. Use the toolbar below to add elements.
              </p>
              <p className="text-sm text-text-tertiary mt-2">
                Click on a tool and then click on the canvas to create an element
              </p>
            </div>
          </div>
        ) : (
          <div className="relative w-full h-full">
            {/* Elements will be rendered here */}
            <p className="absolute top-4 left-4 text-sm text-text-tertiary">
              {elements.length} element(s) in this board
            </p>
          </div>
        )}
      </div>

      {/* Canvas info (bottom right) */}
      <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-sm text-xs text-text-tertiary">
        Board: {currentBoard.name} • Elements: {elements.length}
      </div>
    </div>
  );
}
