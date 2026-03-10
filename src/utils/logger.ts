/**
 * Conditional Logger
 * Only logs debug messages in development mode
 */

interface LoggerConfig {
  enableDebug: boolean;
  enableInfo: boolean;
  prefix?: string;
}

const defaultConfig: LoggerConfig = {
  enableDebug: import.meta.env.DEV,  // Only in development
  enableInfo: true,
  prefix: '[H-Board]',
};

class Logger {
  private config: LoggerConfig;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  /**
   * Debug level - only in development
   * Use for verbose logging (sync details, broadcasts, etc.)
   */
  debug(...args: unknown[]): void {
    if (this.config.enableDebug) {
      console.log(...args);
    }
  }

  /**
   * Info level - always shown
   * Use for important state changes
   */
  info(...args: unknown[]): void {
    if (this.config.enableInfo) {
      console.log(...args);
    }
  }

  /**
   * Warning level - always shown
   */
  warn(...args: unknown[]): void {
    console.warn(...args);
  }

  /**
   * Error level - always shown
   */
  error(...args: unknown[]): void {
    console.error(...args);
  }

  /**
   * Create a child logger with a specific prefix
   */
  child(prefix: string): Logger {
    return new Logger({
      ...this.config,
      prefix: `${this.config.prefix} ${prefix}`,
    });
  }

  /**
   * Temporarily enable debug logging (useful for troubleshooting in production)
   */
  enableDebugMode(): void {
    this.config.enableDebug = true;
    console.log('Debug mode enabled');
  }

  /**
   * Disable debug logging
   */
  disableDebugMode(): void {
    this.config.enableDebug = false;
    console.log('Debug mode disabled');
  }
}

// Export singleton instance
export const logger = new Logger();

// Export for creating child loggers
export { Logger };

// Expose on window for debugging in production
if (typeof window !== 'undefined') {
  (window as any).hboardLogger = logger;
}
