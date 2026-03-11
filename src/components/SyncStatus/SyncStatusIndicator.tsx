/**
 * Sync Status Indicator
 * Displays connection status, sync progress, and storage info
 */

import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff, Cloud, CloudOff, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { connectionService } from '../../services/ConnectionService';
import { syncService } from '../../services/SyncService';
import { storageManager } from '../../services/StorageManager';
import type { ConnectionState, StorageStats } from '../../types';

export const SyncStatusIndicator: React.FC = () => {
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    connectionService.getState()
  );
  const [syncStats, setSyncStats] = useState({ pending: 0, synced: 0, failed: 0, total: 0 });
  const [storageStats, setStorageStats] = useState<StorageStats | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Subscribe to connection changes
  useEffect(() => {
    const unsubscribe = connectionService.subscribe((state) => {
      setConnectionState(state);
    });

    return () => unsubscribe();
  }, []);

  // Periodically update sync and storage stats
  useEffect(() => {
    const updateStats = async () => {
      const stats = await syncService.getStats();
      setSyncStats(stats);

      const storage = await storageManager.getStorageStats();
      setStorageStats(storage);
    };

    updateStats();
    const interval = setInterval(updateStats, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  // Get status icon and color
  const getStatusInfo = () => {
    if (!connectionState.isOnline) {
      return {
        icon: <WifiOff className="w-4 h-4" />,
        color: 'text-gray-400',
        label: 'Offline',
        description: 'No internet connection'
      };
    }

    if (!connectionState.serverReachable) {
      return {
        icon: <CloudOff className="w-4 h-4" />,
        color: 'text-yellow-500',
        label: 'Local Only',
        description: 'Server unavailable, working locally'
      };
    }

    if (syncStats.failed > 0) {
      return {
        icon: <AlertCircle className="w-4 h-4" />,
        color: 'text-red-500',
        label: 'Sync Error',
        description: `${syncStats.failed} operation(s) failed`
      };
    }

    if (syncStats.pending > 0) {
      return {
        icon: <Loader className="w-4 h-4 animate-spin" />,
        color: 'text-blue-500',
        label: 'Syncing',
        description: `${syncStats.pending} operation(s) pending`
      };
    }

    return {
      icon: <CheckCircle className="w-4 h-4" />,
      color: 'text-green-500',
      label: 'Synced',
      description: 'All changes saved'
    };
  };

  const status = getStatusInfo();

  // Format bytes to readable format
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="relative">
      {/* Status Indicator Button */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-md
          bg-white dark:bg-[#252B32] border border-gray-200 dark:border-[#3D444D]
          hover:bg-gray-50 dark:hover:bg-[#2C333A] transition-colors
          text-sm font-medium
          ${status.color}
        `}
        title={status.description}
      >
        {status.icon}
        <span className="text-gray-700 dark:text-[#E0E6ED]">{status.label}</span>
        {syncStats.pending > 0 && (
          <span className="ml-1 px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 text-xs">
            {syncStats.pending}
          </span>
        )}
      </button>

      {/* Details Popup */}
      {showDetails && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-[#1E252B] rounded-lg shadow-lg border border-gray-200 dark:border-[#30363D] p-4 z-50">
          {/* Connection Status */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-[#E0E6ED] mb-2">Connection</h3>
            <div className="flex items-center gap-2">
              {connectionState.isOnline ? (
                <>
                  <Wifi className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-gray-600 dark:text-[#B1B9C4]">Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-[#B1B9C4]">Offline</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              {connectionState.serverReachable ? (
                <>
                  <Cloud className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-gray-600 dark:text-[#B1B9C4]">Server connected</span>
                </>
              ) : (
                <>
                  <CloudOff className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm text-gray-600 dark:text-[#B1B9C4]">Server unavailable</span>
                </>
              )}
            </div>
          </div>

          {/* Sync Status */}
          <div className="mb-4 border-t border-gray-200 dark:border-[#30363D] pt-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-[#E0E6ED] mb-2">Synchronization</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-[#B1B9C4]">Pending:</span>
                <span className="font-medium text-blue-600 dark:text-blue-400">{syncStats.pending}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-[#B1B9C4]">Synced:</span>
                <span className="font-medium text-green-600 dark:text-green-400">{syncStats.synced}</span>
              </div>
              {syncStats.failed > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-[#B1B9C4]">Failed:</span>
                  <span className="font-medium text-red-600 dark:text-red-400">{syncStats.failed}</span>
                </div>
              )}
            </div>
            {syncStats.failed > 0 && (
              <button
                onClick={() => syncService.retryAllFailed()}
                className="mt-2 w-full px-3 py-1.5 bg-red-500 text-white rounded text-sm hover:bg-red-600"
              >
                Retry Failed Operations
              </button>
            )}
          </div>

          {/* Storage Status */}
          {storageStats && (
            <div className="border-t border-gray-200 dark:border-[#30363D] pt-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-[#E0E6ED] mb-2">Storage</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-[#B1B9C4]">Used:</span>
                  <span className="font-medium text-gray-700 dark:text-[#E0E6ED]">{formatBytes(storageStats.usedBytes)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-[#B1B9C4]">Quota:</span>
                  <span className="font-medium text-gray-700 dark:text-[#E0E6ED]">{formatBytes(storageStats.quotaBytes)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-[#B1B9C4]">Cached boards:</span>
                  <span className="font-medium text-gray-700 dark:text-[#E0E6ED]">{storageStats.cachedBoardsCount}</span>
                </div>
              </div>
              {/* Progress bar */}
              <div className="mt-2">
                <div className="w-full bg-gray-200 dark:bg-[#252B32] rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(storageStats.usagePercent, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-[#B1B9C4] mt-1 text-right">
                  {storageStats.usagePercent.toFixed(1)}% used
                </p>
              </div>
            </div>
          )}

          {/* Close button */}
          <button
            onClick={() => setShowDetails(false)}
            className="mt-4 w-full px-3 py-1.5 bg-gray-100 dark:bg-[#252B32] text-gray-700 dark:text-[#E0E6ED] rounded text-sm hover:bg-gray-200 dark:hover:bg-[#2C333A]"
          >
            Close
          </button>
        </div>
      )}

      {/* Click outside to close */}
      {showDetails && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDetails(false)}
        />
      )}
    </div>
  );
};
