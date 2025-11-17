import type { ILogger } from '@lazy-map/domain';
import { FrontLoggingService } from './FrontLoggingService';

/**
 * Frontend logger singleton
 * Provides a consistent logging interface across the frontend application
 */
class LoggerService {
  private static instance: ILogger;

  static getInstance(): ILogger {
    if (!LoggerService.instance) {
      LoggerService.instance = new FrontLoggingService('LazyMapFrontend');
    }
    return LoggerService.instance;
  }

  /**
   * Create a logger with specific context
   */
  static forContext(context: string): ILogger {
    return new FrontLoggingService(context);
  }
}

// Export singleton instance
export const logger = LoggerService.getInstance();

// Export factory for creating context-specific loggers
export const createLogger = LoggerService.forContext;
