import { ErrorContext, ErrorCategory, ErrorSeverity } from '../errors/LazyMapError';

/**
 * Log levels for structured logging
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  CRITICAL = 'critical'
}

/**
 * Structured log entry
 */
export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: ErrorContext;
  metadata?: Record<string, any>;
  correlationId?: string;
  userId?: string;
  error?: {
    code?: string;
    category?: ErrorCategory;
    severity?: ErrorSeverity;
    stack?: string;
  };
}

/**
 * Logging port (interface) for the domain layer
 * This defines what logging capabilities the domain needs
 */
export interface ILogger {
  /**
   * Get the current correlation ID for this logger instance
   */
  readonly correlationId?: string;

  /**
   * Log debug information (development/troubleshooting)
   */
  debug(message: string, context?: ErrorContext, metadata?: Record<string, any>): void;

  /**
   * Log general information
   */
  info(message: string, context?: ErrorContext, metadata?: Record<string, any>): void;

  /**
   * Log warnings (non-critical issues)
   */
  warn(message: string, context?: ErrorContext, metadata?: Record<string, any>): void;

  /**
   * Log errors (critical issues)
   */
  error(message: string, context?: ErrorContext, metadata?: Record<string, any>): void;

  /**
   * Log critical system failures
   */
  critical(message: string, context?: ErrorContext, metadata?: Record<string, any>): void;

  /**
   * Log structured error objects
   */
  logError(error: any, context?: ErrorContext): void;

  /**
   * Log use case execution
   */
  logUseCase(useCaseName: string, operation: string, result: 'started' | 'completed' | 'failed', context?: ErrorContext): void;

  /**
   * Create a child logger with additional context
   */
  child(context: Partial<ErrorContext>): ILogger;

  /**
   * Set correlation ID for request tracing
   */
  withCorrelationId(correlationId: string): ILogger;
}