/**
 * Element Store
 * Manages canvas elements state and operations
 *
 * Clipboard/selection logic lives in ./elementClipboardStore.ts
 * Reference/re-use logic lives in ./elementReferenceStore.ts
 * Both are re-exported here for backward compatibility.
 */

import { create } from 'zustand';
import type { Element, Position, Size, LineElement, LineContent } from '../types';
import { elementOperations } from '../utils/db';
import { useHistoryStore } from './historyStore';
import { getCollaborationService } from '../services/collaboration/collaborationService';
import { logger } from '../utils/logger';

// Extracted slices
import {
  clipboardInitialState,
  createClipboardActions,
} from './elementClipboardStore';
import {
  referenceInitialState,
  createReferenceActions,
} from './elementReferenceStore';

// Re-export selectors from extracted files for backward compatibility
export {
  selectSelectedIds,
  selectClipboard,
} from './elementClipboardStore';
export {
  selectDraggedElementId,
  selectDraggedFromColumnId,
} from './elementReferenceStore';

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
  loading: false,
  error: null,

  // Clipboard & selection initial state
  ...clipboardInitialState,

  // Reference initial state
  ...referenceInitialState,

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
        logger.debug('Broadcasted element_created:', element.id);
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
    logger.debug('updateElement called:', { id, updates });

    try {
      // Get the element to check if it's a reference
      const element = get().getElementById(id);

      // Instance-specific properties that should stay on the reference
      const instanceProps = ['position', 'size', 'zIndex', 'parentId', 'boardId', 'locked'];

      // If this is a reference (has sourceElementId), split the updates
      if (element && element.sourceElementId) {
        logger.debug('Element is a reference, redirecting content updates to source:', element.sourceElementId);

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
          logger.debug('Updating source element:', sourceId, contentUpdates);
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
              logger.debug('Broadcasted source element_updated:', sourceId);
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
      logger.debug('Got updated element from DB:', updatedElement);

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
          logger.debug('Broadcasted element_updated:', { id, elementType: updatedElement.type });
        } catch (err) {
          console.warn('Failed to broadcast element update:', err);
        }
      } else {
        console.warn('Could not get updated element from DB for broadcasting');
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
    logger.debug('deleteElement called:', { id });

    // Push current state to history before deleting
    get().pushToHistory();

    try {
      // Soft delete - set deletedAt instead of hard delete
      const deletedAt = new Date();
      await elementOperations.update(id, {
        deletedAt,
        updatedAt: deletedAt
      });
      logger.debug('Element soft-deleted in DB:', id);

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
        logger.debug('Broadcasted element_deleted:', id);
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
    logger.debug('deleteElements called:', { ids, count: ids.length });

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
      logger.debug(`${ids.length} elements soft-deleted in DB`);

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
        logger.debug('Broadcasted elements_deleted (batch):', ids.length, 'elements');
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

  // --- Clipboard & Selection (delegated to extracted slice) ---
  ...createClipboardActions(set, get),

  // --- Z-index ---
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

  // --- Position & Size ---
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

    logger.debug(`batchUpdatePositions: ${updates.size} elements, persistToDB: ${persistToDB}`);

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

      updates.forEach((position, id) => {
        // Update in IndexedDB
        updatePromises.push(elementOperations.update(id, { position }));
      });
      await Promise.all(updatePromises);

      // Broadcast position updates for real-time collaboration
      try {
        const collabService = getCollaborationService();
        for (const [id, _position] of updates.entries()) {
          const element = await elementOperations.getById(id);
          if (element) {
            collabService.broadcast({
              type: 'element_updated',
              payload: element,
              userId: '',
              timestamp: Date.now()
            });
            logger.debug('Broadcasted position update:', id);
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
    // Exclude lines that are themselves being dragged (they manage their own position)
    const connectedLines = elements.filter(
      (el): el is LineElement => {
        if (el.type !== 'line') return false;
        if (elementIdSet.has(el.id)) return false; // Skip lines being dragged
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

  getElementById: (id: string) => {
    return get().elements.find(el => el.id === id);
  },

  // --- Reference / re-use (delegated to extracted slice) ---
  ...createReferenceActions(set, get),

  // --- History ---
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
}));

// Selectors
type ElementStoreState = ReturnType<typeof useElementStore.getState>;
export const selectElements = (state: ElementStoreState) => state.elements;
export const selectElementById = (id: string) => (state: ElementStoreState) =>
  state.elements.find(el => el.id === id);
export const selectElementsByBoard = (boardId: string) => (state: ElementStoreState) =>
  state.elements.filter(el => el.boardId === boardId);
