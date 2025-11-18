/**
 * Canvas Component
 * Main workspace for placing and manipulating elements
 */

import { useEffect, useRef } from 'react';
import { useBoardStore, useElementStore, useUIStore } from '../../store';
import type { NoteElement, ImageElement } from '../../types';
import CanvasElement from './CanvasElement';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';

export default function Canvas() {
  const { currentBoardId, getCurrentBoard } = useBoardStore();
  const {
    loadElements,
    elements,
    createElement,
    selectElement,
    selectedIds,
    clearSelection,
    deleteElements,
    copy,
    paste,
    duplicate
  } = useElementStore();
  const { zoom, panX, panY, gridEnabled, activeTool, setActiveTool } = useUIStore();
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
    // Only create element if clicking directly on canvas (not on an element)
    if (e.target !== e.currentTarget) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect || !currentBoardId) return;

    // Calculate position accounting for zoom and pan
    const x = (e.clientX - rect.left) / zoom - panX;
    const y = (e.clientY - rect.top) / zoom - panY;

    // Snap to grid if enabled
    const gridSize = gridEnabled ? 8 : 1;
    const snappedX = Math.round(x / gridSize) * gridSize;
    const snappedY = Math.round(y / gridSize) * gridSize;

    // Create element based on active tool
    if (activeTool === 'note') {
      const newNote: NoteElement = {
        id: crypto.randomUUID(),
        boardId: currentBoardId,
        type: 'note',
        position: { x: snappedX, y: snappedY },
        size: { width: 300, height: 200 },
        zIndex: elements.length,
        locked: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        content: {
          text: '',
          textFormat: 'html'
        },
        style: {
          backgroundColor: '#FFFFFF'
        }
      };

      await createElement(newNote);
      setActiveTool(null); // Reset tool after creation
    }

    // Create image element
    if (activeTool === 'image') {
      const newImage: ImageElement = {
        id: crypto.randomUUID(),
        boardId: currentBoardId,
        type: 'image',
        position: { x: snappedX, y: snappedY },
        size: { width: 400, height: 300 },
        zIndex: elements.length,
        locked: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        content: {
          src: '', // Empty initially - user will upload
          alt: '',
          originalName: ''
        },
        style: {
          backgroundColor: '#F9FAFB'
        }
      };

      await createElement(newImage);
      setActiveTool(null); // Reset tool after creation
    }

    // Clear selection when clicking on empty canvas
    if (!activeTool) {
      clearSelection();
    }
  };

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
      ref={canvasRef}
      className={`
        flex-1 overflow-hidden relative
        ${gridEnabled ? 'canvas-grid' : ''}
        ${activeTool ? 'cursor-crosshair' : 'cursor-default'}
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
                Click on a tool and then click on the canvas to create an element
              </p>
            </div>
          </div>
        ) : (
          <div className="relative w-full h-full">
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
        {activeTool && (
          <span className="ml-2 text-primary-600 font-semibold">
            • Creating: {activeTool}
          </span>
        )}
      </div>
    </div>
  );
}
