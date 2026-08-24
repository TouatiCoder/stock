/**
 * Safe Logger Utility for BuildStock Pro
 * 
 * Provides production-safe logging without exposing sensitive data
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
}

class SafeLogger {
  private static isDevelopment = process.env.NODE_ENV === 'development';
  
  /**
   * Sanitize sensitive data from logs
   */
  private static sanitize(data: any): any {
    if (!data) return data;
    
    if (typeof data === 'string') {
      // Remove potential tokens, passwords, emails
      return data
        .replace(/password[=:]\s*\S+/gi, 'password=***')
        .replace(/token[=:]\s*\S+/gi, 'token=***')
        .replace(/secret[=:]\s*\S+/gi, 'secret=***');
    }
    
    if (typeof data === 'object') {
      const sanitized: any = { ...data };
      
      // Remove sensitive fields
      delete sanitized.password;
      delete sanitized.password_hash;
      delete sanitized.token;
      delete sanitized.secret;
      delete sanitized.authToken;
      
      return sanitized;
    }
    
    return data;
  }

  /**
   * Format log message
   */
  private static formatLog(level: LogLevel, message: string, context?: Record<string, any>): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message: SafeLogger.sanitize(message),
      context: context ? SafeLogger.sanitize(context) : undefined,
    };
  }

  /**
   * Output log (only in development)
   */
  private static output(log: LogEntry) {
    if (!SafeLogger.isDevelopment) return;
    
    const prefix = `[${log.timestamp}] [${log.level.toUpperCase()}]`;
    
    switch (log.level) {
      case 'debug':
        console.debug(`${prefix} ${log.message}`, log.context || '');
        break;
      case 'info':
        console.info(`${prefix} ${log.message}`, log.context || '');
        break;
      case 'warn':
        console.warn(`${prefix} ${log.message}`, log.context || '');
        break;
      case 'error':
        console.error(`${prefix} ${log.message}`, log.context || '');
        break;
    }
  }

  /**
   * Log debug message (development only)
   */
  static debug(message: string, context?: Record<string, any>) {
    const log = SafeLogger.formatLog('debug', message, context);
    SafeLogger.output(log);
  }

  /**
   * Log info message (development only)
   */
  static info(message: string, context?: Record<string, any>) {
    const log = SafeLogger.formatLog('info', message, context);
    SafeLogger.output(log);
  }

  /**
   * Log warning (development only)
   */
  static warn(message: string, context?: Record<string, any>) {
    const log = SafeLogger.formatLog('warn', message, context);
    SafeLogger.output(log);
  }

  /**
   * Log error with optional error tracking
   */
  static error(message: string, error?: Error | unknown, context?: Record<string, any>) {
    const log = SafeLogger.formatLog('error', message, {
      ...context,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: SafeLogger.isDevelopment ? error.stack : undefined,
      } : error,
    });
    
    SafeLogger.output(log);
    
    // In production, you could send to error tracking service here
    // e.g., Sentry.captureException(error);
  }

  /**
   * Log API error with response details
   */
  static apiError(endpoint: string, status: number, error: unknown) {
    SafeLogger.error(`API Error: ${endpoint}`, error, {
      endpoint,
      status,
    });
  }

  /**
   * Silent logger for production (no output)
   */
  static silent = {
    debug: () => {},
    info: () => {},
    warn: () => {},
    error: () => {},
  };
}

// Export instance methods for easy import
export const logger = SafeLogger;

// Export for server-side usage
export const safeLog = {
  debug: SafeLogger.debug,
  info: SafeLogger.info,
  warn: SafeLogger.warn,
  error: SafeLogger.error,
};
