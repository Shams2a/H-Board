/**
 * Editing Store
 * Tracks which users are editing which elements for collaboration
 */

import { create } from 'zustand';
import { logger } from '../utils/logger';

export interface EditingUser {
  userId: string;
  userName: string;
  userColor: string;
  elementId: string;
  timestamp: number;
}

interface EditingState {
  editingUsers: Map<string, EditingUser>; // key: `${elementId}:${userId}`

  // Actions
  startEditing: (elementId: string, userId: string, userName: string, userColor: string) => void;
  stopEditing: (elementId: string, userId: string) => void;
  updateHeartbeat: (elementId: string, userId: string) => void;
  cleanupStaleEdits: () => void;
  getEditingUser: (elementId: string) => EditingUser | null;
  isBeingEdited: (elementId: string) => boolean;
  clearAll: () => void;
}

// Timeout after 30 seconds of inactivity
const EDITING_TIMEOUT_MS = 30000;

export const useEditingStore = create<EditingState>((set, get) => ({
  editingUsers: new Map(),

  startEditing: (elementId: string, userId: string, userName: string, userColor: string) => {
    const key = `${elementId}:${userId}`;
    const editingUser: EditingUser = {
      userId,
      userName,
      userColor,
      elementId,
      timestamp: Date.now(),
    };

    set((state) => {
      const newMap = new Map(state.editingUsers);
      newMap.set(key, editingUser);
      logger.debug(`[editingStore] Added: ${key}`, {
        totalEditing: newMap.size,
        allKeys: Array.from(newMap.keys()),
      });
      return { editingUsers: newMap };
    });

    logger.debug(`User ${userName} started editing ${elementId}`);
  },

  stopEditing: (elementId: string, userId: string) => {
    const key = `${elementId}:${userId}`;

    set((state) => {
      const newMap = new Map(state.editingUsers);
      newMap.delete(key);
      return { editingUsers: newMap };
    });

    logger.debug(`User ${userId} stopped editing ${elementId}`);
  },

  updateHeartbeat: (elementId: string, userId: string) => {
    const key = `${elementId}:${userId}`;

    set((state) => {
      const newMap = new Map(state.editingUsers);
      const existing = newMap.get(key);

      if (existing) {
        newMap.set(key, {
          ...existing,
          timestamp: Date.now(),
        });
        logger.debug(`Heartbeat updated for ${key}`);
      }

      return { editingUsers: newMap };
    });
  },

  cleanupStaleEdits: () => {
    const now = Date.now();

    set((state) => {
      const newMap = new Map(state.editingUsers);
      let removedCount = 0;

      for (const [key, user] of newMap.entries()) {
        if (now - user.timestamp > EDITING_TIMEOUT_MS) {
          newMap.delete(key);
          removedCount++;
          logger.debug(`Cleaned up stale edit: ${key} (${Math.round((now - user.timestamp) / 1000)}s old)`);
        }
      }

      if (removedCount > 0) {
        logger.debug(`Cleaned up ${removedCount} stale edit(s)`);
      }

      return { editingUsers: newMap };
    });
  },

  getEditingUser: (elementId: string) => {
    const entries = Array.from(get().editingUsers.values());
    const user = entries.find((u) => u.elementId === elementId);
    return user || null;
  },

  isBeingEdited: (elementId: string) => {
    const entries = Array.from(get().editingUsers.values());
    return entries.some((u) => u.elementId === elementId);
  },

  clearAll: () => {
    set({ editingUsers: new Map() });
  },
}));

// Selectors
type EditingStoreState = ReturnType<typeof useEditingStore.getState>;
export const selectEditingUsers = (state: EditingStoreState) => state.editingUsers;
export const selectEditingUserForElement = (elementId: string) => (state: EditingStoreState) => {
  const entries = Array.from(state.editingUsers.values());
  return entries.find(u => u.elementId === elementId) || null;
};
export const selectIsElementBeingEdited = (elementId: string) => (state: EditingStoreState) => {
  const entries = Array.from(state.editingUsers.values());
  return entries.some(u => u.elementId === elementId);
};
