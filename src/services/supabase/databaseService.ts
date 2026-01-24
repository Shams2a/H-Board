/**
 * Supabase Database Service
 * Handles all Database board operations with Supabase
 */

import { supabase } from '../../lib/supabase';
import type { DatabaseProperty, DatabaseRow, DatabaseView } from '../../types';

export interface SupabaseResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}

// ============================================================================
// PROPERTIES SERVICE
// ============================================================================

export const supabaseDatabasePropertyService = {
  /**
   * Get all properties for a board
   */
  async getByBoard(boardId: string): Promise<SupabaseResponse<DatabaseProperty[]>> {
    if (!supabase) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      const { data, error } = await supabase
        .from('database_properties')
        .select('*')
        .eq('board_id', boardId)
        .order('position', { ascending: true });

      if (error) {
        return { success: false, error: error.message };
      }

      // Transform from snake_case to camelCase
      const properties: DatabaseProperty[] = (data || []).map((prop: any) => ({
        id: prop.id,
        boardId: prop.board_id,
        name: prop.name,
        type: prop.type,
        config: prop.config,
        position: prop.position,
        required: prop.required,
        width: prop.width,
        visible: prop.visible,
        createdAt: new Date(prop.created_at),
        updatedAt: new Date(prop.updated_at)
      }));

      return { success: true, data: properties };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  /**
   * Create a new property
   */
  async create(property: Omit<DatabaseProperty, 'createdAt' | 'updatedAt'>): Promise<SupabaseResponse<DatabaseProperty>> {
    if (!supabase) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      const { data, error } = await supabase
        .from('database_properties')
        .insert({
          id: property.id,
          board_id: property.boardId,
          name: property.name,
          type: property.type,
          config: property.config || {},
          position: property.position,
          required: property.required || false,
          width: property.width || 200,
          visible: property.visible !== false // Default true
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      const createdProperty: DatabaseProperty = {
        id: data.id,
        boardId: data.board_id,
        name: data.name,
        type: data.type,
        config: data.config,
        position: data.position,
        required: data.required,
        width: data.width,
        visible: data.visible,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };

      return { success: true, data: createdProperty };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  /**
   * Update a property
   */
  async update(id: string, updates: Partial<Omit<DatabaseProperty, 'id' | 'boardId' | 'createdAt' | 'updatedAt'>>): Promise<SupabaseResponse<DatabaseProperty>> {
    if (!supabase) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      const updateData: any = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.type !== undefined) updateData.type = updates.type;
      if (updates.config !== undefined) updateData.config = updates.config;
      if (updates.position !== undefined) updateData.position = updates.position;
      if (updates.required !== undefined) updateData.required = updates.required;
      if (updates.width !== undefined) updateData.width = updates.width;
      if (updates.visible !== undefined) updateData.visible = updates.visible;

      const { data, error } = await supabase
        .from('database_properties')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      const updatedProperty: DatabaseProperty = {
        id: data.id,
        boardId: data.board_id,
        name: data.name,
        type: data.type,
        config: data.config,
        position: data.position,
        required: data.required,
        width: data.width,
        visible: data.visible,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };

      return { success: true, data: updatedProperty };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  /**
   * Delete a property
   */
  async delete(id: string): Promise<SupabaseResponse<void>> {
    if (!supabase) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      const { error } = await supabase
        .from('database_properties')
        .delete()
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  /**
   * Reorder properties
   */
  async reorder(propertyIds: string[], positions: number[]): Promise<SupabaseResponse<void>> {
    if (!supabase) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      // Update each property's position
      const updates = propertyIds.map((id, index) =>
        supabase!
          .from('database_properties')
          .update({ position: positions[index] })
          .eq('id', id)
      );

      await Promise.all(updates);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
};

// ============================================================================
// ROWS SERVICE
// ============================================================================

export const supabaseDatabaseRowService = {
  /**
   * Get all rows for a board
   */
  async getByBoard(boardId: string): Promise<SupabaseResponse<DatabaseRow[]>> {
    if (!supabase) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      const { data, error } = await supabase
        .from('database_rows')
        .select('*')
        .eq('board_id', boardId)
        .order('position', { ascending: true });

      if (error) {
        return { success: false, error: error.message };
      }

      // Transform from snake_case to camelCase
      const rows: DatabaseRow[] = (data || []).map((row: any) => ({
        id: row.id,
        boardId: row.board_id,
        properties: row.properties || {},
        position: row.position,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        createdBy: row.created_by,
        lastEditedBy: row.last_edited_by
      }));

      return { success: true, data: rows };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  /**
   * Create a new row
   */
  async create(row: Omit<DatabaseRow, 'createdAt' | 'updatedAt'>): Promise<SupabaseResponse<DatabaseRow>> {
    if (!supabase) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      const { data, error } = await supabase
        .from('database_rows')
        .insert({
          id: row.id,
          board_id: row.boardId,
          properties: row.properties,
          position: row.position,
          created_by: row.createdBy,
          last_edited_by: row.lastEditedBy
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      const createdRow: DatabaseRow = {
        id: data.id,
        boardId: data.board_id,
        properties: data.properties || {},
        position: data.position,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        createdBy: data.created_by,
        lastEditedBy: data.last_edited_by
      };

      return { success: true, data: createdRow };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  /**
   * Update a row
   */
  async update(id: string, updates: Partial<Omit<DatabaseRow, 'id' | 'boardId' | 'createdAt' | 'updatedAt'>>): Promise<SupabaseResponse<DatabaseRow>> {
    if (!supabase) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      const updateData: any = {};
      if (updates.properties !== undefined) updateData.properties = updates.properties;
      if (updates.position !== undefined) updateData.position = updates.position;
      if (updates.createdBy !== undefined) updateData.created_by = updates.createdBy;
      if (updates.lastEditedBy !== undefined) updateData.last_edited_by = updates.lastEditedBy;

      const { data, error } = await supabase
        .from('database_rows')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      const updatedRow: DatabaseRow = {
        id: data.id,
        boardId: data.board_id,
        properties: data.properties || {},
        position: data.position,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        createdBy: data.created_by,
        lastEditedBy: data.last_edited_by
      };

      return { success: true, data: updatedRow };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  /**
   * Delete a row
   */
  async delete(id: string): Promise<SupabaseResponse<void>> {
    if (!supabase) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      const { error } = await supabase
        .from('database_rows')
        .delete()
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  /**
   * Update a single cell value
   */
  async updateCell(rowId: string, propertyId: string, value: any): Promise<SupabaseResponse<void>> {
    if (!supabase) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      // First, fetch the current row
      const { data: currentRow, error: fetchError } = await supabase
        .from('database_rows')
        .select('properties')
        .eq('id', rowId)
        .single();

      if (fetchError) {
        return { success: false, error: fetchError.message };
      }

      // Update the specific property
      const updatedProperties = {
        ...(currentRow.properties || {}),
        [propertyId]: value
      };

      // Update the row
      const { error: updateError } = await supabase
        .from('database_rows')
        .update({ properties: updatedProperties })
        .eq('id', rowId);

      if (updateError) {
        return { success: false, error: updateError.message };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  /**
   * Reorder rows
   */
  async reorder(rowIds: string[], positions: number[]): Promise<SupabaseResponse<void>> {
    if (!supabase) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      // Update each row's position
      const updates = rowIds.map((id, index) =>
        supabase!
          .from('database_rows')
          .update({ position: positions[index] })
          .eq('id', id)
      );

      await Promise.all(updates);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
};

// ============================================================================
// VIEWS SERVICE (Phase 4.2 - Advanced)
// ============================================================================

export const supabaseDatabaseViewService = {
  /**
   * Get all views for a board
   */
  async getByBoard(boardId: string): Promise<SupabaseResponse<DatabaseView[]>> {
    if (!supabase) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      const { data, error } = await supabase
        .from('database_views')
        .select('*')
        .eq('board_id', boardId)
        .order('position', { ascending: true });

      if (error) {
        return { success: false, error: error.message };
      }

      // Transform from snake_case to camelCase
      const views: DatabaseView[] = (data || []).map((view: any) => ({
        id: view.id,
        boardId: view.board_id,
        name: view.name,
        type: view.type,
        filters: view.filters || [],
        sorts: view.sorts || [],
        groupBy: view.group_by,
        visibleProperties: view.visible_properties || [],
        config: view.config,
        position: view.position,
        isDefault: view.is_default,
        createdAt: new Date(view.created_at),
        updatedAt: new Date(view.updated_at)
      }));

      return { success: true, data: views };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  /**
   * Create a new view
   */
  async create(view: Omit<DatabaseView, 'createdAt' | 'updatedAt'>): Promise<SupabaseResponse<DatabaseView>> {
    if (!supabase) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      const { data, error } = await supabase
        .from('database_views')
        .insert({
          id: view.id,
          board_id: view.boardId,
          name: view.name,
          type: view.type,
          filters: view.filters,
          sorts: view.sorts,
          group_by: view.groupBy,
          visible_properties: view.visibleProperties,
          config: view.config,
          position: view.position,
          is_default: view.isDefault
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      const createdView: DatabaseView = {
        id: data.id,
        boardId: data.board_id,
        name: data.name,
        type: data.type,
        filters: data.filters || [],
        sorts: data.sorts || [],
        groupBy: data.group_by,
        visibleProperties: data.visible_properties || [],
        config: data.config,
        position: data.position,
        isDefault: data.is_default,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };

      return { success: true, data: createdView };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  /**
   * Update a view
   */
  async update(id: string, updates: Partial<Omit<DatabaseView, 'id' | 'boardId' | 'createdAt' | 'updatedAt'>>): Promise<SupabaseResponse<DatabaseView>> {
    if (!supabase) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      const updateData: any = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.type !== undefined) updateData.type = updates.type;
      if (updates.filters !== undefined) updateData.filters = updates.filters;
      if (updates.sorts !== undefined) updateData.sorts = updates.sorts;
      if (updates.groupBy !== undefined) updateData.group_by = updates.groupBy;
      if (updates.visibleProperties !== undefined) updateData.visible_properties = updates.visibleProperties;
      if (updates.config !== undefined) updateData.config = updates.config;
      if (updates.position !== undefined) updateData.position = updates.position;
      if (updates.isDefault !== undefined) updateData.is_default = updates.isDefault;

      const { data, error } = await supabase
        .from('database_views')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      const updatedView: DatabaseView = {
        id: data.id,
        boardId: data.board_id,
        name: data.name,
        type: data.type,
        filters: data.filters || [],
        sorts: data.sorts || [],
        groupBy: data.group_by,
        visibleProperties: data.visible_properties || [],
        config: data.config,
        position: data.position,
        isDefault: data.is_default,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };

      return { success: true, data: updatedView };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  /**
   * Delete a view
   */
  async delete(id: string): Promise<SupabaseResponse<void>> {
    if (!supabase) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      const { error } = await supabase
        .from('database_views')
        .delete()
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
};
