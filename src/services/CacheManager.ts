/**
 * Cache Manager
 * Gère le chargement des boards et la stratégie de cache
 */

import { db } from '../utils/db';
import { storageManager } from './StorageManager';
import { connectionService } from './ConnectionService';
import type { Board, Element } from '../types';

export class CacheManager {
  private apiBaseUrl: string | null = null;

  /**
   * Configure API base URL
   * Call this when the backend is ready
   */
  configureAPI(baseUrl: string): void {
    this.apiBaseUrl = baseUrl;
    console.log(`✅ Cache API configured: ${baseUrl}`);
  }

  /**
   * Load a board with its elements
   * Strategy: Try cache first, fetch from server if needed
   */
  async loadBoard(boardId: string): Promise<{ board: Board; elements: Element[] }> {
    // Check if board is in cache
    const isCached = await storageManager.isBoardCached(boardId);

    if (isCached) {
      console.log(`📦 Loading board ${boardId} from cache`);
      return await this.loadFromCache(boardId);
    }

    // Not in cache - try to fetch from server if online
    if (connectionService.isOnline() && connectionService.isServerReachable() && this.apiBaseUrl) {
      console.log(`🌐 Fetching board ${boardId} from server`);
      try {
        return await this.fetchFromServer(boardId);
      } catch (error) {
        console.error(`❌ Failed to fetch board from server:`, error);
        // Fall back to cache/local if available
        return await this.loadFromCache(boardId);
      }
    }

    // Offline or no API configured - load from local database
    console.log(`💾 Loading board ${boardId} from local database`);
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
   * Fetch board and elements from server
   * This is a placeholder - implement when backend is ready
   */
  private async fetchFromServer(boardId: string): Promise<{ board: Board; elements: Element[] }> {
    if (!this.apiBaseUrl) {
      throw new Error('API base URL not configured');
    }

    // Fetch board metadata
    const boardResponse = await fetch(`${this.apiBaseUrl}/boards/${boardId}`);
    if (!boardResponse.ok) {
      throw new Error(`Failed to fetch board: ${boardResponse.status}`);
    }
    const board: Board = await boardResponse.json();

    // Fetch board elements
    const elementsResponse = await fetch(`${this.apiBaseUrl}/boards/${boardId}/elements`);
    if (!elementsResponse.ok) {
      throw new Error(`Failed to fetch elements: ${elementsResponse.status}`);
    }
    const elements: Element[] = await elementsResponse.json();

    // Store in local cache
    await this.cacheBoard(board, elements);

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

    console.log(`💾 Cached board ${board.id} with ${elements.length} elements`);
  }

  /**
   * Prefetch related boards (e.g., child boards, boards in same folder)
   * Useful for improving perceived performance
   */
  async prefetchRelatedBoards(boardId: string): Promise<void> {
    if (!connectionService.isOnline() || !connectionService.isServerReachable()) {
      return; // Only prefetch when online
    }

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
          console.log(`🔮 Prefetched board ${id}`);
        } catch (error) {
          console.error(`Failed to prefetch board ${id}:`, error);
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

    console.log(`🔄 Invalidated cache for board ${boardId}`);
  }

  /**
   * Sync a board with the server
   * Fetch latest version and update local cache
   */
  async syncBoard(boardId: string): Promise<void> {
    if (!connectionService.isOnline() || !connectionService.isServerReachable()) {
      throw new Error('Cannot sync: offline or server unreachable');
    }

    console.log(`🔄 Syncing board ${boardId} with server...`);

    // Invalidate current cache
    await this.invalidateBoard(boardId);

    // Fetch fresh data
    await this.loadBoard(boardId);

    console.log(`✅ Board ${boardId} synced successfully`);
  }

  /**
   * Preload boards list (metadata only, no elements)
   * Useful for showing boards in sidebar/list view
   */
  async preloadBoardsList(): Promise<Board[]> {
    if (connectionService.isOnline() && connectionService.isServerReachable() && this.apiBaseUrl) {
      try {
        console.log('🌐 Fetching boards list from server');
        const response = await fetch(`${this.apiBaseUrl}/boards`);
        if (response.ok) {
          const boards: Board[] = await response.json();

          // Update local board metadata (but don't load elements)
          await db.boards.bulkPut(boards);

          return boards;
        }
      } catch (error) {
        console.error('Failed to fetch boards list from server:', error);
      }
    }

    // Fall back to local database
    console.log('💾 Loading boards list from local database');
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
