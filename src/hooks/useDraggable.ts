/**
 * useDraggable Hook
 * Handles drag and drop functionality for canvas elements
 */

import { useRef, useCallback, useEffect } from 'react';
import { useElementStore, useUIStore, useDragStore } from '../store';
import type { Position } from '../types';

interface UseDraggableOptions {
  elementId: string;
  parentColumnId?: string | null;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

export function useDraggable({ elementId, parentColumnId = null, onDragStart, onDragEnd }: UseDraggableOptions) {
  const { updatePosition, getElementById, selectedIds, updateElement, batchUpdatePositions } = useElementStore();
  const { gridEnabled, zoom, panX, panY } = useUIStore();
  const { setDraggedElement, clearDrag, setJustFinishedDrag, dropTargetBoardId, isDropReady } = useDragStore();

  const isDraggingRef = useRef(false);
  const startPosRef = useRef<Position>({ x: 0, y: 0 });
  const elementStartPosRef = useRef<Position>({ x: 0, y: 0 });
  const selectedElementsStartPosRef = useRef<Map<string, Position>>(new Map());
  const longPressTimerRef = useRef<number | null>(null);
  const hasMovedRef = useRef(false);
  const isMultiSelectRef = useRef(false);
  const currentMousePosRef = useRef<Position>({ x: 0, y: 0 });
  const lastPositionUpdatesRef = useRef<Map<string, Position>>(new Map());

  // Cleanup function to stop dragging
  const cleanup = useCallback(() => {
    // Clear long press timer if exists
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    if (!isDraggingRef.current) return;

    // Persist final positions to DB if we moved
    if (hasMovedRef.current && lastPositionUpdatesRef.current.size > 0) {
      const { batchUpdatePositions } = useElementStore.getState();
      batchUpdatePositions(lastPositionUpdatesRef.current, true);
      lastPositionUpdatesRef.current = new Map();
    }

    // Mark that we just finished a drag if we moved
    if (hasMovedRef.current) {
      setJustFinishedDrag(true);
      // Reset this flag after a short delay to allow onClick to check it
      setTimeout(() => {
        setJustFinishedDrag(false);
      }, 100);
    }

    isDraggingRef.current = false;
    hasMovedRef.current = false;

    // Reset cursor
    document.body.style.cursor = '';
    document.body.style.userSelect = '';

    // Clear drag store
    clearDrag();

    onDragEnd?.();
  }, [clearDrag, onDragEnd, setJustFinishedDrag]);

  // Function to start dragging
  const startDragging = useCallback((clientX: number, clientY: number) => {
    const element = getElementById(elementId);
    if (!element || element.locked) return;

    // Get current state from store
    const { selectElement, selectedIds: currentSelectedIds, elements, updateElement } = useElementStore.getState();

    // Ensure element is selected when starting to drag
    // If element is already part of selection, don't change selection
    // Otherwise, select it with proper multi-select mode based on Ctrl/Cmd key
    if (!currentSelectedIds.includes(elementId)) {
      // Use isMultiSelectRef to determine if we should add to selection or replace it
      selectElement(elementId, isMultiSelectRef.current);
    }

    // If element is in a column (parentColumnId exists), calculate its absolute position from DOM
    let initialPosition = { ...element.position };
    if (parentColumnId) {
      const elementDOM = document.querySelector(`[data-element-id="${elementId}"]`) as HTMLElement;
      if (elementDOM) {
        const rect = elementDOM.getBoundingClientRect();

        // Find the transformed canvas content div (the one with scale/translate)
        const transformedDiv = elementDOM.closest('[style*="transform"]') as HTMLElement;

        if (transformedDiv && transformedDiv.parentElement) {
          const canvasRect = transformedDiv.parentElement.getBoundingClientRect();

          // Calculate the offset between the mouse and the element's top-left corner
          const mouseOffsetX = (clientX - rect.left) / zoom;
          const mouseOffsetY = (clientY - rect.top) / zoom;

          // Calculate mouse position in canvas coordinates
          const mouseCanvasX = (clientX - canvasRect.left) / zoom - panX;
          const mouseCanvasY = (clientY - canvasRect.top) / zoom - panY;

          // Position element so the mouse maintains the same offset from element's top-left
          initialPosition = {
            x: mouseCanvasX - mouseOffsetX,
            y: mouseCanvasY - mouseOffsetY
          };

          // Update element position immediately
          updatePosition(elementId, initialPosition);

          // Update size to preserve the width it had in the column
          // But don't update size for 'board' elements (they have fixed square size)
          if (element.type !== 'board') {
            const actualWidth = rect.width / zoom;
            updateElement(elementId, {
              size: {
                ...element.size,
                width: actualWidth
              }
            });
          }
        }
      }
    }

    // Set dragging state
    isDraggingRef.current = true;
    hasMovedRef.current = false;
    startPosRef.current = { x: clientX, y: clientY };
    elementStartPosRef.current = initialPosition;

    // Store initial positions of all selected elements for multi-element drag
    // Get the updated selectedIds after potentially adding this element
    const finalSelectedIds = useElementStore.getState().selectedIds;
    selectedElementsStartPosRef.current.clear();
    finalSelectedIds.forEach(id => {
      const el = elements.find(e => e.id === id);
      if (el) {
        selectedElementsStartPosRef.current.set(id, { ...el.position });
      }
    });

    // Notify drag store
    setDraggedElement(elementId, parentColumnId);

    // Call onDragStart callback
    onDragStart?.();

    // Change cursor
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
  }, [elementId, parentColumnId, onDragStart, setDraggedElement, getElementById, updatePosition, zoom, panX, panY]);

  // Mouse move handler
  const handleMouseMove = useCallback((e: MouseEvent) => {
    // Track current mouse position for column drag-out
    currentMousePosRef.current = { x: e.clientX, y: e.clientY };

    const deltaX = Math.abs(e.clientX - startPosRef.current.x);
    const deltaY = Math.abs(e.clientY - startPosRef.current.y);

    // Check if mouse moved while in long press waiting period (for column elements)
    if (longPressTimerRef.current && !isDraggingRef.current) {
      // If moved more than 5px, cancel long press
      if (deltaX > 5 || deltaY > 5) {
        window.clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
        hasMovedRef.current = true;
      }
      return;
    }

    // For canvas elements: start dragging on first movement (drag threshold)
    if (!isDraggingRef.current && !longPressTimerRef.current) {
      // Need to move at least 3px to start dragging
      if (deltaX > 3 || deltaY > 3) {
        startDragging(startPosRef.current.x, startPosRef.current.y);
      } else {
        return; // Not enough movement yet
      }
    }

    if (!isDraggingRef.current) return;

    e.preventDefault();
    e.stopPropagation();

    const element = getElementById(elementId);
    if (!element) {
      cleanup();
      return;
    }

    hasMovedRef.current = true;

    // Calculate delta accounting for zoom
    const dx = (e.clientX - startPosRef.current.x) / zoom;
    const dy = (e.clientY - startPosRef.current.y) / zoom;

    // Calculate new position for the primary element
    let newX = elementStartPosRef.current.x + dx;
    let newY = elementStartPosRef.current.y + dy;

    // Snap to grid if enabled
    if (gridEnabled) {
      const gridSize = 8;
      newX = Math.round(newX / gridSize) * gridSize;
      newY = Math.round(newY / gridSize) * gridSize;
    }

    // Build batch update map for all selected elements
    const positionUpdates = new Map<string, Position>();
    positionUpdates.set(elementId, { x: newX, y: newY });

    // Collect all moved element IDs
    const movedElementIds = [elementId];

    // Add all other selected elements to batch
    selectedElementsStartPosRef.current.forEach((startPos, id) => {
      if (id !== elementId) {
        let newElX = startPos.x + dx;
        let newElY = startPos.y + dy;

        // Snap to grid if enabled
        if (gridEnabled) {
          const gridSize = 8;
          newElX = Math.round(newElX / gridSize) * gridSize;
          newElY = Math.round(newElY / gridSize) * gridSize;
        }

        positionUpdates.set(id, { x: newElX, y: newElY });
        movedElementIds.push(id);
      }
    });

    // Store for persistence on drag end
    lastPositionUpdatesRef.current = positionUpdates;

    // Single batch update - no DB persistence during drag
    const { batchUpdatePositions, updateMultipleConnectedLines } = useElementStore.getState();
    batchUpdatePositions(positionUpdates, false);

    // Update all connected lines after positions are updated
    updateMultipleConnectedLines(movedElementIds);
  }, [elementId, zoom, gridEnabled, getElementById, updatePosition, cleanup, startDragging]);

  // Mouse up handler
  const handleMouseUp = useCallback((e: MouseEvent) => {
    // Clear long press timer if it exists
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    if (!isDraggingRef.current) {
      // Re-enable text selection
      document.body.style.userSelect = '';
      // Remove event listeners even if not dragging
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('keydown', handleKeyDown);
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    // Check if dropping onto a board
    const { dropTargetBoardId: targetBoardId, isDropReady: readyToDrop } = useDragStore.getState();
    if (targetBoardId && readyToDrop) {
      // Move all selected elements to the target board
      const { updateElement, selectedIds: currentSelectedIds } = useElementStore.getState();
      const elementsToMove = currentSelectedIds.length > 0 ? currentSelectedIds : [elementId];

      elementsToMove.forEach((id, index) => {
        updateElement(id, {
          boardId: targetBoardId,
          position: { x: 100 + (index * 20), y: 100 + (index * 20) } // Offset each element
        });
      });
    }

    cleanup();

    // Remove all event listeners
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.removeEventListener('keydown', handleKeyDown);
  }, [cleanup, handleMouseMove, elementId]);

  // Keyboard handler for Escape key
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && isDraggingRef.current) {
      e.preventDefault();
      e.stopPropagation();

      cleanup();

      // Remove all event listeners
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('keydown', handleKeyDown);
    }
  }, [cleanup, handleMouseMove, handleMouseUp]);

  // Mouse down handler to start dragging
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Only start drag on left click
    if (e.button !== 0) return;

    // Don't drag when clicking on interactive elements or inside editable content
    const target = e.target as HTMLElement;
    if (
      target.closest('button') ||
      target.closest('input') ||
      target.closest('textarea') ||
      target.closest('.ProseMirror') ||
      target.closest('a') ||
      target.closest('[contenteditable="true"]')
    ) {
      return;
    }

    const element = getElementById(elementId);
    if (!element || element.locked) return;

    e.stopPropagation();
    e.preventDefault(); // Prevent text selection

    // Store whether Ctrl/Cmd key is pressed for multi-selection
    isMultiSelectRef.current = e.ctrlKey || e.metaKey;

    // Store initial position for potential drag
    startPosRef.current = { x: e.clientX, y: e.clientY };
    hasMovedRef.current = false;

    // Disable text selection immediately
    document.body.style.userSelect = 'none';

    // Add event listeners immediately to track movement
    document.addEventListener('mousemove', handleMouseMove, { passive: false });
    document.addEventListener('mouseup', handleMouseUp, { passive: false });
    document.addEventListener('keydown', handleKeyDown, { passive: false });

    // Initialize current mouse position
    currentMousePosRef.current = { x: e.clientX, y: e.clientY };

    // If element is in a column, require long press (500ms)
    // Otherwise, wait for mouse movement to start drag (allows click to work)
    if (parentColumnId) {
      // Long press timer for elements in columns - don't prevent default
      longPressTimerRef.current = window.setTimeout(() => {
        longPressTimerRef.current = null;
        if (!hasMovedRef.current) {
          // Use current mouse position, not the original click position
          startDragging(currentMousePosRef.current.x, currentMousePosRef.current.y);
        }
      }, 500);
    } else {
      // Canvas elements: drag starts on mouse movement (see handleMouseMove)
      // Don't call startDragging here - let onClick work first
      // Dragging will be triggered in handleMouseMove if mouse moves > 3px
    }
  }, [elementId, parentColumnId, getElementById, handleMouseMove, handleMouseUp, handleKeyDown]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isDraggingRef.current) {
        cleanup();
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, [cleanup, handleMouseMove, handleMouseUp, handleKeyDown]);

  return {
    handleMouseDown,
    isDragging: isDraggingRef.current,
    hasMoved: hasMovedRef.current
  };
}
