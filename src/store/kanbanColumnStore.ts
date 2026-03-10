/**
 * Kanban Column Store
 * Manages state for Kanban columns using Zustand
 */

import { create } from 'zustand';
import { generateId } from '../utils/uuid';
import { supabaseKanbanColumnService } from '../services/supabase/kanbanService';
import { getCollaborationService } from '../services/collaboration/collaborationService';
import { logger } from '../utils/logger';
import type { KanbanColumn } from '../types';

interface KanbanColumnStore {
  // State
  columns: Record<string, KanbanColumn[]>; // boardId -> columns

  // Columns CRUD
  createColumn: (boardId: string, name: string, color?: string) => Promise<KanbanColumn>;
  updateColumn: (id: string, updates: Partial<KanbanColumn>) => Promise<void>;
  deleteColumn: (id: string) => Promise<void>;
  reorderColumns: (boardId: string, columnIds: string[]) => Promise<void>;

  // Load / clear
  loadColumns: (boardId: string) => Promise<KanbanColumn[]>;
  clearColumns: (boardId: string) => void;

  // Realtime sync helpers (called by collaboration service)
  addColumnFromRemote: (column: KanbanColumn) => void;
  updateColumnFromRemote: (column: KanbanColumn) => void;
  deleteColumnFromRemote: (columnId: string) => void;
}

export const useKanbanColumnStore = create<KanbanColumnStore>((set, get) => ({
  columns: {},

  createColumn: async (boardId: string, name: string, color = '#9CA3AF') => {
    const boardColumns = get().columns[boardId] || [];
    const position = boardColumns.length;

    const newColumn: KanbanColumn = {
      id: generateId(),
      boardId,
      name,
      color,
      position,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Optimistic update
    set((state) => ({
      columns: {
        ...state.columns,
        [boardId]: [...(state.columns[boardId] || []), newColumn]
      }
    }));

    // Persist to Supabase
    const result = await supabaseKanbanColumnService.create(newColumn);
    if (!result.success) {
      console.error('Failed to create column in Supabase:', result.error);
      // Rollback on error
      set((state) => ({
        columns: {
          ...state.columns,
          [boardId]: (state.columns[boardId] || []).filter(c => c.id !== newColumn.id)
        }
      }));
    } else {
      // Broadcast column creation in real-time
      try {
        const collabService = getCollaborationService();
        collabService.broadcast({
          type: 'kanban_column_created',
          payload: newColumn,
          userId: (collabService as any).userId,
          timestamp: Date.now(),
        });
        logger.debug('Broadcast kanban_column_created:', newColumn.id);
      } catch (err) {
        console.warn('Failed to broadcast column creation:', err);
      }
    }

    return newColumn;
  },

  updateColumn: async (id: string, updates: Partial<KanbanColumn>) => {
    // Store previous state for rollback
    const prevState = get().columns;

    // Optimistic update
    set((state) => {
      const updatedColumns: Record<string, KanbanColumn[]> = {};

      Object.entries(state.columns).forEach(([boardId, columns]) => {
        updatedColumns[boardId] = columns.map((col) =>
          col.id === id ? { ...col, ...updates, updatedAt: new Date() } : col
        );
      });

      return { columns: updatedColumns };
    });

    // Persist to Supabase
    const result = await supabaseKanbanColumnService.update(id, updates);
    if (!result.success) {
      console.error('Failed to update column in Supabase:', result.error);
      // Rollback on error
      set({ columns: prevState });
    } else {
      // Broadcast column update in real-time
      try {
        const collabService = getCollaborationService();
        // Find the updated column
        let updatedColumn: KanbanColumn | null = null;
        Object.values(get().columns).forEach(columns => {
          const found = columns.find(c => c.id === id);
          if (found) updatedColumn = found;
        });

        if (updatedColumn) {
          collabService.broadcast({
            type: 'kanban_column_updated',
            payload: updatedColumn,
            userId: (collabService as any).userId,
            timestamp: Date.now(),
          });
          logger.debug('Broadcast kanban_column_updated:', id);
        }
      } catch (err) {
        console.warn('Failed to broadcast column update:', err);
      }
    }
  },

  deleteColumn: async (id: string) => {
    // Store previous state for rollback
    const prevState = get().columns;

    // Optimistic update
    set((state) => {
      const updatedColumns: Record<string, KanbanColumn[]> = {};

      Object.entries(state.columns).forEach(([boardId, columns]) => {
        updatedColumns[boardId] = columns.filter((col) => col.id !== id);
      });

      return { columns: updatedColumns };
    });

    // Persist to Supabase
    const result = await supabaseKanbanColumnService.delete(id);
    if (!result.success) {
      console.error('Failed to delete column in Supabase:', result.error);
      // Rollback on error
      set({ columns: prevState });
    } else {
      // Broadcast column deletion in real-time
      try {
        const collabService = getCollaborationService();
        collabService.broadcast({
          type: 'kanban_column_deleted',
          payload: { id },
          userId: (collabService as any).userId,
          timestamp: Date.now(),
        });
        logger.debug('Broadcast kanban_column_deleted:', id);
      } catch (err) {
        console.warn('Failed to broadcast column deletion:', err);
      }
    }

    // Note: Cards in deleted column are automatically deleted by ON DELETE CASCADE
  },

  reorderColumns: async (boardId: string, columnIds: string[]) => {
    const boardColumns = get().columns[boardId] || [];
    const prevState = get().columns;

    const reordered = columnIds.map((id, index) => {
      const column = boardColumns.find((col) => col.id === id);
      return column ? { ...column, position: index } : null;
    }).filter(Boolean) as KanbanColumn[];

    // Optimistic update
    set((state) => ({
      columns: {
        ...state.columns,
        [boardId]: reordered
      }
    }));

    // Persist to Supabase
    const positions = reordered.map((_, idx) => idx);
    const result = await supabaseKanbanColumnService.reorder(columnIds, positions);
    if (!result.success) {
      console.error('Failed to reorder columns in Supabase:', result.error);
      // Rollback on error
      set({ columns: prevState });
    } else {
      // Broadcast ALL reordered columns in real-time
      try {
        const collabService = getCollaborationService();

        // Broadcast each reordered column
        reordered.forEach(column => {
          collabService.broadcast({
            type: 'kanban_column_updated',
            payload: column,
            userId: (collabService as any).userId,
            timestamp: Date.now(),
          });
        });

        logger.debug(`Broadcast kanban_column_updated (reordered ${reordered.length} columns)`);
      } catch (err) {
        console.warn('Failed to broadcast column reorder:', err);
      }
    }
  },

  loadColumns: async (boardId: string) => {
    const columnsResult = await supabaseKanbanColumnService.getByBoard(boardId);

    if (columnsResult.success) {
      const columns = columnsResult.data || [];

      if (columns.length === 0) {
        const defaultColumns: KanbanColumn[] = [
          {
            id: generateId(),
            boardId,
            name: 'À faire',
            color: '#9CA3AF',
            position: 0,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: generateId(),
            boardId,
            name: 'En cours',
            color: '#60A5FA',
            position: 1,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: generateId(),
            boardId,
            name: 'Terminé',
            color: '#34D399',
            position: 2,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ];

        set((state) => ({
          columns: {
            ...state.columns,
            [boardId]: defaultColumns
          }
        }));

        // Try to create in Supabase (may fail if board not synced yet)
        const results = await Promise.allSettled(
          defaultColumns.map(col => supabaseKanbanColumnService.create(col))
        );

        const hasFailures = results.some(r => r.status === 'rejected' ||
          (r.status === 'fulfilled' && !r.value.success));

        if (hasFailures) {
          console.warn(
            'Some columns failed to sync to Supabase (board may not be synced yet). ' +
            'Columns saved locally and will sync when you create/update them.'
          );
        }

        return defaultColumns;
      } else {
        set((state) => ({
          columns: {
            ...state.columns,
            [boardId]: columns
          }
        }));
        return columns;
      }
    } else {
      console.warn('Failed to load columns from Supabase, using local state');
      const existingColumns = get().columns[boardId];

      if (!existingColumns || existingColumns.length === 0) {
        const defaultColumns: KanbanColumn[] = [
          {
            id: generateId(),
            boardId,
            name: 'À faire',
            color: '#9CA3AF',
            position: 0,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: generateId(),
            boardId,
            name: 'En cours',
            color: '#60A5FA',
            position: 1,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: generateId(),
            boardId,
            name: 'Terminé',
            color: '#34D399',
            position: 2,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ];

        set((state) => ({
          columns: {
            ...state.columns,
            [boardId]: defaultColumns
          }
        }));

        return defaultColumns;
      }

      return existingColumns;
    }
  },

  clearColumns: (boardId: string) => {
    set((state) => {
      const { [boardId]: _, ...remainingColumns } = state.columns;
      return { columns: remainingColumns };
    });
  },

  // Realtime sync helpers
  addColumnFromRemote: (column: KanbanColumn) => {
    set((state) => {
      const boardColumns = state.columns[column.boardId] || [];
      // Check if already exists (avoid duplicates)
      if (boardColumns.some(c => c.id === column.id)) {
        return state;
      }
      return {
        columns: {
          ...state.columns,
          [column.boardId]: [...boardColumns, column]
        }
      };
    });
  },

  updateColumnFromRemote: (column: KanbanColumn) => {
    set((state) => ({
      columns: {
        ...state.columns,
        [column.boardId]: (state.columns[column.boardId] || []).map(c =>
          c.id === column.id ? column : c
        )
      }
    }));
  },

  deleteColumnFromRemote: (columnId: string) => {
    set((state) => {
      const updatedColumns: Record<string, KanbanColumn[]> = {};
      Object.entries(state.columns).forEach(([boardId, columns]) => {
        updatedColumns[boardId] = columns.filter(c => c.id !== columnId);
      });
      return { columns: updatedColumns };
    });
  },
}));

// Selectors
type KanbanColumnStoreState = ReturnType<typeof useKanbanColumnStore.getState>;
export const selectColumns = (state: KanbanColumnStoreState) => state.columns;
export const selectColumnById = (id: string) => (state: KanbanColumnStoreState) => {
  for (const columns of Object.values(state.columns)) {
    const found = columns.find(c => c.id === id);
    if (found) return found;
  }
  return undefined;
};
