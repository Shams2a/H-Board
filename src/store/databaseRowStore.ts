/**
 * Database Row Store
 * Manages state for database rows using Zustand
 */

import { create } from 'zustand';
import { generateId } from '../utils/uuid';
import type {
  DatabaseProperty,
  DatabaseRow,
  DatabaseSort,
  FilterOperator,
  PropertyType,
} from '../types';
import { supabaseDatabaseRowService } from '../services/supabase/databaseService';
import { getCollaborationService } from '../services/collaboration/collaborationService';
import { logger } from '../utils/logger';
import { useDatabasePropertyStore } from './databasePropertyStore';
import { useDatabaseViewStore } from './databaseViewStore';

export interface DatabaseRowState {
  rows: Record<string, DatabaseRow[]>; // boardId -> rows
}

export interface DatabaseRowActions {
  createRow: (boardId: string, values?: Record<string, any>) => Promise<DatabaseRow>;
  updateRow: (id: string, propertyId: string, value: any) => Promise<void>;
  deleteRow: (id: string) => Promise<void>;
  duplicateRow: (id: string) => Promise<DatabaseRow>;

  // Data processing
  getFilteredRows: (boardId: string, viewId: string) => DatabaseRow[];
  getSortedRows: (rows: DatabaseRow[], sorts: DatabaseSort[], properties: DatabaseProperty[]) => DatabaseRow[];

  // Remote sync
  addRowFromRemote: (row: DatabaseRow) => void;
  updateRowFromRemote: (row: DatabaseRow) => void;
  deleteRowFromRemote: (rowId: string) => void;

  // Load / clear
  loadRows: (boardId: string) => Promise<DatabaseRow[]>;
  clearRows: (boardId: string) => void;

  // Cross-store helper: remove property values from all rows
  removePropertyFromRows: (propertyId: string) => void;
}

export type DatabaseRowStore = DatabaseRowState & DatabaseRowActions;

// Helper function to apply filters
function applyFilter(value: any, operator: FilterOperator, filterValue: any, _propertyType: PropertyType): boolean {
  // Text operators
  if (operator === 'contains') {
    return String(value || '').toLowerCase().includes(String(filterValue).toLowerCase());
  }
  if (operator === 'not_contains') {
    return !String(value || '').toLowerCase().includes(String(filterValue).toLowerCase());
  }
  if (operator === 'is') {
    return String(value) === String(filterValue);
  }
  if (operator === 'is_not') {
    return String(value) !== String(filterValue);
  }
  if (operator === 'starts_with') {
    return String(value || '').toLowerCase().startsWith(String(filterValue).toLowerCase());
  }
  if (operator === 'ends_with') {
    return String(value || '').toLowerCase().endsWith(String(filterValue).toLowerCase());
  }
  if (operator === 'is_empty') {
    return !value || value === '';
  }
  if (operator === 'is_not_empty') {
    return value && value !== '';
  }

  // Number operators
  if (operator === 'equals') {
    return Number(value) === Number(filterValue);
  }
  if (operator === 'not_equals') {
    return Number(value) !== Number(filterValue);
  }
  if (operator === 'greater_than') {
    return Number(value) > Number(filterValue);
  }
  if (operator === 'less_than') {
    return Number(value) < Number(filterValue);
  }
  if (operator === 'greater_than_or_equal') {
    return Number(value) >= Number(filterValue);
  }
  if (operator === 'less_than_or_equal') {
    return Number(value) <= Number(filterValue);
  }

  // Date operators
  if (operator === 'is_before') {
    return new Date(value) < new Date(filterValue);
  }
  if (operator === 'is_after') {
    return new Date(value) > new Date(filterValue);
  }
  if (operator === 'is_on_or_before') {
    return new Date(value) <= new Date(filterValue);
  }
  if (operator === 'is_on_or_after') {
    return new Date(value) >= new Date(filterValue);
  }

  // Select operators
  if (operator === 'is_any_of') {
    if (Array.isArray(value)) {
      return value.some((v) => filterValue.includes(v));
    }
    return filterValue.includes(value);
  }
  if (operator === 'is_none_of') {
    if (Array.isArray(value)) {
      return !value.some((v) => filterValue.includes(v));
    }
    return !filterValue.includes(value);
  }

  // Checkbox operators
  if (operator === 'is_checked') {
    return value === true;
  }
  if (operator === 'is_not_checked') {
    return value !== true;
  }

  return true;
}

export const useDatabaseRowStore = create<DatabaseRowStore>((set, get) => ({
  rows: {},

  createRow: async (boardId: string, values: Record<string, any> = {}) => {
    const boardRows = get().rows[boardId] || [];
    const position = boardRows.length;

    const newRow: DatabaseRow = {
      id: generateId(),
      boardId,
      properties: values,
      position,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Optimistic update
    set((state) => ({
      rows: {
        ...state.rows,
        [boardId]: [...(state.rows[boardId] || []), newRow]
      }
    }));

    // Persist to Supabase
    try {
      const result = await supabaseDatabaseRowService.create(newRow);
      if (!result.success) {
        console.error('Error creating row:', result.error);
        // Rollback on error
        set((state) => ({
          rows: {
            ...state.rows,
            [boardId]: state.rows[boardId].filter((r) => r.id !== newRow.id)
          }
        }));
        throw new Error(result.error);
      }

      // Broadcast row creation in real-time
      try {
        const collabService = getCollaborationService();
        collabService.broadcast({
          type: 'database_row_created',
          payload: newRow,
          userId: (collabService as any).userId,
          timestamp: Date.now(),
        });
        logger.debug('Broadcast database_row_created:', newRow.id);
      } catch (err) {
        console.warn('Failed to broadcast row creation:', err);
      }
    } catch (error) {
      console.error('Error persisting row:', error);
      throw error;
    }

    return newRow;
  },

  updateRow: async (id: string, propertyId: string, value: any) => {
    // Store old state for rollback
    const oldRows = get().rows;

    // Find the row to update
    let rowToUpdate: DatabaseRow | undefined;
    Object.values(get().rows).forEach((rows) => {
      const found = rows.find((r) => r.id === id);
      if (found) rowToUpdate = found;
    });

    if (!rowToUpdate) {
      console.error('Row not found:', id);
      return;
    }

    // Optimistic update
    set((state) => {
      const updatedRows: Record<string, DatabaseRow[]> = {};

      Object.entries(state.rows).forEach(([boardId, rows]) => {
        updatedRows[boardId] = rows.map((row) =>
          row.id === id
            ? {
                ...row,
                properties: { ...row.properties, [propertyId]: value },
                updatedAt: new Date()
              }
            : row
        );
      });

      return { rows: updatedRows };
    });

    // Persist to Supabase
    try {
      const result = await supabaseDatabaseRowService.updateCell(id, propertyId, value);
      if (!result.success) {
        console.error('Error updating row:', result.error);
        // Rollback on error
        set({ rows: oldRows });
        throw new Error(result.error);
      }

      // Broadcast row update in real-time
      try {
        const collabService = getCollaborationService();
        // Get the updated row from state
        let updatedRow: DatabaseRow | undefined;
        Object.values(get().rows).forEach((rows) => {
          const found = rows.find((r) => r.id === id);
          if (found) updatedRow = found;
        });

        if (updatedRow) {
          collabService.broadcast({
            type: 'database_row_updated',
            payload: updatedRow,
            userId: (collabService as any).userId,
            timestamp: Date.now(),
          });
          logger.debug('Broadcast database_row_updated:', id);
        }
      } catch (err) {
        console.warn('Failed to broadcast row update:', err);
      }
    } catch (error) {
      console.error('Error persisting row update:', error);
      throw error;
    }
  },

  deleteRow: async (id: string) => {
    // Store old state for rollback
    const oldRows = get().rows;

    // Optimistic update
    set((state) => {
      const updatedRows: Record<string, DatabaseRow[]> = {};

      Object.entries(state.rows).forEach(([boardId, rows]) => {
        updatedRows[boardId] = rows.filter((row) => row.id !== id);
      });

      return { rows: updatedRows };
    });

    // Delete from Supabase
    try {
      const result = await supabaseDatabaseRowService.delete(id);
      if (!result.success) {
        console.error('Error deleting row:', result.error);
        // Rollback on error
        set({ rows: oldRows });
        throw new Error(result.error);
      }

      // Broadcast row deletion in real-time
      try {
        const collabService = getCollaborationService();
        collabService.broadcast({
          type: 'database_row_deleted',
          payload: { id },
          userId: (collabService as any).userId,
          timestamp: Date.now(),
        });
        logger.debug('Broadcast database_row_deleted:', id);
      } catch (err) {
        console.warn('Failed to broadcast row deletion:', err);
      }
    } catch (error) {
      console.error('Error deleting row:', error);
      throw error;
    }
  },

  duplicateRow: async (id: string) => {
    let duplicatedRow: DatabaseRow | null = null;

    // Optimistic update
    set((state) => {
      const updatedRows: Record<string, DatabaseRow[]> = {};

      Object.entries(state.rows).forEach(([boardId, rows]) => {
        const originalRow = rows.find((row) => row.id === id);
        if (originalRow) {
          const newRow: DatabaseRow = {
            ...originalRow,
            id: generateId(),
            position: rows.length,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          duplicatedRow = newRow;
          updatedRows[boardId] = [...rows, newRow];
        } else {
          updatedRows[boardId] = rows;
        }
      });

      return { rows: updatedRows };
    });

    if (!duplicatedRow) {
      throw new Error('Row not found');
    }

    // Persist to Supabase
    try {
      const result = await supabaseDatabaseRowService.create(duplicatedRow);
      if (!result.success) {
        console.error('Error duplicating row:', result.error);
        // Rollback on error
        set((state) => {
          const updatedRows: Record<string, DatabaseRow[]> = {};
          Object.entries(state.rows).forEach(([boardId, rows]) => {
            updatedRows[boardId] = rows.filter((r) => r.id !== duplicatedRow!.id);
          });
          return { rows: updatedRows };
        });
        throw new Error(result.error);
      }

      // Broadcast row creation in real-time (duplication creates a new row)
      try {
        const collabService = getCollaborationService();
        collabService.broadcast({
          type: 'database_row_created',
          payload: duplicatedRow,
          userId: (collabService as any).userId,
          timestamp: Date.now(),
        });
        logger.debug('Broadcast database_row_created (duplicate):', (duplicatedRow as any).id);
      } catch (err) {
        console.warn('Failed to broadcast row duplication:', err);
      }
    } catch (error) {
      console.error('Error persisting duplicated row:', error);
      throw error;
    }

    return duplicatedRow;
  },

  getFilteredRows: (boardId: string, viewId: string) => {
    const rows = get().rows[boardId] || [];
    const views = useDatabaseViewStore.getState().views[boardId] || [];
    const properties = useDatabasePropertyStore.getState().properties[boardId] || [];
    const view = views.find((v) => v.id === viewId);

    if (!view || view.filters.length === 0) {
      return rows;
    }

    return rows.filter((row) => {
      return view.filters.every((filter) => {
        const value = row.properties[filter.propertyId];
        const property = properties.find((p) => p.id === filter.propertyId);

        if (!property) return true;

        // Apply filter based on property type and operator
        return applyFilter(value, filter.operator, filter.value, property.type);
      });
    });
  },

  getSortedRows: (rows: DatabaseRow[], sorts: DatabaseSort[], properties: DatabaseProperty[]) => {
    if (sorts.length === 0) return rows;

    return [...rows].sort((a, b) => {
      for (const sort of sorts) {
        const aValue = a.properties[sort.propertyId];
        const bValue = b.properties[sort.propertyId];
        const property = properties.find((p) => p.id === sort.propertyId);

        if (!property) continue;

        let comparison = 0;

        // Compare based on property type
        if (property.type === 'number') {
          comparison = (Number(aValue) || 0) - (Number(bValue) || 0);
        } else if (property.type === 'date') {
          comparison = new Date(String(aValue || 0)).getTime() - new Date(String(bValue || 0)).getTime();
        } else if (property.type === 'checkbox') {
          comparison = (aValue ? 1 : 0) - (bValue ? 1 : 0);
        } else {
          // Text-based comparison
          comparison = String(aValue || '').localeCompare(String(bValue || ''));
        }

        if (comparison !== 0) {
          return sort.direction === 'asc' ? comparison : -comparison;
        }
      }

      return 0;
    });
  },

  // Remote sync handlers
  addRowFromRemote: (row: DatabaseRow) => {
    logger.debug('[databaseStore] addRowFromRemote:', row.id);
    set((state) => {
      const boardRows = state.rows[row.boardId] || [];
      const exists = boardRows.some((r) => r.id === row.id);
      if (exists) {
        logger.debug('Row already exists, skipping');
        return state;
      }
      return {
        rows: {
          ...state.rows,
          [row.boardId]: [...boardRows, row]
        }
      };
    });
  },

  updateRowFromRemote: (row: DatabaseRow) => {
    logger.debug('[databaseStore] updateRowFromRemote:', row.id);
    set((state) => {
      const boardRows = state.rows[row.boardId] || [];
      const exists = boardRows.some((r) => r.id === row.id);
      if (!exists) {
        logger.debug('Row not found, adding it');
        return {
          rows: {
            ...state.rows,
            [row.boardId]: [...boardRows, row]
          }
        };
      }
      return {
        rows: {
          ...state.rows,
          [row.boardId]: boardRows.map((r) =>
            r.id === row.id ? row : r
          )
        }
      };
    });
  },

  deleteRowFromRemote: (rowId: string) => {
    logger.debug('[databaseStore] deleteRowFromRemote:', rowId);
    set((state) => {
      const updatedRows: Record<string, DatabaseRow[]> = {};
      Object.entries(state.rows).forEach(([boardId, rows]) => {
        updatedRows[boardId] = rows.filter((r) => r.id !== rowId);
      });
      return { rows: updatedRows };
    });
  },

  loadRows: async (boardId: string) => {
    const rowsResult = await supabaseDatabaseRowService.getByBoard(boardId);
    if (!rowsResult.success) {
      console.error('Error loading rows:', rowsResult.error);
      return [];
    }
    const rows = rowsResult.data || [];
    set((state) => ({
      rows: {
        ...state.rows,
        [boardId]: rows
      }
    }));
    return rows;
  },

  clearRows: (boardId: string) => {
    set((state) => {
      const { [boardId]: _, ...remaining } = state.rows;
      return { rows: remaining };
    });
  },

  removePropertyFromRows: (propertyId: string) => {
    set((state) => {
      const updatedRows: Record<string, DatabaseRow[]> = {};
      Object.entries(state.rows).forEach(([boardId, rows]) => {
        updatedRows[boardId] = rows.map((row) => {
          const { [propertyId]: _, ...remainingProperties } = row.properties;
          return { ...row, properties: remainingProperties };
        });
      });
      return { rows: updatedRows };
    });
  },
}));

// Selectors
type DatabaseRowStoreState = ReturnType<typeof useDatabaseRowStore.getState>;
export const selectRows = (state: DatabaseRowStoreState) => state.rows;
export const selectRowsByBoard = (boardId: string) => (state: DatabaseRowStoreState) =>
  state.rows[boardId] || [];
