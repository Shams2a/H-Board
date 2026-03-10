/**
 * IndexedDB setup with Dexie.js
 * Handles all local storage for H-Board
 */

import Dexie from 'dexie';
import type { Table } from 'dexie';
import { generateId } from './uuid';
import type { Board, Element, Folder, SyncOperation, CacheMetadata } from '../types';

export class HBoardDatabase extends Dexie {
  boards!: Table<Board, string>;
  elements!: Table<Element, string>;
  folders!: Table<Folder, string>;
  syncQueue!: Table<SyncOperation, string>;
  cacheMetadata!: Table<CacheMetadata & { boardId: string }, string>;
  settings!: Table<{ key: string; value: any }, string>;

  constructor() {
    super('HBoardDB');

    // Version 1: Initial schema
    this.version(1).stores({
      boards: 'id, name, parentId, createdAt, updatedAt',
      elements: 'id, boardId, type, parentId, createdAt, updatedAt, zIndex'
    });

    // Version 2: Add folders table and folderId to boards
    this.version(2).stores({
      boards: 'id, name, parentId, folderId, createdAt, updatedAt',
      elements: 'id, boardId, type, parentId, createdAt, updatedAt, zIndex',
      folders: 'id, name, parentFolderId, createdAt, updatedAt'
    });

    // Version 3: Add sync support and cache management
    this.version(3).stores({
      boards: 'id, name, parentId, folderId, createdAt, updatedAt, lastAccess',
      elements: 'id, boardId, type, parentId, createdAt, updatedAt, zIndex',
      folders: 'id, name, parentFolderId, createdAt, updatedAt',
      syncQueue: '++id, timestamp, syncStatus, entityType, entityId',
      cacheMetadata: 'boardId, lastAccess',
      settings: 'key'
    });
  }
}

// Create and export database instance
export const db = new HBoardDatabase();

// Helper functions for common operations

export const boardOperations = {
  /**
   * Get all boards
   */
  async getAll(): Promise<Board[]> {
    return await db.boards.toArray();
  },

  /**
   * Get board by ID
   */
  async getById(id: string): Promise<Board | undefined> {
    return await db.boards.get(id);
  },

  /**
   * Get root boards (boards without parent)
   */
  async getRootBoards(): Promise<Board[]> {
    return await db.boards.where('parentId').equals(null as any).toArray();
  },

  /**
   * Get child boards of a parent
   */
  async getChildren(parentId: string): Promise<Board[]> {
    return await db.boards.where('parentId').equals(parentId).toArray();
  },

  /**
   * Create a new board
   */
  async create(board: Board): Promise<string> {
    return await db.boards.add(board);
  },

  /**
   * Update an existing board
   */
  async update(id: string, updates: Partial<Board>): Promise<number> {
    return await db.boards.update(id, {
      ...updates,
      updatedAt: new Date()
    });
  },

  /**
   * Delete a board and all its descendants
   */
  async delete(id: string): Promise<void> {
    // Get all descendant boards recursively
    const descendants = await getDescendantBoards(id);
    const boardsToDelete = [id, ...descendants.map(b => b.id)];

    // Delete all elements in these boards
    await db.elements.where('boardId').anyOf(boardsToDelete).delete();

    // Delete all boards
    await db.boards.bulkDelete(boardsToDelete);
  },

  /**
   * Duplicate a board
   */
  async duplicate(id: string, newName?: string): Promise<string> {
    const original = await db.boards.get(id);
    if (!original) throw new Error('Board not found');

    const newBoard: Board = {
      ...original,
      id: generateId(),
      name: newName || `${original.name} (Copy)`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const newBoardId = await db.boards.add(newBoard);

    // Duplicate all elements
    const elements = await elementOperations.getByBoard(id);
    for (const element of elements) {
      await elementOperations.create({
        ...element,
        id: generateId(),
        boardId: newBoardId as string,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    return newBoardId as string;
  }
};

export const elementOperations = {
  /**
   * Get all elements in a board
   */
  async getByBoard(boardId: string): Promise<Element[]> {
    return await db.elements.where('boardId').equals(boardId).toArray();
  },

  /**
   * Get element by ID
   */
  async getById(id: string): Promise<Element | undefined> {
    return await db.elements.get(id);
  },

  /**
   * Get elements by type
   */
  async getByType(boardId: string, type: Element['type']): Promise<Element[]> {
    return await db.elements
      .where('[boardId+type]')
      .equals([boardId, type])
      .toArray();
  },

  /**
   * Get children of a container (column)
   */
  async getChildren(parentId: string): Promise<Element[]> {
    return await db.elements.where('parentId').equals(parentId).toArray();
  },

  /**
   * Create a new element
   */
  async create(element: Element): Promise<string> {
    return await db.elements.add(element);
  },

  /**
   * Update an existing element
   */
  async update(id: string, updates: Partial<Element>): Promise<number> {
    return await db.elements.update(id, {
      ...updates,
      updatedAt: new Date()
    });
  },

  /**
   * Delete an element
   */
  async delete(id: string): Promise<void> {
    await db.elements.delete(id);
  },

  /**
   * Delete multiple elements
   */
  async bulkDelete(ids: string[]): Promise<void> {
    await db.elements.bulkDelete(ids);
  },

  /**
   * Get the highest z-index in a board
   */
  async getMaxZIndex(boardId: string): Promise<number> {
    const elements = await db.elements
      .where('boardId')
      .equals(boardId)
      .toArray();

    if (elements.length === 0) return 0;
    return Math.max(...elements.map(e => e.zIndex));
  },

  /**
   * Bring element to front
   */
  async bringToFront(id: string): Promise<void> {
    const element = await db.elements.get(id);
    if (!element) return;

    const maxZIndex = await this.getMaxZIndex(element.boardId);
    await this.update(id, { zIndex: maxZIndex + 1 });
  },

  /**
   * Send element to back
   */
  async sendToBack(id: string): Promise<void> {
    const element = await db.elements.get(id);
    if (!element) return;

    const elements = await this.getByBoard(element.boardId);
    const now = new Date();

    // Batch all z-index updates in a single transaction
    await db.transaction('rw', db.elements, async () => {
      const updatedElements = elements.map(el => ({
        ...el,
        zIndex: el.id === id ? 0 : el.zIndex + 1,
        updatedAt: now,
      }));
      await db.elements.bulkPut(updatedElements);
    });
  }
};

export const folderOperations = {
  /**
   * Get all folders
   */
  async getAll(): Promise<Folder[]> {
    return await db.folders.toArray();
  },

  /**
   * Get folder by ID
   */
  async getById(id: string): Promise<Folder | undefined> {
    return await db.folders.get(id);
  },

  /**
   * Get root folders (folders without parent)
   */
  async getRootFolders(): Promise<Folder[]> {
    return await db.folders.where('parentFolderId').equals(null as any).toArray();
  },

  /**
   * Get child folders
   */
  async getChildren(parentId: string): Promise<Folder[]> {
    return await db.folders.where('parentFolderId').equals(parentId).toArray();
  },

  /**
   * Create a new folder
   */
  async create(folder: Folder): Promise<string> {
    return await db.folders.add(folder);
  },

  /**
   * Update a folder
   */
  async update(id: string, updates: Partial<Folder>): Promise<number> {
    return await db.folders.update(id, {
      ...updates,
      updatedAt: new Date()
    });
  },

  /**
   * Delete a folder and move its contents to root
   */
  async delete(id: string): Promise<void> {
    // Move all boards in this folder to root
    const boardsInFolder = await db.boards.where('folderId').equals(id).toArray();
    for (const board of boardsInFolder) {
      await db.boards.update(board.id, { folderId: null });
    }

    // Move all child folders to root
    const childFolders = await db.folders.where('parentFolderId').equals(id).toArray();
    for (const folder of childFolders) {
      await db.folders.update(folder.id, { parentFolderId: null });
    }

    // Delete the folder
    await db.folders.delete(id);
  }
};

/**
 * Helper function to get all descendant boards recursively
 */
async function getDescendantBoards(parentId: string): Promise<Board[]> {
  const children = await db.boards.where('parentId').equals(parentId).toArray();
  const descendants: Board[] = [...children];

  for (const child of children) {
    const childDescendants = await getDescendantBoards(child.id);
    descendants.push(...childDescendants);
  }

  return descendants;
}

/**
 * Initialize database
 */
export async function initializeDatabase(): Promise<void> {
  // Database is ready, no default data created
  console.log('✅ Database initialized');
}

// Export db instance as default
export default db;
