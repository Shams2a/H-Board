/**
 * Hook for real-time synchronization of elements.
 * Manages channel subscription lifecycle and delegates broadcast events to handlers.
 */

import { useEffect, useRef } from 'react';
import { useElementStore } from '../store/elementStore';
import { useEditingStore } from '../store/editingStore';
import { getCollaborationService } from '../services/collaboration/collaborationService';
import { newSyncService } from '../services/supabase/newSyncService';
import { useBoardStore } from '../store/boardStore';
import { logger } from '../utils/logger';
import {
  handleElementEvent,
  handleBoardEvent,
  handleKanbanEvent,
  handleDatabaseEvent,
  handleEditingEvent,
} from './realtimeSyncHandlers';

interface UseRealtimeSyncOptions {
  boardId: string;
  userId: string;
  userName?: string;
  enabled?: boolean;
}

export function useRealtimeSync({
  boardId,
  userId,
  userName: _userName = 'Anonymous',
  enabled = true,
}: UseRealtimeSyncOptions) {
  const collaborationService = useRef(getCollaborationService());
  const isInitialized = useRef(false);
  const isInitializing = useRef(false);
  const cleanupInterval = useRef<NodeJS.Timeout | null>(null);

  const setElements = useElementStore((state) => state.setElements);
  const loadBoards = useBoardStore(state => state.loadBoards);

  useEffect(() => {
    if (!enabled || !boardId || !userId) {
      return;
    }

    const service = collaborationService.current;

    const initializeCollaboration = async () => {
      if (isInitialized.current || isInitializing.current) {
        return;
      }

      isInitializing.current = true;

      try {
        await service.initialize(boardId, userId, {
          enablePresence: true,
          enableCursors: true,
          enableEditingIndicators: false,
        });

        isInitialized.current = true;

        // Register reconnection callback for catch-up sync
        const serviceAny = service as any;
        if (serviceAny.onReconnect) {
          serviceAny.onReconnect(() => {
            logger.info('[useRealtimeSync] Channel reconnected - triggering catch-up download');
            newSyncService.downloadOnly().then((hasNewData) => {
              if (hasNewData) {
                useElementStore.getState().loadElements(boardId);
                loadBoards();
              }
            }).catch((err) => {
              logger.error('[useRealtimeSync] Catch-up failed:', err);
            });
          });
        }

        // Subscribe to broadcast events and dispatch to handlers
        service.subscribeToBroadcast((event) => {
          const { type } = event;

          if (type.startsWith('element')) {
            handleElementEvent(event, setElements);
          } else if (type.startsWith('board_')) {
            handleBoardEvent(event);
          } else if (type.startsWith('kanban_')) {
            handleKanbanEvent(event);
          } else if (type.startsWith('database_')) {
            handleDatabaseEvent(event);
          } else if (type.startsWith('editing_')) {
            handleEditingEvent(event);
          } else if (type === 'cursor_move') {
            // Cursor events are handled separately in setupBroadcasts()
          } else {
            logger.warn('[useRealtimeSync] Unknown broadcast event type:', type);
          }
        });

        logger.info('[useRealtimeSync] Initialized for board:', boardId);

        // Start cleanup interval for stale edits (every 10 seconds)
        cleanupInterval.current = setInterval(() => {
          const { cleanupStaleEdits } = useEditingStore.getState();
          cleanupStaleEdits();
        }, 10000);

      } catch (error) {
        logger.error('[useRealtimeSync] Failed to initialize collaboration:', error);
        isInitialized.current = false;
      } finally {
        isInitializing.current = false;
      }
    };

    initializeCollaboration();

    return () => {
      if (isInitialized.current) {
        service.cleanup();
        isInitialized.current = false;
        isInitializing.current = false;
      }

      if (cleanupInterval.current) {
        clearInterval(cleanupInterval.current);
        cleanupInterval.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId, userId, enabled]);

  return {
    isConnected: isInitialized.current,
    service: collaborationService.current,
  };
}
