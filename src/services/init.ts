/**
 * Service Initialization
 * Initializes all services when the app starts
 */

import { initializeDatabase } from '../utils/db';
import { storageManager } from './StorageManager';
import { isSupabaseConfigured, testSupabaseConnection } from '../lib/supabase';
import { newSyncService } from './supabase/newSyncService';

/**
 * Initialize all application services
 */
export async function initializeServices(): Promise<void> {
  console.log('🚀 Initializing H-Board services...');

  try {
    // Initialize IndexedDB
    await initializeDatabase();
    console.log('✅ Database initialized');

    // Run initial storage cleanup if auto cleanup is enabled
    const settings = await storageManager.getSettings();
    if (settings.autoCleanup) {
      await storageManager.cleanupOldBoards();
      console.log('✅ Storage cleanup completed');
    }

    // Get initial storage stats
    const stats = await storageManager.getStorageStats();
    console.log(`📊 Storage: ${stats.cachedBoardsCount} boards cached, ${stats.pendingOpsCount} pending sync operations`);

    // Check Supabase configuration
    if (isSupabaseConfigured()) {
      console.log('🔌 Supabase configured, testing connection...');
      const isConnected = await testSupabaseConnection();

      if (isConnected) {
        console.log('✅ Supabase connection successful');
        console.log('ℹ️  Auto-sync enabled (syncs every 2 minutes)');

        // Note: newSyncService starts automatically in constructor
        // First sync happens after 5 seconds, then every 2 minutes
      } else {
        console.warn('⚠️  Supabase connection failed, will retry automatically');
      }
    } else {
      console.log('ℹ️  Supabase not configured - running in offline-only mode');
      console.log('ℹ️  Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env to enable sync');
    }

    console.log('✅ All services initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing services:', error);
    throw error;
  }
}

/**
 * Configure API endpoints when ready
 * Call this function when you have a backend API
 */
export function configureAPI(baseUrl: string): void {
  console.log(`🔧 Configuring API: ${baseUrl}`);

  syncService.configureAPI(baseUrl);
  connectionService.configureServerEndpoint(`${baseUrl}/health`, 30000);

  console.log('✅ API configured');

  // Trigger initial sync
  syncService.processQueue().catch(err => {
    console.error('Failed to sync after API configuration:', err);
  });
}
