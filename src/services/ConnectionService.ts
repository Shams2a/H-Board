/**
 * Connection Service
 * Gère la détection de connexion online/offline et la disponibilité du serveur
 */

import type { ConnectionState } from '../types';
import { logger } from '../utils/logger';

type ConnectionListener = (state: ConnectionState) => void;

export class ConnectionService {
  private listeners: ConnectionListener[] = [];
  private state: ConnectionState = {
    isOnline: navigator.onLine,
    lastOnline: new Date(),
    serverReachable: false
  };

  // API endpoint for server health check (to be configured when backend is ready)
  private serverHealthEndpoint: string | null = null;
  private healthCheckInterval: number | null = null;

  constructor() {
    // Listen to browser online/offline events
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);

    // Initialize state
    if (navigator.onLine) {
      this.state.lastOnline = new Date();
    }
  }

  /**
   * Configure server health check endpoint
   * Call this when the backend API is available
   */
  configureServerEndpoint(endpoint: string, checkIntervalMs: number = 30000): void {
    this.serverHealthEndpoint = endpoint;

    // Clear existing interval if any
    if (this.healthCheckInterval !== null) {
      window.clearInterval(this.healthCheckInterval);
    }

    // Start periodic health checks
    this.healthCheckInterval = window.setInterval(() => {
      this.checkServerHealth();
    }, checkIntervalMs);

    // Run initial check
    this.checkServerHealth();
  }

  /**
   * Handle browser online event
   */
  private handleOnline = (): void => {
    logger.info('Browser is online');
    this.state.isOnline = true;
    this.state.lastOnline = new Date();

    // Check if server is reachable
    this.checkServerHealth();

    this.notifyListeners();
  };

  /**
   * Handle browser offline event
   */
  private handleOffline = (): void => {
    logger.info('Browser is offline');
    this.state.isOnline = false;
    this.state.serverReachable = false;
    this.notifyListeners();
  };

  /**
   * Check if server is reachable
   * This is a placeholder for now - will be implemented when backend is ready
   */
  private async checkServerHealth(): Promise<void> {
    if (!this.state.isOnline) {
      this.state.serverReachable = false;
      return;
    }

    // If no server endpoint configured, assume server is not reachable
    if (!this.serverHealthEndpoint) {
      this.state.serverReachable = false;
      return;
    }

    try {
      // Attempt to ping the server health endpoint
      const response = await fetch(this.serverHealthEndpoint, {
        method: 'HEAD',
        mode: 'cors',
        cache: 'no-cache',
        // Timeout after 5 seconds
        signal: AbortSignal.timeout(5000)
      });

      const wasReachable = this.state.serverReachable;
      this.state.serverReachable = response.ok;

      // Notify if status changed
      if (wasReachable !== this.state.serverReachable) {
        if (this.state.serverReachable) {
          logger.debug('Server is reachable');
        } else {
          logger.debug('Server is not reachable');
        }
        this.notifyListeners();
      }
    } catch (error) {
      const wasReachable = this.state.serverReachable;
      this.state.serverReachable = false;

      if (wasReachable) {
        logger.debug('Server is not reachable:', error);
        this.notifyListeners();
      }
    }
  }

  /**
   * Get current connection state
   */
  getState(): ConnectionState {
    return { ...this.state };
  }

  /**
   * Check if currently online
   */
  isOnline(): boolean {
    return this.state.isOnline;
  }

  /**
   * Check if server is currently reachable
   */
  isServerReachable(): boolean {
    return this.state.serverReachable;
  }

  /**
   * Subscribe to connection state changes
   */
  subscribe(listener: ConnectionListener): () => void {
    this.listeners.push(listener);

    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Notify all listeners of state change
   */
  private notifyListeners(): void {
    const stateCopy = this.getState();
    this.listeners.forEach(listener => {
      try {
        listener(stateCopy);
      } catch (error) {
        console.error('Error in connection listener:', error);
      }
    });
  }

  /**
   * Manually trigger a server health check
   */
  async checkConnection(): Promise<ConnectionState> {
    await this.checkServerHealth();
    return this.getState();
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);

    if (this.healthCheckInterval !== null) {
      window.clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    this.listeners = [];
  }
}

// Export singleton instance
export const connectionService = new ConnectionService();
