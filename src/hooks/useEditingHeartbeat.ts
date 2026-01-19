/**
 * Hook to send editing heartbeats while editing an element
 * This keeps the editing indicator alive while the user is actively editing
 */

import { useEffect, useRef } from 'react';
import { getCollaborationService } from '../services/collaboration/collaborationService';

interface UseEditingHeartbeatOptions {
  elementId: string;
  isEditing: boolean;
  interval?: number; // milliseconds, default 10 seconds
}

export function useEditingHeartbeat({
  elementId,
  isEditing,
  interval = 10000,
}: UseEditingHeartbeatOptions) {
  const heartbeatInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isEditing) {
      // Stop heartbeat if not editing
      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current);
        heartbeatInterval.current = null;
        console.log(`💓 Stopped heartbeat for ${elementId}`);
      }
      return;
    }

    // Start heartbeat
    console.log(`💓 Starting heartbeat for ${elementId} (every ${interval}ms)`);

    heartbeatInterval.current = setInterval(() => {
      const collabService = getCollaborationService();

      collabService.broadcast({
        type: 'editing_heartbeat',
        payload: {
          elementId,
        },
        userId: (collabService as any).userId,
        timestamp: Date.now(),
      });

      console.log(`💓 Sent heartbeat for ${elementId}`);
    }, interval);

    // Cleanup on unmount or when editing stops
    return () => {
      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current);
        heartbeatInterval.current = null;
        console.log(`💓 Cleaned up heartbeat for ${elementId}`);
      }
    };
  }, [elementId, isEditing, interval]);
}
