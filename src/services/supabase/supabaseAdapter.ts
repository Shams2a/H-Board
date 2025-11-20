/**
 * Supabase Adapter
 * Adapts Supabase services to work with the existing SyncService architecture
 */

import { supabaseBoardService } from './boardService';
import { supabaseElementService } from './elementService';
import { supabaseFolderService } from './folderService';
import type { Board, BoardElement } from '../../types';
import type { Folder } from '../../utils/db';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Supabase Adapter
 * Provides a unified API interface for the SyncService
 */
export const supabaseAdapter = {
  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const result = await supabaseBoardService.getAll();
      return result.success;
    } catch {
      return false;
    }
  },

  /**
   * Board operations
   */
  board: {
    async getAll(): Promise<ApiResponse<Board[]>> {
      const result = await supabaseBoardService.getAll();
      return {
        success: result.success,
        data: result.data,
        error: result.error
      };
    },

    async getById(id: string): Promise<ApiResponse<Board>> {
      const result = await supabaseBoardService.getById(id);
      return {
        success: result.success,
        data: result.data,
        error: result.error
      };
    },

    async create(board: Partial<Board>): Promise<ApiResponse<Board>> {
      const result = await supabaseBoardService.create(board);
      return {
        success: result.success,
        data: result.data,
        error: result.error
      };
    },

    async update(id: string, updates: Partial<Board>): Promise<ApiResponse<Board>> {
      const result = await supabaseBoardService.update(id, updates);
      return {
        success: result.success,
        data: result.data,
        error: result.error
      };
    },

    async delete(id: string): Promise<ApiResponse<void>> {
      const result = await supabaseBoardService.delete(id);
      return {
        success: result.success,
        error: result.error
      };
    }
  },

  /**
   * Element operations
   */
  element: {
    async getByBoard(boardId: string): Promise<ApiResponse<BoardElement[]>> {
      const result = await supabaseElementService.getByBoard(boardId);
      return {
        success: result.success,
        data: result.data,
        error: result.error
      };
    },

    async getById(id: string): Promise<ApiResponse<BoardElement>> {
      const result = await supabaseElementService.getById(id);
      return {
        success: result.success,
        data: result.data,
        error: result.error
      };
    },

    async create(element: Partial<BoardElement>): Promise<ApiResponse<BoardElement>> {
      const result = await supabaseElementService.create(element);
      return {
        success: result.success,
        data: result.data,
        error: result.error
      };
    },

    async update(id: string, updates: Partial<BoardElement>): Promise<ApiResponse<BoardElement>> {
      const result = await supabaseElementService.update(id, updates);
      return {
        success: result.success,
        data: result.data,
        error: result.error
      };
    },

    async delete(id: string): Promise<ApiResponse<void>> {
      const result = await supabaseElementService.delete(id);
      return {
        success: result.success,
        error: result.error
      };
    },

    async bulkUpdate(updates: Array<{ id: string; updates: Partial<BoardElement> }>): Promise<ApiResponse<BoardElement[]>> {
      const result = await supabaseElementService.bulkUpdate(updates);
      return {
        success: result.success,
        data: result.data,
        error: result.error
      };
    }
  },

  /**
   * Folder operations
   */
  folder: {
    async getAll(): Promise<ApiResponse<Folder[]>> {
      const result = await supabaseFolderService.getAll();
      return {
        success: result.success,
        data: result.data as Folder[],
        error: result.error
      };
    },

    async getById(id: string): Promise<ApiResponse<Folder>> {
      const result = await supabaseFolderService.getById(id);
      return {
        success: result.success,
        data: result.data as Folder,
        error: result.error
      };
    },

    async create(folder: Partial<Folder>): Promise<ApiResponse<Folder>> {
      const result = await supabaseFolderService.create(folder);
      return {
        success: result.success,
        data: result.data as Folder,
        error: result.error
      };
    },

    async update(id: string, updates: Partial<Folder>): Promise<ApiResponse<Folder>> {
      const result = await supabaseFolderService.update(id, updates);
      return {
        success: result.success,
        data: result.data as Folder,
        error: result.error
      };
    },

    async delete(id: string): Promise<ApiResponse<void>> {
      const result = await supabaseFolderService.delete(id);
      return {
        success: result.success,
        error: result.error
      };
    }
  }
};
