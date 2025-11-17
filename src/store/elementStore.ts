/**
 * Element Store
 * Manages canvas elements state and operations
 */

import { create } from 'zustand';
import type { Element, Position, Size } from '../types';
import { elementOperations } from '../utils/db';

interface ElementState {
  elements: Element[];
  selectedIds: string[];
  clipboard: Element[];
  loading: boolean;
  error: string | null;

  // Actions
  loadElements: (boardId: string) => Promise<void>;
  createElement: (element: Element) => Promise<string>;
  updateElement: (id: string, updates: Partial<Element>) => Promise<void>;
  deleteElement: (id: string) => Promise<void>;
  deleteElements: (ids: string[]) => Promise<void>;

  // Selection
  selectElement: (id: string, multi?: boolean) => void;
  deselectElement: (id: string) => void;
  clearSelection: () => void;
  selectAll: () => void;

  // Clipboard
  copy: () => void;
  cut: () => void;
  paste: (position?: Position) => Promise<void>;
  duplicate: (ids: string[]) => Promise<void>;

  // Z-index
  bringToFront: (id: string) => Promise<void>;
  sendToBack: (id: string) => Promise<void>;

  // Position & Size
  updatePosition: (id: string, position: Position) => Promise<void>;
  updateSize: (id: string, size: Size) => Promise<void>;

  // Getters
  getSelectedElements: () => Element[];
  getElementById: (id: string) => Element | undefined;
}

export const useElementStore = create<ElementState>((set, get) => ({
  elements: [],
  selectedIds: [],
  clipboard: [],
  loading: false,
  error: null,

  loadElements: async (boardId: string) => {
    set({ loading: true, error: null });
    try {
      const elements = await elementOperations.getByBoard(boardId);
      set({ elements, loading: false, selectedIds: [] });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load elements',
        loading: false
      });
    }
  },

  createElement: async (element: Element) => {
    set({ loading: true, error: null });
    try {
      const id = await elementOperations.create(element);
      set(state => ({
        elements: [...state.elements, element],
        loading: false
      }));
      return id as string;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create element',
        loading: false
      });
      throw error;
    }
  },

  updateElement: async (id: string, updates: Partial<Element>) => {
    try {
      await elementOperations.update(id, updates);
      set(state => ({
        elements: state.elements.map(el =>
          el.id === id ? { ...el, ...updates, updatedAt: new Date() } : el
        )
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update element'
      });
      throw error;
    }
  },

  deleteElement: async (id: string) => {
    try {
      await elementOperations.delete(id);
      set(state => ({
        elements: state.elements.filter(el => el.id !== id),
        selectedIds: state.selectedIds.filter(selectedId => selectedId !== id)
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete element'
      });
      throw error;
    }
  },

  deleteElements: async (ids: string[]) => {
    try {
      await elementOperations.bulkDelete(ids);
      set(state => ({
        elements: state.elements.filter(el => !ids.includes(el.id)),
        selectedIds: state.selectedIds.filter(id => !ids.includes(id))
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete elements'
      });
      throw error;
    }
  },

  selectElement: (id: string, multi = false) => {
    set(state => {
      if (multi) {
        // Toggle selection in multi-select mode
        if (state.selectedIds.includes(id)) {
          return { selectedIds: state.selectedIds.filter(selectedId => selectedId !== id) };
        } else {
          return { selectedIds: [...state.selectedIds, id] };
        }
      } else {
        // Single selection
        return { selectedIds: [id] };
      }
    });
  },

  deselectElement: (id: string) => {
    set(state => ({
      selectedIds: state.selectedIds.filter(selectedId => selectedId !== id)
    }));
  },

  clearSelection: () => {
    set({ selectedIds: [] });
  },

  selectAll: () => {
    set(state => ({
      selectedIds: state.elements.map(el => el.id)
    }));
  },

  copy: () => {
    const { elements, selectedIds } = get();
    const selectedElements = elements.filter(el => selectedIds.includes(el.id));
    set({ clipboard: selectedElements });
  },

  cut: () => {
    get().copy();
    const { selectedIds } = get();
    get().deleteElements(selectedIds);
  },

  paste: async (position?: Position) => {
    const { clipboard, elements } = get();
    if (clipboard.length === 0) return;

    // Calculate offset for pasted elements
    const offset = position || { x: 20, y: 20 };

    for (const element of clipboard) {
      const newElement: Element = {
        ...element,
        id: crypto.randomUUID(),
        position: {
          x: element.position.x + offset.x,
          y: element.position.y + offset.y
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await get().createElement(newElement);
    }
  },

  duplicate: async (ids: string[]) => {
    const { elements } = get();
    const elementsToDuplicate = elements.filter(el => ids.includes(el.id));

    for (const element of elementsToDuplicate) {
      const newElement: Element = {
        ...element,
        id: crypto.randomUUID(),
        position: {
          x: element.position.x + 20,
          y: element.position.y + 20
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await get().createElement(newElement);
    }
  },

  bringToFront: async (id: string) => {
    try {
      await elementOperations.bringToFront(id);
      const element = get().elements.find(el => el.id === id);
      if (element) {
        const maxZ = Math.max(...get().elements.map(el => el.zIndex));
        set(state => ({
          elements: state.elements.map(el =>
            el.id === id ? { ...el, zIndex: maxZ + 1 } : el
          )
        }));
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to bring to front'
      });
    }
  },

  sendToBack: async (id: string) => {
    try {
      await elementOperations.sendToBack(id);
      set(state => ({
        elements: state.elements.map(el =>
          el.id === id ? { ...el, zIndex: 0 } : { ...el, zIndex: el.zIndex + 1 }
        )
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to send to back'
      });
    }
  },

  updatePosition: async (id: string, position: Position) => {
    await get().updateElement(id, { position });
  },

  updateSize: async (id: string, size: Size) => {
    await get().updateElement(id, { size });
  },

  getSelectedElements: () => {
    const { elements, selectedIds } = get();
    return elements.filter(el => selectedIds.includes(el.id));
  },

  getElementById: (id: string) => {
    return get().elements.find(el => el.id === id);
  }
}));
