/**
 * Supabase Sync Status Indicator
 * Shows the current sync status with Supabase
 */

import { useState, useEffect } from 'react';
import { Cloud, CloudOff, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { isSupabaseConfigured } from '../../lib/supabase';
import { supabaseSyncService } from '../../services/supabase/supabaseSyncService';

interface SyncStats {
  pending: number;
  synced: number;
  failed: number;
  total: number;
}

export function SupabaseSyncStatus() {
  const [stats, setStats] = useState<SyncStats>({ pending: 0, synced: 0, failed: 0, total: 0 });
  const [showDetails, setShowDetails] = useState(false);
  const [isConfigured] = useState(isSupabaseConfigured());

  useEffect(() => {
    if (!isConfigured) return;

    // Update stats immediately
    updateStats();

    // Subscribe to sync service changes
    const unsubscribe = supabaseSyncService.subscribe(() => {
      updateStats();
    });

    // Poll for stats every 3 seconds
    const interval = setInterval(updateStats, 3000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [isConfigured]);

  const updateStats = () => {
    const newStats = supabaseSyncService.getStats();
    setStats(newStats);
  };

  const handleRetryFailed = async () => {
    await supabaseSyncService.retryAllFailed();
  };

  const handleClearSynced = () => {
    supabaseSyncService.clearSynced();
    updateStats();
  };

  if (!isConfigured) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-md text-sm">
        <CloudOff className="w-4 h-4 text-gray-400" />
        <span className="text-gray-600">Offline Only</span>
      </div>
    );
  }

  // Determine status
  const isSyncing = stats.pending > 0;
  const hasFailed = stats.failed > 0;
  const isSynced = stats.pending === 0 && stats.failed === 0;

  return (
    <div className="relative">
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="flex items-center gap-2 px-3 py-1.5 bg-white border rounded-md text-sm hover:bg-gray-50 transition-colors"
      >
        {isSyncing && (
          <>
            <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
            <span className="text-blue-600">Syncing ({stats.pending})</span>
          </>
        )}
        {hasFailed && !isSyncing && (
          <>
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span className="text-red-600">Failed ({stats.failed})</span>
          </>
        )}
        {isSynced && (
          <>
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-green-600">Synced</span>
          </>
        )}
        {!isSyncing && !hasFailed && !isSynced && (
          <>
            <Cloud className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">Ready</span>
          </>
        )}
      </button>

      {showDetails && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDetails(false)}
          />

          {/* Details panel */}
          <div className="absolute top-full right-0 mt-2 w-80 bg-white border rounded-lg shadow-lg z-50 p-4">
            <h3 className="font-semibold text-lg mb-3">Supabase Sync Status</h3>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Pending:</span>
                <span className="font-semibold text-blue-600">{stats.pending}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Synced:</span>
                <span className="font-semibold text-green-600">{stats.synced}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Failed:</span>
                <span className="font-semibold text-red-600">{stats.failed}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-gray-600">Total:</span>
                <span className="font-semibold">{stats.total}</span>
              </div>
            </div>

            <div className="space-y-2">
              {stats.failed > 0 && (
                <button
                  onClick={handleRetryFailed}
                  className="w-full px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm font-medium"
                >
                  Retry Failed Operations
                </button>
              )}

              {stats.synced > 0 && (
                <button
                  onClick={handleClearSynced}
                  className="w-full px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm font-medium"
                >
                  Clear Synced Operations
                </button>
              )}

              <button
                onClick={() => setShowDetails(false)}
                className="w-full px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
