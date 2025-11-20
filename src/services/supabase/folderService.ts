/**
 * Supabase Folder Service
 * Handles all folder-related operations with Supabase
 */

import { supabase } from '../../lib/supabase';
import type { Folder } from '../../types/folder';
import type { SupabaseResponse } from './boardService';
import { folderToSupabase, folderFromSupabase, transformArray } from './transformers';

export const supabaseFolderService = {
  /**
   * Get all folders
   */
  async getAll(): Promise<SupabaseResponse<Folder[]>> {
    if (!supabase) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: transformArray(data || [], folderFromSupabase) };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  /**
   * Get folder by ID
   */
  async getById(id: string): Promise<SupabaseResponse<Folder>> {
    if (!supabase) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: folderFromSupabase(data) };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  /**
   * Get root folders (no parent)
   */
  async getRoots(): Promise<SupabaseResponse<Folder[]>> {
    if (!supabase) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .is('parent_folder_id', null)
        .order('name', { ascending: true });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: transformArray(data || [], folderFromSupabase) };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  /**
   * Get child folders
   */
  async getChildren(parentId: string): Promise<SupabaseResponse<Folder[]>> {
    if (!supabase) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .eq('parent_folder_id', parentId)
        .order('name', { ascending: true });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: transformArray(data || [], folderFromSupabase) };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  /**
   * Create new folder
   */
  async create(folder: Partial<Folder>): Promise<SupabaseResponse<Folder>> {
    if (!supabase) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      const supabaseFolder = folderToSupabase(folder);

      const { data, error } = await supabase
        .from('folders')
        .insert(supabaseFolder)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: folderFromSupabase(data) };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  /**
   * Update folder
   */
  async update(id: string, updates: Partial<Folder>): Promise<SupabaseResponse<Folder>> {
    if (!supabase) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      const supabaseUpdates = folderToSupabase({
        ...updates,
        updatedAt: new Date(),
      });

      const { data, error } = await supabase
        .from('folders')
        .update(supabaseUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: folderFromSupabase(data) };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  /**
   * Delete folder
   */
  async delete(id: string): Promise<SupabaseResponse<void>> {
    if (!supabase) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      const { error } = await supabase.from('folders').delete().eq('id', id);

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
