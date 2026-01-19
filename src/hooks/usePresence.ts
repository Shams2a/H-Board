/**
 * Hook for managing user presence
 * Shows who is currently active on the board
 */

import { useState, useEffect } from 'react';
import { getCollaborationService } from '../services/collaboration/collaborationService';
import type { UserPresence, CollaborationUser } from '../types/collaboration';

interface UsePresenceOptions {
  boardId: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  enabled?: boolean;
}

export function usePresence({
  boardId,
  userId,
  userName = 'Anonymous',
  userEmail,
  enabled = true,
}: UsePresenceOptions) {
  const [activeUsers, setActiveUsers] = useState<CollaborationUser[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Reset state when board changes
    setActiveUsers([]);
    setIsConnected(false);

    if (!enabled || !boardId || !userId) return;

    const service = getCollaborationService();

    // Subscribe to presence changes
    service.subscribeToPresence((users: UserPresence[]) => {
      // Convert to CollaborationUser format
      const collaborationUsers: CollaborationUser[] = users.map((user) => ({
        id: user.userId,
        name: user.userName,
        email: user.userEmail,
        color: user.userColor,
        isActive: true,
      }));

      setActiveUsers(collaborationUsers);
      setIsConnected(true);
    });

    // Update presence when cursor moves (optional, for cursor tracking)
    // This is handled by the collaboration service

    return () => {
      // Cleanup handled by useRealtimeSync
    };
  }, [boardId, userId, userName, userEmail, enabled]);

  return {
    activeUsers,
    activeUserCount: activeUsers.length,
    isConnected,
  };
}
