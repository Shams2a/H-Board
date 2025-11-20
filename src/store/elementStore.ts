/**
 * Element Store
 * Manages canvas elements state and operations
 */

import { create } from 'zustand';
import type { Element, Position, Size } from '../types';
import { elementOperations } from '../utils/db';
import { newSyncService } from '../services/supabase/newSyncService';
import { useHistoryStore } from './historyStore';

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
  updatePosition: (id: string, position: Position, skipLineUpdate?: boolean) => Promise<void>;
  updateSize: (id: string, size: Size) => Promise<void>;
  updateConnectedLines: (elementId: string) => Promise<void>;
  updateMultipleConnectedLines: (elementIds: string[]) => Promise<void>;

  // Getters
  getSelectedElements: () => Element[];
  getElementById: (id: string) => Element | undefined;

  // History
  pushToHistory: () => void;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
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
      const allElements = await elementOperations.getByBoard(boardId);
      // Filter out soft-deleted elements
      const elements = allElements.filter(el => !el.deletedAt);
      set({ elements, loading: false, selectedIds: [] });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load elements',
        loading: false
      });
    }
  },

  createElement: async (element: Element) => {
    // Push current state to history before creating
    get().pushToHistory();

    set({ loading: true, error: null });
    try {
      const id = await elementOperations.create(element);

      // Queue sync operation
      newSyncService.syncAll().catch(() => {});

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

      // Get updated element for sync
      const updatedElement = await elementOperations.getById(id);
      if (updatedElement) {
        newSyncService.syncAll().catch(() => {});
      }

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
    // Push current state to history before deleting
    get().pushToHistory();

    try {
      // Soft delete - set deletedAt instead of hard delete
      const deletedAt = new Date();
      await elementOperations.update(id, {
        deletedAt,
        updatedAt: deletedAt
      });

      // Queue sync operation
      newSyncService.syncAll().catch(() => {});

      // Remove from local state
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
    // Push current state to history before deleting
    get().pushToHistory();

    try {
      // Soft delete - set deletedAt for all elements
      const deletedAt = new Date();
      for (const id of ids) {
        await elementOperations.update(id, {
          deletedAt,
          updatedAt: deletedAt
        });
      }

      // Queue sync operation once
      newSyncService.syncAll().catch(() => {});

      // Remove from local state
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

  updatePosition: async (id: string, position: Position, skipLineUpdate = false) => {
    const element = get().getElementById(id);
    if (!element) return;

    await get().updateElement(id, { position });

    // Update connected lines only if not skipped
    if (!skipLineUpdate) {
      await get().updateConnectedLines(id);
    }
  },

  // Helper function to update lines connected to an element
  updateConnectedLines: async (elementId: string) => {
    const { elements, updateElement } = get();
    const movedElement = elements.find(el => el.id === elementId);
    if (!movedElement) return;

    // Check if the element is in a column
    const parentColumn = elements.find(
      el => el.type === 'column' && el.content.childrenIds?.includes(elementId)
    );

    // Calculate connection point (center of element or parent column)
    const getConnectionPoint = (): Position => {
      if (parentColumn) {
        // If element is in a column, point to column center
        return {
          x: parentColumn.position.x + parentColumn.size.width / 2,
          y: parentColumn.position.y + parentColumn.size.height / 2
        };
      } else {
        // Otherwise, point to element center
        return {
          x: movedElement.position.x + movedElement.size.width / 2,
          y: movedElement.position.y + movedElement.size.height / 2
        };
      }
    };

    const connectionPoint = getConnectionPoint();

    // Find all lines connected to this element
    const connectedLines = elements.filter(
      el => el.type === 'line' && (
        el.content.startElementId === elementId ||
        el.content.endElementId === elementId
      )
    );

    // Update each connected line
    for (const line of connectedLines) {
      const updates: any = { content: { ...line.content } };

      if (line.content.startElementId === elementId) {
        updates.content.startPoint = connectionPoint;
      }
      if (line.content.endElementId === elementId) {
        updates.content.endPoint = connectionPoint;
      }

      await updateElement(line.id, updates);
    }
  },

  // Update lines connected to multiple elements (for multi-element drag)
  updateMultipleConnectedLines: async (elementIds: string[]) => {
    const { elements, updateElement } = get();
    const elementIdSet = new Set(elementIds);

    // Helper to get connection point for an element
    const getConnectionPointForElement = (elementId: string): Position | null => {
      const element = elements.find(el => el.id === elementId);
      if (!element) return null;

      // Check if the element is in a column
      const parentColumn = elements.find(
        el => el.type === 'column' && el.content.childrenIds?.includes(elementId)
      );

      if (parentColumn) {
        return {
          x: parentColumn.position.x + parentColumn.size.width / 2,
          y: parentColumn.position.y + parentColumn.size.height / 2
        };
      } else {
        return {
          x: element.position.x + element.size.width / 2,
          y: element.position.y + element.size.height / 2
        };
      }
    };

    // Find all lines connected to any of these elements
    const connectedLines = elements.filter(
      el => el.type === 'line' && (
        (el.content.startElementId && elementIdSet.has(el.content.startElementId)) ||
        (el.content.endElementId && elementIdSet.has(el.content.endElementId))
      )
    );

    // Update each connected line
    for (const line of connectedLines) {
      const updates: any = { content: { ...line.content } };
      let hasUpdate = false;

      if (line.content.startElementId && elementIdSet.has(line.content.startElementId)) {
        const connectionPoint = getConnectionPointForElement(line.content.startElementId);
        if (connectionPoint) {
          updates.content.startPoint = connectionPoint;
          hasUpdate = true;
        }
      }
      if (line.content.endElementId && elementIdSet.has(line.content.endElementId)) {
        const connectionPoint = getConnectionPointForElement(line.content.endElementId);
        if (connectionPoint) {
          updates.content.endPoint = connectionPoint;
          hasUpdate = true;
        }
      }

      if (hasUpdate) {
        await updateElement(line.id, updates);
      }
    }
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
  },

  // History functions
  pushToHistory: () => {
    const { elements } = get();
    useHistoryStore.getState().pushState(elements);
  },

  undo: async () => {
    const historyStore = useHistoryStore.getState();
    if (!historyStore.canUndo()) return;

    const { elements } = get();
    const previousElements = historyStore.undo(elements);
    if (previousElements) {
      // Update local state
      set({ elements: previousElements });
    }
  },

  redo: async () => {
    const historyStore = useHistoryStore.getState();
    if (!historyStore.canRedo()) return;

    const { elements } = get();
    const nextElements = historyStore.redo(elements);
    if (nextElements) {
      // Update local state
      set({ elements: nextElements });
    }
  }
}));
