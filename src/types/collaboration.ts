/**
 * Types for real-time collaboration features
 */

// ============================================
// User Presence
// ============================================

export interface UserPresence {
  boardId: string;
  userId: string;
  userName: string;
  userEmail?: string;
  userColor: string;
  cursorX?: number;
  cursorY?: number;
  lastSeen: Date;
  createdAt: Date;
}

export interface CollaborationUser {
  id: string;
  name: string;
  email?: string;
  color: string;
  isActive: boolean;
}

// ============================================
// Element Activity
// ============================================

export type ActivityType = 'editing' | 'viewing' | 'commenting';

export interface ElementActivity {
  elementId: string;
  userId: string;
  userName: string;
  userColor: string;
  activityType: ActivityType;
  startedAt: Date;
  expiresAt: Date;
}

// ============================================
// Realtime Events
// ============================================

export type RealtimeEventType =
  | 'INSERT'
  | 'UPDATE'
  | 'DELETE';

export interface RealtimePayload<T = any> {
  eventType: RealtimeEventType;
  new?: T;
  old?: T;
  errors?: string[];
}

// ============================================
// Cursor & Interaction
// ============================================

export interface CursorPosition {
  x: number;
  y: number;
  boardId: string;
  userId: string;
  userName: string;
  userColor: string;
  timestamp: number;
}

export interface BroadcastEvent {
  type:
    | 'cursor_move'
    | 'element_select'
    | 'element_hover'
    | 'typing'
    | 'element_created'
    | 'element_updated'
    | 'element_deleted'
    | 'element_marked_reusable'
    | 'element_reference_created'
    | 'editing_started'
    | 'editing_stopped'
    | 'editing_heartbeat'
    | 'board_created'
    | 'board_updated'
    | 'board_deleted'
    | 'kanban_column_created'
    | 'kanban_column_updated'
    | 'kanban_column_deleted'
    | 'kanban_card_created'
    | 'kanban_card_updated'
    | 'kanban_card_deleted'
    | 'database_property_created'
    | 'database_property_updated'
    | 'database_property_deleted'
    | 'database_row_created'
    | 'database_row_updated'
    | 'database_row_deleted'
    | 'database_view_created'
    | 'database_view_updated'
    | 'database_view_deleted';
  payload: any;
  userId: string;
  timestamp: number;
}

// ============================================
// Collaboration Config
// ============================================

export interface CollaborationConfig {
  enablePresence: boolean;
  enableCursors: boolean;
  enableEditingIndicators: boolean;
  presenceHeartbeatInterval: number; // ms
  activityTimeout: number; // ms
  cursorThrottleInterval: number; // ms
}

export const DEFAULT_COLLABORATION_CONFIG: CollaborationConfig = {
  enablePresence: true,
  enableCursors: false, // Disabled by default (can be resource intensive)
  enableEditingIndicators: true,
  presenceHeartbeatInterval: 30000, // 30 seconds
  activityTimeout: 30000, // 30 seconds
  cursorThrottleInterval: 50, // 50ms (20 updates/sec max)
};

// ============================================
// User Colors
// ============================================

export const USER_COLORS = [
  '#EF4444', // Red
  '#F59E0B', // Amber
  '#10B981', // Green
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#14B8A6', // Teal
  '#F97316', // Orange
  '#84CC16', // Lime
  '#6366F1', // Indigo
];

/**
 * Generate a consistent color for a user based on their ID
 */
export function getUserColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % USER_COLORS.length;
  return USER_COLORS[index];
}
