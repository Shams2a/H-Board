/**
 * Broadcast event handlers for real-time synchronization.
 * Pure functions that don't depend on React hooks.
 */

import { useElementStore } from '../store/elementStore';
import { useKanbanColumnStore, useKanbanCardStore } from '../store/kanbanStore';
import { useDatabaseStore } from '../store/databaseStore';
import { useEditingStore } from '../store/editingStore';
import { useBoardStore } from '../store/boardStore';
import { db, elementOperations, boardOperations } from '../utils/db';
import { logger } from '../utils/logger';
import type { BroadcastEvent } from '../types/collaboration';
import type { Element, Board, KanbanColumn, KanbanCard, DatabaseProperty, DatabaseRow, DatabaseView } from '../types';

/**
 * Handle element CRUD broadcast events (element_created, element_updated, element_deleted, elements_deleted).
 */
export function handleElementEvent(
  event: BroadcastEvent,
  setElements: ReturnType<typeof useElementStore.getState>['setElements']
): void {
  switch (event.type) {
    case 'element_created':
      if (event.payload) {
        db.elements.put(event.payload as Element).catch((err: any) => {
          logger.warn('Failed to add element to IndexedDB:', err);
        });

        setElements((prevElements) => {
          const exists = prevElements.some((el: any) => el.id === event.payload.id);
          if (exists) return prevElements;
          return [...prevElements, event.payload as Element];
        });
      }
      break;

    case 'element_updated':
      if (event.payload) {
        db.elements.put(event.payload as Element).catch((err: any) => {
          logger.warn('Failed to update element in IndexedDB:', err);
        });

        setElements((prevElements) => {
          const oldElement = prevElements.find((el: any) => el.id === event.payload.id);
          if (!oldElement) {
            return [...prevElements, event.payload as Element];
          }
          return prevElements.map((el: any) =>
            el.id === event.payload.id ? (event.payload as Element) : el
          );
        });
      }
      break;

    case 'element_deleted':
      if (event.payload && event.payload.id) {
        const deletedAt = new Date();
        elementOperations.update(event.payload.id, {
          deletedAt,
          updatedAt: deletedAt,
        }).catch((err: any) => {
          logger.warn('Failed to delete element in IndexedDB:', err);
        });

        setElements((prevElements) =>
          prevElements.filter((el: any) => el.id !== event.payload.id)
        );
      }
      break;

    case 'elements_deleted':
      if (event.payload && event.payload.ids && Array.isArray(event.payload.ids)) {
        const ids = event.payload.ids as string[];
        const deletedAt = new Date();
        for (const id of ids) {
          elementOperations.update(id, {
            deletedAt,
            updatedAt: deletedAt,
          }).catch((err: any) => {
            logger.warn('Failed to delete element in IndexedDB:', id, err);
          });
        }

        setElements((prevElements) => {
          const idsSet = new Set(ids);
          return prevElements.filter((el: any) => !idsSet.has(el.id));
        });
      }
      break;
  }
}

/**
 * Handle board CRUD broadcast events (board_created, board_updated, board_deleted).
 */
export function handleBoardEvent(event: BroadcastEvent): void {
  const { loadBoards } = useBoardStore.getState();

  switch (event.type) {
    case 'board_created':
      if (event.payload) {
        db.boards.put(event.payload as Board)
          .then(() => loadBoards())
          .catch((err: any) => {
            logger.warn('Failed to add board to IndexedDB:', err);
            loadBoards();
          });
      }
      break;

    case 'board_updated':
      if (event.payload) {
        db.boards.put(event.payload as Board)
          .then(() => loadBoards())
          .catch((err: any) => {
            logger.warn('Failed to update board in IndexedDB:', err);
            loadBoards();
          });
      }
      break;

    case 'board_deleted':
      if (event.payload && event.payload.id) {
        const deletedAt = new Date();
        boardOperations.update(event.payload.id, {
          deletedAt,
          updatedAt: deletedAt,
        })
          .then(() => loadBoards())
          .catch((err: any) => {
            logger.warn('Failed to delete board in IndexedDB:', err);
            loadBoards();
          });
      }
      break;
  }
}

/**
 * Handle kanban broadcast events (kanban_column_*, kanban_card_*).
 */
export function handleKanbanEvent(event: BroadcastEvent): void {
  const {
    addColumnFromRemote,
    updateColumnFromRemote,
    deleteColumnFromRemote,
  } = useKanbanColumnStore.getState();

  const {
    addCardFromRemote,
    updateCardFromRemote,
    deleteCardFromRemote,
  } = useKanbanCardStore.getState();

  switch (event.type) {
    case 'kanban_column_created':
      if (event.payload) addColumnFromRemote(event.payload as unknown as KanbanColumn);
      break;
    case 'kanban_column_updated':
      if (event.payload) updateColumnFromRemote(event.payload as unknown as KanbanColumn);
      break;
    case 'kanban_column_deleted':
      if (event.payload?.id) deleteColumnFromRemote(event.payload.id as string);
      break;
    case 'kanban_card_created':
      if (event.payload) addCardFromRemote(event.payload as unknown as KanbanCard);
      break;
    case 'kanban_card_updated':
      if (event.payload) updateCardFromRemote(event.payload as unknown as KanbanCard);
      break;
    case 'kanban_card_deleted':
      if (event.payload?.id) deleteCardFromRemote(event.payload.id as string);
      break;
  }
}

/**
 * Handle database broadcast events (database_property_*, database_row_*, database_view_*).
 */
export function handleDatabaseEvent(event: BroadcastEvent): void {
  const state = useDatabaseStore.getState();

  switch (event.type) {
    case 'database_property_created':
      if (event.payload) state.addPropertyFromRemote(event.payload as unknown as DatabaseProperty);
      break;
    case 'database_property_updated':
      if (event.payload) state.updatePropertyFromRemote(event.payload as unknown as DatabaseProperty);
      break;
    case 'database_property_deleted':
      if (event.payload?.id) state.deletePropertyFromRemote(event.payload.id as string);
      break;
    case 'database_row_created':
      if (event.payload) state.addRowFromRemote(event.payload as unknown as DatabaseRow);
      break;
    case 'database_row_updated':
      if (event.payload) state.updateRowFromRemote(event.payload as unknown as DatabaseRow);
      break;
    case 'database_row_deleted':
      if (event.payload?.id) state.deleteRowFromRemote(event.payload.id as string);
      break;
    case 'database_view_created':
      if (event.payload) state.addViewFromRemote(event.payload as unknown as DatabaseView);
      break;
    case 'database_view_updated':
      if (event.payload) state.updateViewFromRemote(event.payload as unknown as DatabaseView);
      break;
    case 'database_view_deleted':
      if (event.payload?.id) state.deleteViewFromRemote(event.payload.id as string);
      break;
  }
}

/**
 * Handle editing broadcast events (editing_started, editing_stopped, editing_heartbeat).
 */
export function handleEditingEvent(event: BroadcastEvent): void {
  const state = useEditingStore.getState();

  switch (event.type) {
    case 'editing_started':
      if (event.payload?.elementId) {
        state.startEditing(
          event.payload.elementId as string,
          event.payload.userId as string,
          event.payload.userName as string,
          event.payload.userColor as string
        );
      }
      break;
    case 'editing_stopped':
      if (event.payload?.elementId) {
        state.stopEditing(event.payload.elementId as string, event.payload.userId as string);
      }
      break;
    case 'editing_heartbeat':
      if (event.payload?.elementId) {
        state.updateHeartbeat(event.payload.elementId as string, event.payload.userId as string);
      }
      break;
  }
}
