/**
 * Kanban Store — Thin orchestration & re-export layer
 *
 * All column logic lives in kanbanColumnStore.ts
 * All card logic lives in kanbanCardStore.ts
 *
 * This file re-exports everything under `useKanbanStore` so that
 * existing consumers continue to work without any import changes.
 */

import { useKanbanColumnStore, selectColumns, selectColumnById } from './kanbanColumnStore';
import {
  useKanbanCardStore,
  selectCards,
  selectCardsByColumn,
  selectCardById,
  selectFilters,
} from './kanbanCardStore';

// ---------------------------------------------------------------------------
// Combined hook — backward-compatible drop-in for the old useKanbanStore
// ---------------------------------------------------------------------------

/**
 * Returns a combined API surface that mirrors the original monolithic store.
 * Every existing destructuring pattern (e.g. `const { columns, createCard } = useKanbanStore()`)
 * continues to work unchanged.
 */
export function useKanbanStore() {
  const columnStore = useKanbanColumnStore();
  const cardStore = useKanbanCardStore();

  return {
    // --- state ---
    columns: columnStore.columns,
    cards: cardStore.cards,
    filters: cardStore.filters,

    // --- column CRUD ---
    createColumn: columnStore.createColumn,
    updateColumn: columnStore.updateColumn,
    deleteColumn: columnStore.deleteColumn,
    reorderColumns: columnStore.reorderColumns,

    // --- card CRUD ---
    createCard: cardStore.createCard,
    updateCard: cardStore.updateCard,
    deleteCard: cardStore.deleteCard,
    moveCard: cardStore.moveCard,

    // --- filters ---
    setFilters: cardStore.setFilters,
    getFilteredCards: cardStore.getFilteredCards,

    // --- orchestration ---
    loadKanbanBoard: async (boardId: string) => {
      // Check if already loaded to avoid duplicates
      const existingColumns = useKanbanColumnStore.getState().columns[boardId];
      if (existingColumns && existingColumns.length > 0) {
        // Kanban board already loaded, skipping
        return;
      }

      // Load columns first (may create defaults), then cards
      const columns = await useKanbanColumnStore.getState().loadColumns(boardId);
      await useKanbanCardStore.getState().loadCards(boardId);

      // If columns were freshly created defaults and cards came back empty,
      // make sure the card state is initialised for that board
      if (columns.length > 0) {
        const currentCards = useKanbanCardStore.getState().cards[boardId];
        if (!currentCards) {
          useKanbanCardStore.setState((state) => ({
            cards: { ...state.cards, [boardId]: [] },
          }));
        }
      }
    },

    clearKanbanBoard: (boardId: string) => {
      useKanbanColumnStore.getState().clearColumns(boardId);
      useKanbanCardStore.getState().clearCards(boardId);
    },

    // --- realtime sync helpers ---
    addColumnFromRemote: columnStore.addColumnFromRemote,
    updateColumnFromRemote: columnStore.updateColumnFromRemote,
    deleteColumnFromRemote: columnStore.deleteColumnFromRemote,
    addCardFromRemote: cardStore.addCardFromRemote,
    updateCardFromRemote: cardStore.updateCardFromRemote,
    deleteCardFromRemote: cardStore.deleteCardFromRemote,
  };
}

// ---------------------------------------------------------------------------
// Re-export selectors (backwards-compatible)
// ---------------------------------------------------------------------------

// Column selectors operate on the column store state shape which has a `columns` key.
// Card selectors operate on the card store state shape which has `cards` & `filters` keys.
// We re-export them so that call-sites importing from this file keep working.
export {
  selectColumns,
  selectColumnById,
  selectCards,
  selectCardsByColumn,
  selectCardById,
  selectFilters,
};

// Re-export sub-stores for consumers that want to use them directly
export { useKanbanColumnStore } from './kanbanColumnStore';
export { useKanbanCardStore } from './kanbanCardStore';
