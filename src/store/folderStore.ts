/**
 * Folder Store
 * Manages folders state and operations
 */

import { create } from 'zustand';
import type { Folder } from '../types';
import { folderOperations } from '../utils/db';

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
      const folders = await folderOperations.getAll();
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
        id: crypto.randomUUID(),
        name,
        color,
        parentFolderId: parentFolderId || null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await folderOperations.create(newFolder);
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
      await folderOperations.delete(id);
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
