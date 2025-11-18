/**
 * Canvas Component
 * Main workspace for placing and manipulating elements
 */

import { useEffect, useRef } from 'react';
import { useBoardStore, useElementStore, useUIStore } from '../../store';
import CanvasElement from './CanvasElement';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';

export default function Canvas() {
  const { currentBoardId, getCurrentBoard } = useBoardStore();
  const {
    loadElements,
    elements,
    selectElement,
    selectedIds,
    clearSelection,
    deleteElements,
    copy,
    paste,
    duplicate
  } = useElementStore();
  const { zoom, panX, panY, gridEnabled } = useUIStore();
  const canvasRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onDelete: () => {
      if (selectedIds.length > 0) {
        deleteElements(selectedIds);
      }
    },
    onCopy: () => {
      if (selectedIds.length > 0) {
        copy();
      }
    },
    onPaste: async () => {
      await paste();
    },
    onDuplicate: async () => {
      if (selectedIds.length > 0) {
        await duplicate(selectedIds);
      }
    }
  });

  const currentBoard = getCurrentBoard();

  useEffect(() => {
    if (currentBoardId) {
      loadElements(currentBoardId);
    }
  }, [currentBoardId, loadElements]);

  const handleCanvasClick = async (e: React.MouseEvent<HTMLDivElement>) => {
    // Only handle click if clicking directly on canvas (not on an element)
    if (e.target !== e.currentTarget) return;

    // Clear selection when clicking on empty canvas
    clearSelection();
  };

  if (!currentBoard) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-background-canvas">
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
      ref={canvasRef}
      className={`
        w-full h-full overflow-hidden relative
        ${gridEnabled ? 'canvas-grid' : ''}
      `}
      style={{
        backgroundColor: currentBoard.settings.backgroundColor || '#F5F5F5'
      }}
      onClick={handleCanvasClick}
    >
      {/* Canvas content with zoom and pan */}
      <div
        style={{
          transform: `scale(${zoom}) translate(${panX}px, ${panY}px)`,
          transformOrigin: 'top left',
          width: '100%',
          height: '100%',
          transition: 'transform 0.1s ease-out',
          position: 'relative'
        }}
      >
        {elements.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center pointer-events-none">
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                {currentBoard.name}
              </h3>
              <p className="text-text-secondary">
                This board is empty. Use the toolbar below to add elements.
              </p>
              <p className="text-sm text-text-tertiary mt-2">
                Click on a tool icon in the toolbar to create an element
              </p>
            </div>
          </div>
        ) : (
          <div
            className="relative w-full h-full"
            onClick={handleCanvasClick}
          >
            {/* Render all elements */}
            {elements.map((element) => (
              <CanvasElement
                key={element.id}
                element={element}
                isSelected={selectedIds.includes(element.id)}
                onSelect={() => selectElement(element.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Canvas info (bottom right) */}
      <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-sm text-xs text-text-tertiary pointer-events-none">
        Board: {currentBoard.name} • Elements: {elements.length}
      </div>
    </div>
  );
}
