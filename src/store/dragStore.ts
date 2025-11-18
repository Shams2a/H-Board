/**
 * Drag Store
 * Manages drag and drop state for elements
 */

import { create } from 'zustand';

interface DragState {
  draggedElementId: string | null;
  draggedFromColumnId: string | null;
  setDraggedElement: (elementId: string | null, fromColumnId?: string | null) => void;
  clearDrag: () => void;
}

export const useDragStore = create<DragState>((set) => ({
  draggedElementId: null,
  draggedFromColumnId: null,

  setDraggedElement: (elementId, fromColumnId = null) =>
    set({ draggedElementId: elementId, draggedFromColumnId: fromColumnId }),

  clearDrag: () =>
    set({ draggedElementId: null, draggedFromColumnId: null })
}));
