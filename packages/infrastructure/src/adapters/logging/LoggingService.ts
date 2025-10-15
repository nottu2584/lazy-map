import { Injectable, Logger as NestLogger } from '@nestjs/common';
import { 
  ILogger, 
  LogLevel, 
  LogEntry, 
  ErrorContext, 
  isLazyMapError, 
  extractErrorInfo 
} from '@lazy-map/domain';

/**
 * NestJS-based logging service implementation
 * Integrates with NestJS built-in Logger while providing structured logging
 */
@Injectable()
export class LoggingService implements ILogger {
  private readonly nestLogger: NestLogger;
  private readonly baseContext: Partial<ErrorContext>;
  private readonly loggerContext: string;
  private _correlationId?: string;

  constructor(context?: string, baseContext?: Partial<ErrorContext>, correlationId?: string) {
    this.loggerContext = context || 'LazyMapApp';
    this.nestLogger = new NestLogger(this.loggerContext);
    this.baseContext = baseContext || {};
    this._correlationId = correlationId;
  }

  /**
   * Get the current correlation ID
   */
  get correlationId(): string | undefined {
    return this._correlationId;
  }

  /**
   * Create a structured log entry
   */
  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: ErrorContext,
    metadata?: Record<string, any>
  ): LogEntry {
    return {
      level,
      message,
      timestamp: new Date(),
      correlationId: this.correlationId,
      context: {
        ...this.baseContext,
        ...context
      },
      metadata
    };
  }

  /**
   * Format log entry for NestJS Logger
   */
  private formatForNest(entry: LogEntry): string {
    const parts: string[] = [];

    // Add correlation ID if available
    if (entry.correlationId) {
      parts.push(`[${entry.correlationId}]`);
    }

    // Add component context
    if (entry.context?.component) {
      parts.push(`[${entry.context.component}]`);
    }

    // Add operation context
    if (entry.context?.operation) {
      parts.push(`${entry.context.operation}:`);
    }

    // Add the main message
    parts.push(entry.message);

    // Add metadata if present
    if (entry.metadata && Object.keys(entry.metadata).length > 0) {
      parts.push(`| ${JSON.stringify(entry.metadata)}`);
    }

    return parts.join(' ');
  }

  /**
   * Log at the specified level
   */
  private log(level: LogLevel, message: string, context?: ErrorContext, metadata?: Record<string, any>): void {
    const entry = this.createLogEntry(level, message, context, metadata);
    const formattedMessage = this.formatForNest(entry);

    switch (level) {
      case LogLevel.DEBUG:
        this.nestLogger.debug(formattedMessage);
        break;
      case LogLevel.INFO:
        this.nestLogger.log(formattedMessage);
        break;
      case LogLevel.WARN:
        this.nestLogger.warn(formattedMessage);
        break;
      case LogLevel.ERROR:
        this.nestLogger.error(formattedMessage);
        break;
      case LogLevel.CRITICAL:
        this.nestLogger.fatal(formattedMessage);
        break;
    }
  }

  debug(message: string, context?: ErrorContext, metadata?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context, metadata);
  }

  info(message: string, context?: ErrorContext, metadata?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context, metadata);
  }

  warn(message: string, context?: ErrorContext, metadata?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context, metadata);
  }

  error(message: string, context?: ErrorContext, metadata?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, context, metadata);
  }

  critical(message: string, context?: ErrorContext, metadata?: Record<string, any>): void {
    this.log(LogLevel.CRITICAL, message, context, metadata);
  }

  /**
   * Log structured error objects
   */
  logError(error: any, context?: ErrorContext): void {
    const errorInfo = extractErrorInfo(error);
    const mergedContext = { ...context, ...errorInfo.context };

    // Determine log level based on error severity
    let level = LogLevel.ERROR;
    if (errorInfo.severity === 'CRITICAL') {
      level = LogLevel.CRITICAL;
    } else if (errorInfo.severity === 'LOW') {
      level = LogLevel.WARN;
    }

    // Create detailed message
    let message = errorInfo.message;
    if (errorInfo.code) {
      message = `[${errorInfo.code}] ${message}`;
    }
    if (errorInfo.category) {
      message = `${errorInfo.category}: ${message}`;
    }

    this.log(level, message, mergedContext, {
      errorCode: errorInfo.code,
      errorCategory: errorInfo.category,
      errorSeverity: errorInfo.severity,
      isStructuredError: isLazyMapError(error)
    });
  }

  /**
   * Log use case execution for observability
   */
  logUseCase(
    useCaseName: string,
    operation: string,
    result: 'started' | 'completed' | 'failed',
    context?: ErrorContext
  ): void {
    const level = result === 'failed' ? LogLevel.ERROR : LogLevel.INFO;
    const message = `${useCaseName}.${operation} ${result}`;
    
    this.log(level, message, {
      component: 'UseCase',
      operation: `${useCaseName}.${operation}`,
      ...context
    }, {
      useCaseName,
      operation,
      result
    });
  }

  /**
   * Create a child logger with additional context
   */
  child(context: Partial<ErrorContext>): ILogger {
    return new LoggingService(
      this.loggerContext,
      { ...this.baseContext, ...context }
    );
  }

  /**
   * Create a logger with correlation ID for request tracing
   */
  withCorrelationId(correlationId: string): ILogger {
    return new LoggingService(this.loggerContext, this.baseContext, correlationId);
  }
}