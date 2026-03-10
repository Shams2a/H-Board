/**
 * Storage Manager
 * Gère le cache local, le nettoyage et les statistiques de stockage
 */

import { db } from '../utils/db';
import type { StorageSettings, StorageStats, CacheMetadata } from '../types';
import { logger } from '../utils/logger';

/**
 * Default storage settings
 */
const DEFAULT_STORAGE_SETTINGS: StorageSettings = {
  maxCachedBoards: 3,
  cacheExpiryDays: 7,
  autoCleanup: true,
  storeImagesLocally: false
};

/**
 * Settings key for IndexedDB
 */
const STORAGE_SETTINGS_KEY = 'storageSettings';

export class StorageManager {
  /**
   * Get current storage settings
   */
  async getSettings(): Promise<StorageSettings> {
    const settings = await db.settings.get(STORAGE_SETTINGS_KEY);
    return settings?.value || DEFAULT_STORAGE_SETTINGS;
  }

  /**
   * Update storage settings
   */
  async updateSettings(updates: Partial<StorageSettings>): Promise<void> {
    const currentSettings = await this.getSettings();
    const newSettings = { ...currentSettings, ...updates };

    await db.settings.put({
      key: STORAGE_SETTINGS_KEY,
      value: newSettings
    });

    // If auto cleanup is enabled, run cleanup
    if (newSettings.autoCleanup) {
      await this.cleanupOldBoards();
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<StorageStats> {
    // Get browser storage estimate
    let usedBytes = 0;
    let quotaBytes = 0;

    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      usedBytes = estimate.usage || 0;
      quotaBytes = estimate.quota || 0;
    }

    // Get cached boards count
    const cachedBoards = await db.cacheMetadata.count();

    // Get pending operations count
    const pendingOps = await db.syncQueue
      .where('syncStatus')
      .equals('pending' as any)
      .count();

    const usagePercent = quotaBytes > 0 ? (usedBytes / quotaBytes) * 100 : 0;

    return {
      usedBytes,
      quotaBytes,
      usagePercent,
      cachedBoardsCount: cachedBoards,
      pendingOpsCount: pendingOps
    };
  }

  /**
   * Update board access time (for LRU cache)
   */
  async updateBoardAccess(boardId: string): Promise<void> {
    const now = new Date();

    // Update board lastAccess
    await db.boards.update(boardId, { lastAccess: now });

    // Calculate cache metadata
    const elements = await db.elements.where('boardId').equals(boardId).toArray();
    const elementCount = elements.length;

    // Rough estimation of cache size (in bytes)
    // This is an approximation based on JSON stringified size
    const board = await db.boards.get(boardId);
    const estimatedSize =
      JSON.stringify(board).length +
      JSON.stringify(elements).length;

    // Update or create cache metadata
    const existing = await db.cacheMetadata.get(boardId);
    if (existing) {
      await db.cacheMetadata.update(boardId, {
        lastAccess: now,
        cacheSize: estimatedSize,
        elementCount
      });
    } else {
      await db.cacheMetadata.put({
        boardId,
        lastAccess: now,
        cacheSize: estimatedSize,
        elementCount
      });
    }

    // Check if we need to enforce max cached boards limit
    await this.enforceCacheLimit();
  }

  /**
   * Enforce max cached boards limit (LRU eviction)
   */
  private async enforceCacheLimit(): Promise<void> {
    const settings = await this.getSettings();
    const maxCached = settings.maxCachedBoards;

    // Get all cached boards sorted by last access (oldest first)
    const allCached = await db.cacheMetadata
      .orderBy('lastAccess')
      .toArray();

    // If we're over the limit, remove the oldest boards
    if (allCached.length > maxCached) {
      const toRemove = allCached.slice(0, allCached.length - maxCached);

      for (const cached of toRemove) {
        await this.evictBoard(cached.boardId);
      }
    }
  }

  /**
   * Evict a board from cache (remove elements, keep board metadata)
   */
  async evictBoard(boardId: string): Promise<void> {
    // Delete all elements for this board
    await db.elements.where('boardId').equals(boardId).delete();

    // Remove from cache metadata
    await db.cacheMetadata.delete(boardId);

    logger.debug(`Evicted board ${boardId} from cache`);
  }

  /**
   * Clean up old boards based on cache expiry days
   */
  async cleanupOldBoards(): Promise<void> {
    const settings = await this.getSettings();
    const expiryMs = settings.cacheExpiryDays * 24 * 60 * 60 * 1000;
    const now = Date.now();

    // Get all cached boards
    const allCached = await db.cacheMetadata.toArray();

    for (const cached of allCached) {
      const lastAccessTime = cached.lastAccess.getTime();
      const age = now - lastAccessTime;

      // If board hasn't been accessed in longer than expiry period, evict it
      if (age > expiryMs) {
        await this.evictBoard(cached.boardId);
      }
    }
  }

  /**
   * Get cache metadata for a specific board
   */
  async getBoardCacheMetadata(boardId: string): Promise<CacheMetadata | undefined> {
    return await db.cacheMetadata.get(boardId);
  }

  /**
   * Check if a board is currently cached
   */
  async isBoardCached(boardId: string): Promise<boolean> {
    const metadata = await db.cacheMetadata.get(boardId);
    return metadata !== undefined;
  }

  /**
   * Manually clear all cache (keep boards metadata, remove elements)
   */
  async clearAllCache(): Promise<void> {
    // Get all cached boards
    const allCached = await db.cacheMetadata.toArray();

    // Evict each one
    for (const cached of allCached) {
      await this.evictBoard(cached.boardId);
    }

    logger.debug('All cache cleared');
  }

  /**
   * Get list of cached boards with metadata
   */
  async getCachedBoards(): Promise<Array<CacheMetadata & { boardId: string }>> {
    return await db.cacheMetadata.toArray();
  }
}

// Export singleton instance
export const storageManager = new StorageManager();
