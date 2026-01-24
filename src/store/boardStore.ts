/**
 * Board Store
 * Manages boards state and operations
 */

import { create } from 'zustand';
import { generateId } from '../utils/uuid';
import type { Board, BoardType } from '../types';
import { boardOperations } from '../utils/db';
import { newSyncService } from '../services/supabase/newSyncService';
import { cacheManager } from '../services/CacheManager';
import { storageManager } from '../services/StorageManager';
import { getCollaborationService } from '../services/collaboration/collaborationService';

interface BoardState {
  boards: Board[];
  currentBoardId: string | null;
  loading: boolean;
  error: string | null;

  // Actions
  loadBoards: () => Promise<void>;
  setCurrentBoard: (boardId: string) => void;
  createBoard: (name: string, type?: BoardType, parentId?: string, description?: string, tags?: string[]) => Promise<string>;
  updateBoard: (id: string, updates: Partial<Board>) => Promise<void>;
  deleteBoard: (id: string) => Promise<void>;
  duplicateBoard: (id: string, newName?: string) => Promise<string>;
  getCurrentBoard: () => Board | null;
  getBoardPath: (boardId: string) => Board[];
  getChildBoards: (parentId: string | null) => Board[];
  addTagToBoard: (boardId: string, tag: string) => Promise<void>;
  removeTagFromBoard: (boardId: string, tag: string) => Promise<void>;
  getAllTags: () => string[];
}

export const useBoardStore = create<BoardState>((set, get) => ({
  boards: [],
  currentBoardId: null,
  loading: false,
  error: null,

  loadBoards: async () => {
    set({ loading: true, error: null });
    try {
      // Try to load from IndexedDB first for instant updates
      let allBoards = await boardOperations.getAll();

      // If no boards in IndexedDB, fetch from server
      if (allBoards.length === 0) {
        allBoards = await cacheManager.getBoardsList();
      }

      // Filter out soft-deleted boards
      const boards = allBoards.filter(b => !b.deletedAt);
      set({ boards, loading: false });

      // If no current board, select the first root board
      if (!get().currentBoardId && boards.length > 0) {
        const rootBoard = boards.find(b => !b.parentId);
        if (rootBoard) {
          set({ currentBoardId: rootBoard.id });
        }
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load boards',
        loading: false
      });
    }
  },

  setCurrentBoard: (boardId: string) => {
    set({ currentBoardId: boardId });

    // Update board access time for LRU cache
    storageManager.updateBoardAccess(boardId).catch(error => {
      console.error('Failed to update board access time:', error);
    });
  },

  createBoard: async (name: string, type: BoardType = 'canvas', parentId?: string, description?: string, tags?: string[]) => {
    set({ loading: true, error: null });
    try {
      const newBoard: Board = {
        id: generateId(),
        name,
        type,
        description,
        tags: tags || [],
        folderId: null,
        parentId: parentId || null,
        createdAt: new Date(),
        updatedAt: new Date(),
        settings: {
          gridEnabled: true,
          gridSize: 8,
          backgroundColor: '#F5F5F5',
          zoom: 1,
          panX: 0,
          panY: 0
        }
      };

      // Create in IndexedDB
      await boardOperations.create(newBoard);

      // Immediately update UI state (optimistic update)
      const currentBoards = get().boards;
      set({
        boards: [...currentBoards, newBoard],
        loading: false
      });

      // Broadcast board creation in real-time
      try {
        const collabService = getCollaborationService();
        collabService.broadcast({
          type: 'board_created',
          payload: newBoard,
          userId: (collabService as any).userId,
          timestamp: Date.now(),
        });
        console.log('📢 Broadcast board_created:', newBoard.id);
      } catch (err) {
        console.warn('Failed to broadcast board creation:', err);
      }

      // Trigger sync in background (don't wait)
      newSyncService.syncAll().catch((err) => {
        console.warn('Background sync failed (will retry automatically):', err);
      });

      return newBoard.id;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create board',
        loading: false
      });
      throw error;
    }
  },

  updateBoard: async (id: string, updates: Partial<Board>) => {
    set({ loading: true, error: null });
    try {
      // Update in IndexedDB
      await boardOperations.update(id, updates);

      // Get updated board and immediately update UI state
      const updatedBoard = await boardOperations.getById(id);
      if (updatedBoard) {
        const currentBoards = get().boards;
        set({
          boards: currentBoards.map(b => b.id === id ? updatedBoard : b),
          loading: false
        });

        // Broadcast board update in real-time
        try {
          const collabService = getCollaborationService();
          collabService.broadcast({
            type: 'board_updated',
            payload: updatedBoard,
            userId: (collabService as any).userId,
            timestamp: Date.now(),
          });
          console.log('📢 Broadcast board_updated:', id);
        } catch (err) {
          console.warn('Failed to broadcast board update:', err);
        }
      } else {
        set({ loading: false });
      }

      // Trigger sync in background
      newSyncService.syncAll().catch((err) => {
        console.warn('Background sync failed (will retry automatically):', err);
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update board',
        loading: false
      });
      throw error;
    }
  },

  deleteBoard: async (id: string) => {
    set({ loading: true, error: null });
    try {
      // Soft delete - set deletedAt instead of hard delete
      const deletedAt = new Date();
      await boardOperations.update(id, {
        deletedAt,
        updatedAt: deletedAt
      });

      // Immediately update UI state - remove deleted board
      const currentBoards = get().boards;
      set({
        boards: currentBoards.filter(b => b.id !== id),
        loading: false
      });

      // If deleting current board, switch to a root board
      if (get().currentBoardId === id) {
        const rootBoard = currentBoards.find(b => !b.parentId && b.id !== id);
        set({ currentBoardId: rootBoard?.id || null });
      }

      // Broadcast board deletion in real-time
      try {
        const collabService = getCollaborationService();
        collabService.broadcast({
          type: 'board_deleted',
          payload: { id },
          userId: (collabService as any).userId,
          timestamp: Date.now(),
        });
        console.log('📢 Broadcast board_deleted:', id);
      } catch (err) {
        console.warn('Failed to broadcast board deletion:', err);
      }

      // Trigger sync in background
      newSyncService.syncAll().catch((err) => {
        console.warn('Background sync failed (will retry automatically):', err);
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete board',
        loading: false
      });
      throw error;
    }
  },

  duplicateBoard: async (id: string, newName?: string) => {
    set({ loading: true, error: null });
    try {
      // Duplicate the board in IndexedDB
      const newBoardId = await boardOperations.duplicate(id, newName);

      // Get the new board and immediately update UI state
      const newBoard = await boardOperations.getById(newBoardId);
      if (newBoard) {
        const currentBoards = get().boards;
        set({
          boards: [...currentBoards, newBoard],
          loading: false
        });

        // Broadcast board creation (duplication creates a new board)
        try {
          const collabService = getCollaborationService();
          collabService.broadcast({
            type: 'board_created',
            payload: newBoard,
            userId: (collabService as any).userId,
            timestamp: Date.now(),
          });
          console.log('📢 Broadcast board_created (duplicate):', newBoardId);
        } catch (err) {
          console.warn('Failed to broadcast board duplication:', err);
        }
      } else {
        set({ loading: false });
      }

      // Trigger sync in background
      newSyncService.syncAll().catch((err) => {
        console.warn('Background sync failed (will retry automatically):', err);
      });

      return newBoardId;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to duplicate board',
        loading: false
      });
      throw error;
    }
  },

  getCurrentBoard: () => {
    const { boards, currentBoardId } = get();
    if (!currentBoardId) return null;
    return boards.find(b => b.id === currentBoardId) || null;
  },

  getBoardPath: (boardId: string): Board[] => {
    const { boards } = get();
    const path: Board[] = [];
    let currentId: string | null = boardId;

    while (currentId) {
      const board = boards.find(b => b.id === currentId);
      if (!board) break;
      path.unshift(board);
      currentId = board.parentId;
    }

    return path;
  },

  getChildBoards: (parentId: string | null): Board[] => {
    const { boards } = get();
    return boards.filter(b => b.parentId === parentId);
  },

  addTagToBoard: async (boardId: string, tag: string) => {
    const board = get().boards.find(b => b.id === boardId);
    if (!board) return;

    const tags = [...new Set([...(board.tags || []), tag])]; // Avoid duplicates
    await get().updateBoard(boardId, { tags });
  },

  removeTagFromBoard: async (boardId: string, tag: string) => {
    const board = get().boards.find(b => b.id === boardId);
    if (!board) return;

    const tags = (board.tags || []).filter(t => t !== tag);
    await get().updateBoard(boardId, { tags });
  },

  getAllTags: (): string[] => {
    const { boards } = get();
    const allTags = boards.flatMap(b => b.tags || []);
    return [...new Set(allTags)].sort();
  }
}));
