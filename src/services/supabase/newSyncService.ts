/**
 * New Supabase Sync Service
 * Simple and robust sync using UPSERT strategy
 */

import { supabase } from '../../lib/supabase';
import { isSupabaseConfigured } from '../../lib/supabase';
import { db, boardOperations, elementOperations, folderOperations } from '../../utils/db';
import {
  boardToSupabase, elementToSupabase, folderToSupabase,
  boardFromSupabase, elementFromSupabase, folderFromSupabase
} from './transformers';

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
  private stats: SyncStats = {
    boards: { synced: 0, failed: 0, deleted: 0, downloaded: 0 },
    elements: { synced: 0, failed: 0, deleted: 0, downloaded: 0 },
    folders: { synced: 0, failed: 0, deleted: 0, downloaded: 0 },
    lastSyncTime: null,
    isConnected: false,
  };

  constructor() {
    this.startAutoSync();
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
      console.log('⚠️  Supabase not configured, skipping sync');
      return;
    }

    if (!supabase) {
      console.log('⚠️  Supabase client not available');
      return;
    }

    if (this.isSyncing) {
      console.log('🔄 Sync already in progress');
      return;
    }

    this.isSyncing = true;
    console.log('🔄 Starting full sync...');

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
      this.stats.lastSyncTime = new Date();

      console.log(`✅ Sync complete: ${downloaded} downloaded, ${uploaded} uploaded, ${failed} failed`);
      this.notifyListeners();

      // Notify callbacks that sync is complete
      const hasNewData = downloaded > 0 || this.stats.boards.deleted > 0 || this.stats.elements.deleted > 0 || this.stats.folders.deleted > 0;
      this.onSyncCompleteCallbacks.forEach(callback => callback(hasNewData));
    } catch (error) {
      console.error('❌ Sync error:', error);
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
      console.log(`📁 Syncing ${folders.length} folders...`);

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
            console.error(`❌ Failed to sync folder ${folder.id}:`, error.message);
            this.stats.folders.failed++;
          } else {
            this.stats.folders.synced++;
          }
        } catch (error) {
          console.error(`❌ Error syncing folder ${folder.id}:`, error);
          this.stats.folders.failed++;
        }
      }

      console.log(`✅ Folders: ${this.stats.folders.synced} synced, ${this.stats.folders.failed} failed`);
    } catch (error) {
      console.error('❌ Error loading folders:', error);
    }
  }

  /**
   * Sync all boards
   */
  private async syncBoards(): Promise<void> {
    if (!supabase) return;

    try {
      const boards = await boardOperations.getAll();
      console.log(`📋 Syncing ${boards.length} boards...`);

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
            console.error(`❌ Failed to sync board ${board.id}:`, error.message);
            this.stats.boards.failed++;
          } else {
            this.stats.boards.synced++;
          }
        } catch (error) {
          console.error(`❌ Error syncing board ${board.id}:`, error);
          this.stats.boards.failed++;
        }
      }

      console.log(`✅ Boards: ${this.stats.boards.synced} synced, ${this.stats.boards.failed} failed`);
    } catch (error) {
      console.error('❌ Error loading boards:', error);
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
                console.error(`❌ Failed to sync element ${element.id}:`, error.message);
                this.stats.elements.failed++;
              } else {
                this.stats.elements.synced++;
              }
            } catch (error) {
              console.error(`❌ Error syncing element ${element.id}:`, error);
              this.stats.elements.failed++;
            }
          }
        } catch (error) {
          console.error(`❌ Error loading elements for board ${board.id}:`, error);
        }
      }

      console.log(`✅ Elements: ${this.stats.elements.synced} synced, ${this.stats.elements.failed} failed`);
    } catch (error) {
      console.error('❌ Error syncing elements:', error);
    }
  }

  /**
   * Download folders from Supabase to local
   */
  private async downloadFolders(): Promise<void> {
    if (!supabase) return;

    try {
      const { data: remoteFolders, error } = await supabase
        .from('folders')
        .select('*');

      if (error) {
        console.error('❌ Failed to fetch remote folders:', error.message);
        return;
      }

      if (!remoteFolders || remoteFolders.length === 0) {
        console.log('📁 No remote folders to download');
        return;
      }

      console.log(`📁 Downloading ${remoteFolders.length} folders from Supabase...`);

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
          console.error(`❌ Error downloading folder ${remoteFolder.id}:`, error);
        }
      }

      console.log(`✅ Folders downloaded: ${this.stats.folders.downloaded}`);
    } catch (error) {
      console.error('❌ Error downloading folders:', error);
    }
  }

  /**
   * Download boards from Supabase to local
   */
  private async downloadBoards(): Promise<void> {
    if (!supabase) return;

    try {
      const { data: remoteBoards, error } = await supabase
        .from('boards')
        .select('*');

      if (error) {
        console.error('❌ Failed to fetch remote boards:', error.message);
        return;
      }

      if (!remoteBoards || remoteBoards.length === 0) {
        console.log('📋 No remote boards to download');
        return;
      }

      console.log(`📋 Downloading ${remoteBoards.length} boards from Supabase...`);

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
          console.error(`❌ Error downloading board ${remoteBoard.id}:`, error);
        }
      }

      console.log(`✅ Boards downloaded: ${this.stats.boards.downloaded}`);
    } catch (error) {
      console.error('❌ Error downloading boards:', error);
    }
  }

  /**
   * Download elements from Supabase to local
   */
  private async downloadElements(): Promise<void> {
    if (!supabase) return;

    try {
      const { data: remoteElements, error } = await supabase
        .from('elements')
        .select('*');

      if (error) {
        console.error('❌ Failed to fetch remote elements:', error.message);
        return;
      }

      if (!remoteElements || remoteElements.length === 0) {
        console.log('🧩 No remote elements to download');
        return;
      }

      console.log(`🧩 Downloading ${remoteElements.length} elements from Supabase...`);

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
          console.error(`❌ Error downloading element ${remoteElement.id}:`, error);
        }
      }

      console.log(`✅ Elements downloaded: ${this.stats.elements.downloaded}`);
    } catch (error) {
      console.error('❌ Error downloading elements:', error);
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
