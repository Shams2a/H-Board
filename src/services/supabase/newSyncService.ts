/**
 * New Supabase Sync Service
 * Simple and robust sync using UPSERT strategy with Delta Sync optimization
 */

import { supabase } from '../../lib/supabase';
import { isSupabaseConfigured } from '../../lib/supabase';
import { db, boardOperations, elementOperations, folderOperations } from '../../utils/db';
import { logger } from '../../utils/logger';
import {
  boardToSupabase, elementToSupabase, folderToSupabase,
  boardFromSupabase, elementFromSupabase, folderFromSupabase
} from './transformers';

// Storage key for persisting lastSyncTime
const LAST_SYNC_TIME_KEY = 'h-board-last-sync-time';

interface SyncStats {
  boards: { synced: number; failed: number; deleted: number; downloaded: number };
  elements: { synced: number; failed: number; deleted: number; downloaded: number };
  folders: { synced: number; failed: number; deleted: number; downloaded: number };
  lastSyncTime: Date | null;
  isConnected: boolean;
}

class NewSyncService {
  private isSyncing = false;
  private listeners: Set<() => void> = new Set();
  private onSyncCompleteCallbacks: Set<(hasNewData: boolean) => void> = new Set();
  private lastSyncTime: Date | null = null;
  private stats: SyncStats = {
    boards: { synced: 0, failed: 0, deleted: 0, downloaded: 0 },
    elements: { synced: 0, failed: 0, deleted: 0, downloaded: 0 },
    folders: { synced: 0, failed: 0, deleted: 0, downloaded: 0 },
    lastSyncTime: null,
    isConnected: false,
  };

  constructor() {
    // Load lastSyncTime from localStorage
    this.loadLastSyncTime();
    this.startAutoSync();
  }

  /**
   * Load lastSyncTime from localStorage
   */
  private loadLastSyncTime(): void {
    try {
      const stored = localStorage.getItem(LAST_SYNC_TIME_KEY);
      if (stored) {
        this.lastSyncTime = new Date(stored);
        this.stats.lastSyncTime = this.lastSyncTime;
        logger.debug(`📅 Loaded lastSyncTime: ${this.lastSyncTime.toISOString()}`);
      } else {
        logger.debug('📅 No previous sync time found - will do full sync');
      }
    } catch (error) {
      logger.warn('Failed to load lastSyncTime:', error);
      this.lastSyncTime = null;
    }
  }

  /**
   * Save lastSyncTime to localStorage
   */
  private saveLastSyncTime(): void {
    try {
      if (this.lastSyncTime) {
        localStorage.setItem(LAST_SYNC_TIME_KEY, this.lastSyncTime.toISOString());
      }
    } catch (error) {
      logger.warn('Failed to save lastSyncTime:', error);
    }
  }

  /**
   * Register callback for when sync completes
   */
  onSyncComplete(callback: (hasNewData: boolean) => void): () => void {
    this.onSyncCompleteCallbacks.add(callback);
    return () => this.onSyncCompleteCallbacks.delete(callback);
  }

  /**
   * Sync all data from IndexedDB to Supabase
   * Uses UPSERT strategy (insert or update)
   */
  async syncAll(): Promise<void> {
    if (!isSupabaseConfigured()) {
      logger.debug('⚠️  Supabase not configured, skipping sync');
      return;
    }

    if (!supabase) {
      logger.debug('⚠️  Supabase client not available');
      return;
    }

    if (this.isSyncing) {
      logger.debug('🔄 Sync already in progress');
      return;
    }

    this.isSyncing = true;
    const syncType = this.lastSyncTime ? 'delta' : 'full';
    logger.debug(`🔄 Starting ${syncType} sync...${this.lastSyncTime ? ` (since ${this.lastSyncTime.toISOString()})` : ''}`);

    try {
      // Reset stats but keep lastSyncTime
      this.stats = {
        boards: { synced: 0, failed: 0, deleted: 0, downloaded: 0 },
        elements: { synced: 0, failed: 0, deleted: 0, downloaded: 0 },
        folders: { synced: 0, failed: 0, deleted: 0, downloaded: 0 },
        lastSyncTime: this.stats.lastSyncTime,
        isConnected: false,
      };

      // STEP 1: Download from Supabase to local (merge remote data)
      await this.downloadFolders();
      await this.downloadBoards();
      await this.downloadElements();

      // STEP 2: Upload from local to Supabase
      await this.syncFolders();
      await this.syncBoards();
      await this.syncElements();

      // NOTE: Cleanup disabled - needs proper deletion tracking
      // Items should only be deleted when explicitly marked as deleted

      const uploaded =
        this.stats.boards.synced +
        this.stats.elements.synced +
        this.stats.folders.synced;

      const downloaded =
        this.stats.boards.downloaded +
        this.stats.elements.downloaded +
        this.stats.folders.downloaded;

      const failed =
        this.stats.boards.failed +
        this.stats.elements.failed +
        this.stats.folders.failed;

      // Update connection status and last sync time
      this.stats.isConnected = failed === 0 || uploaded > 0 || downloaded > 0;
      this.lastSyncTime = new Date();
      this.stats.lastSyncTime = this.lastSyncTime;

      // Persist lastSyncTime for delta sync
      this.saveLastSyncTime();

      logger.debug(`✅ Sync complete: ${downloaded} downloaded, ${uploaded} uploaded, ${failed} failed`);
      this.notifyListeners();

      // Notify callbacks that sync is complete
      const hasNewData = downloaded > 0 || this.stats.boards.deleted > 0 || this.stats.elements.deleted > 0 || this.stats.folders.deleted > 0;
      this.onSyncCompleteCallbacks.forEach(callback => callback(hasNewData));
    } catch (error) {
      logger.error('❌ Sync error:', error);
      this.stats.isConnected = false;
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Sync all folders
   */
  private async syncFolders(): Promise<void> {
    if (!supabase) return;

    try {
      const folders = await folderOperations.getAll();
      logger.debug(`📁 Syncing ${folders.length} folders...`);

      for (const folder of folders) {
        try {
          const supabaseFolder = folderToSupabase(folder);

          // UPSERT: Try insert, on conflict update
          const { error } = await supabase
            .from('folders')
            .upsert(supabaseFolder, {
              onConflict: 'id'
            });

          if (error) {
            logger.error(`❌ Failed to sync folder ${folder.id}:`, error.message);
            this.stats.folders.failed++;
          } else {
            this.stats.folders.synced++;
          }
        } catch (error) {
          logger.error(`❌ Error syncing folder ${folder.id}:`, error);
          this.stats.folders.failed++;
        }
      }

      logger.debug(`✅ Folders: ${this.stats.folders.synced} synced, ${this.stats.folders.failed} failed`);
    } catch (error) {
      logger.error('❌ Error loading folders:', error);
    }
  }

  /**
   * Sync all boards
   */
  private async syncBoards(): Promise<void> {
    if (!supabase) return;

    try {
      const boards = await boardOperations.getAll();
      logger.debug(`📋 Syncing ${boards.length} boards...`);

      for (const board of boards) {
        try {
          const supabaseBoard = boardToSupabase(board);

          // UPSERT: Try insert, on conflict update
          const { error } = await supabase
            .from('boards')
            .upsert(supabaseBoard, {
              onConflict: 'id'
            });

          if (error) {
            logger.error(`❌ Failed to sync board ${board.id}:`, error.message);
            this.stats.boards.failed++;
          } else {
            this.stats.boards.synced++;
          }
        } catch (error) {
          logger.error(`❌ Error syncing board ${board.id}:`, error);
          this.stats.boards.failed++;
        }
      }

      logger.debug(`✅ Boards: ${this.stats.boards.synced} synced, ${this.stats.boards.failed} failed`);
    } catch (error) {
      logger.error('❌ Error loading boards:', error);
    }
  }

  /**
   * Sync all elements
   */
  private async syncElements(): Promise<void> {
    if (!supabase) return;

    try {
      // Get all boards to sync their elements
      const boards = await boardOperations.getAll();
      let totalElements = 0;

      for (const board of boards) {
        try {
          const elements = await elementOperations.getByBoard(board.id);
          totalElements += elements.length;

          for (const element of elements) {
            try {
              // @ts-ignore - Element type conversion handled by elementToSupabase
              const supabaseElement = elementToSupabase(element);

              // UPSERT: Try insert, on conflict update
              const { error } = await supabase
                .from('elements')
                .upsert(supabaseElement, {
                  onConflict: 'id'
                });

              if (error) {
                logger.error(`❌ Failed to sync element ${element.id}:`, error.message);
                this.stats.elements.failed++;
              } else {
                this.stats.elements.synced++;
              }
            } catch (error) {
              logger.error(`❌ Error syncing element ${element.id}:`, error);
              this.stats.elements.failed++;
            }
          }
        } catch (error) {
          logger.error(`❌ Error loading elements for board ${board.id}:`, error);
        }
      }

      logger.debug(`✅ Elements: ${this.stats.elements.synced} synced, ${this.stats.elements.failed} failed`);
    } catch (error) {
      logger.error('❌ Error syncing elements:', error);
    }
  }

  /**
   * Download folders from Supabase to local (with delta sync)
   */
  private async downloadFolders(): Promise<void> {
    if (!supabase) return;

    try {
      // Build query - use delta sync if we have a lastSyncTime
      let query = supabase.from('folders').select('*');

      if (this.lastSyncTime) {
        // Delta sync: only fetch folders updated since last sync
        query = query.gte('updated_at', this.lastSyncTime.toISOString());
        logger.debug(`📁 Delta sync folders (since ${this.lastSyncTime.toISOString()})...`);
      } else {
        logger.debug('📁 Full sync folders (first time)...');
      }

      const { data: remoteFolders, error } = await query;

      if (error) {
        logger.error('❌ Failed to fetch remote folders:', error.message);
        return;
      }

      if (!remoteFolders || remoteFolders.length === 0) {
        logger.debug('📁 No remote folders to download');
        return;
      }

      logger.debug(`📁 Downloading ${remoteFolders.length} folders from Supabase...`);

      // Get local folders for comparison
      const localFolders = await folderOperations.getAll();
      const localFoldersMap = new Map(localFolders.map(f => [f.id, f]));

      for (const remoteFolder of remoteFolders) {
        try {
          const folder = folderFromSupabase(remoteFolder);
          const localFolder = localFoldersMap.get(folder.id);

          // Check if remotely deleted
          if (folder.deletedAt) {
            if (localFolder) {
              await folderOperations.delete(folder.id);
              this.stats.folders.deleted++;
            }
            continue;
          }

          if (!localFolder) {
            // New folder - create locally
            await folderOperations.create(folder);
            this.stats.folders.downloaded++;
          } else {
            // Existing folder - update if remote is newer
            const remoteUpdated = new Date(folder.updatedAt).getTime();
            const localUpdated = new Date(localFolder.updatedAt).getTime();

            if (remoteUpdated > localUpdated) {
              await folderOperations.update(folder.id, folder);
              this.stats.folders.downloaded++;
            }
          }
        } catch (error) {
          logger.error(`❌ Error downloading folder ${remoteFolder.id}:`, error);
        }
      }

      logger.debug(`✅ Folders downloaded: ${this.stats.folders.downloaded}`);
    } catch (error) {
      logger.error('❌ Error downloading folders:', error);
    }
  }

  /**
   * Download boards from Supabase to local (with delta sync)
   */
  private async downloadBoards(): Promise<void> {
    if (!supabase) return;

    try {
      // Build query - use delta sync if we have a lastSyncTime
      let query = supabase.from('boards').select('*');

      if (this.lastSyncTime) {
        // Delta sync: only fetch boards updated since last sync
        query = query.gte('updated_at', this.lastSyncTime.toISOString());
        logger.debug(`📋 Delta sync boards (since ${this.lastSyncTime.toISOString()})...`);
      } else {
        logger.debug('📋 Full sync boards (first time)...');
      }

      const { data: remoteBoards, error } = await query;

      if (error) {
        logger.error('❌ Failed to fetch remote boards:', error.message);
        return;
      }

      if (!remoteBoards || remoteBoards.length === 0) {
        logger.debug('📋 No remote boards to download');
        return;
      }

      logger.debug(`📋 Downloading ${remoteBoards.length} boards from Supabase...`);

      // Get local boards for comparison
      const localBoards = await boardOperations.getAll();
      const localBoardsMap = new Map(localBoards.map(b => [b.id, b]));

      for (const remoteBoard of remoteBoards) {
        try {
          const board = boardFromSupabase(remoteBoard);
          const localBoard = localBoardsMap.get(board.id);

          // Check if remotely deleted
          if (board.deletedAt) {
            if (localBoard) {
              await boardOperations.delete(board.id);
              this.stats.boards.deleted++;
            }
            continue;
          }

          if (!localBoard) {
            // New board - create locally
            await boardOperations.create(board);
            this.stats.boards.downloaded++;
          } else {
            // Existing board - update if remote is newer
            const remoteUpdated = new Date(board.updatedAt).getTime();
            const localUpdated = new Date(localBoard.updatedAt).getTime();

            if (remoteUpdated > localUpdated) {
              await boardOperations.update(board.id, board);
              this.stats.boards.downloaded++;
            }
          }
        } catch (error) {
          logger.error(`❌ Error downloading board ${remoteBoard.id}:`, error);
        }
      }

      logger.debug(`✅ Boards downloaded: ${this.stats.boards.downloaded}`);
    } catch (error) {
      logger.error('❌ Error downloading boards:', error);
    }
  }

  /**
   * Download elements from Supabase to local (with delta sync)
   */
  private async downloadElements(): Promise<void> {
    if (!supabase) return;

    try {
      // Build query - use delta sync if we have a lastSyncTime
      let query = supabase.from('elements').select('*');

      if (this.lastSyncTime) {
        // Delta sync: only fetch elements updated since last sync
        query = query.gte('updated_at', this.lastSyncTime.toISOString());
        logger.debug(`🧩 Delta sync elements (since ${this.lastSyncTime.toISOString()})...`);
      } else {
        logger.debug('🧩 Full sync elements (first time)...');
      }

      const { data: remoteElements, error } = await query;

      if (error) {
        logger.error('❌ Failed to fetch remote elements:', error.message);
        return;
      }

      if (!remoteElements || remoteElements.length === 0) {
        logger.debug('🧩 No remote elements to download');
        return;
      }

      logger.debug(`🧩 Downloading ${remoteElements.length} elements from Supabase...`);

      // Get all local elements for comparison
      const localBoards = await boardOperations.getAll();
      const localElementsMap = new Map<string, any>();

      for (const board of localBoards) {
        const elements = await elementOperations.getByBoard(board.id);
        elements.forEach(el => localElementsMap.set(el.id, el));
      }

      for (const remoteElement of remoteElements) {
        try {
          const element = elementFromSupabase(remoteElement);
          const localElement = localElementsMap.get(element.id);

          // Check if remotely deleted
          if (element.deletedAt) {
            if (localElement) {
              await elementOperations.delete(element.id);
              this.stats.elements.deleted++;
            }
            continue;
          }

          if (!localElement) {
            // New element - use put for upsert to avoid constraint errors
            await db.elements.put(element);
            this.stats.elements.downloaded++;
          } else {
            // Existing element - update if remote is newer
            const remoteUpdated = new Date(element.updatedAt).getTime();
            const localUpdated = new Date(localElement.updatedAt).getTime();

            if (remoteUpdated > localUpdated) {
              await db.elements.put(element);
              this.stats.elements.downloaded++;
            }
          }
        } catch (error) {
          logger.error(`❌ Error downloading element ${remoteElement.id}:`, error);
        }
      }

      logger.debug(`✅ Elements downloaded: ${this.stats.elements.downloaded}`);
    } catch (error) {
      logger.error('❌ Error downloading elements:', error);
    }
  }

  /**
   * Download only - used for catch-up after reconnection
   * Does not upload local changes, only downloads remote changes
   */
  async downloadOnly(): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      logger.debug('⚠️  Supabase not configured, skipping download');
      return false;
    }

    if (!supabase) {
      logger.debug('⚠️  Supabase client not available');
      return false;
    }

    if (this.isSyncing) {
      logger.debug('🔄 Sync already in progress, skipping catch-up');
      return false;
    }

    this.isSyncing = true;
    logger.debug('🔄 Starting catch-up download (reconnection)...');

    try {
      // Reset download stats
      this.stats.boards.downloaded = 0;
      this.stats.elements.downloaded = 0;
      this.stats.folders.downloaded = 0;

      // Download only - no upload
      await this.downloadFolders();
      await this.downloadBoards();
      await this.downloadElements();

      const downloaded =
        this.stats.boards.downloaded +
        this.stats.elements.downloaded +
        this.stats.folders.downloaded;

      logger.debug(`✅ Catch-up complete: ${downloaded} items downloaded`);

      // Notify callbacks if we got new data
      if (downloaded > 0) {
        this.onSyncCompleteCallbacks.forEach(callback => callback(true));
      }

      this.notifyListeners();
      return downloaded > 0;
    } catch (error) {
      logger.error('❌ Catch-up download error:', error);
      return false;
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Get sync statistics
   */
  getStats(): SyncStats {
    return { ...this.stats };
  }

  /**
   * Check if currently syncing
   */
  isSyncInProgress(): boolean {
    return this.isSyncing;
  }

  /**
   * Force a full sync by resetting lastSyncTime
   * Use this when you suspect data might be out of sync
   */
  async forceFullSync(): Promise<void> {
    logger.debug('🔄 Forcing full sync (resetting lastSyncTime)...');
    this.lastSyncTime = null;
    this.stats.lastSyncTime = null;
    try {
      localStorage.removeItem(LAST_SYNC_TIME_KEY);
    } catch (error) {
      logger.warn('Failed to remove lastSyncTime from localStorage:', error);
    }
    await this.syncAll();
  }

  /**
   * Get the last sync time
   */
  getLastSyncTime(): Date | null {
    return this.lastSyncTime;
  }

  /**
   * Subscribe to sync status changes
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }

  /**
   * Start automatic sync every 2 minutes
   */
  private startAutoSync(): void {
    // Sync on startup after 5 seconds
    setTimeout(() => {
      this.syncAll();
    }, 5000);

    // Then sync every 2 minutes
    setInterval(() => {
      if (isSupabaseConfigured()) {
        this.syncAll();
      }
    }, 120000); // 2 minutes
  }

  // NOTE: Cleanup methods removed - deletion should be tracked explicitly
  // not inferred from "missing in local = should delete from remote"
}


// Export singleton instance
export const newSyncService = new NewSyncService();
