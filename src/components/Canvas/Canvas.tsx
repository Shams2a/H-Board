/**
 * Canvas Component
 * Main workspace for placing and manipulating elements
 */

import { useEffect, useRef, useState } from 'react';
import { useBoardStore, useElementStore, useUIStore, useDragStore } from '../../store';
import { useDarkModeColor } from '../../hooks/useDarkModeColor';
import { newSyncService } from '../../services/supabase/newSyncService';
import CanvasElement from './CanvasElement';

export default function Canvas() {
  const { currentBoardId, getCurrentBoard } = useBoardStore();
  const {
    loadElements,
    elements,
    selectElement,
    selectedIds,
    clearSelection,
    deleteElements,
    undo,
    redo
  } = useElementStore();
  const { zoom, panX, panY, gridEnabled, setPan } = useUIStore();
  const { draggedElementId, justFinishedDrag } = useDragStore();
  const canvasRef = useRef<HTMLDivElement>(null);

  // Selection box state
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState({ x: 0, y: 0 });
  const [selectionEnd, setSelectionEnd] = useState({ x: 0, y: 0 });
  const [didSelect, setDidSelect] = useState(false);

  const currentBoard = getCurrentBoard();

  // Get dark mode adapted canvas background color
  const canvasBackgroundColor = useDarkModeColor(
    currentBoard.settings.backgroundColor || '#F5F5F5'
  );

  useEffect(() => {
    if (currentBoardId) {
      loadElements(currentBoardId);
    }
  }, [currentBoardId, loadElements]);

  // Refresh elements when sync downloads new data
  useEffect(() => {
    const unsubscribe = newSyncService.onSyncComplete((hasNewData) => {
      if (hasNewData && currentBoardId) {
        loadElements(currentBoardId);
      }
    });
    return unsubscribe;
  }, [currentBoardId, loadElements]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle shortcuts if user is typing in an input, textarea, or contenteditable
      const target = e.target as HTMLElement;
      const isTyping =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true' ||
        target.closest('.ProseMirror');

      // Undo: Ctrl+Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        if (isTyping) return;
        e.preventDefault();
        undo();
        return;
      }

      // Redo: Ctrl+Y or Ctrl+Shift+Z
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        if (isTyping) return;
        e.preventDefault();
        redo();
        return;
      }

      // Delete or Backspace key to delete selected elements
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.length > 0) {
        if (isTyping) return;

        e.preventDefault();
        deleteElements(selectedIds);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, deleteElements, undo, redo]);

  // Handle mouse wheel for panning
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e: WheelEvent) => {
      // Prevent default scroll behavior
      e.preventDefault();

      // Panning speed factor (adjust as needed)
      const panSpeed = 1;

      // Calculate new pan values
      // deltaY for vertical scroll, deltaX for horizontal scroll
      // Shift+wheel can also trigger horizontal scroll in some browsers
      const deltaX = e.deltaX || (e.shiftKey ? e.deltaY : 0);
      const deltaY = e.shiftKey ? 0 : e.deltaY;

      const newPanX = panX - deltaX * panSpeed;
      const newPanY = panY - deltaY * panSpeed;

      setPan(newPanX, newPanY);
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, [panX, panY, setPan]);

  const handleCanvasClick = async (e: React.MouseEvent<HTMLDivElement>) => {
    // Don't clear selection if we just finished a selection box
    if (didSelect) {
      setDidSelect(false);
      return;
    }

    // Don't clear selection if we just finished dragging
    if (justFinishedDrag) {
      return;
    }

    // Only handle click if NOT clicking on an element
    const target = e.target as HTMLElement;
    if (target.closest('.element-card')) return;

    // Clear selection when clicking on empty canvas
    clearSelection();
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only start selection box if NOT clicking on an element
    const target = e.target as HTMLElement;
    if (target.closest('.element-card')) return;

    // Don't start selection box if right-clicking
    if (e.button !== 0) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Calculate position relative to canvas, accounting for zoom and pan
    const x = (e.clientX - rect.left) / zoom - panX;
    const y = (e.clientY - rect.top) / zoom - panY;

    setIsSelecting(true);
    setSelectionStart({ x, y });
    setSelectionEnd({ x, y });
    setDidSelect(false); // Reset flag

    // Clear selection if not holding Ctrl/Cmd
    if (!e.ctrlKey && !e.metaKey) {
      clearSelection();
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isSelecting) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Calculate position relative to canvas, accounting for zoom and pan
    const x = (e.clientX - rect.left) / zoom - panX;
    const y = (e.clientY - rect.top) / zoom - panY;

    setSelectionEnd({ x, y });

    // Calculate selection box bounds
    const minX = Math.min(selectionStart.x, x);
    const maxX = Math.max(selectionStart.x, x);
    const minY = Math.min(selectionStart.y, y);
    const maxY = Math.max(selectionStart.y, y);

    // Find elements within selection box
    elements.forEach((element) => {
      const elX = element.position.x;
      const elY = element.position.y;
      const elRight = elX + element.size.width;
      const elBottom = elY + element.size.height;

      // Check if element intersects with selection box
      const intersects = !(elRight < minX || elX > maxX || elBottom < minY || elY > maxY);

      if (intersects && !selectedIds.includes(element.id)) {
        selectElement(element.id, true); // multi-select mode
        setDidSelect(true); // Mark that we selected something
      }
    });
  };

  const handleCanvasMouseUp = () => {
    setIsSelecting(false);
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

  // Calculate selection box dimensions for rendering
  const selectionBox = isSelecting ? {
    left: Math.min(selectionStart.x, selectionEnd.x),
    top: Math.min(selectionStart.y, selectionEnd.y),
    width: Math.abs(selectionEnd.x - selectionStart.x),
    height: Math.abs(selectionEnd.y - selectionStart.y)
  } : null;

  return (
    <div
      ref={canvasRef}
      className={`
        canvas-container w-full h-full overflow-hidden relative
        ${gridEnabled ? 'canvas-grid' : ''}
      `}
      style={{
        backgroundColor: canvasBackgroundColor
      }}
      onClick={handleCanvasClick}
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleCanvasMouseMove}
      onMouseUp={handleCanvasMouseUp}
      onMouseLeave={handleCanvasMouseUp}
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
            {/* Render only top-level elements (not children of columns) */}
            {/* Exception: also render the currently dragged element even if it's in a column */}
            {elements
              .filter((element) => {
                // Filter out elements that don't belong to this board
                if (element.boardId !== currentBoardId) {
                  return false;
                }

                // Always render the element being dragged
                if (element.id === draggedElementId) {
                  return true;
                }

                // Check if this element is a child of any column
                const isChildOfColumn = elements.some(
                  (el) =>
                    el.type === 'column' &&
                    el.content.childrenIds?.includes(element.id)
                );
                return !isChildOfColumn;
              })
              .map((element) => (
                <CanvasElement
                  key={element.id}
                  element={element}
                  isSelected={selectedIds.includes(element.id)}
                  onSelect={() => selectElement(element.id)}
                />
              ))}
          </div>
        )}

        {/* Selection Box */}
        {selectionBox && (
          <div
            className="absolute pointer-events-none"
            style={{
              left: `${selectionBox.left}px`,
              top: `${selectionBox.top}px`,
              width: `${selectionBox.width}px`,
              height: `${selectionBox.height}px`,
              border: '2px dashed #3B82F6',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              zIndex: 10000
            }}
          />
        )}
      </div>

      {/* Canvas info (bottom right) */}
      <div className="absolute bottom-4 right-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-sm text-xs text-text-tertiary dark:text-gray-400 pointer-events-none">
        Board: {currentBoard.name} • Elements: {elements.length}
      </div>
    </div>
  );
}
