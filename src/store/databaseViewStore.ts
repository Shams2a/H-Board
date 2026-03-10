/**
 * Database View Store
 * Manages state for database views using Zustand
 */

import { create } from 'zustand';
import { generateId } from '../utils/uuid';
import type {
  DatabaseView,
  ViewType,
} from '../types';
import { supabaseDatabaseViewService } from '../services/supabase/databaseService';
import { getCollaborationService } from '../services/collaboration/collaborationService';
import { logger } from '../utils/logger';

export interface DatabaseViewState {
  views: Record<string, DatabaseView[]>; // boardId -> views
  currentViewId: Record<string, string>; // boardId -> viewId
}

export interface DatabaseViewActions {
  createView: (boardId: string, name: string, type: ViewType) => Promise<DatabaseView>;
  updateView: (id: string, updates: Partial<DatabaseView>) => Promise<void>;
  deleteView: (id: string) => Promise<void>;
  setCurrentView: (boardId: string, viewId: string) => void;

  // Remote sync
  addViewFromRemote: (view: DatabaseView) => void;
  updateViewFromRemote: (view: DatabaseView) => void;
  deleteViewFromRemote: (viewId: string) => void;

  // Load / clear
  loadViews: (boardId: string) => Promise<DatabaseView[]>;
  clearViews: (boardId: string) => void;
}

export type DatabaseViewStore = DatabaseViewState & DatabaseViewActions;

export const useDatabaseViewStore = create<DatabaseViewStore>((set, get) => ({
  views: {},
  currentViewId: {},

  createView: async (boardId: string, name: string, type: ViewType) => {
    const boardViews = get().views[boardId] || [];
    const position = boardViews.length;
    const isFirst = boardViews.length === 0;

    const newView: DatabaseView = {
      id: generateId(),
      boardId,
      name,
      type,
      config: {},
      filters: [],
      sorts: [],
      visibleProperties: [], // All properties visible by default
      position,
      isDefault: isFirst, // First view is default
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Optimistic update
    set((state) => ({
      views: {
        ...state.views,
        [boardId]: [...(state.views[boardId] || []), newView]
      },
      currentViewId: isFirst
        ? { ...state.currentViewId, [boardId]: newView.id }
        : state.currentViewId
    }));

    // Persist to Supabase
    try {
      const result = await supabaseDatabaseViewService.create(newView);
      if (!result.success) {
        console.error('Error creating view:', result.error);
        // Rollback on error
        set((state) => ({
          views: {
            ...state.views,
            [boardId]: state.views[boardId].filter((v) => v.id !== newView.id)
          }
        }));
        throw new Error(result.error);
      }

      // Broadcast view creation in real-time
      try {
        const collabService = getCollaborationService();
        collabService.broadcast({
          type: 'database_view_created',
          payload: newView,
          userId: (collabService as any).userId,
          timestamp: Date.now(),
        });
        logger.debug('Broadcast database_view_created:', newView.id);
      } catch (err) {
        console.warn('Failed to broadcast view creation:', err);
      }
    } catch (error) {
      console.error('Error persisting view:', error);
      throw error;
    }

    return newView;
  },

  updateView: async (id: string, updates: Partial<DatabaseView>) => {
    // Store old state for rollback
    const oldViews = get().views;

    // Optimistic update
    set((state) => {
      const updatedViews: Record<string, DatabaseView[]> = {};

      Object.entries(state.views).forEach(([boardId, views]) => {
        updatedViews[boardId] = views.map((view) =>
          view.id === id ? { ...view, ...updates } : view
        );
      });

      return { views: updatedViews };
    });

    // Persist to Supabase
    try {
      const result = await supabaseDatabaseViewService.update(id, updates);
      if (!result.success) {
        console.error('Error updating view:', result.error);
        // Rollback on error
        set({ views: oldViews });
        throw new Error(result.error);
      }

      // Broadcast view update in real-time
      try {
        const collabService = getCollaborationService();
        // Get the updated view from state
        let updatedView: DatabaseView | undefined;
        Object.values(get().views).forEach((views) => {
          const found = views.find((v) => v.id === id);
          if (found) updatedView = found;
        });

        if (updatedView) {
          collabService.broadcast({
            type: 'database_view_updated',
            payload: updatedView,
            userId: (collabService as any).userId,
            timestamp: Date.now(),
          });
          logger.debug('Broadcast database_view_updated:', id);
        }
      } catch (err) {
        console.warn('Failed to broadcast view update:', err);
      }
    } catch (error) {
      console.error('Error persisting view update:', error);
      throw error;
    }
  },

  deleteView: async (id: string) => {
    // Store old state for rollback
    const oldViews = get().views;
    const oldCurrentViewId = get().currentViewId;

    // Optimistic update
    set((state) => {
      const updatedViews: Record<string, DatabaseView[]> = {};
      const updatedCurrentViewId = { ...state.currentViewId };

      Object.entries(state.views).forEach(([boardId, views]) => {
        const filtered = views.filter((view) => view.id !== id);
        updatedViews[boardId] = filtered;

        // If deleted view was current, switch to first view
        if (state.currentViewId[boardId] === id && filtered.length > 0) {
          updatedCurrentViewId[boardId] = filtered[0].id;
        }
      });

      return { views: updatedViews, currentViewId: updatedCurrentViewId };
    });

    // Delete from Supabase
    try {
      const result = await supabaseDatabaseViewService.delete(id);
      if (!result.success) {
        console.error('Error deleting view:', result.error);
        // Rollback on error
        set({ views: oldViews, currentViewId: oldCurrentViewId });
        throw new Error(result.error);
      }

      // Broadcast view deletion in real-time
      try {
        const collabService = getCollaborationService();
        collabService.broadcast({
          type: 'database_view_deleted',
          payload: { id },
          userId: (collabService as any).userId,
          timestamp: Date.now(),
        });
        logger.debug('Broadcast database_view_deleted:', id);
      } catch (err) {
        console.warn('Failed to broadcast view deletion:', err);
      }
    } catch (error) {
      console.error('Error deleting view:', error);
      throw error;
    }
  },

  setCurrentView: (boardId: string, viewId: string) => {
    set((state) => ({
      currentViewId: {
        ...state.currentViewId,
        [boardId]: viewId
      }
    }));
  },

  // Remote sync handlers
  addViewFromRemote: (view: DatabaseView) => {
    logger.debug('[databaseStore] addViewFromRemote:', view.id);
    set((state) => {
      const boardViews = state.views[view.boardId] || [];
      const exists = boardViews.some((v) => v.id === view.id);
      if (exists) {
        logger.debug('View already exists, skipping');
        return state;
      }
      return {
        views: {
          ...state.views,
          [view.boardId]: [...boardViews, view]
        }
      };
    });
  },

  updateViewFromRemote: (view: DatabaseView) => {
    logger.debug('[databaseStore] updateViewFromRemote:', view.id);
    set((state) => {
      const boardViews = state.views[view.boardId] || [];
      const exists = boardViews.some((v) => v.id === view.id);
      if (!exists) {
        logger.debug('View not found, adding it');
        return {
          views: {
            ...state.views,
            [view.boardId]: [...boardViews, view]
          }
        };
      }
      return {
        views: {
          ...state.views,
          [view.boardId]: boardViews.map((v) =>
            v.id === view.id ? view : v
          )
        }
      };
    });
  },

  deleteViewFromRemote: (viewId: string) => {
    logger.debug('[databaseStore] deleteViewFromRemote:', viewId);
    set((state) => {
      const updatedViews: Record<string, DatabaseView[]> = {};
      Object.entries(state.views).forEach(([boardId, views]) => {
        updatedViews[boardId] = views.filter((v) => v.id !== viewId);
      });
      return { views: updatedViews };
    });
  },

  loadViews: async (boardId: string) => {
    const viewsResult = await supabaseDatabaseViewService.getByBoard(boardId);
    if (!viewsResult.success) {
      console.error('Error loading views:', viewsResult.error);
      return [];
    }
    const views = viewsResult.data || [];

    // Set current view to default or first view
    const defaultView = views.find((v) => v.isDefault) || views[0];

    set((state) => ({
      views: {
        ...state.views,
        [boardId]: views
      },
      currentViewId: defaultView
        ? { ...state.currentViewId, [boardId]: defaultView.id }
        : state.currentViewId
    }));
    return views;
  },

  clearViews: (boardId: string) => {
    set((state) => {
      const { [boardId]: _, ...remainingViews } = state.views;
      const { [boardId]: __, ...remainingCurrentViewId } = state.currentViewId;
      return { views: remainingViews, currentViewId: remainingCurrentViewId };
    });
  },
}));

// Selectors
type DatabaseViewStoreState = ReturnType<typeof useDatabaseViewStore.getState>;
export const selectViews = (state: DatabaseViewStoreState) => state.views;
export const selectViewsByBoard = (boardId: string) => (state: DatabaseViewStoreState) =>
  state.views[boardId] || [];
