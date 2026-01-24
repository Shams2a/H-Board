/**
 * Supabase Implementation of Collaboration Service
 */

import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import { logger } from '../../utils/logger';
import type { CollaborationService } from './collaborationService';
import type {
  UserPresence,
  ElementActivity,
  CursorPosition,
  BroadcastEvent,
  RealtimePayload,
  CollaborationConfig,
} from '../../types/collaboration';
import { DEFAULT_COLLABORATION_CONFIG, getUserColor } from '../../types/collaboration';

export class SupabaseCollaborationService implements CollaborationService {
  private channel: RealtimeChannel | null = null;
  private boardId: string | null = null;
  private userId: string | null = null;
  private userName: string = 'Anonymous';
  private userColor: string = '#3B82F6';
  private config: CollaborationConfig = DEFAULT_COLLABORATION_CONFIG;

  // Callbacks
  private presenceCallback: ((users: UserPresence[]) => void) | null = null;
  private elementActivityCallback: ((activities: ElementActivity[]) => void) | null = null;
  private broadcastCallback: ((event: BroadcastEvent) => void) | null = null;
  private cursorCallback: ((cursors: CursorPosition[]) => void) | null = null;
  private reconnectCallback: (() => void) | null = null;

  // Intervals
  private presenceHeartbeat: NodeJS.Timeout | null = null;
  private cursorThrottle: NodeJS.Timeout | null = null;
  private pendingCursor: { x: number; y: number } | null = null;

  // Reconnection
  private reconnectAttempts: number = 0;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private maxReconnectAttempts: number = 5;
  private isReconnecting: boolean = false;
  private wasConnectedBefore: boolean = false;

  // Cache
  private activeUsers: UserPresence[] = [];
  private elementActivities: Map<string, ElementActivity> = new Map();

  // ============================================
  // Initialization
  // ============================================

  async initialize(
    boardId: string,
    userId: string,
    config?: Partial<CollaborationConfig>
  ): Promise<void> {
    if (!supabase) {
      logger.warn('Supabase not configured, collaboration disabled');
      return;
    }

    // Cleanup any existing connection first
    if (this.channel) {
      logger.debug('🔄 Cleaning up existing channel before re-initializing...');
      this.cleanup();
    }

    this.boardId = boardId;
    this.userId = userId;
    this.userColor = getUserColor(userId);
    this.config = { ...DEFAULT_COLLABORATION_CONFIG, ...config };

    // Get user info (if available)
    // TODO: Integrate with your auth system
    this.userName = `User ${userId.slice(0, 8)}`;

    // Create channel - use boardId but without special characters
    const channelName = `board_${boardId}`;
    logger.debug(`📝 Creating channel: ${channelName}`);
    this.channel = supabase.channel(channelName);

    // postgres_changes DISABLED (causes CHANNEL_ERROR on free plan)
    // this.setupTableSubscriptions();

    // Subscribe to presence (disabled for now)
    // TODO: Re-enable once basic channel connection works
    /*if (this.config.enablePresence) {
      this.setupPresence();
    }*/

    // Subscribe to broadcasts (ENABLED for collaboration)
    logger.debug('🔊 Setting up broadcast listeners...');
    this.setupBroadcasts();

    // Subscribe to channel - NO AWAIT, NO ASYNC (like RealtimeTest)
    logger.debug(`🔌 Subscribing to collaboration channel (simple test)...`);
    this.channel.subscribe((status) => {
      logger.debug(`📡 Channel status: ${status}`);

      if (status === 'SUBSCRIBED') {
        logger.debug('✅ Collaboration channel subscribed - SUCCESS!');

        // Trigger reconnect callback if this is a reconnection (not first connection)
        if (this.wasConnectedBefore && this.reconnectAttempts > 0) {
          logger.debug('🔄 Reconnected after disconnect - triggering catch-up...');
          if (this.reconnectCallback) {
            this.reconnectCallback();
          }
        }

        // Mark that we've been connected at least once
        this.wasConnectedBefore = true;
        // Reset reconnect attempts on successful connection
        this.reconnectAttempts = 0;
        this.isReconnecting = false;
      } else if (status === 'CHANNEL_ERROR') {
        logger.error('❌ Collaboration channel error - attempting reconnection...');
        this.attemptReconnect();
      } else if (status === 'TIMED_OUT') {
        logger.error('⏱️ Collaboration channel timed out - attempting reconnection...');
        this.attemptReconnect();
      } else if (status === 'CLOSED') {
        logger.debug('🔌 Collaboration channel closed');
        // Don't reconnect if closed intentionally
        if (!this.isReconnecting) {
          logger.debug('Channel was closed intentionally, not reconnecting');
        }
      }
    });

    // Start heartbeat (disabled for now to simplify debugging)
    // TODO: Re-enable once channel connection is stable
    /*if (this.config.enablePresence) {
      this.startPresenceHeartbeat();
    }*/
  }

  isInitialized(): boolean {
    return !!(this.boardId && this.userId && this.channel);
  }

  private attemptReconnect(): void {
    if (this.isReconnecting || this.reconnectAttempts >= this.maxReconnectAttempts) {
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        logger.error('❌ Max reconnection attempts reached. Please refresh the page.');
      }
      return;
    }

    this.isReconnecting = true;
    this.reconnectAttempts++;

    // Exponential backoff: 1s, 2s, 4s, 8s, 16s
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 16000);

    logger.debug(`🔄 Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms...`);

    this.reconnectTimeout = setTimeout(async () => {
      try {
        // Clean up the old channel
        if (this.channel) {
          supabase?.removeChannel(this.channel);
          this.channel = null;
        }

        // Re-initialize with the same parameters
        if (this.boardId && this.userId) {
          logger.debug('🔄 Re-initializing collaboration channel...');
          await this.initialize(this.boardId, this.userId, this.config);
        }
      } catch (error) {
        logger.error('❌ Reconnection failed:', error);
        this.isReconnecting = false;
        // Try again if we haven't hit max attempts
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.attemptReconnect();
        }
      }
    }, delay);
  }

  cleanup(): void {
    // Clear intervals
    if (this.presenceHeartbeat) {
      clearInterval(this.presenceHeartbeat);
      this.presenceHeartbeat = null;
    }
    if (this.cursorThrottle) {
      clearTimeout(this.cursorThrottle);
      this.cursorThrottle = null;
    }
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    // Reset reconnection state
    this.reconnectAttempts = 0;
    this.isReconnecting = false;

    // Remove presence
    this.removePresence();

    // Notify presence callback with empty list before cleanup
    if (this.presenceCallback) {
      this.presenceCallback([]);
    }

    // Notify cursor callback with empty list before cleanup
    if (this.cursorCallback) {
      this.cursorCallback([]);
    }

    // Unsubscribe channel
    if (this.channel) {
      supabase?.removeChannel(this.channel);
      this.channel = null;
    }

    // Clear callbacks
    this.presenceCallback = null;
    this.elementActivityCallback = null;
    this.broadcastCallback = null;
    this.cursorCallback = null;

    // Clear cache
    this.activeUsers = [];
    this.elementActivities.clear();
  }

  // ============================================
  // Table Subscriptions
  // ============================================

  subscribeToTable<T = any>(
    table: string,
    filter: Record<string, any>,
    callbacks: {
      onInsert?: (payload: RealtimePayload<T>) => void;
      onUpdate?: (payload: RealtimePayload<T>) => void;
      onDelete?: (payload: RealtimePayload<T>) => void;
    }
  ): void {
    if (!this.channel) return;

    // Build filter string only if filter has keys
    const hasFilter = Object.keys(filter).length > 0;
    const filterString = hasFilter
      ? Object.entries(filter)
          .map(([key, value]) => `${key}=eq.${value}`)
          .join(',')
      : undefined;

    logger.debug(`🔧 Subscribing to table '${table}' with filter:`, filterString || 'NO FILTER');

    // Subscribe to INSERT
    if (callbacks.onInsert) {
      const config: any = {
        event: 'INSERT',
        schema: 'public',
        table,
      };

      // Only add filter if it exists
      if (filterString) {
        config.filter = filterString;
      }

      this.channel.on(
        'postgres_changes' as any,
        config,
        (payload: any) => {
          callbacks.onInsert!({
            eventType: 'INSERT',
            new: payload.new as T,
          });
        }
      );
    }

    // Subscribe to UPDATE
    if (callbacks.onUpdate) {
      const config: any = {
        event: 'UPDATE',
        schema: 'public',
        table,
      };

      if (filterString) {
        config.filter = filterString;
      }

      this.channel.on(
        'postgres_changes' as any,
        config,
        (payload: any) => {
          callbacks.onUpdate!({
            eventType: 'UPDATE',
            new: payload.new as T,
            old: payload.old as T,
          });
        }
      );
    }

    // Subscribe to DELETE
    if (callbacks.onDelete) {
      const config: any = {
        event: 'DELETE',
        schema: 'public',
        table,
      };

      if (filterString) {
        config.filter = filterString;
      }

      this.channel.on(
        'postgres_changes' as any,
        config,
        (payload: any) => {
          callbacks.onDelete!({
            eventType: 'DELETE',
            old: payload.old as T,
          });
        }
      );
    }
  }

  unsubscribeFromTable(table: string): void {
    // Supabase doesn't support selective unsubscribe
    // Would need to recreate channel without this subscription
    logger.warn('Selective unsubscribe not supported in Supabase');
  }

  private setupTableSubscriptions(): void {
    if (!this.boardId) return;

    // Note: element_activity subscriptions are created on-demand when starting/stopping
    // editing of specific elements. We don't subscribe at the board level here.
    // This avoids filtering by element_id with a boardId which doesn't make sense.

    logger.debug('📋 Table subscriptions setup (element_activity will be per-element)');
  }

  // ============================================
  // Presence
  // ============================================

  private setupPresence(): void {
    if (!this.channel) return;

    this.channel.on('presence', { event: 'sync' }, () => {
      const state = this.channel!.presenceState();
      const users: UserPresence[] = [];

      Object.values(state).forEach((presences: any) => {
        presences.forEach((presence: any) => {
          users.push({
            boardId: this.boardId!,
            userId: presence.userId,
            userName: presence.userName,
            userEmail: presence.userEmail,
            userColor: presence.userColor,
            cursorX: presence.cursorX,
            cursorY: presence.cursorY,
            lastSeen: new Date(presence.lastSeen),
            createdAt: new Date(presence.createdAt),
          });
        });
      });

      this.activeUsers = users;
      this.notifyPresence();
    });

    this.channel.on('presence', { event: 'join' }, ({ newPresences }) => {
      logger.debug('User joined:', newPresences);
    });

    this.channel.on('presence', { event: 'leave' }, ({ leftPresences }) => {
      logger.debug('User left:', leftPresences);
    });
  }

  async updatePresence(data: Partial<UserPresence>): Promise<void> {
    if (!this.channel || !this.userId) return;

    const presenceData = {
      userId: this.userId,
      userName: data.userName || this.userName,
      userEmail: data.userEmail,
      userColor: data.userColor || this.userColor,
      cursorX: data.cursorX,
      cursorY: data.cursorY,
      lastSeen: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    await this.channel.track(presenceData);

    // Also update in database for persistence
    if (supabase && this.boardId) {
      await supabase
        .from('presence')
        .upsert({
          board_id: this.boardId,
          user_id: this.userId,
          user_name: presenceData.userName,
          user_email: presenceData.userEmail,
          user_color: presenceData.userColor,
          cursor_x: presenceData.cursorX,
          cursor_y: presenceData.cursorY,
        });
    }
  }

  getActiveUsers(): UserPresence[] {
    return this.activeUsers.filter((u) => u.userId !== this.userId);
  }

  subscribeToPresence(callback: (users: UserPresence[]) => void): void {
    this.presenceCallback = callback;
  }

  async removePresence(): Promise<void> {
    if (!supabase || !this.boardId || !this.userId) return;

    await supabase
      .from('presence')
      .delete()
      .eq('board_id', this.boardId)
      .eq('user_id', this.userId);

    if (this.channel) {
      await this.channel.untrack();
    }
  }

  private startPresenceHeartbeat(): void {
    this.presenceHeartbeat = setInterval(() => {
      this.updatePresence({});
    }, this.config.presenceHeartbeatInterval);
  }

  private notifyPresence(): void {
    if (this.presenceCallback) {
      this.presenceCallback(this.getActiveUsers());
    }
  }

  // ============================================
  // Element Activity
  // ============================================

  async startEditingElement(elementId: string): Promise<boolean> {
    if (!this.boardId || !this.userId) {
      logger.error('❌ Cannot start editing: Service not initialized!', {
        hasBoardId: !!this.boardId,
        hasUserId: !!this.userId,
        hasChannel: !!this.channel,
      });
      logger.error('💡 Make sure useRealtimeSync hook is mounted and enabled');
      return false;
    }

    logger.debug('🖊️ [startEditingElement] Starting to edit:', {
      elementId,
      userId: this.userId,
      userName: this.userName,
      userColor: this.userColor,
    });

    // Broadcast that we're starting to edit (no DB needed with free plan)
    this.broadcast({
      type: 'editing_started',
      payload: {
        elementId,
        userId: this.userId,
        userName: this.userName,
        userColor: this.userColor,
      },
      userId: this.userId,
      timestamp: Date.now(),
    });

    logger.debug('✅ [startEditingElement] Broadcast sent');
    return true;
  }

  async stopEditingElement(elementId: string): Promise<void> {
    if (!this.userId) return;

    logger.debug('✅ Stopped editing element:', elementId);

    // Broadcast that we stopped editing
    this.broadcast({
      type: 'editing_stopped',
      payload: {
        elementId,
        userId: this.userId,
      },
      userId: this.userId,
      timestamp: Date.now(),
    });

    this.elementActivities.delete(elementId);
  }

  getElementActivity(elementId: string): ElementActivity | null {
    return this.elementActivities.get(elementId) || null;
  }

  subscribeToElementActivity(callback: (activities: ElementActivity[]) => void): void {
    this.elementActivityCallback = callback;
  }

  private notifyElementActivity(): void {
    if (this.elementActivityCallback) {
      this.elementActivityCallback(Array.from(this.elementActivities.values()));
    }
  }

  // ============================================
  // Broadcast
  // ============================================

  private setupBroadcasts(): void {
    if (!this.channel) return;

    this.channel.on('broadcast', { event: 'collab_event' }, ({ payload }) => {
      logger.debug('🔔 Broadcast received:', {
        type: payload.type,
        userId: payload.userId,
        myUserId: this.userId,
        shouldProcess: payload.userId !== this.userId,
        payload
      });

      if (this.broadcastCallback && payload.userId !== this.userId) {
        logger.debug('✅ Processing broadcast (different user)');
        this.broadcastCallback(payload as BroadcastEvent);
      } else if (payload.userId === this.userId) {
        logger.debug('⏭️ Ignoring own broadcast');
      } else if (!this.broadcastCallback) {
        logger.warn('⚠️ No broadcast callback registered');
      }

      // Handle cursor events separately
      if (payload.type === 'cursor_move' && this.cursorCallback && payload.userId !== this.userId) {
        const cursor: CursorPosition = {
          x: payload.payload.x,
          y: payload.payload.y,
          boardId: this.boardId!,
          userId: payload.userId,
          userName: payload.payload.userName,
          userColor: payload.payload.userColor,
          timestamp: payload.timestamp,
        };

        // Update active user cursor
        const userIndex = this.activeUsers.findIndex(u => u.userId === payload.userId);
        if (userIndex >= 0) {
          this.activeUsers[userIndex].cursorX = cursor.x;
          this.activeUsers[userIndex].cursorY = cursor.y;
        }

        this.cursorCallback([cursor]);
      }
    });
  }

  broadcast(event: BroadcastEvent): void {
    if (!this.channel) return;

    const payload = {
      ...event,
      userId: this.userId,
      timestamp: Date.now(),
    };

    logger.debug('📤 Sending broadcast:', {
      type: event.type,
      userId: this.userId,
      hasChannel: !!this.channel,
      payload
    });

    // Use modern broadcast API instead of deprecated send()
    this.channel.send({
      type: 'broadcast',
      event: 'collab_event',
      payload,
    });
  }

  subscribeToBroadcast(callback: (event: BroadcastEvent) => void): void {
    this.broadcastCallback = callback;
  }

  /**
   * Register callback for when channel reconnects after a disconnect
   * Used for catch-up sync to recover missed broadcasts
   */
  onReconnect(callback: () => void): void {
    this.reconnectCallback = callback;
  }

  // ============================================
  // Cursors
  // ============================================

  updateCursor(x: number, y: number): void {
    if (!this.config.enableCursors) return;

    this.pendingCursor = { x, y };

    if (!this.cursorThrottle) {
      this.cursorThrottle = setTimeout(() => {
        if (this.pendingCursor) {
          this.broadcast({
            type: 'cursor_move',
            payload: {
              x: this.pendingCursor.x,
              y: this.pendingCursor.y,
              userName: this.userName,
              userColor: this.userColor,
            },
            userId: this.userId!,
            timestamp: Date.now(),
          });
          this.pendingCursor = null;
        }
        this.cursorThrottle = null;
      }, this.config.cursorThrottleInterval);
    }
  }

  subscribeToCursors(callback: (cursors: CursorPosition[]) => void): void {
    this.cursorCallback = callback;
  }
}
