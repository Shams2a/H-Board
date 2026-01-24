/**
 * Element Store
 * Manages canvas elements state and operations
 */

import { create } from 'zustand';
import { generateId } from '../utils/uuid';
import type { Element, Position, Size, LineElement, LineContent } from '../types';
import { elementOperations } from '../utils/db';
import { newSyncService } from '../services/supabase/newSyncService';
import { useHistoryStore } from './historyStore';
import { getCollaborationService } from '../services/collaboration/collaborationService';

interface ElementState {
  elements: Element[];
  selectedIds: string[];
  clipboard: Element[];
  loading: boolean;
  error: string | null;
  // Re-use system
  pendingReusableElementId: string | null; // Element marked for re-use

  // Actions
  setElements: (elementsOrUpdater: Element[] | ((prev: Element[]) => Element[])) => void;
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
  batchUpdatePositions: (updates: Map<string, Position>, persistToDB?: boolean) => Promise<void>;
  updateSize: (id: string, size: Size) => Promise<void>;
  updateConnectedLines: (elementId: string) => Promise<void>;
  updateMultipleConnectedLines: (elementIds: string[]) => Promise<void>;

  // Re-use system
  markAsReusable: (id: string) => Promise<void>;
  createReference: (sourceElementId: string, position: Position, boardId: string) => Promise<string>;
  resolveElement: (id: string) => Element | undefined;

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
  pendingReusableElementId: null,

  setElements: (elementsOrUpdater) => {
    set((state) => ({
      elements: typeof elementsOrUpdater === 'function'
        ? elementsOrUpdater(state.elements)
        : elementsOrUpdater
    }));
  },

  loadElements: async (boardId: string) => {
    set({ loading: true, error: null });
    try {
      const allElements = await elementOperations.getByBoard(boardId);
      // Filter out soft-deleted elements
      const elements = allElements.filter(el => !el.deletedAt);

      // Load source elements for any references (even if they're on other boards)
      const sourceElementIds = new Set<string>();
      elements.forEach(el => {
        if (el.sourceElementId) {
          sourceElementIds.add(el.sourceElementId);
        }
      });

      // Fetch source elements and add them to the elements array
      const sourceElements: Element[] = [];
      for (const sourceId of sourceElementIds) {
        // Only load if not already in the elements array
        if (!elements.find(el => el.id === sourceId)) {
          try {
            const sourceEl = await elementOperations.getById(sourceId);
            if (sourceEl && !sourceEl.deletedAt) {
              sourceElements.push(sourceEl);
            }
          } catch (err) {
            console.warn(`Failed to load source element ${sourceId}:`, err);
          }
        }
      }

      // Combine board elements with source elements
      const allLoadedElements = [...elements, ...sourceElements];

      // Preserve selection for elements that still exist
      const currentSelectedIds = get().selectedIds;
      const elementIds = new Set(allLoadedElements.map(el => el.id));
      const preservedSelection = currentSelectedIds.filter(id => elementIds.has(id));

      set({ elements: allLoadedElements, loading: false, selectedIds: preservedSelection });
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

      // DON'T sync immediately - it causes conflicts with download overwriting local changes
      // The periodic sync will handle Supabase sync later
      // newSyncService.syncAll().catch(() => {});

      // Broadcast element creation for real-time collaboration
      try {
        const collabService = getCollaborationService();
        collabService.broadcast({
          type: 'element_created',
          payload: element,
          userId: '', // Will be set by service
          timestamp: Date.now()
        });
        console.log('🔊 Broadcasted element_created:', element.id);
      } catch (err) {
        console.warn('Failed to broadcast element creation:', err);
      }

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
    console.log('🔧 updateElement called:', { id, updates });

    try {
      // Get the element to check if it's a reference
      const element = get().getElementById(id);

      // Instance-specific properties that should stay on the reference
      const instanceProps = ['position', 'size', 'zIndex', 'parentId', 'boardId', 'locked'];

      // If this is a reference (has sourceElementId), split the updates
      if (element && element.sourceElementId) {
        console.log('📎 Element is a reference, redirecting content updates to source:', element.sourceElementId);

        // Separate instance updates from content updates
        const instanceUpdates: Partial<Element> = {};
        const contentUpdates: Partial<Element> = {};

        Object.keys(updates).forEach(key => {
          const k = key as keyof Element;
          if (instanceProps.includes(key)) {
            (instanceUpdates as Record<string, unknown>)[key] = updates[k];
          } else {
            (contentUpdates as Record<string, unknown>)[key] = updates[k];
          }
        });

        // Apply instance updates to the reference itself
        if (Object.keys(instanceUpdates).length > 0) {
          await elementOperations.update(id, instanceUpdates);
          // @ts-ignore
          set(state => ({
            elements: state.elements.map(el =>
              el.id === id ? { ...el, ...instanceUpdates, updatedAt: new Date() } : el
            )
          }));
        }

        // Apply content updates to the source element
        if (Object.keys(contentUpdates).length > 0) {
          const sourceId = element.sourceElementId;
          console.log('🎯 Updating source element:', sourceId, contentUpdates);
          await elementOperations.update(sourceId, contentUpdates);

          // Update source in store (this will trigger re-render of all references)
          // @ts-ignore
          set(state => ({
            elements: state.elements.map(el =>
              el.id === sourceId ? { ...el, ...contentUpdates, updatedAt: new Date() } : el
            )
          }));

          // Broadcast source update
          const updatedSource = await elementOperations.getById(sourceId);
          if (updatedSource) {
            try {
              const collabService = getCollaborationService();
              collabService.broadcast({
                type: 'element_updated',
                payload: updatedSource,
                userId: '',
                timestamp: Date.now()
              });
              console.log('🔊 Broadcasted source element_updated:', sourceId);
            } catch (err) {
              console.warn('Failed to broadcast source update:', err);
            }
          }
        }

        return;
      }

      // Normal update for non-reference elements
      await elementOperations.update(id, updates);

      // Get updated element for sync and broadcast
      const updatedElement = await elementOperations.getById(id);
      console.log('📖 Got updated element from DB:', updatedElement);

      if (updatedElement) {
        // DON'T sync immediately - it causes conflicts with download overwriting local changes
        // The periodic sync will handle Supabase sync later
        // newSyncService.syncAll().catch(() => {});

        // Broadcast element update for real-time collaboration
        try {
          const collabService = getCollaborationService();
          collabService.broadcast({
            type: 'element_updated',
            payload: updatedElement,
            userId: '',
            timestamp: Date.now()
          });
          console.log('🔊 Broadcasted element_updated:', { id, elementType: updatedElement.type });
        } catch (err) {
          console.warn('Failed to broadcast element update:', err);
        }
      } else {
        console.warn('⚠️ Could not get updated element from DB for broadcasting');
      }

      // @ts-ignore - Complex union type inference
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
    console.log('🗑️ deleteElement called:', { id });

    // Push current state to history before deleting
    get().pushToHistory();

    try {
      // Soft delete - set deletedAt instead of hard delete
      const deletedAt = new Date();
      await elementOperations.update(id, {
        deletedAt,
        updatedAt: deletedAt
      });
      console.log('✅ Element soft-deleted in DB:', id);

      // DON'T sync immediately - it causes conflicts with download overwriting local changes
      // The periodic sync will handle Supabase sync later
      // newSyncService.syncAll().catch(() => {});

      // Broadcast element deletion for real-time collaboration
      try {
        const collabService = getCollaborationService();
        collabService.broadcast({
          type: 'element_deleted',
          payload: { id },
          userId: '',
          timestamp: Date.now()
        });
        console.log('🔊 Broadcasted element_deleted:', id);
      } catch (err) {
        console.warn('Failed to broadcast element deletion:', err);
      }

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
    console.log('🗑️ deleteElements called:', { ids, count: ids.length });

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
      console.log(`✅ ${ids.length} elements soft-deleted in DB`);

      // DON'T sync immediately - it causes conflicts with download overwriting local changes
      // The periodic sync will handle Supabase sync later
      // newSyncService.syncAll().catch(() => {});

      // Broadcast element deletions for real-time collaboration (batched)
      try {
        const collabService = getCollaborationService();
        // Send a single broadcast with all deleted IDs instead of one per element
        collabService.broadcast({
          type: 'elements_deleted',  // plural for batch operation
          payload: { ids },
          userId: '',
          timestamp: Date.now()
        });
        console.log('🔊 Broadcasted elements_deleted (batch):', ids.length, 'elements');
      } catch (err) {
        console.warn('Failed to broadcast element deletions:', err);
      }

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
        id: generateId(),
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
        id: generateId(),
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

  // Batch update positions - optimized for drag operations
  batchUpdatePositions: async (updates: Map<string, Position>, persistToDB = false) => {
    if (updates.size === 0) return;

    console.log(`📍 batchUpdatePositions: ${updates.size} elements, persistToDB: ${persistToDB}`);

    // Single state update for all elements
    set(state => ({
      elements: state.elements.map(el => {
        const newPosition = updates.get(el.id);
        if (newPosition) {
          return { ...el, position: newPosition, updatedAt: new Date() };
        }
        return el;
      })
    }));

    // Only persist to DB when drag ends (not during drag)
    if (persistToDB) {
      const updatePromises: Promise<any>[] = [];
      const broadcastPromises: Promise<void>[] = [];

      updates.forEach((position, id) => {
        // Update in IndexedDB
        updatePromises.push(elementOperations.update(id, { position }));
      });
      await Promise.all(updatePromises);

      // Broadcast position updates for real-time collaboration
      try {
        const collabService = getCollaborationService();
        for (const [id, position] of updates.entries()) {
          const element = await elementOperations.getById(id);
          if (element) {
            collabService.broadcast({
              type: 'element_updated',
              payload: element,
              userId: '',
              timestamp: Date.now()
            });
            console.log('🔊 Broadcasted position update:', id);
          }
        }
      } catch (err) {
        console.warn('Failed to broadcast position updates:', err);
      }

      // DON'T sync immediately - periodic sync will handle it
      // newSyncService.syncAll().catch(() => {});
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
      (el): el is LineElement => {
        if (el.type !== 'line') return false;
        const content = el.content as LineContent;
        return content.startElementId === elementId || content.endElementId === elementId;
      }
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
      (el): el is LineElement => {
        if (el.type !== 'line') return false;
        const content = el.content as LineContent;
        return !!(content.startElementId && elementIdSet.has(content.startElementId)) ||
               !!(content.endElementId && elementIdSet.has(content.endElementId));
      }
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
  },

  // Re-use system implementation
  markAsReusable: async (id: string) => {
    // Mark element as reusable and store its ID for pending re-use
    await get().updateElement(id, { isReusable: true });
    set({ pendingReusableElementId: id });

    // Broadcast to collaboration service
    const collaborationService = getCollaborationService();
    if (collaborationService && collaborationService.isInitialized()) {
      collaborationService.broadcast({
        type: 'element_marked_reusable',
        payload: { elementId: id },
        userId: 'current-user', // TODO: Get from auth context
        timestamp: Date.now()
      });
    }
  },

  createReference: async (sourceElementId: string, position: Position, boardId: string) => {
    // Try to get from current store first
    let sourceElement = get().getElementById(sourceElementId);

    // If not found in store, load from database (might be on a different board)
    if (!sourceElement) {
      try {
        sourceElement = await elementOperations.getById(sourceElementId);
      } catch (error) {
        throw new Error('Source element not found in database');
      }
    }

    if (!sourceElement) {
      throw new Error('Source element not found');
    }

    // Create new element that references the source
    const referenceElement: Element = {
      ...sourceElement,
      id: generateId(),
      boardId,
      position,
      sourceElementId,
      isReusable: false, // References themselves are not reusable
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const newId = await get().createElement(referenceElement);

    // Clear pending state
    set({ pendingReusableElementId: null });

    // Broadcast creation
    const collaborationService = getCollaborationService();
    if (collaborationService && collaborationService.isInitialized()) {
      collaborationService.broadcast({
        type: 'element_reference_created',
        payload: {
          sourceElementId,
          referenceElementId: newId,
          boardId
        },
        userId: 'current-user', // TODO: Get from auth context
        timestamp: Date.now()
      });
    }

    return newId;
  },

  resolveElement: (id: string) => {
    const element = get().getElementById(id);
    if (!element) return undefined;

    // If element is a reference, resolve it
    if (element.sourceElementId) {
      const sourceElement = get().getElementById(element.sourceElementId);
      if (sourceElement) {
        // Merge: source content + reference position/size/boardId
        return {
          ...sourceElement,
          id: element.id,
          boardId: element.boardId,
          position: element.position,
          size: element.size,
          zIndex: element.zIndex,
          parentId: element.parentId,
          sourceElementId: element.sourceElementId
        } as Element;
      }
    }

    return element;
  }
}));