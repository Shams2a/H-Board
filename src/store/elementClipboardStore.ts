/**
 * Element Clipboard & Selection Store
 * Clipboard and selection operations for canvas elements.
 *
 * These are extracted action creators and selectors that work with
 * the main ElementState. The main elementStore delegates to these.
 */

import { generateId } from '../utils/uuid';
import type { Element, Position } from '../types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ClipboardSliceState {
  selectedIds: string[];
  clipboard: Element[];
}

export const clipboardInitialState: ClipboardSliceState = {
  selectedIds: [],
  clipboard: [],
};

// ---------------------------------------------------------------------------
// Action creators
// These return partial-state objects (or mutate via set/get) just like
// Zustand actions.  The main store wires them up.
// ---------------------------------------------------------------------------

/** Build the clipboard/selection actions for the main store's `create` call. */
export function createClipboardActions(
  set: (partial: any) => void,
  get: () => any,
) {
  return {
    selectElement: (id: string, multi = false) => {
      set((state: any) => {
        if (multi) {
          if (state.selectedIds.includes(id)) {
            return { selectedIds: state.selectedIds.filter((sid: string) => sid !== id) };
          } else {
            return { selectedIds: [...state.selectedIds, id] };
          }
        } else {
          return { selectedIds: [id] };
        }
      });
    },

    deselectElement: (id: string) => {
      set((state: any) => ({
        selectedIds: state.selectedIds.filter((sid: string) => sid !== id),
      }));
    },

    clearSelection: () => {
      set({ selectedIds: [] });
    },

    selectAll: () => {
      set((state: any) => ({
        selectedIds: state.elements.map((el: Element) => el.id),
      }));
    },

    copy: () => {
      const { elements, selectedIds } = get();
      const selectedElements = elements.filter((el: Element) => selectedIds.includes(el.id));
      set({ clipboard: selectedElements });
    },

    cut: () => {
      get().copy();
      const { selectedIds } = get();
      get().deleteElements(selectedIds);
    },

    paste: async (position?: Position) => {
      const { clipboard } = get();
      if (clipboard.length === 0) return;

      const offset = position || { x: 20, y: 20 };

      for (const element of clipboard) {
        const newElement: Element = {
          ...element,
          id: generateId(),
          position: {
            x: element.position.x + offset.x,
            y: element.position.y + offset.y,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await get().createElement(newElement);
      }
    },

    duplicate: async (ids: string[]) => {
      const { elements } = get();
      const elementsToDuplicate = elements.filter((el: Element) => ids.includes(el.id));

      for (const element of elementsToDuplicate) {
        const newElement: Element = {
          ...element,
          id: generateId(),
          position: {
            x: element.position.x + 20,
            y: element.position.y + 20,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await get().createElement(newElement);
      }
    },

    getSelectedElements: () => {
      const { elements, selectedIds } = get();
      return elements.filter((el: Element) => selectedIds.includes(el.id));
    },
  };
}

// ---------------------------------------------------------------------------
// Selectors  (operate on the MAIN ElementState – same shape as before)
// ---------------------------------------------------------------------------

export const selectSelectedIds = (state: { selectedIds: string[] }) => state.selectedIds;
export const selectClipboard = (state: { clipboard: Element[] }) => state.clipboard;
