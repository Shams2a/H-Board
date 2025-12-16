/**
 * Supabase Kanban Service
 * Handles all Kanban-related operations with Supabase
 */

import { supabase } from '../../lib/supabase';
import type { KanbanColumn, KanbanCard } from '../../types';

export interface SupabaseResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}

// ============================================================================
// COLUMNS
// ============================================================================

export const supabaseKanbanColumnService = {
  /**
   * Get all columns for a board
   */
  async getByBoard(boardId: string): Promise<SupabaseResponse<KanbanColumn[]>> {
    if (!supabase) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      const { data, error } = await supabase
        .from('kanban_columns')
        .select('*')
        .eq('board_id', boardId)
        .order('position', { ascending: true });

      if (error) {
        return { success: false, error: error.message };
      }

      // Transform from snake_case to camelCase
      const columns: KanbanColumn[] = (data || []).map((col: any) => ({
        id: col.id,
        boardId: col.board_id,
        name: col.name,
        color: col.color,
        position: col.position,
        wipLimit: col.wip_limit,
        createdAt: new Date(col.created_at),
        updatedAt: new Date(col.updated_at)
      }));

      return { success: true, data: columns };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  /**
   * Create a new column
   */
  async create(column: Omit<KanbanColumn, 'createdAt' | 'updatedAt'>): Promise<SupabaseResponse<KanbanColumn>> {
    if (!supabase) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      const { data, error } = await supabase
        .from('kanban_columns')
        .insert({
          id: column.id,
          board_id: column.boardId,
          name: column.name,
          color: column.color,
          position: column.position,
          wip_limit: column.wipLimit
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      const createdColumn: KanbanColumn = {
        id: data.id,
        boardId: data.board_id,
        name: data.name,
        color: data.color,
        position: data.position,
        wipLimit: data.wip_limit,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };

      return { success: true, data: createdColumn };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  /**
   * Update a column
   */
  async update(id: string, updates: Partial<Omit<KanbanColumn, 'id' | 'boardId' | 'createdAt' | 'updatedAt'>>): Promise<SupabaseResponse<KanbanColumn>> {
    if (!supabase) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      const updateData: any = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.color !== undefined) updateData.color = updates.color;
      if (updates.position !== undefined) updateData.position = updates.position;
      if (updates.wipLimit !== undefined) updateData.wip_limit = updates.wipLimit;

      const { data, error } = await supabase
        .from('kanban_columns')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      const updatedColumn: KanbanColumn = {
        id: data.id,
        boardId: data.board_id,
        name: data.name,
        color: data.color,
        position: data.position,
        wipLimit: data.wip_limit,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };

      return { success: true, data: updatedColumn };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  /**
   * Delete a column
   */
  async delete(id: string): Promise<SupabaseResponse<void>> {
    if (!supabase) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      const { error } = await supabase
        .from('kanban_columns')
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
   * Reorder columns
   */
  async reorder(columnIds: string[], positions: number[]): Promise<SupabaseResponse<void>> {
    if (!supabase) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      // Update each column's position
      const updates = columnIds.map((id, index) =>
        supabase
          .from('kanban_columns')
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
// CARDS
// ============================================================================

export const supabaseKanbanCardService = {
  /**
   * Get all cards for a board
   */
  async getByBoard(boardId: string): Promise<SupabaseResponse<KanbanCard[]>> {
    if (!supabase) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      const { data, error } = await supabase
        .from('kanban_cards')
        .select('*')
        .eq('board_id', boardId)
        .order('position', { ascending: true });

      if (error) {
        return { success: false, error: error.message };
      }

      // Transform from snake_case to camelCase
      const cards: KanbanCard[] = (data || []).map((card: any) => ({
        id: card.id,
        boardId: card.board_id,
        columnId: card.column_id,
        title: card.title,
        description: card.description || '',
        position: card.position,
        tags: card.tags || [],
        priority: card.priority || 'medium',
        dueDate: card.due_date ? new Date(card.due_date) : undefined,
        startDate: card.start_date ? new Date(card.start_date) : undefined,
        coverImage: card.cover_image,
        attachments: card.attachments || [],
        checklist: card.checklist || [],
        createdAt: new Date(card.created_at),
        updatedAt: new Date(card.updated_at)
      }));

      return { success: true, data: cards };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  /**
   * Create a new card
   */
  async create(card: Omit<KanbanCard, 'createdAt' | 'updatedAt'>): Promise<SupabaseResponse<KanbanCard>> {
    if (!supabase) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      const { data, error } = await supabase
        .from('kanban_cards')
        .insert({
          id: card.id,
          board_id: card.boardId,
          column_id: card.columnId,
          title: card.title,
          description: card.description,
          position: card.position,
          tags: card.tags,
          priority: card.priority,
          due_date: card.dueDate?.toISOString(),
          start_date: card.startDate?.toISOString(),
          cover_image: card.coverImage,
          attachments: card.attachments,
          checklist: card.checklist
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      const createdCard: KanbanCard = {
        id: data.id,
        boardId: data.board_id,
        columnId: data.column_id,
        title: data.title,
        description: data.description || '',
        position: data.position,
        tags: data.tags || [],
        priority: data.priority || 'medium',
        dueDate: data.due_date ? new Date(data.due_date) : undefined,
        startDate: data.start_date ? new Date(data.start_date) : undefined,
        coverImage: data.cover_image,
        attachments: data.attachments || [],
        checklist: data.checklist || [],
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };

      return { success: true, data: createdCard };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  /**
   * Update a card
   */
  async update(id: string, updates: Partial<Omit<KanbanCard, 'id' | 'boardId' | 'createdAt' | 'updatedAt'>>): Promise<SupabaseResponse<KanbanCard>> {
    if (!supabase) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      const updateData: any = {};
      if (updates.columnId !== undefined) updateData.column_id = updates.columnId;
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.position !== undefined) updateData.position = updates.position;
      if (updates.tags !== undefined) updateData.tags = updates.tags;
      if (updates.priority !== undefined) updateData.priority = updates.priority;
      if (updates.dueDate !== undefined) updateData.due_date = updates.dueDate?.toISOString();
      if (updates.startDate !== undefined) updateData.start_date = updates.startDate?.toISOString();
      if (updates.coverImage !== undefined) updateData.cover_image = updates.coverImage;
      if (updates.attachments !== undefined) updateData.attachments = updates.attachments;
      if (updates.checklist !== undefined) updateData.checklist = updates.checklist;

      const { data, error } = await supabase
        .from('kanban_cards')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      const updatedCard: KanbanCard = {
        id: data.id,
        boardId: data.board_id,
        columnId: data.column_id,
        title: data.title,
        description: data.description || '',
        position: data.position,
        tags: data.tags || [],
        priority: data.priority || 'medium',
        dueDate: data.due_date ? new Date(data.due_date) : undefined,
        startDate: data.start_date ? new Date(data.start_date) : undefined,
        coverImage: data.cover_image,
        attachments: data.attachments || [],
        checklist: data.checklist || [],
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };

      return { success: true, data: updatedCard };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  /**
   * Delete a card
   */
  async delete(id: string): Promise<SupabaseResponse<void>> {
    if (!supabase) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      const { error } = await supabase
        .from('kanban_cards')
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
