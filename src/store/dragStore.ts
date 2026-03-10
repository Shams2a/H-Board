/**
 * Drag Store
 * Manages drag and drop state for elements
 */

import { create } from 'zustand';

interface DragState {
  draggedElementId: string | null;
  draggedFromColumnId: string | null;
  justFinishedDrag: boolean;
  dropTargetBoardId: string | null;
  isDropReady: boolean;
  setDraggedElement: (elementId: string | null, fromColumnId?: string | null) => void;
  clearDrag: () => void;
  setJustFinishedDrag: (value: boolean) => void;
  setDropTargetBoard: (boardId: string | null) => void;
  setDropReady: (ready: boolean) => void;
}

export const useDragStore = create<DragState>((set) => ({
  draggedElementId: null,
  draggedFromColumnId: null,
  justFinishedDrag: false,
  dropTargetBoardId: null,
  isDropReady: false,

  setDraggedElement: (elementId, fromColumnId = null) =>
    set({ draggedElementId: elementId, draggedFromColumnId: fromColumnId }),

  clearDrag: () =>
    set({ draggedElementId: null, draggedFromColumnId: null, dropTargetBoardId: null, isDropReady: false }),

  setJustFinishedDrag: (value) =>
    set({ justFinishedDrag: value }),

  setDropTargetBoard: (boardId) =>
    set({ dropTargetBoardId: boardId, isDropReady: false }),

  setDropReady: (ready) =>
    set({ isDropReady: ready })
}));

// Selectors
type DragStoreState = ReturnType<typeof useDragStore.getState>;
export const selectDraggedItem = (state: DragStoreState) => ({
  elementId: state.draggedElementId,
  fromColumnId: state.draggedFromColumnId,
});
export const selectIsDragging = (state: DragStoreState) => state.draggedElementId !== null;
