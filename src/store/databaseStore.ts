/**
 * Database Store
 * Manages state for Database boards using Zustand
 */

import { create } from 'zustand';
import { evaluate } from 'mathjs';
import type {
  DatabaseProperty,
  DatabaseRow,
  DatabaseView,
  PropertyType,
  PropertyConfig,
  ViewType,
  DatabaseFilter,
  DatabaseSort,
  FilterOperator,
  getDefaultCellValue
} from '../types';
import {
  supabaseDatabasePropertyService,
  supabaseDatabaseRowService,
  supabaseDatabaseViewService
} from '../services/supabase/databaseService';

interface DatabaseStore {
  // State
  properties: Record<string, DatabaseProperty[]>; // boardId -> properties
  rows: Record<string, DatabaseRow[]>; // boardId -> rows
  views: Record<string, DatabaseView[]>; // boardId -> views
  currentViewId: Record<string, string>; // boardId -> viewId

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
  evaluateFormula: (formula: string, row: DatabaseRow, properties: DatabaseProperty[]) => any;

  // Load data
  loadDatabase: (boardId: string) => Promise<void>;
  clearDatabase: (boardId: string) => void;
}

export const useDatabaseStore = create<DatabaseStore>((set, get) => ({
  properties: {},
  rows: {},
  views: {},
  currentViewId: {},

  createProperty: async (boardId: string, name: string, type: PropertyType, config: PropertyConfig = {}) => {
    const boardProperties = get().properties[boardId] || [];
    const position = boardProperties.length;

    const newProperty: DatabaseProperty = {
      id: crypto.randomUUID(),
      boardId,
      name,
      type,
      config,
      position,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Optimistic update
    set((state) => ({
      properties: {
        ...state.properties,
        [boardId]: [...(state.properties[boardId] || []), newProperty]
      }
    }));

    // Persist to Supabase
    try {
      const result = await supabaseDatabasePropertyService.create(newProperty);
      if (!result.success) {
        console.error('Error creating property:', result.error);
        // Rollback on error
        set((state) => ({
          properties: {
            ...state.properties,
            [boardId]: state.properties[boardId].filter((p) => p.id !== newProperty.id)
          }
        }));
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error persisting property:', error);
      throw error;
    }

    return newProperty;
  },

  updateProperty: async (id: string, updates: Partial<DatabaseProperty>) => {
    // Store old state for rollback
    const oldProperties = get().properties;

    // Optimistic update
    set((state) => {
      const updatedProperties: Record<string, DatabaseProperty[]> = {};

      Object.entries(state.properties).forEach(([boardId, properties]) => {
        updatedProperties[boardId] = properties.map((prop) =>
          prop.id === id ? { ...prop, ...updates, updatedAt: new Date() } : prop
        );
      });

      return { properties: updatedProperties };
    });

    // Persist to Supabase
    try {
      const result = await supabaseDatabasePropertyService.update(id, updates);
      if (!result.success) {
        console.error('Error updating property:', result.error);
        // Rollback on error
        set({ properties: oldProperties });
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error persisting property update:', error);
      throw error;
    }
  },

  deleteProperty: async (id: string) => {
    // Store old state for rollback
    const oldProperties = get().properties;
    const oldRows = get().rows;

    // Optimistic update
    set((state) => {
      const updatedProperties: Record<string, DatabaseProperty[]> = {};
      const updatedRows: Record<string, DatabaseRow[]> = {};

      // Remove property
      Object.entries(state.properties).forEach(([boardId, properties]) => {
        updatedProperties[boardId] = properties.filter((prop) => prop.id !== id);
      });

      // Remove property values from all rows
      Object.entries(state.rows).forEach(([boardId, rows]) => {
        updatedRows[boardId] = rows.map((row) => {
          const { [id]: _, ...remainingProperties } = row.properties;
          return { ...row, properties: remainingProperties };
        });
      });

      return { properties: updatedProperties, rows: updatedRows };
    });

    // Delete from Supabase
    try {
      const result = await supabaseDatabasePropertyService.delete(id);
      if (!result.success) {
        console.error('Error deleting property:', result.error);
        // Rollback on error
        set({ properties: oldProperties, rows: oldRows });
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error deleting property:', error);
      throw error;
    }
  },

  reorderProperties: async (boardId: string, propertyIds: string[]) => {
    const boardProperties = get().properties[boardId] || [];
    const oldProperties = get().properties;

    const reordered = propertyIds.map((id, index) => {
      const property = boardProperties.find((prop) => prop.id === id);
      return property ? { ...property, position: index } : null;
    }).filter(Boolean) as DatabaseProperty[];

    // Optimistic update
    set((state) => ({
      properties: {
        ...state.properties,
        [boardId]: reordered
      }
    }));

    // Persist to Supabase
    try {
      // Generate positions array from indices
      const positions = propertyIds.map((_, index) => index);
      const result = await supabaseDatabasePropertyService.reorder(propertyIds, positions);
      if (!result.success) {
        console.error('Error reordering properties:', result.error);
        // Rollback on error
        set({ properties: oldProperties });
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error persisting property reorder:', error);
      throw error;
    }
  },

  createRow: async (boardId: string, values: Record<string, any> = {}) => {
    const boardRows = get().rows[boardId] || [];
    const position = boardRows.length;

    const newRow: DatabaseRow = {
      id: crypto.randomUUID(),
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
            id: crypto.randomUUID(),
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
    } catch (error) {
      console.error('Error persisting duplicated row:', error);
      throw error;
    }

    return duplicatedRow;
  },

  createView: async (boardId: string, name: string, type: ViewType) => {
    const boardViews = get().views[boardId] || [];
    const position = boardViews.length;
    const isFirst = boardViews.length === 0;

    const newView: DatabaseView = {
      id: crypto.randomUUID(),
      boardId,
      name,
      type,
      config: {},
      filters: [],
      sorts: [],
      position,
      isDefault: isFirst, // First view is default
      createdAt: new Date()
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

  getFilteredRows: (boardId: string, viewId: string) => {
    const rows = get().rows[boardId] || [];
    const views = get().views[boardId] || [];
    const properties = get().properties[boardId] || [];
    const view = views.find((v) => v.id === viewId);

    if (!view || view.filters.length === 0) {
      return rows;
    }

    return rows.filter((row) => {
      return view.filters.every((filter) => {
        const value = row.properties[filter.propertyId];  // Renamed from "values" and "property"
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
        const aValue = a.properties[sort.propertyId];  // Renamed from "values" and "property"
        const bValue = b.properties[sort.propertyId];
        const property = properties.find((p) => p.id === sort.propertyId);

        if (!property) continue;

        let comparison = 0;

        // Compare based on property type
        if (property.type === 'number') {
          comparison = (aValue || 0) - (bValue || 0);
        } else if (property.type === 'date') {
          comparison = new Date(aValue || 0).getTime() - new Date(bValue || 0).getTime();
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

  evaluateFormula: (formula: string, row: DatabaseRow, properties: DatabaseProperty[]) => {
    try {
      // Replace prop('PropertyName') with actual values
      let processedFormula = formula;

      const propRegex = /prop\(['"]([^'"]+)['"]\)/g;
      processedFormula = processedFormula.replace(propRegex, (_, propertyName) => {
        const property = properties.find((p) => p.name === propertyName);
        if (property) {
          const value = row.properties[property.id];  // Renamed from "values"
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

  loadDatabase: async (boardId: string) => {
    try {
      // Load properties, rows, and views in parallel
      const [propsResult, rowsResult, viewsResult] = await Promise.all([
        supabaseDatabasePropertyService.getByBoard(boardId),
        supabaseDatabaseRowService.getByBoard(boardId),
        supabaseDatabaseViewService.getByBoard(boardId)
      ]);

      if (!propsResult.success || !rowsResult.success || !viewsResult.success) {
        console.error('Error loading database:', {
          properties: propsResult.error,
          rows: rowsResult.error,
          views: viewsResult.error
        });
        return;
      }

      const properties = propsResult.data || [];
      const rows = rowsResult.data || [];
      const views = viewsResult.data || [];

      // Set current view to default or first view
      const defaultView = views.find((v) => v.isDefault) || views[0];

      set((state) => ({
        properties: {
          ...state.properties,
          [boardId]: properties
        },
        rows: {
          ...state.rows,
          [boardId]: rows
        },
        views: {
          ...state.views,
          [boardId]: views
        },
        currentViewId: defaultView
          ? { ...state.currentViewId, [boardId]: defaultView.id }
          : state.currentViewId
      }));
    } catch (error) {
      console.error('Error loading database:', error);
    }
  },

  clearDatabase: (boardId: string) => {
    set((state) => {
      const { [boardId]: _, ...remainingProperties } = state.properties;
      const { [boardId]: __, ...remainingRows } = state.rows;
      const { [boardId]: ___, ...remainingViews } = state.views;
      const { [boardId]: ____, ...remainingCurrentViewId } = state.currentViewId;

      return {
        properties: remainingProperties,
        rows: remainingRows,
        views: remainingViews,
        currentViewId: remainingCurrentViewId
      };
    });
  }
}));

// Helper function to apply filters
function applyFilter(value: any, operator: FilterOperator, filterValue: any, propertyType: PropertyType): boolean {
  // Text operators
  if (operator === 'contains') {
    return String(value || '').toLowerCase().includes(String(filterValue).toLowerCase());
  }
  if (operator === 'does_not_contain') {
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
  if (operator === 'does_not_equal') {
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
