/**
 * Supabase Sync Service
 * Handles synchronization between IndexedDB and Supabase
 */

import { generateId } from '../../utils/uuid';
import { supabaseAdapter } from './supabaseAdapter';
import { isSupabaseConfigured } from '../../lib/supabase';
import type { Board, BoardElement, Folder } from '../../types';

interface SyncOperation {
  id: string;
  operation: 'create' | 'update' | 'delete';
  entityType: 'board' | 'element' | 'folder';
  entityId: string;
  data: any;
  timestamp: number;
  retries: number;
  status: 'pending' | 'syncing' | 'synced' | 'failed';
  error?: string;
}

interface SyncStats {
  pending: number;
  synced: number;
  failed: number;
  total: number;
}

const STORAGE_KEY = 'h-board-supabase-sync-queue';
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

class SupabaseSyncService {
  private queue: SyncOperation[] = [];
  private isProcessing = false;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.loadQueue();
    this.startAutoSync();
  }

  /**
   * Load queue from localStorage
   */
  private loadQueue(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
        console.log(`📋 Loaded ${this.queue.length} sync operations from storage`);
      }
    } catch (error) {
      console.error('Failed to load sync queue:', error);
      this.queue = [];
    }
  }

  /**
   * Save queue to localStorage
   */
  private saveQueue(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.queue));
      this.notifyListeners();
    } catch (error) {
      console.error('Failed to save sync queue:', error);
    }
  }

  /**
   * Add operation to sync queue
   */
  async queueOperation(
    operation: 'create' | 'update' | 'delete',
    entityType: 'board' | 'element' | 'folder',
    entityId: string,
    data: any
  ): Promise<void> {
    const syncOp: SyncOperation = {
      id: generateId(),
      operation,
      entityType,
      entityId,
      data,
      timestamp: Date.now(),
      retries: 0,
      status: 'pending'
    };

    this.queue.push(syncOp);
    this.saveQueue();

    console.log(`➕ Queued ${entityType}:${operation} ${entityId}`);

    // Try to sync immediately if Supabase is configured
    if (isSupabaseConfigured()) {
      this.processQueue();
    }
  }

  /**
   * Process sync queue
   * Processes operations in order: folders, boards, then elements
   */
  async processQueue(): Promise<void> {
    if (!isSupabaseConfigured()) {
      console.log('⚠️  Supabase not configured, skipping sync');
      return;
    }

    if (this.isProcessing) {
      console.log('🔄 Sync already in progress');
      return;
    }

    const pendingOps = this.queue.filter(op => op.status === 'pending' || op.status === 'failed');
    if (pendingOps.length === 0) {
      return;
    }

    this.isProcessing = true;
    console.log(`🔄 Syncing ${pendingOps.length} operations...`);

    // Check if Supabase is reachable
    const isReachable = await supabaseAdapter.healthCheck();
    if (!isReachable) {
      console.log('⚠️  Supabase not reachable, will retry later');
      this.isProcessing = false;
      return;
    }

    let synced = 0;
    let failed = 0;

    // Sort operations by priority: folders first, then boards, then elements
    const sortedOps = this.sortOperationsByPriority(pendingOps);

    for (const op of sortedOps) {
      try {
        op.status = 'syncing';
        this.saveQueue();

        await this.syncOperation(op);

        op.status = 'synced';
        synced++;
        console.log(`✅ Synced ${op.entityType}:${op.operation} ${op.entityId}`);
      } catch (error) {
        op.retries++;
        op.error = error instanceof Error ? error.message : 'Unknown error';

        if (op.retries >= MAX_RETRIES) {
          op.status = 'failed';
          failed++;
          console.error(`❌ Failed to sync ${op.entityType}:${op.operation} ${op.entityId} after ${MAX_RETRIES} retries`);
        } else {
          op.status = 'pending';
          console.warn(`⚠️  Retry ${op.retries}/${MAX_RETRIES} for ${op.entityType}:${op.operation} ${op.entityId}`);
        }
      }

      this.saveQueue();
    }

    this.isProcessing = false;
    console.log(`✅ Sync complete. ${synced} synced, ${failed} failed`);

    // Clean up synced operations (keep only last 100)
    this.cleanupSyncedOperations();
  }

  /**
   * Sort operations by priority
   * Order: folders -> boards -> elements
   * Within each type: creates before updates before deletes
   */
  private sortOperationsByPriority(ops: SyncOperation[]): SyncOperation[] {
    const priorityMap: Record<string, number> = {
      'folder-create': 1,
      'folder-update': 2,
      'folder-delete': 3,
      'board-create': 4,
      'board-update': 5,
      'board-delete': 6,
      'element-create': 7,
      'element-update': 8,
      'element-delete': 9,
    };

    return [...ops].sort((a, b) => {
      const keyA = `${a.entityType}-${a.operation}`;
      const keyB = `${b.entityType}-${b.operation}`;
      const priorityA = priorityMap[keyA] || 999;
      const priorityB = priorityMap[keyB] || 999;

      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      // If same priority, sort by timestamp (older first)
      return a.timestamp - b.timestamp;
    });
  }

  /**
   * Sync a single operation
   */
  private async syncOperation(op: SyncOperation): Promise<void> {
    const { operation, entityType, entityId, data } = op;

    switch (entityType) {
      case 'board':
        await this.syncBoard(operation, entityId, data);
        break;
      case 'element':
        await this.syncElement(operation, entityId, data);
        break;
      case 'folder':
        await this.syncFolder(operation, entityId, data);
        break;
      default:
        throw new Error(`Unknown entity type: ${entityType}`);
    }
  }

  /**
   * Sync board operation
   */
  private async syncBoard(operation: string, id: string, data: Board | null): Promise<void> {
    switch (operation) {
      case 'create':
        const createResult = await supabaseAdapter.board.create(data!);
        if (!createResult.success) {
          // If board already exists (duplicate key), treat as success
          if (createResult.error?.includes('duplicate key') || createResult.error?.includes('23505')) {
            console.log(`⚠️  Board ${id} already exists in Supabase, skipping create`);
            return;
          }
          throw new Error(createResult.error || 'Failed to create board');
        }
        break;
      case 'update':
        const updateResult = await supabaseAdapter.board.update(id, data!);
        if (!updateResult.success) {
          // If board doesn't exist (PGRST116), try to create it instead
          if (updateResult.error?.includes('PGRST116') || updateResult.error?.includes('0 rows')) {
            console.log(`⚠️  Board ${id} not found in Supabase, creating it instead`);
            const createFallbackResult = await supabaseAdapter.board.create(data!);
            if (!createFallbackResult.success) {
              throw new Error(createFallbackResult.error || 'Failed to create board as fallback');
            }
            return;
          }
          throw new Error(updateResult.error || 'Failed to update board');
        }
        break;
      case 'delete':
        const deleteResult = await supabaseAdapter.board.delete(id);
        if (!deleteResult.success) {
          // If board doesn't exist, treat as success
          if (deleteResult.error?.includes('PGRST116') || deleteResult.error?.includes('0 rows')) {
            console.log(`⚠️  Board ${id} already deleted from Supabase`);
            return;
          }
          throw new Error(deleteResult.error || 'Failed to delete board');
        }
        break;
    }
  }

  /**
   * Sync element operation
   */
  private async syncElement(operation: string, id: string, data: BoardElement | null): Promise<void> {
    switch (operation) {
      case 'create':
        const createResult = await supabaseAdapter.element.create(data!);
        if (!createResult.success) {
          // If element already exists (duplicate key), treat as success
          if (createResult.error?.includes('duplicate key') || createResult.error?.includes('23505')) {
            console.log(`⚠️  Element ${id} already exists in Supabase, skipping create`);
            return;
          }
          // If parent board doesn't exist, this is a real error
          if (createResult.error?.includes('23503') || createResult.error?.includes('foreign key')) {
            throw new Error(`Parent board not found in Supabase: ${createResult.error}`);
          }
          throw new Error(createResult.error || 'Failed to create element');
        }
        break;
      case 'update':
        const updateResult = await supabaseAdapter.element.update(id, data!);
        if (!updateResult.success) {
          // If element doesn't exist (PGRST116), try to create it instead
          if (updateResult.error?.includes('PGRST116') || updateResult.error?.includes('0 rows')) {
            console.log(`⚠️  Element ${id} not found in Supabase, creating it instead`);
            const createFallbackResult = await supabaseAdapter.element.create(data!);
            if (!createFallbackResult.success) {
              // If parent board doesn't exist, this is expected - board needs to sync first
              if (createFallbackResult.error?.includes('23503') || createFallbackResult.error?.includes('foreign key')) {
                throw new Error(`Parent board not synced yet: ${createFallbackResult.error}`);
              }
              throw new Error(createFallbackResult.error || 'Failed to create element as fallback');
            }
            return;
          }
          throw new Error(updateResult.error || 'Failed to update element');
        }
        break;
      case 'delete':
        const deleteResult = await supabaseAdapter.element.delete(id);
        if (!deleteResult.success) {
          // If element doesn't exist, treat as success
          if (deleteResult.error?.includes('PGRST116') || deleteResult.error?.includes('0 rows')) {
            console.log(`⚠️  Element ${id} already deleted from Supabase`);
            return;
          }
          throw new Error(deleteResult.error || 'Failed to delete element');
        }
        break;
    }
  }

  /**
   * Sync folder operation
   */
  private async syncFolder(operation: string, id: string, data: Folder | null): Promise<void> {
    switch (operation) {
      case 'create':
        const createResult = await supabaseAdapter.folder.create(data!);
        if (!createResult.success) {
          // If folder already exists (duplicate key), treat as success
          if (createResult.error?.includes('duplicate key') || createResult.error?.includes('23505')) {
            console.log(`⚠️  Folder ${id} already exists in Supabase, skipping create`);
            return;
          }
          throw new Error(createResult.error || 'Failed to create folder');
        }
        break;
      case 'update':
        const updateResult = await supabaseAdapter.folder.update(id, data!);
        if (!updateResult.success) {
          // If folder doesn't exist (PGRST116), try to create it instead
          if (updateResult.error?.includes('PGRST116') || updateResult.error?.includes('0 rows')) {
            console.log(`⚠️  Folder ${id} not found in Supabase, creating it instead`);
            const createFallbackResult = await supabaseAdapter.folder.create(data!);
            if (!createFallbackResult.success) {
              throw new Error(createFallbackResult.error || 'Failed to create folder as fallback');
            }
            return;
          }
          throw new Error(updateResult.error || 'Failed to update folder');
        }
        break;
      case 'delete':
        const deleteResult = await supabaseAdapter.folder.delete(id);
        if (!deleteResult.success) {
          // If folder doesn't exist, treat as success
          if (deleteResult.error?.includes('PGRST116') || deleteResult.error?.includes('0 rows')) {
            console.log(`⚠️  Folder ${id} already deleted from Supabase`);
            return;
          }
          throw new Error(deleteResult.error || 'Failed to delete folder');
        }
        break;
    }
  }

  /**
   * Get sync statistics
   */
  getStats(): SyncStats {
    const pending = this.queue.filter(op => op.status === 'pending').length;
    const synced = this.queue.filter(op => op.status === 'synced').length;
    const failed = this.queue.filter(op => op.status === 'failed').length;

    return {
      pending,
      synced,
      failed,
      total: this.queue.length
    };
  }

  /**
   * Get queue status
   */
  getQueue(): SyncOperation[] {
    return [...this.queue];
  }

  /**
   * Retry all failed operations
   */
  async retryAllFailed(): Promise<void> {
    this.queue
      .filter(op => op.status === 'failed')
      .forEach(op => {
        op.status = 'pending';
        op.retries = 0;
        op.error = undefined;
      });

    this.saveQueue();
    await this.processQueue();
  }

  /**
   * Clear synced operations
   */
  clearSynced(): void {
    this.queue = this.queue.filter(op => op.status !== 'synced');
    this.saveQueue();
    console.log('🧹 Cleared synced operations');
  }

  /**
   * Cleanup old synced operations
   */
  private cleanupSyncedOperations(): void {
    const synced = this.queue.filter(op => op.status === 'synced');
    if (synced.length > 100) {
      // Keep only the last 100 synced operations
      const toKeep = synced.slice(-100);
      this.queue = [
        ...this.queue.filter(op => op.status !== 'synced'),
        ...toKeep
      ];
      this.saveQueue();
      console.log('🧹 Cleaned up old synced operations');
    }
  }

  /**
   * Start automatic sync every 30 seconds
   */
  private startAutoSync(): void {
    setInterval(() => {
      if (isSupabaseConfigured()) {
        this.processQueue();
      }
    }, 30000); // 30 seconds
  }

  /**
   * Subscribe to queue changes
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
   * Check if Supabase is available
   */
  isSupabaseAvailable(): boolean {
    return isSupabaseConfigured();
  }
}

// Export singleton instance
export const supabaseSyncService = new SupabaseSyncService();
