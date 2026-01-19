/**
 * Collaboration Service Interface
 * Abstract interface for real-time collaboration
 * Can be implemented with Supabase, Yjs, or any other provider
 */

import type {
  UserPresence,
  ElementActivity,
  CursorPosition,
  BroadcastEvent,
  RealtimePayload,
  CollaborationConfig
} from '../../types/collaboration';
import { SupabaseCollaborationService } from './supabaseCollaboration';

// ============================================
// Main Collaboration Service Interface
// ============================================

export interface CollaborationService {
  /**
   * Initialize the collaboration service for a board
   */
  initialize(boardId: string, userId: string, config?: Partial<CollaborationConfig>): Promise<void>;

  /**
   * Check if the service is initialized
   */
  isInitialized(): boolean;

  /**
   * Clean up and disconnect
   */
  cleanup(): void;

  // ============================================
  // Realtime Data Sync
  // ============================================

  /**
   * Subscribe to changes on a table
   */
  subscribeToTable<T = any>(
    table: string,
    filter: Record<string, any>,
    callbacks: {
      onInsert?: (payload: RealtimePayload<T>) => void;
      onUpdate?: (payload: RealtimePayload<T>) => void;
      onDelete?: (payload: RealtimePayload<T>) => void;
    }
  ): void;

  /**
   * Unsubscribe from table changes
   */
  unsubscribeFromTable(table: string): void;

  // ============================================
  // Presence Management
  // ============================================

  /**
   * Update current user's presence
   */
  updatePresence(data: Partial<UserPresence>): Promise<void>;

  /**
   * Get all active users on the board
   */
  getActiveUsers(): UserPresence[];

  /**
   * Subscribe to presence changes
   */
  subscribeToPresence(callback: (users: UserPresence[]) => void): void;

  /**
   * Remove presence (when user leaves)
   */
  removePresence(): Promise<void>;

  // ============================================
  // Element Activity (Editing Indicators)
  // ============================================

  /**
   * Mark an element as being edited by current user
   */
  startEditingElement(elementId: string): Promise<boolean>;

  /**
   * Stop editing an element
   */
  stopEditingElement(elementId: string): Promise<void>;

  /**
   * Get who is editing an element
   */
  getElementActivity(elementId: string): ElementActivity | null;

  /**
   * Subscribe to element activity changes
   */
  subscribeToElementActivity(callback: (activities: ElementActivity[]) => void): void;

  // ============================================
  // Broadcast Events (Cursors, etc.)
  // ============================================

  /**
   * Broadcast an event to other users
   */
  broadcast(event: BroadcastEvent): void;

  /**
   * Subscribe to broadcast events
   */
  subscribeToBroadcast(callback: (event: BroadcastEvent) => void): void;

  /**
   * Update cursor position (throttled automatically)
   */
  updateCursor(x: number, y: number): void;

  /**
   * Subscribe to cursor movements
   */
  subscribeToCursors(callback: (cursors: CursorPosition[]) => void): void;
}

// ============================================
// Factory function
// ============================================

let collaborationServiceInstance: CollaborationService | null = null;

export function getCollaborationService(): CollaborationService {
  if (!collaborationServiceInstance) {
    collaborationServiceInstance = new SupabaseCollaborationService();
  }
  return collaborationServiceInstance;
}

export function setCollaborationService(service: CollaborationService): void {
  collaborationServiceInstance = service;
}
