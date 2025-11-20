/**
 * Sync Service
 * Gère la queue de synchronisation et la communication avec l'API
 */

import { db } from '../utils/db';
import { connectionService } from './ConnectionService';
import { supabaseBoardService } from './supabase/boardService';
import { supabaseElementService } from './supabase/elementService';
import { supabaseFolderService } from './supabase/folderService';
import { isSupabaseConfigured, testSupabaseConnection } from '../lib/supabase';
import type { SyncOperation, SyncOperationType, SyncEntityType, Board, Element, Folder } from '../types';

const MAX_RETRY_COUNT = 3;
const RETRY_DELAY_MS = 2000; // Initial retry delay

type SyncListener = (operation: SyncOperation) => void;

export class SyncService {
  private listeners: SyncListener[] = [];
  private isProcessing = false;
  private apiBaseUrl: string | null = null;

  constructor() {
    // Subscribe to connection changes to trigger sync
    connectionService.subscribe((state) => {
      if (state.isOnline && state.serverReachable) {
        console.log('🔄 Connection restored, processing sync queue...');
        this.processQueue();
      }
    });
  }

  /**
   * Configure API base URL
   * Call this when the backend is ready
   * @deprecated Use Supabase configuration instead
   */
  configureAPI(baseUrl: string): void {
    this.apiBaseUrl = baseUrl;
    console.log(`✅ Sync API configured: ${baseUrl}`);
  }

  /**
   * Check if Supabase is configured
   */
  isConfigured(): boolean {
    return isSupabaseConfigured();
  }

  /**
   * Add an operation to the sync queue
   */
  async queueOperation(
    type: SyncOperationType,
    entityType: SyncEntityType,
    entityId: string,
    data: any
  ): Promise<void> {
    const operation: SyncOperation = {
      id: crypto.randomUUID(),
      type,
      entityType,
      entityId,
      data,
      timestamp: new Date(),
      syncStatus: 'pending',
      retryCount: 0
    };

    await db.syncQueue.add(operation);
    console.log(`📝 Queued ${type} operation for ${entityType} ${entityId}`);

    // Try to process immediately if online
    if (connectionService.isOnline() && connectionService.isServerReachable()) {
      this.processQueue();
    }
  }

  /**
   * Process all pending operations in the queue
   */
  async processQueue(): Promise<void> {
    // Prevent concurrent processing
    if (this.isProcessing) {
      console.log('⏳ Sync already in progress...');
      return;
    }

    // Check if we're online and server is reachable
    if (!connectionService.isOnline() || !connectionService.isServerReachable()) {
      console.log('📴 Cannot sync: offline or server unreachable');
      return;
    }

    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      console.log('⚠️  Supabase not configured, sync postponed');
      return;
    }

    this.isProcessing = true;

    try {
      // Get all pending operations, ordered by timestamp
      const pendingOps = await db.syncQueue
        .where('syncStatus')
        .equals('pending')
        .sortBy('timestamp');

      console.log(`🔄 Processing ${pendingOps.length} pending operations...`);

      for (const operation of pendingOps) {
        await this.processOperation(operation);
      }

      console.log('✅ Sync queue processed successfully');
    } catch (error) {
      console.error('❌ Error processing sync queue:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process a single sync operation
   */
  private async processOperation(operation: SyncOperation): Promise<void> {
    try {
      // Call appropriate API endpoint based on entity type and operation type
      await this.syncToServer(operation);

      // Mark as synced
      await db.syncQueue.update(operation.id, {
        syncStatus: 'synced'
      });

      console.log(`✅ Synced ${operation.type} ${operation.entityType} ${operation.entityId}`);

      // Notify listeners
      this.notifyListeners(operation);
    } catch (error) {
      console.error(`❌ Failed to sync operation ${operation.id}:`, error);

      // Increment retry count
      const newRetryCount = operation.retryCount + 1;

      if (newRetryCount >= MAX_RETRY_COUNT) {
        // Max retries exceeded, mark as error
        await db.syncQueue.update(operation.id, {
          syncStatus: 'error',
          retryCount: newRetryCount,
          error: error instanceof Error ? error.message : String(error)
        });
        console.log(`🚫 Max retries exceeded for operation ${operation.id}`);
      } else {
        // Schedule retry with exponential backoff
        await db.syncQueue.update(operation.id, {
          retryCount: newRetryCount,
          error: error instanceof Error ? error.message : String(error)
        });

        const delay = RETRY_DELAY_MS * Math.pow(2, newRetryCount - 1);
        console.log(`🔄 Retrying operation ${operation.id} in ${delay}ms (attempt ${newRetryCount}/${MAX_RETRY_COUNT})`);

        setTimeout(() => {
          this.processQueue();
        }, delay);
      }
    }
  }

  /**
   * Sync operation to Supabase
   */
  private async syncToServer(operation: SyncOperation): Promise<void> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    const { type, entityType, entityId, data } = operation;

    let result;

    switch (entityType) {
      case 'board':
        result = await this.syncBoard(type, entityId, data);
        break;
      case 'element':
        result = await this.syncElement(type, entityId, data);
        break;
      case 'folder':
        result = await this.syncFolder(type, entityId, data);
        break;
      default:
        throw new Error(`Unknown entity type: ${entityType}`);
    }

    if (!result.success) {
      throw new Error(result.error || 'Sync failed');
    }
  }

  /**
   * Sync board to Supabase
   */
  private async syncBoard(type: SyncOperationType, entityId: string, data: any) {
    switch (type) {
      case 'create':
        return await supabaseBoardService.create(data);
      case 'update':
        return await supabaseBoardService.update(entityId, data);
      case 'delete':
        return await supabaseBoardService.delete(entityId);
      default:
        return { success: false, error: `Unknown operation type: ${type}` };
    }
  }

  /**
   * Sync element to Supabase
   */
  private async syncElement(type: SyncOperationType, entityId: string, data: any) {
    switch (type) {
      case 'create':
        return await supabaseElementService.create(data);
      case 'update':
        return await supabaseElementService.update(entityId, data);
      case 'delete':
        return await supabaseElementService.delete(entityId);
      default:
        return { success: false, error: `Unknown operation type: ${type}` };
    }
  }

  /**
   * Sync folder to Supabase
   */
  private async syncFolder(type: SyncOperationType, entityId: string, data: any) {
    switch (type) {
      case 'create':
        return await supabaseFolderService.create(data);
      case 'update':
        return await supabaseFolderService.update(entityId, data);
      case 'delete':
        return await supabaseFolderService.delete(entityId);
      default:
        return { success: false, error: `Unknown operation type: ${type}` };
    }
  }

  /**
   * Get all pending operations
   */
  async getPendingOperations(): Promise<SyncOperation[]> {
    return await db.syncQueue
      .where('syncStatus')
      .equals('pending')
      .toArray();
  }

  /**
   * Get all failed operations
   */
  async getFailedOperations(): Promise<SyncOperation[]> {
    return await db.syncQueue
      .where('syncStatus')
      .equals('error')
      .toArray();
  }

  /**
   * Retry a specific failed operation
   */
  async retryOperation(operationId: string): Promise<void> {
    const operation = await db.syncQueue.get(operationId);
    if (!operation) {
      throw new Error(`Operation ${operationId} not found`);
    }

    // Reset status and retry count
    await db.syncQueue.update(operationId, {
      syncStatus: 'pending',
      retryCount: 0,
      error: undefined
    });

    // Process immediately
    await this.processQueue();
  }

  /**
   * Retry all failed operations
   */
  async retryAllFailed(): Promise<void> {
    const failedOps = await this.getFailedOperations();

    for (const operation of failedOps) {
      await db.syncQueue.update(operation.id, {
        syncStatus: 'pending',
        retryCount: 0,
        error: undefined
      });
    }

    console.log(`🔄 Retrying ${failedOps.length} failed operations...`);
    await this.processQueue();
  }

  /**
   * Clear all synced operations from the queue
   */
  async clearSyncedOperations(): Promise<void> {
    const syncedCount = await db.syncQueue
      .where('syncStatus')
      .equals('synced')
      .delete();

    console.log(`🧹 Cleared ${syncedCount} synced operations from queue`);
  }

  /**
   * Subscribe to sync events
   */
  subscribe(listener: SyncListener): () => void {
    this.listeners.push(listener);

    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Notify listeners of sync event
   */
  private notifyListeners(operation: SyncOperation): void {
    this.listeners.forEach(listener => {
      try {
        listener(operation);
      } catch (error) {
        console.error('Error in sync listener:', error);
      }
    });
  }

  /**
   * Get sync statistics
   */
  async getStats(): Promise<{
    pending: number;
    synced: number;
    failed: number;
    total: number;
  }> {
    const all = await db.syncQueue.toArray();

    return {
      pending: all.filter(op => op.syncStatus === 'pending').length,
      synced: all.filter(op => op.syncStatus === 'synced').length,
      failed: all.filter(op => op.syncStatus === 'error').length,
      total: all.length
    };
  }
}

// Export singleton instance
export const syncService = new SyncService();
