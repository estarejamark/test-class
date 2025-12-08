/**
 * Logger utility for conditional logging in development mode only
 * Suppresses console.log in production while preserving console.error for error handling
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

class Logger {
  private isDev = process.env.NODE_ENV === 'development';

  /**
   * Log info messages - only in development mode
   */
  info(message: string, ...args: any[]) {
    if (this.isDev) {
      console.log(`ℹ️ ${message}`, ...args);
    }
  }

  /**
   * Log warning messages - only in development mode
   */
  warn(message: string, ...args: any[]) {
    if (this.isDev) {
      console.warn(`⚠️ ${message}`, ...args);
    }
  }

  /**
   * Log debug messages - only in development mode
   */
  debug(message: string, ...args: any[]) {
    if (this.isDev) {
      console.debug(`🔍 ${message}`, ...args);
    }
  }

  /**
   * Log error messages - always shown (for error handling)
   */
  error(message: string, ...args: any[]) {
    console.error(`❌ ${message}`, ...args);
  }
}

// Create singleton instance
export const logger = new Logger();

// Export the class for testing
export { Logger };
