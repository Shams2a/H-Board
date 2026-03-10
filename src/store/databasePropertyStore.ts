/**
 * Database Property Store
 * Manages state for database properties using Zustand
 */

import { create } from 'zustand';
import { generateId } from '../utils/uuid';
import type {
  DatabaseProperty,
  PropertyType,
  PropertyConfig,
} from '../types';
import { supabaseDatabasePropertyService } from '../services/supabase/databaseService';
import { getCollaborationService } from '../services/collaboration/collaborationService';
import { logger } from '../utils/logger';

export interface DatabasePropertyState {
  properties: Record<string, DatabaseProperty[]>; // boardId -> properties
}

export interface DatabasePropertyActions {
  createProperty: (boardId: string, name: string, type: PropertyType, config?: PropertyConfig) => Promise<DatabaseProperty>;
  updateProperty: (id: string, updates: Partial<DatabaseProperty>) => Promise<void>;
  deleteProperty: (id: string) => Promise<void>;
  reorderProperties: (boardId: string, propertyIds: string[]) => Promise<void>;

  // Remote sync
  addPropertyFromRemote: (property: DatabaseProperty) => void;
  updatePropertyFromRemote: (property: DatabaseProperty) => void;
  deletePropertyFromRemote: (propertyId: string) => void;

  // Load / clear
  loadProperties: (boardId: string) => Promise<DatabaseProperty[]>;
  clearProperties: (boardId: string) => void;
}

export type DatabasePropertyStore = DatabasePropertyState & DatabasePropertyActions;

export const useDatabasePropertyStore = create<DatabasePropertyStore>((set, get) => ({
  properties: {},

  createProperty: async (boardId: string, name: string, type: PropertyType, config: PropertyConfig = {}) => {
    const boardProperties = get().properties[boardId] || [];
    const position = boardProperties.length;

    const newProperty: DatabaseProperty = {
      id: generateId(),
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

      // Broadcast property creation in real-time
      try {
        const collabService = getCollaborationService();
        collabService.broadcast({
          type: 'database_property_created',
          payload: newProperty,
          userId: (collabService as any).userId,
          timestamp: Date.now(),
        });
        logger.debug('Broadcast database_property_created:', newProperty.id);
      } catch (err) {
        console.warn('Failed to broadcast property creation:', err);
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

      // Broadcast property update in real-time
      try {
        const collabService = getCollaborationService();
        // Get the updated property from state
        let updatedProperty: DatabaseProperty | undefined;
        Object.values(get().properties).forEach((properties) => {
          const found = properties.find((p) => p.id === id);
          if (found) updatedProperty = found;
        });

        if (updatedProperty) {
          collabService.broadcast({
            type: 'database_property_updated',
            payload: updatedProperty,
            userId: (collabService as any).userId,
            timestamp: Date.now(),
          });
          logger.debug('Broadcast database_property_updated:', id);
        }
      } catch (err) {
        console.warn('Failed to broadcast property update:', err);
      }
    } catch (error) {
      console.error('Error persisting property update:', error);
      throw error;
    }
  },

  deleteProperty: async (id: string) => {
    // Store old state for rollback
    const oldProperties = get().properties;

    // Optimistic update - only remove from properties; row cleanup is handled by the orchestration layer
    set((state) => {
      const updatedProperties: Record<string, DatabaseProperty[]> = {};

      // Remove property
      Object.entries(state.properties).forEach(([boardId, properties]) => {
        updatedProperties[boardId] = properties.filter((prop) => prop.id !== id);
      });

      return { properties: updatedProperties };
    });

    // Delete from Supabase
    try {
      const result = await supabaseDatabasePropertyService.delete(id);
      if (!result.success) {
        console.error('Error deleting property:', result.error);
        // Rollback on error
        set({ properties: oldProperties });
        throw new Error(result.error);
      }

      // Broadcast property deletion in real-time
      try {
        const collabService = getCollaborationService();
        collabService.broadcast({
          type: 'database_property_deleted',
          payload: { id },
          userId: (collabService as any).userId,
          timestamp: Date.now(),
        });
        logger.debug('Broadcast database_property_deleted:', id);
      } catch (err) {
        console.warn('Failed to broadcast property deletion:', err);
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

      // Broadcast ALL reordered properties in real-time
      try {
        const collabService = getCollaborationService();
        reordered.forEach(property => {
          collabService.broadcast({
            type: 'database_property_updated',
            payload: property,
            userId: (collabService as any).userId,
            timestamp: Date.now(),
          });
        });
        logger.debug(`Broadcast database_property_updated (reordered ${reordered.length} properties)`);
      } catch (err) {
        console.warn('Failed to broadcast property reorder:', err);
      }
    } catch (error) {
      console.error('Error persisting property reorder:', error);
      throw error;
    }
  },

  // Remote sync handlers
  addPropertyFromRemote: (property: DatabaseProperty) => {
    logger.debug('[databaseStore] addPropertyFromRemote:', property.id);
    set((state) => {
      const boardProperties = state.properties[property.boardId] || [];
      const exists = boardProperties.some((p) => p.id === property.id);
      if (exists) {
        logger.debug('Property already exists, skipping');
        return state;
      }
      return {
        properties: {
          ...state.properties,
          [property.boardId]: [...boardProperties, property]
        }
      };
    });
  },

  updatePropertyFromRemote: (property: DatabaseProperty) => {
    logger.debug('[databaseStore] updatePropertyFromRemote:', property.id);
    set((state) => {
      const boardProperties = state.properties[property.boardId] || [];
      const exists = boardProperties.some((p) => p.id === property.id);
      if (!exists) {
        logger.debug('Property not found, adding it');
        return {
          properties: {
            ...state.properties,
            [property.boardId]: [...boardProperties, property]
          }
        };
      }
      return {
        properties: {
          ...state.properties,
          [property.boardId]: boardProperties.map((p) =>
            p.id === property.id ? property : p
          )
        }
      };
    });
  },

  deletePropertyFromRemote: (propertyId: string) => {
    logger.debug('[databaseStore] deletePropertyFromRemote:', propertyId);
    set((state) => {
      const updatedProperties: Record<string, DatabaseProperty[]> = {};
      Object.entries(state.properties).forEach(([boardId, properties]) => {
        updatedProperties[boardId] = properties.filter((p) => p.id !== propertyId);
      });
      return { properties: updatedProperties };
    });
  },

  loadProperties: async (boardId: string) => {
    const propsResult = await supabaseDatabasePropertyService.getByBoard(boardId);
    if (!propsResult.success) {
      console.error('Error loading properties:', propsResult.error);
      return [];
    }
    const properties = propsResult.data || [];
    set((state) => ({
      properties: {
        ...state.properties,
        [boardId]: properties
      }
    }));
    return properties;
  },

  clearProperties: (boardId: string) => {
    set((state) => {
      const { [boardId]: _, ...remaining } = state.properties;
      return { properties: remaining };
    });
  },
}));

// Selectors
type DatabasePropertyStoreState = ReturnType<typeof useDatabasePropertyStore.getState>;
export const selectProperties = (state: DatabasePropertyStoreState) => state.properties;
export const selectPropertiesByBoard = (boardId: string) => (state: DatabasePropertyStoreState) =>
  state.properties[boardId] || [];
