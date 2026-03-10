/**
 * Element Reference / Re-use Store
 * Manages the reference/re-use system for canvas elements.
 *
 * These are extracted action creators and selectors that work with
 * the main ElementState. The main elementStore delegates to these.
 */

import { generateId } from '../utils/uuid';
import type { Element, Position } from '../types';
import { elementOperations } from '../utils/db';
import { getCollaborationService } from '../services/collaboration/collaborationService';
import { useAuthStore } from './authStore';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ReferenceSliceState {
  pendingReusableElementId: string | null;
}

export const referenceInitialState: ReferenceSliceState = {
  pendingReusableElementId: null,
};

// ---------------------------------------------------------------------------
// Action creators
// ---------------------------------------------------------------------------

/** Build the reference/re-use actions for the main store's `create` call. */
export function createReferenceActions(
  set: (partial: any) => void,
  get: () => any,
) {
  return {
    markAsReusable: async (id: string) => {
      await get().updateElement(id, { isReusable: true });
      set({ pendingReusableElementId: id });

      const collaborationService = getCollaborationService();
      if (collaborationService && collaborationService.isInitialized()) {
        collaborationService.broadcast({
          type: 'element_marked_reusable',
          payload: { elementId: id },
          userId: useAuthStore.getState().user?.id || 'anonymous',
          timestamp: Date.now(),
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
        isReusable: false,
        createdAt: new Date(),
        updatedAt: new Date(),
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
            boardId,
          },
          userId: useAuthStore.getState().user?.id || 'anonymous',
          timestamp: Date.now(),
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
          return {
            ...sourceElement,
            id: element.id,
            boardId: element.boardId,
            position: element.position,
            size: element.size,
            zIndex: element.zIndex,
            parentId: element.parentId,
            sourceElementId: element.sourceElementId,
          } as Element;
        }
      }

      return element;
    },
  };
}

// ---------------------------------------------------------------------------
// Selectors (operate on the MAIN ElementState)
// ---------------------------------------------------------------------------

export const selectDraggedElementId = (state: { pendingReusableElementId: string | null }) =>
  state.pendingReusableElementId;
export const selectDraggedFromColumnId = (_state: any) => null;
