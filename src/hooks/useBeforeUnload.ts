/**
 * Hook for syncing data before page unload
 * Ensures local changes are persisted to Supabase before the user leaves
 */

import { useEffect } from 'react';
import { newSyncService } from '../services/supabase/newSyncService';
import { isSupabaseConfigured } from '../lib/supabase';
import { logger } from '../utils/logger';

interface UseBeforeUnloadOptions {
  enabled?: boolean;
}

export function useBeforeUnload({ enabled = true }: UseBeforeUnloadOptions = {}) {
  useEffect(() => {
    if (!enabled || !isSupabaseConfigured()) {
      return;
    }

    // Handler for beforeunload - sync data before page closes
    const handleBeforeUnload = (_event: BeforeUnloadEvent) => {
      // Trigger sync - note: this is async but we can't await in beforeunload
      // The browser will try to complete pending requests
      logger.debug('[useBeforeUnload] Page unloading - triggering final sync...');

      // Use sendBeacon for reliable delivery (doesn't block page close)
      // But since we're using Supabase client, we'll just trigger the sync
      // and hope it completes. For critical data, consider using sendBeacon API
      // with a custom endpoint.
      newSyncService.syncAll().catch((err) => {
        console.error('[useBeforeUnload] Final sync failed:', err);
      });

      // Don't show confirmation dialog - just sync silently
      // If you want to warn users about unsaved changes, uncomment below:
      // event.preventDefault();
      // event.returnValue = '';
    };

    // Handler for visibility change - sync when tab becomes hidden
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        logger.debug('[useBeforeUnload] Tab hidden - triggering sync...');
        newSyncService.syncAll().catch((err) => {
          console.error('[useBeforeUnload] Visibility sync failed:', err);
        });
      }
    };

    // Handler for page hide (more reliable than beforeunload on mobile)
    const handlePageHide = (event: PageTransitionEvent) => {
      if (event.persisted) {
        // Page is being cached (bfcache), don't sync
        return;
      }
      logger.debug('[useBeforeUnload] Page hiding - triggering sync...');
      newSyncService.syncAll().catch((err) => {
        console.error('[useBeforeUnload] PageHide sync failed:', err);
      });
    };

    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);

    logger.debug('[useBeforeUnload] Event listeners registered');

    // Cleanup
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
      logger.debug('[useBeforeUnload] Event listeners removed');
    };
  }, [enabled]);
}
