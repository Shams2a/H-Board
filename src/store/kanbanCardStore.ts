/**
 * Kanban Card Store
 * Manages state for Kanban cards using Zustand
 */

import { create } from 'zustand';
import { generateId } from '../utils/uuid';
import { supabaseKanbanCardService } from '../services/supabase/kanbanService';
import { getCollaborationService } from '../services/collaboration/collaborationService';
import { logger } from '../utils/logger';
import { useKanbanColumnStore } from './kanbanColumnStore';
import type {
  KanbanCard,
  KanbanFilters,
} from '../types';

interface KanbanCardStore {
  // State
  cards: Record<string, KanbanCard[]>; // boardId -> cards
  filters: KanbanFilters;

  // Cards CRUD
  createCard: (columnId: string, title: string) => Promise<KanbanCard>;
  updateCard: (id: string, updates: Partial<KanbanCard>) => Promise<void>;
  deleteCard: (id: string) => Promise<void>;
  moveCard: (cardId: string, toColumnId: string, position: number) => Promise<void>;

  // Filters
  setFilters: (filters: KanbanFilters) => void;
  getFilteredCards: (boardId: string) => KanbanCard[];

  // Load / clear
  loadCards: (boardId: string) => Promise<KanbanCard[]>;
  clearCards: (boardId: string) => void;

  // Realtime sync helpers (called by collaboration service)
  addCardFromRemote: (card: KanbanCard) => void;
  updateCardFromRemote: (card: KanbanCard) => void;
  deleteCardFromRemote: (cardId: string) => void;
}

export const useKanbanCardStore = create<KanbanCardStore>((set, get) => ({
  cards: {},
  filters: {},

  createCard: async (columnId: string, title: string) => {
    // Find board ID from column (read from column store)
    let boardId = '';
    const columnState = useKanbanColumnStore.getState();
    Object.entries(columnState.columns).forEach(([bid, columns]) => {
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
    } else {
      // Broadcast card creation in real-time
      try {
        const collabService = getCollaborationService();
        collabService.broadcast({
          type: 'kanban_card_created',
          payload: newCard,
          userId: (collabService as any).userId,
          timestamp: Date.now(),
        });
        logger.debug('Broadcast kanban_card_created:', newCard.id);
      } catch (err) {
        console.warn('Failed to broadcast card creation:', err);
      }
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
    } else {
      // Broadcast card update in real-time
      try {
        const collabService = getCollaborationService();
        // Find the updated card
        let updatedCard: KanbanCard | null = null;
        Object.values(get().cards).forEach(cards => {
          const found = cards.find(c => c.id === id);
          if (found) updatedCard = found;
        });

        if (updatedCard) {
          collabService.broadcast({
            type: 'kanban_card_updated',
            payload: updatedCard,
            userId: (collabService as any).userId,
            timestamp: Date.now(),
          });
          logger.debug('Broadcast kanban_card_updated:', id);
        }
      } catch (err) {
        console.warn('Failed to broadcast card update:', err);
      }
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
    } else {
      // Broadcast card deletion in real-time
      try {
        const collabService = getCollaborationService();
        collabService.broadcast({
          type: 'kanban_card_deleted',
          payload: { id },
          userId: (collabService as any).userId,
          timestamp: Date.now(),
        });
        logger.debug('Broadcast kanban_card_deleted:', id);
      } catch (err) {
        console.warn('Failed to broadcast card deletion:', err);
      }
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
    } else {
      // Broadcast ALL affected cards (moved card + reordered cards in target column)
      try {
        const collabService = getCollaborationService();

        // Find all cards in the target column (they all got new positions)
        let affectedCards: KanbanCard[] = [];
        Object.values(get().cards).forEach(cards => {
          const columnCards = cards.filter(c => c.columnId === toColumnId);
          affectedCards = [...affectedCards, ...columnCards];
        });

        // Broadcast each affected card
        affectedCards.forEach(card => {
          collabService.broadcast({
            type: 'kanban_card_updated',
            payload: card,
            userId: (collabService as any).userId,
            timestamp: Date.now(),
          });
        });

        logger.debug(`Broadcast kanban_card_updated (moved ${cardId} + ${affectedCards.length - 1} reordered)`);
      } catch (err) {
        console.warn('Failed to broadcast card move:', err);
      }
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

  loadCards: async (boardId: string) => {
    const cardsResult = await supabaseKanbanCardService.getByBoard(boardId);

    if (cardsResult.success) {
      const cards = cardsResult.data || [];
      set((state) => ({
        cards: {
          ...state.cards,
          [boardId]: cards
        }
      }));
      return cards;
    } else {
      console.warn('Failed to load cards from Supabase, using local state');
      return get().cards[boardId] || [];
    }
  },

  clearCards: (boardId: string) => {
    set((state) => {
      const { [boardId]: _, ...remainingCards } = state.cards;
      return { cards: remainingCards };
    });
  },

  // Realtime sync helpers
  addCardFromRemote: (card: KanbanCard) => {
    set((state) => {
      const boardCards = state.cards[card.boardId] || [];
      // Check if already exists (avoid duplicates)
      if (boardCards.some(c => c.id === card.id)) {
        return state;
      }
      return {
        cards: {
          ...state.cards,
          [card.boardId]: [...boardCards, card]
        }
      };
    });
  },

  updateCardFromRemote: (card: KanbanCard) => {
    logger.debug('[kanbanStore] updateCardFromRemote called:', {
      cardId: card.id,
      cardTitle: card.title,
      columnId: card.columnId,
      position: card.position,
      boardId: card.boardId
    });

    set((state) => {
      const currentCards = state.cards[card.boardId] || [];
      const cardExists = currentCards.some(c => c.id === card.id);

      logger.debug('[kanbanStore] Current state:', {
        totalCards: currentCards.length,
        cardExists,
        cardsInSameColumn: currentCards.filter(c => c.columnId === card.columnId).length
      });

      const updatedCards = currentCards.map(c => {
        if (c.id === card.id) {
          logger.debug('[kanbanStore] Replacing card:', {
            oldPosition: c.position,
            newPosition: card.position,
            oldColumnId: c.columnId,
            newColumnId: card.columnId
          });
          return card;
        }
        return c;
      });

      return {
        cards: {
          ...state.cards,
          [card.boardId]: updatedCards
        }
      };
    });

    logger.debug('[kanbanStore] updateCardFromRemote completed');
  },

  deleteCardFromRemote: (cardId: string) => {
    set((state) => {
      const updatedCards: Record<string, KanbanCard[]> = {};
      Object.entries(state.cards).forEach(([boardId, cards]) => {
        updatedCards[boardId] = cards.filter(c => c.id !== cardId);
      });
      return { cards: updatedCards };
    });
  }
}));

// Selectors
type KanbanCardStoreState = ReturnType<typeof useKanbanCardStore.getState>;
export const selectCards = (state: KanbanCardStoreState) => state.cards;
export const selectCardsByColumn = (columnId: string) => (state: KanbanCardStoreState) => {
  for (const cards of Object.values(state.cards)) {
    const filtered = cards.filter(c => c.columnId === columnId);
    if (filtered.length > 0) return filtered;
  }
  return [];
};
export const selectCardById = (id: string) => (state: KanbanCardStoreState) => {
  for (const cards of Object.values(state.cards)) {
    const found = cards.find(c => c.id === id);
    if (found) return found;
  }
  return undefined;
};
export const selectFilters = (state: KanbanCardStoreState) => state.filters;
