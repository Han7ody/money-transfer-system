// backend/src/utils/logger.ts
/**
 * Centralized logging utility
 * Provides consistent logging across the application
 */

export enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG'
}

interface LogContext {
  userId?: number;
  adminId?: number;
  transactionId?: number;
  action?: string;
  [key: string]: any;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  /**
   * Log error message
   */
  error(message: string, error?: Error | any, context?: LogContext): void {
    console.error(`[${LogLevel.ERROR}]`, message, {
      ...context,
      error: error?.message,
      stack: this.isDevelopment ? error?.stack : undefined,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: LogContext): void {
    console.warn(`[${LogLevel.WARN}]`, message, {
      ...context,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log info message
   */
  info(message: string, context?: LogContext): void {
    console.log(`[${LogLevel.INFO}]`, message, {
      ...context,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log debug message (only in development)
   */
  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.log(`[${LogLevel.DEBUG}]`, message, {
        ...context,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Log admin action
   */
  adminAction(action: string, adminId: number, context?: LogContext): void {
    this.info(`Admin Action: ${action}`, {
      adminId,
      action,
      ...context
    });
  }

  /**
   * Log security event
   */
  security(event: string, context?: LogContext): void {
    console.warn(`[SECURITY]`, event, {
      ...context,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log API request
   */
  request(method: string, path: string, context?: LogContext): void {
    if (this.isDevelopment) {
      this.debug(`${method} ${path}`, context);
    }
  }
}

export const logger = new Logger();
