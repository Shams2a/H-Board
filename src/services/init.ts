/**
 * Service Initialization
 * Initializes all services when the app starts
 */

import { initializeDatabase } from '../utils/db';
import { storageManager } from './StorageManager';
import { isSupabaseConfigured, testSupabaseConnection } from '../lib/supabase';
import { logger } from '../utils/logger';

/**
 * Initialize all application services
 */
export async function initializeServices(): Promise<void> {
  logger.info('Initializing H-Board services...');

  try {
    // Initialize IndexedDB
    await initializeDatabase();
    logger.info('Database initialized');

    // Run initial storage cleanup if auto cleanup is enabled
    const settings = await storageManager.getSettings();
    if (settings.autoCleanup) {
      await storageManager.cleanupOldBoards();
      logger.info('Storage cleanup completed');
    }

    // Get initial storage stats
    const stats = await storageManager.getStorageStats();
    logger.info(`Storage: ${stats.cachedBoardsCount} boards cached, ${stats.pendingOpsCount} pending sync operations`);

    // Check Supabase configuration
    if (isSupabaseConfigured()) {
      logger.info('Supabase configured, testing connection...');
      const isConnected = await testSupabaseConnection();

      if (isConnected) {
        logger.info('Supabase connection successful');
        logger.info('Auto-sync enabled (syncs every 2 minutes)');

        // Note: newSyncService starts automatically in constructor
        // First sync happens after 5 seconds, then every 2 minutes
      } else {
        console.warn('Supabase connection failed, will retry automatically');
      }
    } else {
      logger.info('Supabase not configured - running in offline-only mode');
      logger.info('Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env to enable sync');
    }

    logger.info('All services initialized successfully');
  } catch (error) {
    console.error('Error initializing services:', error);
    throw error;
  }
}

