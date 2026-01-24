/**
 * Cache Manager
 * Gère le chargement des boards et la stratégie de cache
 * Note: Uses local IndexedDB cache. Supabase sync is handled by newSyncService.
 */

import { db } from '../utils/db';
import { storageManager } from './StorageManager';
import { logger } from '../utils/logger';
import type { Board, Element } from '../types';

export class CacheManager {
  /**
   * Load a board with its elements from local cache
   */
  async loadBoard(boardId: string): Promise<{ board: Board; elements: Element[] }> {
    logger.debug(`💾 Loading board ${boardId} from local database`);
    return await this.loadFromCache(boardId);
  }

  /**
   * Load board and elements from local cache/database
   */
  private async loadFromCache(boardId: string): Promise<{ board: Board; elements: Element[] }> {
    const board = await db.boards.get(boardId);
    if (!board) {
      throw new Error(`Board ${boardId} not found`);
    }

    const elements = await db.elements.where('boardId').equals(boardId).toArray();

    // Update access time for LRU
    await storageManager.updateBoardAccess(boardId);

    return { board, elements };
  }

  /**
   * Cache a board and its elements locally
   */
  async cacheBoard(board: Board, elements: Element[]): Promise<void> {
    // Store board
    await db.boards.put(board);

    // Store elements (bulk operation for efficiency)
    if (elements.length > 0) {
      await db.elements.bulkPut(elements);
    }

    // Update cache metadata
    await storageManager.updateBoardAccess(board.id);

    logger.debug(`💾 Cached board ${board.id} with ${elements.length} elements`);
  }

  /**
   * Prefetch related boards (e.g., child boards, boards in same folder)
   * Useful for improving perceived performance by preloading from local cache
   */
  async prefetchRelatedBoards(boardId: string): Promise<void> {
    const board = await db.boards.get(boardId);
    if (!board) return;

    const toPrefetch: string[] = [];

    // Get child boards
    const children = await db.boards.where('parentId').equals(boardId).toArray();
    toPrefetch.push(...children.map(b => b.id));

    // Get boards in same folder
    if (board.folderId) {
      const siblings = await db.boards.where('folderId').equals(board.folderId).toArray();
      toPrefetch.push(...siblings.map(b => b.id).filter(id => id !== boardId));
    }

    // Prefetch boards that aren't already cached
    for (const id of toPrefetch) {
      const isCached = await storageManager.isBoardCached(id);
      if (!isCached) {
        try {
          await this.loadBoard(id);
          logger.debug(`🔮 Prefetched board ${id}`);
        } catch (error) {
          logger.error(`Failed to prefetch board ${id}:`, error);
        }
      }
    }
  }

  /**
   * Invalidate cache for a specific board
   * Call this when you know the server version is newer
   */
  async invalidateBoard(boardId: string): Promise<void> {
    // Remove elements
    await db.elements.where('boardId').equals(boardId).delete();

    // Remove cache metadata
    await db.cacheMetadata.delete(boardId);

    logger.debug(`🔄 Invalidated cache for board ${boardId}`);
  }

  /**
   * Refresh board from local cache
   * Use newSyncService.syncAll() for server synchronization
   */
  async refreshBoard(boardId: string): Promise<{ board: Board; elements: Element[] }> {
    logger.debug(`🔄 Refreshing board ${boardId} from local cache...`);
    return await this.loadFromCache(boardId);
  }

  /**
   * Get boards list from local database
   * Use newSyncService.syncAll() to sync with server first if needed
   */
  async getBoardsList(): Promise<Board[]> {
    logger.debug('💾 Loading boards list from local database');
    return await db.boards.toArray();
  }

  /**
   * Get cached boards info
   */
  async getCachedBoardsInfo(): Promise<Array<{
    boardId: string;
    name: string;
    lastAccess: Date;
    elementCount: number;
    cacheSize: number;
  }>> {
    const cached = await storageManager.getCachedBoards();
    const result = [];

    for (const cache of cached) {
      const board = await db.boards.get(cache.boardId);
      if (board) {
        result.push({
          boardId: cache.boardId,
          name: board.name,
          lastAccess: cache.lastAccess,
          elementCount: cache.elementCount,
          cacheSize: cache.cacheSize
        });
      }
    }

    return result;
  }
}

// Export singleton instance
export const cacheManager = new CacheManager();
