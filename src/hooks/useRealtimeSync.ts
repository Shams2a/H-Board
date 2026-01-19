/**
 * Hook for real-time synchronization of elements
 * Automatically syncs canvas elements, kanban cards, database rows, etc.
 */

import { useEffect, useRef } from 'react';
import { useElementStore } from '../store/elementStore';
import { useKanbanStore } from '../store/kanbanStore';
import { useDatabaseStore } from '../store/databaseStore';
import { useEditingStore } from '../store/editingStore';
import { useBoardStore } from '../store/boardStore';
import { getCollaborationService } from '../services/collaboration/collaborationService';
import { db, elementOperations, boardOperations } from '../utils/db';
import type { Element, Board } from '../types';

interface UseRealtimeSyncOptions {
  boardId: string;
  userId: string;
  userName?: string;
  enabled?: boolean;
}

export function useRealtimeSync({
  boardId,
  userId,
  userName = 'Anonymous',
  enabled = true,
}: UseRealtimeSyncOptions) {
  const collaborationService = useRef(getCollaborationService());
  const isInitialized = useRef(false);
  const isInitializing = useRef(false);
  const cleanupInterval = useRef<NodeJS.Timeout | null>(null);

  // Element store methods (for Canvas boards)
  const setElements = useElementStore((state) => state.setElements);

  // Board store methods
  const { loadBoards } = useBoardStore();

  // Kanban store methods
  const {
    addColumnFromRemote,
    updateColumnFromRemote,
    deleteColumnFromRemote,
    addCardFromRemote,
    updateCardFromRemote,
    deleteCardFromRemote
  } = useKanbanStore();

  // Database store methods - used for real-time collaboration
  // Note: We use getState() in the broadcast listeners instead of destructuring here

  useEffect(() => {
    console.log('🔍 [useRealtimeSync] Hook called with:', {
      enabled,
      boardId,
      userId,
      willInitialize: !!(enabled && boardId && userId)
    });

    if (!enabled || !boardId || !userId) {
      console.log('⚠️ [useRealtimeSync] Skipping - missing requirements');
      return;
    }

    console.log('✅ [useRealtimeSync] Requirements met, proceeding...');

    const service = collaborationService.current;

    // Initialize collaboration service
    const initializeCollaboration = async () => {
      // Prevent concurrent initializations
      if (isInitialized.current || isInitializing.current) {
        console.log('⏭️ Skipping initialization (already initialized or in progress)');
        return;
      }

      console.log('🚀 [useRealtimeSync] Starting collaboration initialization...');

      isInitializing.current = true;

      try {
        console.log('📝 About to initialize service with:', { boardId, userId });

        await service.initialize(boardId, userId, {
          enablePresence: true,
          enableCursors: true, // ENABLED for real-time cursors
          enableEditingIndicators: false, // Disabled for now to simplify
        });

        // Verify initialization succeeded by checking service directly
        console.log('🔍 [useRealtimeSync] Verifying service state after initialize()');
        const serviceInstance = getCollaborationService() as any;
        console.log('🔍 Service state:', {
          hasBoardId: !!serviceInstance.boardId,
          hasUserId: !!serviceInstance.userId,
          hasChannel: !!serviceInstance.channel,
          boardIdValue: serviceInstance.boardId,
          userIdValue: serviceInstance.userId,
        });

        isInitialized.current = true;

      console.log('🔊 Setting up BROADCAST listeners (postgres_changes disabled)...');

      // BROADCAST APPROACH: Listen to manual broadcasts instead of postgres_changes
      service.subscribeToBroadcast((event) => {
        console.log('📡 [useRealtimeSync] Received broadcast event:', {
          type: event.type,
          userId: event.userId,
          timestamp: event.timestamp,
          boardId,
          event
        });

        // Debug: Log payload details for kanban events
        if (event.type.startsWith('kanban_')) {
          console.log('🔍 [useRealtimeSync] Kanban event payload:', event.payload);
        }

        switch (event.type) {
          case 'element_created':
            if (event.payload) {
              console.log('🔵 Remote element created:', event.payload);

              // Add to IndexedDB to prevent sync from deleting it
              db.elements.put(event.payload as Element).catch((err: any) => {
                console.warn('Failed to add element to IndexedDB:', err);
              });

              setElements((prevElements) => {
                const exists = prevElements.some((el: any) => el.id === event.payload.id);
                if (exists) {
                  console.log('⚠️ Element already exists, skipping');
                  return prevElements;
                }
                console.log('✅ Adding element to state');
                return [...prevElements, event.payload as Element];
              });
            }
            break;

          case 'element_updated':
            if (event.payload) {
              console.log('🟡 Remote element updated:', event.payload);

              // Update IndexedDB to prevent sync from overwriting with old data
              db.elements.put(event.payload as Element).catch((err: any) => {
                console.warn('Failed to update element in IndexedDB:', err);
              });

              setElements((prevElements) => {
                const oldElement = prevElements.find((el: any) => el.id === event.payload.id);
                if (!oldElement) {
                  console.warn('⚠️ Element not found locally, adding it:', event.payload.id);
                  // If element doesn't exist locally, add it (happens when element was created before we joined)
                  return [...prevElements, event.payload as Element];
                }
                console.log('✅ Updating element in state');
                return prevElements.map((el: any) =>
                  el.id === event.payload.id ? (event.payload as Element) : el
                );
              });
            }
            break;

          case 'element_deleted':
            if (event.payload && event.payload.id) {
              console.log('🔴 Remote element deleted:', event.payload.id);

              // Soft delete in IndexedDB to prevent sync from restoring it
              const deletedAt = new Date();
              elementOperations.update(event.payload.id, {
                deletedAt,
                updatedAt: deletedAt
              }).catch((err: any) => {
                console.warn('Failed to delete element in IndexedDB:', err);
              });

              setElements((prevElements) => {
                const exists = prevElements.some((el: any) => el.id === event.payload.id);
                if (!exists) {
                  console.warn('⚠️ Element not found for deletion:', event.payload.id);
                }
                console.log('✅ Removing element from state');
                return prevElements.filter((el: any) => el.id !== event.payload.id);
              });
            }
            break;

          case 'editing_started':
            if (event.payload && event.payload.elementId) {
              console.log('🖊️ Remote user started editing:', event.payload);
              const { startEditing } = useEditingStore.getState();
              startEditing(
                event.payload.elementId,
                event.payload.userId,
                event.payload.userName,
                event.payload.userColor
              );
            }
            break;

          case 'editing_stopped':
            if (event.payload && event.payload.elementId) {
              console.log('✅ Remote user stopped editing:', event.payload);
              const { stopEditing } = useEditingStore.getState();
              stopEditing(event.payload.elementId, event.payload.userId);
            }
            break;

          case 'editing_heartbeat':
            if (event.payload && event.payload.elementId) {
              console.log('💓 Remote user editing heartbeat:', event.payload);
              const { updateHeartbeat } = useEditingStore.getState();
              updateHeartbeat(event.payload.elementId, event.payload.userId);
            }
            break;

          case 'board_created':
            if (event.payload) {
              console.log('🔵 Remote board created:', event.payload);

              // Add to IndexedDB first, then reload boards list
              db.boards.put(event.payload as Board)
                .then(() => {
                  console.log('✅ Board added to IndexedDB, reloading list...');
                  loadBoards();
                })
                .catch((err: any) => {
                  console.warn('Failed to add board to IndexedDB:', err);
                  // Still try to reload even if IndexedDB fails
                  loadBoards();
                });
            }
            break;

          case 'board_updated':
            if (event.payload) {
              console.log('🟡 Remote board updated:', event.payload);

              // Update in IndexedDB first, then reload
              db.boards.put(event.payload as Board)
                .then(() => {
                  console.log('✅ Board updated in IndexedDB, reloading list...');
                  loadBoards();
                })
                .catch((err: any) => {
                  console.warn('Failed to update board in IndexedDB:', err);
                  loadBoards();
                });
            }
            break;

          case 'board_deleted':
            if (event.payload && event.payload.id) {
              console.log('🔴 Remote board deleted:', event.payload.id);

              // Soft delete in IndexedDB first, then reload
              const deletedAt = new Date();
              boardOperations.update(event.payload.id, {
                deletedAt,
                updatedAt: deletedAt
              })
                .then(() => {
                  console.log('✅ Board deleted in IndexedDB, reloading list...');
                  loadBoards();
                })
                .catch((err: any) => {
                  console.warn('Failed to delete board in IndexedDB:', err);
                  loadBoards();
                });
            }
            break;

          case 'kanban_column_created':
            if (event.payload) {
              console.log('🔵 Remote kanban column created:', event.payload);
              addColumnFromRemote(event.payload);
            }
            break;

          case 'kanban_column_updated':
            if (event.payload) {
              console.log('🟡 Remote kanban column updated:', event.payload);
              updateColumnFromRemote(event.payload);
            }
            break;

          case 'kanban_column_deleted':
            if (event.payload && event.payload.id) {
              console.log('🔴 Remote kanban column deleted:', event.payload.id);
              deleteColumnFromRemote(event.payload.id);
            }
            break;

          case 'kanban_card_created':
            if (event.payload) {
              console.log('🔵 Remote kanban card created:', event.payload);
              addCardFromRemote(event.payload);
            }
            break;

          case 'kanban_card_updated':
            if (event.payload) {
              console.log('🟡 Remote kanban card updated:', event.payload);
              updateCardFromRemote(event.payload);
            }
            break;

          case 'kanban_card_deleted':
            if (event.payload && event.payload.id) {
              console.log('🔴 Remote kanban card deleted:', event.payload.id);
              deleteCardFromRemote(event.payload.id);
            }
            break;

          case 'database_property_created':
            if (event.payload) {
              console.log('🔵 Remote database property created:', event.payload);
              const { addPropertyFromRemote } = useDatabaseStore.getState();
              addPropertyFromRemote(event.payload);
            }
            break;

          case 'database_property_updated':
            if (event.payload) {
              console.log('🟡 Remote database property updated:', event.payload);
              const { updatePropertyFromRemote } = useDatabaseStore.getState();
              updatePropertyFromRemote(event.payload);
            }
            break;

          case 'database_property_deleted':
            if (event.payload && event.payload.id) {
              console.log('🔴 Remote database property deleted:', event.payload.id);
              const { deletePropertyFromRemote } = useDatabaseStore.getState();
              deletePropertyFromRemote(event.payload.id);
            }
            break;

          case 'database_row_created':
            if (event.payload) {
              console.log('🔵 Remote database row created:', event.payload);
              const { addRowFromRemote } = useDatabaseStore.getState();
              addRowFromRemote(event.payload);
            }
            break;

          case 'database_row_updated':
            if (event.payload) {
              console.log('🟡 Remote database row updated:', event.payload);
              const { updateRowFromRemote } = useDatabaseStore.getState();
              updateRowFromRemote(event.payload);
            }
            break;

          case 'database_row_deleted':
            if (event.payload && event.payload.id) {
              console.log('🔴 Remote database row deleted:', event.payload.id);
              const { deleteRowFromRemote } = useDatabaseStore.getState();
              deleteRowFromRemote(event.payload.id);
            }
            break;

          case 'database_view_created':
            if (event.payload) {
              console.log('🔵 Remote database view created:', event.payload);
              const { addViewFromRemote } = useDatabaseStore.getState();
              addViewFromRemote(event.payload);
            }
            break;

          case 'database_view_updated':
            if (event.payload) {
              console.log('🟡 Remote database view updated:', event.payload);
              const { updateViewFromRemote } = useDatabaseStore.getState();
              updateViewFromRemote(event.payload);
            }
            break;

          case 'database_view_deleted':
            if (event.payload && event.payload.id) {
              console.log('🔴 Remote database view deleted:', event.payload.id);
              const { deleteViewFromRemote } = useDatabaseStore.getState();
              deleteViewFromRemote(event.payload.id);
            }
            break;

          case 'cursor_move':
            // Cursor events are handled separately in setupBroadcasts()
            // Don't log warning for these
            break;

          default:
            console.warn('⚠️ Unknown broadcast event type:', event.type);
        }
      });

      // postgres_changes DISABLED (causes CHANNEL_ERROR on free plan)
      /*
      // Subscribe to kanban_columns table (Kanban boards)
      service.subscribeToTable(
        'kanban_columns',
        { board_id: boardId },
        {
          onInsert: (payload) => {
            if (payload.new) {
              console.log('🔵 Remote kanban column created:', payload.new);
              addColumnFromRemote(payload.new);
            }
          },
          onUpdate: (payload) => {
            if (payload.new) {
              console.log('🟡 Remote kanban column updated:', payload.new);
              updateColumnFromRemote(payload.new);
            }
          },
          onDelete: (payload) => {
            if (payload.old) {
              console.log('🔴 Remote kanban column deleted:', payload.old.id);
              deleteColumnFromRemote(payload.old.id);
            }
          },
        }
      );

      // Subscribe to kanban_cards table (Kanban boards)
      service.subscribeToTable(
        'kanban_cards',
        { board_id: boardId },
        {
          onInsert: (payload) => {
            if (payload.new) {
              console.log('🔵 Remote kanban card created:', payload.new);
              addCardFromRemote(payload.new);
            }
          },
          onUpdate: (payload) => {
            if (payload.new) {
              console.log('🟡 Remote kanban card updated:', payload.new);
              updateCardFromRemote(payload.new);
            }
          },
          onDelete: (payload) => {
            if (payload.old) {
              console.log('🔴 Remote kanban card deleted:', payload.old.id);
              deleteCardFromRemote(payload.old.id);
            }
          },
        }
      );

      // Subscribe to database_properties table (Database boards)
      service.subscribeToTable(
        'database_properties',
        { board_id: boardId },
        {
          onInsert: (payload) => {
            console.log('🔵 Remote database property created:', payload.new);
          },
          onUpdate: (payload) => {
            console.log('🟡 Remote database property updated:', payload.new);
          },
          onDelete: (payload) => {
            console.log('🔴 Remote database property deleted:', payload.old);
          },
        }
      );

      // Subscribe to database_rows table (Database boards)
      service.subscribeToTable(
        'database_rows',
        { board_id: boardId },
        {
          onInsert: (payload) => {
            console.log('🔵 Remote database row created:', payload.new);
          },
          onUpdate: (payload) => {
            console.log('🟡 Remote database row updated:', payload.new);
          },
          onDelete: (payload) => {
            console.log('🔴 Remote database row deleted:', payload.old);
          },
        }
      );
      */

      console.log('✅ Real-time sync initialized for board:', boardId);

      // Start cleanup interval for stale edits (every 10 seconds)
      cleanupInterval.current = setInterval(() => {
        const { cleanupStaleEdits } = useEditingStore.getState();
        cleanupStaleEdits();
      }, 10000);

      console.log('🧹 Started cleanup interval for stale edits');

      } catch (error) {
        console.error('❌ Failed to initialize collaboration:', error);
        isInitialized.current = false;
      } finally {
        isInitializing.current = false;
      }
    };

    initializeCollaboration();

    // Cleanup
    return () => {
      if (isInitialized.current) {
        console.log('🧹 Cleaning up real-time sync for board:', boardId);
        service.cleanup();
        isInitialized.current = false;
        isInitializing.current = false;
        console.log('🔌 Real-time sync disconnected');
      }

      // Clear cleanup interval
      if (cleanupInterval.current) {
        clearInterval(cleanupInterval.current);
        cleanupInterval.current = null;
        console.log('🧹 Stopped cleanup interval');
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId, userId, enabled]);

  return {
    isConnected: isInitialized.current,
    service: collaborationService.current,
  };
}
