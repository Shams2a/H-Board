/**
 * Synchronization types
 * Types pour gérer la sync online/offline
 */

export type SyncStatus = 'synced' | 'pending' | 'conflict' | 'error';

export type SyncOperationType = 'create' | 'update' | 'delete';

export type SyncEntityType = 'board' | 'element' | 'folder';

/**
 * Métadonnées de synchronisation pour toutes les entités
 */
export interface SyncMetadata {
  syncStatus: SyncStatus;
  serverId?: string;         // ID côté serveur (peut différer de l'ID local)
  lastSyncedAt?: Date;       // Dernière sync réussie
  version: number;           // Version pour résolution de conflits
}

/**
 * Opération de synchronisation en attente
 */
export interface SyncOperation {
  id: string;
  type: SyncOperationType;
  entityType: SyncEntityType;
  entityId: string;
  data: any;
  timestamp: Date;
  syncStatus: SyncStatus;
  retryCount: number;
  error?: string;
}

/**
 * Métadonnées de cache pour un board
 */
export interface CacheMetadata {
  lastAccess: Date;          // Dernière fois que le board a été ouvert
  cacheSize: number;         // Taille en bytes
  elementCount: number;      // Nombre d'éléments pour stats
}

/**
 * Configuration du stockage utilisateur
 */
export interface StorageSettings {
  maxCachedBoards: number;      // 1-10 (défaut: 3)
  cacheExpiryDays: number;       // 1-30 (défaut: 7)
  autoCleanup: boolean;          // défaut: true
  storeImagesLocally: boolean;   // défaut: false (économie d'espace)
}

/**
 * État de la connexion
 */
export interface ConnectionState {
  isOnline: boolean;
  lastOnline: Date;
  serverReachable: boolean;
}

/**
 * Statistiques de stockage
 */
export interface StorageStats {
  usedBytes: number;
  quotaBytes: number;
  usagePercent: number;
  cachedBoardsCount: number;
  pendingOpsCount: number;
}
