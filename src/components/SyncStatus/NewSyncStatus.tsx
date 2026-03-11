/**
 * New Sync Status Indicator
 * Displays connection status, sync progress, and storage info
 */

import { useEffect, useState } from 'react';
import { Wifi, Cloud, CloudOff, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { isSupabaseConfigured } from '../../lib/supabase';
import { newSyncService } from '../../services/supabase/newSyncService';
import { storageManager } from '../../services/StorageManager';
import type { StorageStats } from '../../types';

export function NewSyncStatus() {
  const [stats, setStats] = useState(newSyncService.getStats());
  const [isSyncing, setIsSyncing] = useState(false);
  const [storageStats, setStorageStats] = useState<StorageStats | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [isConfigured] = useState(isSupabaseConfigured());

  // Subscribe to sync service and update stats
  useEffect(() => {
    const updateStats = async () => {
      setStats(newSyncService.getStats());
      setIsSyncing(newSyncService.isSyncInProgress());

      const storage = await storageManager.getStorageStats();
      setStorageStats(storage);
    };

    updateStats();
    const interval = setInterval(updateStats, 5000);

    const unsubscribe = newSyncService.subscribe(() => {
      setStats(newSyncService.getStats());
      setIsSyncing(newSyncService.isSyncInProgress());
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, []);

  const totalSynced = stats.boards.synced + stats.elements.synced + stats.folders.synced;
  const totalFailed = stats.boards.failed + stats.elements.failed + stats.folders.failed;
  const totalDownloaded = (stats.boards.downloaded || 0) + (stats.elements.downloaded || 0) + (stats.folders.downloaded || 0);

  // Get status icon and color
  const getStatusInfo = () => {
    if (!isConfigured) {
      return {
        icon: <CloudOff className="w-4 h-4" />,
        color: 'text-gray-400',
        label: 'Offline Only',
        description: 'Supabase not configured'
      };
    }

    if (isSyncing) {
      return {
        icon: <Loader className="w-4 h-4 animate-spin" />,
        color: 'text-blue-500',
        label: 'Syncing',
        description: 'Synchronization in progress'
      };
    }

    if (totalFailed > 0) {
      return {
        icon: <AlertCircle className="w-4 h-4" />,
        color: 'text-red-500',
        label: 'Sync Error',
        description: `${totalFailed} operation(s) failed`
      };
    }

    if (stats.isConnected) {
      return {
        icon: <CheckCircle className="w-4 h-4" />,
        color: 'text-green-500',
        label: 'Synced',
        description: 'All changes saved to cloud'
      };
    }

    return {
      icon: <Cloud className="w-4 h-4" />,
      color: 'text-gray-400',
      label: 'Pending',
      description: 'Waiting for sync'
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

  // Format last sync time
  const formatLastSync = (date: Date | null): string => {
    if (!date) return 'Never';
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  const handleManualSync = async () => {
    await newSyncService.syncAll();
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
        {isSyncing && (
          <span className="ml-1 px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 text-xs">
            ...
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
              <Wifi className="w-4 h-4 text-green-500" />
              <span className="text-sm text-gray-600 dark:text-[#B1B9C4]">Online</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              {isConfigured ? (
                stats.isConnected ? (
                  <>
                    <Cloud className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-gray-600 dark:text-[#B1B9C4]">Supabase connected</span>
                  </>
                ) : (
                  <>
                    <CloudOff className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm text-gray-600 dark:text-[#B1B9C4]">Supabase pending</span>
                  </>
                )
              ) : (
                <>
                  <CloudOff className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-[#B1B9C4]">Supabase not configured</span>
                </>
              )}
            </div>
            {stats.lastSyncTime && (
              <div className="mt-2 text-xs text-gray-500 dark:text-[#B1B9C4]">
                Last sync: {formatLastSync(stats.lastSyncTime)}
              </div>
            )}
          </div>

          {/* Sync Status */}
          <div className="mb-4 border-t border-gray-200 dark:border-[#30363D] pt-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-[#E0E6ED] mb-2">Synchronization</h3>
            <div className="space-y-1 text-sm">
              {totalDownloaded > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-[#B1B9C4]">Downloaded:</span>
                  <span className="font-medium text-blue-600 dark:text-blue-400">{totalDownloaded}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-[#B1B9C4]">Uploaded:</span>
                <span className="font-medium text-green-600 dark:text-green-400">{totalSynced}</span>
              </div>
              {totalFailed > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-[#B1B9C4]">Failed:</span>
                  <span className="font-medium text-red-600 dark:text-red-400">{totalFailed}</span>
                </div>
              )}
            </div>

            {/* Details by type */}
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-[#30363D] space-y-2 text-xs">
              <div className="flex justify-between text-gray-500 dark:text-[#B1B9C4]">
                <span>Boards:</span>
                <span>{stats.boards.downloaded || 0} dl, {stats.boards.synced} up{stats.boards.failed > 0 ? `, ${stats.boards.failed} err` : ''}</span>
              </div>
              <div className="flex justify-between text-gray-500 dark:text-[#B1B9C4]">
                <span>Elements:</span>
                <span>{stats.elements.downloaded || 0} dl, {stats.elements.synced} up{stats.elements.failed > 0 ? `, ${stats.elements.failed} err` : ''}</span>
              </div>
              <div className="flex justify-between text-gray-500 dark:text-[#B1B9C4]">
                <span>Folders:</span>
                <span>{stats.folders.downloaded || 0} dl, {stats.folders.synced} up{stats.folders.failed > 0 ? `, ${stats.folders.failed} err` : ''}</span>
              </div>
            </div>

            {/* Sync Now button */}
            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className="mt-3 w-full px-3 py-1.5 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSyncing ? 'Syncing...' : 'Sync Now'}
            </button>
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
}
