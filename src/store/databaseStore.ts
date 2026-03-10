/**
 * Database Store — Thin orchestration & re-export layer
 *
 * All domain logic lives in the three sub-stores:
 *   - databasePropertyStore.ts  (properties CRUD + selectors)
 *   - databaseRowStore.ts       (rows CRUD + filtering/sorting + selectors)
 *   - databaseViewStore.ts      (views CRUD + selectors)
 *
 * This file provides backward compatibility so that every existing
 * `import { useDatabaseStore } from '…/databaseStore'` keeps working.
 */

import { create } from 'zustand';
import type {
  DatabaseProperty,
  DatabaseRow,
  DatabaseView,
  PropertyType,
  PropertyConfig,
  ViewType,
  DatabaseSort,
} from '../types';

// ── Sub-stores ──────────────────────────────────────────────────────────
import { useDatabasePropertyStore } from './databasePropertyStore';
import { useDatabaseRowStore } from './databaseRowStore';
import { useDatabaseViewStore } from './databaseViewStore';

// ── Selectors (typed against the combined DatabaseStore) ────────────────
export const selectProperties = (state: DatabaseStore) => state.properties;
export const selectPropertiesByBoard = (boardId: string) => (state: DatabaseStore) => state.properties[boardId] || [];
export const selectRows = (state: DatabaseStore) => state.rows;
export const selectRowsByBoard = (boardId: string) => (state: DatabaseStore) => state.rows[boardId] || [];
export const selectViews = (state: DatabaseStore) => state.views;
export const selectViewsByBoard = (boardId: string) => (state: DatabaseStore) => state.views[boardId] || [];

// ── Re-export sub-stores for direct use ─────────────────────────────────
export { useDatabasePropertyStore } from './databasePropertyStore';
export { useDatabaseRowStore } from './databaseRowStore';
export { useDatabaseViewStore } from './databaseViewStore';

// ── Combined interface (mirrors the original) ───────────────────────────
interface DatabaseStore {
  // State (delegated)
  properties: Record<string, DatabaseProperty[]>;
  rows: Record<string, DatabaseRow[]>;
  views: Record<string, DatabaseView[]>;
  currentViewId: Record<string, string>;

  // Properties CRUD
  createProperty: (boardId: string, name: string, type: PropertyType, config?: PropertyConfig) => Promise<DatabaseProperty>;
  updateProperty: (id: string, updates: Partial<DatabaseProperty>) => Promise<void>;
  deleteProperty: (id: string) => Promise<void>;
  reorderProperties: (boardId: string, propertyIds: string[]) => Promise<void>;

  // Rows CRUD
  createRow: (boardId: string, values?: Record<string, any>) => Promise<DatabaseRow>;
  updateRow: (id: string, propertyId: string, value: any) => Promise<void>;
  deleteRow: (id: string) => Promise<void>;
  duplicateRow: (id: string) => Promise<DatabaseRow>;

  // Views CRUD
  createView: (boardId: string, name: string, type: ViewType) => Promise<DatabaseView>;
  updateView: (id: string, updates: Partial<DatabaseView>) => Promise<void>;
  deleteView: (id: string) => Promise<void>;
  setCurrentView: (boardId: string, viewId: string) => void;

  // Data processing
  getFilteredRows: (boardId: string, viewId: string) => DatabaseRow[];
  getSortedRows: (rows: DatabaseRow[], sorts: DatabaseSort[], properties: DatabaseProperty[]) => DatabaseRow[];
  evaluateFormula: (formula: string, row: DatabaseRow, properties: DatabaseProperty[]) => Promise<any>;

  // Load data
  loadDatabase: (boardId: string) => Promise<void>;
  clearDatabase: (boardId: string) => void;

  // Remote updates (for real-time collaboration)
  addPropertyFromRemote: (property: DatabaseProperty) => void;
  updatePropertyFromRemote: (property: DatabaseProperty) => void;
  deletePropertyFromRemote: (propertyId: string) => void;
  addRowFromRemote: (row: DatabaseRow) => void;
  updateRowFromRemote: (row: DatabaseRow) => void;
  deleteRowFromRemote: (rowId: string) => void;
  addViewFromRemote: (view: DatabaseView) => void;
  updateViewFromRemote: (view: DatabaseView) => void;
  deleteViewFromRemote: (viewId: string) => void;
}

// ── Helper: keep combined store in sync with sub-stores ─────────────────
function syncFromSubStores() {
  return {
    properties: useDatabasePropertyStore.getState().properties,
    rows: useDatabaseRowStore.getState().rows,
    views: useDatabaseViewStore.getState().views,
    currentViewId: useDatabaseViewStore.getState().currentViewId,
  };
}

export const useDatabaseStore = create<DatabaseStore>((set) => {
  // Subscribe to sub-store changes and mirror state into combined store
  useDatabasePropertyStore.subscribe((state) => {
    set({ properties: state.properties });
  });
  useDatabaseRowStore.subscribe((state) => {
    set({ rows: state.rows });
  });
  useDatabaseViewStore.subscribe((state) => {
    set({ views: state.views, currentViewId: state.currentViewId });
  });

  return {
    // Initial state from sub-stores
    ...syncFromSubStores(),

    // ── Properties CRUD (delegate) ────────────────────────────────────
    createProperty: (...args) => useDatabasePropertyStore.getState().createProperty(...args),
    updateProperty: (...args) => useDatabasePropertyStore.getState().updateProperty(...args),
    deleteProperty: async (id: string) => {
      // The original deleteProperty also cleaned up row data
      await useDatabasePropertyStore.getState().deleteProperty(id);
      useDatabaseRowStore.getState().removePropertyFromRows(id);
    },
    reorderProperties: (...args) => useDatabasePropertyStore.getState().reorderProperties(...args),

    // ── Rows CRUD (delegate) ──────────────────────────────────────────
    createRow: (...args) => useDatabaseRowStore.getState().createRow(...args),
    updateRow: (...args) => useDatabaseRowStore.getState().updateRow(...args),
    deleteRow: (...args) => useDatabaseRowStore.getState().deleteRow(...args),
    duplicateRow: (...args) => useDatabaseRowStore.getState().duplicateRow(...args),

    // ── Views CRUD (delegate) ─────────────────────────────────────────
    createView: (...args) => useDatabaseViewStore.getState().createView(...args),
    updateView: (...args) => useDatabaseViewStore.getState().updateView(...args),
    deleteView: (...args) => useDatabaseViewStore.getState().deleteView(...args),
    setCurrentView: (...args) => useDatabaseViewStore.getState().setCurrentView(...args),

    // ── Data processing ───────────────────────────────────────────────
    getFilteredRows: (...args) => useDatabaseRowStore.getState().getFilteredRows(...args),
    getSortedRows: (...args) => useDatabaseRowStore.getState().getSortedRows(...args),

    evaluateFormula: async (formula: string, row: DatabaseRow, properties: DatabaseProperty[]) => {
      try {
        const { evaluate } = await import('mathjs');
        // Replace prop('PropertyName') with actual values
        let processedFormula = formula;

        const propRegex = /prop\(['"]([^'"]+)['"]\)/g;
        processedFormula = processedFormula.replace(propRegex, (_, propertyName) => {
          const property = properties.find((p) => p.name === propertyName);
          if (property) {
            const value = row.properties[property.id];
            return String(value ?? 0);
          }
          return '0';
        });

        // Evaluate using mathjs
        return evaluate(processedFormula);
      } catch (err) {
        console.error('Formula evaluation error:', err);
        return 'Error';
      }
    },

    // ── Orchestration: load / clear ───────────────────────────────────
    loadDatabase: async (boardId: string) => {
      try {
        await Promise.all([
          useDatabasePropertyStore.getState().loadProperties(boardId),
          useDatabaseRowStore.getState().loadRows(boardId),
          useDatabaseViewStore.getState().loadViews(boardId),
        ]);
      } catch (error) {
        console.error('Error loading database:', error);
      }
    },

    clearDatabase: (boardId: string) => {
      useDatabasePropertyStore.getState().clearProperties(boardId);
      useDatabaseRowStore.getState().clearRows(boardId);
      useDatabaseViewStore.getState().clearViews(boardId);
    },

    // ── Remote sync (delegate) ────────────────────────────────────────
    addPropertyFromRemote: (...args) => useDatabasePropertyStore.getState().addPropertyFromRemote(...args),
    updatePropertyFromRemote: (...args) => useDatabasePropertyStore.getState().updatePropertyFromRemote(...args),
    deletePropertyFromRemote: (...args) => useDatabasePropertyStore.getState().deletePropertyFromRemote(...args),
    addRowFromRemote: (...args) => useDatabaseRowStore.getState().addRowFromRemote(...args),
    updateRowFromRemote: (...args) => useDatabaseRowStore.getState().updateRowFromRemote(...args),
    deleteRowFromRemote: (...args) => useDatabaseRowStore.getState().deleteRowFromRemote(...args),
    addViewFromRemote: (...args) => useDatabaseViewStore.getState().addViewFromRemote(...args),
    updateViewFromRemote: (...args) => useDatabaseViewStore.getState().updateViewFromRemote(...args),
    deleteViewFromRemote: (...args) => useDatabaseViewStore.getState().deleteViewFromRemote(...args),
  };
});

// Re-export the combined store state type for selectors
export type DatabaseStoreState = ReturnType<typeof useDatabaseStore.getState>;
