/**
 * Supabase Board Service
 * Handles all board-related operations with Supabase
 */

import { supabase } from '../../lib/supabase';
import type { Board } from '../../types/board';
import { boardToSupabase, boardFromSupabase, transformArray } from './transformers';

export interface SupabaseResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}

export const supabaseBoardService = {
  /**
   * Get all boards
   */
  async getAll(): Promise<SupabaseResponse<Board[]>> {
    if (!supabase) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      const { data, error } = await supabase
        .from('boards')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: transformArray(data || [], boardFromSupabase) };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  /**
   * Get board by ID
   */
  async getById(id: string): Promise<SupabaseResponse<Board>> {
    if (!supabase) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      const { data, error } = await supabase
        .from('boards')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: boardFromSupabase(data) };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  /**
   * Get boards by folder ID
   */
  async getByFolder(folderId: string): Promise<SupabaseResponse<Board[]>> {
    if (!supabase) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      const { data, error } = await supabase
        .from('boards')
        .select('*')
        .eq('folder_id', folderId)
        .order('updated_at', { ascending: false });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: transformArray(data || [], boardFromSupabase) };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  /**
   * Get child boards (sub-boards)
   */
  async getChildren(parentId: string): Promise<SupabaseResponse<Board[]>> {
    if (!supabase) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      const { data, error } = await supabase
        .from('boards')
        .select('*')
        .eq('parent_id', parentId)
        .order('created_at', { ascending: true });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: transformArray(data || [], boardFromSupabase) };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  /**
   * Create new board
   */
  async create(board: Partial<Board>): Promise<SupabaseResponse<Board>> {
    if (!supabase) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      const supabaseBoard = boardToSupabase(board);

      const { data, error } = await supabase
        .from('boards')
        .insert(supabaseBoard)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: boardFromSupabase(data) };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  /**
   * Update board
   */
  async update(id: string, updates: Partial<Board>): Promise<SupabaseResponse<Board>> {
    if (!supabase) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      const supabaseUpdates = boardToSupabase({
        ...updates,
        updatedAt: new Date(),
      });

      const { data, error } = await supabase
        .from('boards')
        .update(supabaseUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: boardFromSupabase(data) };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  /**
   * Delete board
   */
  async delete(id: string): Promise<SupabaseResponse<void>> {
    if (!supabase) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      const { error } = await supabase.from('boards').delete().eq('id', id);

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
   * Search boards by name or tags
   */
  async search(query: string): Promise<SupabaseResponse<Board[]>> {
    if (!supabase) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      const { data, error } = await supabase
        .from('boards')
        .select('*')
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
        .order('updated_at', { ascending: false });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: transformArray(data || [], boardFromSupabase) };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
};
