/**
 * Kanban Store
 * Manages state for Kanban boards using Zustand
 */

import { create } from 'zustand';
import { generateId } from '../utils/uuid';
import { supabaseKanbanColumnService, supabaseKanbanCardService } from '../services/supabase/kanbanService';
import type {
  KanbanColumn,
  KanbanCard,
  KanbanFilters,
  KanbanPriority,
  ChecklistItem,
  Attachment
} from '../types';

interface KanbanStore {
  // State
  columns: Record<string, KanbanColumn[]>; // boardId -> columns
  cards: Record<string, KanbanCard[]>; // boardId -> cards
  filters: KanbanFilters;

  // Columns CRUD
  createColumn: (boardId: string, name: string, color?: string) => Promise<KanbanColumn>;
  updateColumn: (id: string, updates: Partial<KanbanColumn>) => Promise<void>;
  deleteColumn: (id: string) => Promise<void>;
  reorderColumns: (boardId: string, columnIds: string[]) => Promise<void>;

  // Cards CRUD
  createCard: (columnId: string, title: string) => Promise<KanbanCard>;
  updateCard: (id: string, updates: Partial<KanbanCard>) => Promise<void>;
  deleteCard: (id: string) => Promise<void>;
  moveCard: (cardId: string, toColumnId: string, position: number) => Promise<void>;

  // Filters
  setFilters: (filters: KanbanFilters) => void;
  getFilteredCards: (boardId: string) => KanbanCard[];

  // Load data
  loadKanbanBoard: (boardId: string) => Promise<void>;
  clearKanbanBoard: (boardId: string) => void;
}

export const useKanbanStore = create<KanbanStore>((set, get) => ({
  columns: {},
  cards: {},
  filters: {},

  createColumn: async (boardId: string, name: string, color = '#9CA3AF') => {
    const boardColumns = get().columns[boardId] || [];
    const position = boardColumns.length;

    const newColumn: KanbanColumn = {
      id: generateId(),
      boardId,
      name,
      color,
      position,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Optimistic update
    set((state) => ({
      columns: {
        ...state.columns,
        [boardId]: [...(state.columns[boardId] || []), newColumn]
      }
    }));

    // Persist to Supabase
    const result = await supabaseKanbanColumnService.create(newColumn);
    if (!result.success) {
      console.error('Failed to create column in Supabase:', result.error);
      // Rollback on error
      set((state) => ({
        columns: {
          ...state.columns,
          [boardId]: (state.columns[boardId] || []).filter(c => c.id !== newColumn.id)
        }
      }));
    }

    return newColumn;
  },

  updateColumn: async (id: string, updates: Partial<KanbanColumn>) => {
    // Store previous state for rollback
    const prevState = get().columns;

    // Optimistic update
    set((state) => {
      const updatedColumns: Record<string, KanbanColumn[]> = {};

      Object.entries(state.columns).forEach(([boardId, columns]) => {
        updatedColumns[boardId] = columns.map((col) =>
          col.id === id ? { ...col, ...updates, updatedAt: new Date() } : col
        );
      });

      return { columns: updatedColumns };
    });

    // Persist to Supabase
    const result = await supabaseKanbanColumnService.update(id, updates);
    if (!result.success) {
      console.error('Failed to update column in Supabase:', result.error);
      // Rollback on error
      set({ columns: prevState });
    }
  },

  deleteColumn: async (id: string) => {
    // Store previous state for rollback
    const prevState = get().columns;

    // Optimistic update
    set((state) => {
      const updatedColumns: Record<string, KanbanColumn[]> = {};

      Object.entries(state.columns).forEach(([boardId, columns]) => {
        updatedColumns[boardId] = columns.filter((col) => col.id !== id);
      });

      return { columns: updatedColumns };
    });

    // Persist to Supabase
    const result = await supabaseKanbanColumnService.delete(id);
    if (!result.success) {
      console.error('Failed to delete column in Supabase:', result.error);
      // Rollback on error
      set({ columns: prevState });
    }

    // Note: Cards in deleted column are automatically deleted by ON DELETE CASCADE
  },

  reorderColumns: async (boardId: string, columnIds: string[]) => {
    const boardColumns = get().columns[boardId] || [];
    const prevState = get().columns;

    const reordered = columnIds.map((id, index) => {
      const column = boardColumns.find((col) => col.id === id);
      return column ? { ...column, position: index } : null;
    }).filter(Boolean) as KanbanColumn[];

    // Optimistic update
    set((state) => ({
      columns: {
        ...state.columns,
        [boardId]: reordered
      }
    }));

    // Persist to Supabase
    const positions = reordered.map((_, idx) => idx);
    const result = await supabaseKanbanColumnService.reorder(columnIds, positions);
    if (!result.success) {
      console.error('Failed to reorder columns in Supabase:', result.error);
      // Rollback on error
      set({ columns: prevState });
    }
  },

  createCard: async (columnId: string, title: string) => {
    // Find board ID from column
    let boardId = '';
    Object.entries(get().columns).forEach(([bid, columns]) => {
      if (columns.some((col) => col.id === columnId)) {
        boardId = bid;
      }
    });

    const boardCards = get().cards[boardId] || [];
    const columnCards = boardCards.filter((card) => card.columnId === columnId);
    const position = columnCards.length;

    const newCard: KanbanCard = {
      id: generateId(),
      boardId,
      columnId,
      title,
      description: '',
      position,
      tags: [],
      priority: 'medium',
      attachments: [],
      checklist: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Optimistic update
    set((state) => ({
      cards: {
        ...state.cards,
        [boardId]: [...(state.cards[boardId] || []), newCard]
      }
    }));

    // Persist to Supabase
    const result = await supabaseKanbanCardService.create(newCard);
    if (!result.success) {
      console.error('Failed to create card in Supabase:', result.error);
      // Rollback on error
      set((state) => ({
        cards: {
          ...state.cards,
          [boardId]: (state.cards[boardId] || []).filter(c => c.id !== newCard.id)
        }
      }));
    }

    return newCard;
  },

  updateCard: async (id: string, updates: Partial<KanbanCard>) => {
    const prevState = get().cards;

    // Optimistic update
    set((state) => {
      const updatedCards: Record<string, KanbanCard[]> = {};

      Object.entries(state.cards).forEach(([boardId, cards]) => {
        updatedCards[boardId] = cards.map((card) =>
          card.id === id ? { ...card, ...updates, updatedAt: new Date() } : card
        );
      });

      return { cards: updatedCards };
    });

    // Persist to Supabase
    const result = await supabaseKanbanCardService.update(id, updates);
    if (!result.success) {
      console.error('Failed to update card in Supabase:', result.error);
      // Rollback on error
      set({ cards: prevState });
    }
  },

  deleteCard: async (id: string) => {
    const prevState = get().cards;

    // Optimistic update
    set((state) => {
      const updatedCards: Record<string, KanbanCard[]> = {};

      Object.entries(state.cards).forEach(([boardId, cards]) => {
        updatedCards[boardId] = cards.filter((card) => card.id !== id);
      });

      return { cards: updatedCards };
    });

    // Persist to Supabase
    const result = await supabaseKanbanCardService.delete(id);
    if (!result.success) {
      console.error('Failed to delete card in Supabase:', result.error);
      // Rollback on error
      set({ cards: prevState });
    }
  },

  moveCard: async (cardId: string, toColumnId: string, position: number) => {
    const prevState = get().cards;

    // Optimistic update
    set((state) => {
      const updatedCards: Record<string, KanbanCard[]> = {};

      Object.entries(state.cards).forEach(([boardId, cards]) => {
        // Find the card being moved
        const card = cards.find((c) => c.id === cardId);
        if (!card) {
          updatedCards[boardId] = cards;
          return;
        }

        // Update card's column and position
        const movedCard = { ...card, columnId: toColumnId, position, updatedAt: new Date() };

        // Reorder cards in the target column
        const otherCards = cards.filter((c) => c.id !== cardId);
        const targetColumnCards = otherCards.filter((c) => c.columnId === toColumnId);

        // Insert at position
        targetColumnCards.splice(position, 0, movedCard);

        // Update positions for all cards in target column
        const reorderedTargetCards = targetColumnCards.map((c, idx) => ({
          ...c,
          position: idx
        }));

        // Combine with cards from other columns
        const otherColumnCards = otherCards.filter((c) => c.columnId !== toColumnId);

        updatedCards[boardId] = [...otherColumnCards, ...reorderedTargetCards];
      });

      return { cards: updatedCards };
    });

    // Persist to Supabase
    const result = await supabaseKanbanCardService.update(cardId, { columnId: toColumnId, position });
    if (!result.success) {
      console.error('Failed to move card in Supabase:', result.error);
      // Rollback on error
      set({ cards: prevState });
    }
  },

  setFilters: (filters: KanbanFilters) => {
    set({ filters });
  },

  getFilteredCards: (boardId: string) => {
    const cards = get().cards[boardId] || [];
    const { searchQuery, tags, priorities, dateFilter } = get().filters;

    let filtered = cards;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (card) =>
          card.title.toLowerCase().includes(query) ||
          card.description.toLowerCase().includes(query)
      );
    }

    // Tags filter
    if (tags && tags.length > 0) {
      filtered = filtered.filter((card) =>
        tags.some((tag) => card.tags.includes(tag))
      );
    }

    // Priority filter
    if (priorities && priorities.length > 0) {
      filtered = filtered.filter((card) => priorities.includes(card.priority));
    }

    // Date filter
    if (dateFilter && dateFilter !== 'all') {
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());

      filtered = filtered.filter((card) => {
        if (dateFilter === 'overdue') {
          return card.dueDate && card.dueDate < today;
        } else if (dateFilter === 'thisWeek') {
          return card.dueDate && card.dueDate >= startOfWeek;
        } else if (dateFilter === 'noDate') {
          return !card.dueDate;
        }
        return true;
      });
    }

    return filtered;
  },

  loadKanbanBoard: async (boardId: string) => {
    // Check if already loaded to avoid duplicates
    const existingColumns = get().columns[boardId];
    if (existingColumns && existingColumns.length > 0) {
      console.log('Kanban board already loaded, skipping');
      return;
    }

    // Load from Supabase
    const columnsResult = await supabaseKanbanColumnService.getByBoard(boardId);
    const cardsResult = await supabaseKanbanCardService.getByBoard(boardId);

    if (columnsResult.success && cardsResult.success) {
      // Got data from Supabase
      const columns = columnsResult.data || [];
      const cards = cardsResult.data || [];

      // If no columns exist, create default ones
      if (columns.length === 0) {
        const defaultColumns: KanbanColumn[] = [
          {
            id: generateId(),
            boardId,
            name: 'À faire',
            color: '#9CA3AF',
            position: 0,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: generateId(),
            boardId,
            name: 'En cours',
            color: '#60A5FA',
            position: 1,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: generateId(),
            boardId,
            name: 'Terminé',
            color: '#34D399',
            position: 2,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ];

        // Set local state first
        set((state) => ({
          columns: {
            ...state.columns,
            [boardId]: defaultColumns
          },
          cards: {
            ...state.cards,
            [boardId]: []
          }
        }));

        // Try to create in Supabase (may fail if board not synced yet)
        const results = await Promise.allSettled(
          defaultColumns.map(col => supabaseKanbanColumnService.create(col))
        );

        // Check for failures (likely FK constraint if board not synced)
        const hasFailures = results.some(r => r.status === 'rejected' ||
          (r.status === 'fulfilled' && !r.value.success));

        if (hasFailures) {
          console.warn(
            'Some columns failed to sync to Supabase (board may not be synced yet). ' +
            'Columns saved locally and will sync when you create/update them.'
          );
        }
      } else {
        // Use data from Supabase
        set((state) => ({
          columns: {
            ...state.columns,
            [boardId]: columns
          },
          cards: {
            ...state.cards,
            [boardId]: cards
          }
        }));
      }
    } else {
      // Supabase not configured or error - use local state
      console.warn('Failed to load from Supabase, using local state');
      const existingColumns = get().columns[boardId];

      if (!existingColumns || existingColumns.length === 0) {
        // Create default columns in local state only
        const defaultColumns: KanbanColumn[] = [
          {
            id: generateId(),
            boardId,
            name: 'À faire',
            color: '#9CA3AF',
            position: 0,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: generateId(),
            boardId,
            name: 'En cours',
            color: '#60A5FA',
            position: 1,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: generateId(),
            boardId,
            name: 'Terminé',
            color: '#34D399',
            position: 2,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ];

        set((state) => ({
          columns: {
            ...state.columns,
            [boardId]: defaultColumns
          },
          cards: {
            ...state.cards,
            [boardId]: []
          }
        }));
      }
    }
  },

  clearKanbanBoard: (boardId: string) => {
    set((state) => {
      const { [boardId]: _, ...remainingColumns } = state.columns;
      const { [boardId]: __, ...remainingCards } = state.cards;

      return {
        columns: remainingColumns,
        cards: remainingCards
      };
    });
  }
}));
