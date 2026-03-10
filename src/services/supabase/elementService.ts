/**
 * Supabase Element Service
 * Handles all element-related operations with Supabase
 */

import { supabase } from '../../lib/supabase';
import type { BoardElement } from '../../types';
import type { SupabaseResponse } from './boardService';
import { elementToSupabase, elementFromSupabase, transformArray } from './transformers';

export const supabaseElementService = {
  /**
   * Get all elements for a board
   */
  async getByBoard(boardId: string): Promise<SupabaseResponse<BoardElement[]>> {
    if (!supabase) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      const { data, error } = await supabase
        .from('elements')
        .select('*')
        .eq('board_id', boardId)
        .order('z_index', { ascending: true });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: transformArray(data || [], elementFromSupabase) };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  /**
   * Get element by ID
   */
  async getById(id: string): Promise<SupabaseResponse<BoardElement>> {
    if (!supabase) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      const { data, error } = await supabase
        .from('elements')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: elementFromSupabase(data) };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  /**
   * Get child elements
   */
  async getChildren(parentId: string): Promise<SupabaseResponse<BoardElement[]>> {
    if (!supabase) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      const { data, error } = await supabase
        .from('elements')
        .select('*')
        .eq('parent_id', parentId)
        .order('created_at', { ascending: true });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: transformArray(data || [], elementFromSupabase) };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  /**
   * Create new element
   */
  async create(element: Partial<BoardElement>): Promise<SupabaseResponse<BoardElement>> {
    if (!supabase) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      const supabaseElement = elementToSupabase(element);

      const { data, error } = await supabase
        .from('elements')
        .insert(supabaseElement)
        .select()
        .single();

      if (error) {
        console.error('Supabase element create error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: elementFromSupabase(data) };
    } catch (error) {
      console.error('Element create exception:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  /**
   * Update element
   */
  async update(id: string, updates: Partial<BoardElement>): Promise<SupabaseResponse<BoardElement>> {
    if (!supabase) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      const supabaseUpdates = elementToSupabase({
        ...updates,
        updatedAt: new Date(),
      });

      const { data, error } = await supabase
        .from('elements')
        .update(supabaseUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Supabase element update error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: elementFromSupabase(data) };
    } catch (error) {
      console.error('Element update exception:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  /**
   * Bulk update multiple elements
   */
  async bulkUpdate(
    updates: Array<{ id: string; updates: Partial<BoardElement> }>
  ): Promise<SupabaseResponse<BoardElement[]>> {
    if (!supabase) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      // Run all updates in parallel instead of sequentially
      const results = await Promise.all(
        updates.map(update => {
          const supabaseUpdates = elementToSupabase({
            ...update.updates,
            updatedAt: new Date(),
          });

          return supabase!
            .from('elements')
            .update(supabaseUpdates)
            .eq('id', update.id)
            .select()
            .single();
        })
      );

      // Check for errors in any of the results
      for (const result of results) {
        if (result.error) {
          console.error('Bulk update error:', result.error);
          return { success: false, error: result.error.message };
        }
      }

      const data = results
        .filter(r => r.data)
        .map(r => elementFromSupabase(r.data));

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  /**
   * Delete element
   */
  async delete(id: string): Promise<SupabaseResponse<void>> {
    if (!supabase) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      const { error } = await supabase.from('elements').delete().eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  /**
   * Bulk delete multiple elements
   */
  async bulkDelete(ids: string[]): Promise<SupabaseResponse<void>> {
    if (!supabase) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      const { error } = await supabase.from('elements').delete().in('id', ids);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
};
