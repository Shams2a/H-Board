/**
 * Folder Store
 * Manages folders state and operations
 */

import { create } from 'zustand';
import { generateId } from '../utils/uuid';
import type { Folder } from '../types';
import { folderOperations } from '../utils/db';
import { newSyncService } from '../services/supabase/newSyncService';

interface FolderState {
  folders: Folder[];
  loading: boolean;
  error: string | null;

  // Actions
  loadFolders: () => Promise<void>;
  createFolder: (name: string, parentFolderId?: string, color?: string) => Promise<string>;
  updateFolder: (id: string, updates: Partial<Folder>) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
  getRootFolders: () => Folder[];
  getChildFolders: (parentId: string) => Folder[];
}

export const useFolderStore = create<FolderState>((set, get) => ({
  folders: [],
  loading: false,
  error: null,

  loadFolders: async () => {
    set({ loading: true, error: null });
    try {
      const allFolders = await folderOperations.getAll();
      // Filter out soft-deleted folders
      const folders = allFolders.filter(f => !f.deletedAt);
      set({ folders, loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load folders',
        loading: false
      });
    }
  },

  createFolder: async (name: string, parentFolderId?: string, color?: string) => {
    set({ loading: true, error: null });
    try {
      const newFolder: Folder = {
        id: generateId(),
        name,
        color,
        parentFolderId: parentFolderId || null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await folderOperations.create(newFolder);

      // Queue sync operation
      newSyncService.syncAll().catch(() => {});

      await get().loadFolders();
      set({ loading: false });
      return newFolder.id;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create folder',
        loading: false
      });
      throw error;
    }
  },

  updateFolder: async (id: string, updates: Partial<Folder>) => {
    set({ loading: true, error: null });
    try {
      await folderOperations.update(id, updates);

      // Queue sync operation
      const updatedFolder = await folderOperations.getById(id);
      if (updatedFolder) {
        newSyncService.syncAll().catch(() => {});
      }

      await get().loadFolders();
      set({ loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update folder',
        loading: false
      });
      throw error;
    }
  },

  deleteFolder: async (id: string) => {
    set({ loading: true, error: null });
    try {
      // Soft delete - set deletedAt instead of hard delete
      const deletedAt = new Date();
      await folderOperations.update(id, {
        deletedAt,
        updatedAt: deletedAt
      });

      // Queue sync operation
      newSyncService.syncAll().catch(() => {});

      await get().loadFolders();
      set({ loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete folder',
        loading: false
      });
      throw error;
    }
  },

  getRootFolders: (): Folder[] => {
    const { folders } = get();
    return folders.filter(f => f.parentFolderId === null);
  },

  getChildFolders: (parentId: string): Folder[] => {
    const { folders } = get();
    return folders.filter(f => f.parentFolderId === parentId);
  }
}));

// Selectors
type FolderStoreState = ReturnType<typeof useFolderStore.getState>;
export const selectFolders = (state: FolderStoreState) => state.folders;
export const selectFolderById = (id: string) => (state: FolderStoreState) =>
  state.folders.find(f => f.id === id);
