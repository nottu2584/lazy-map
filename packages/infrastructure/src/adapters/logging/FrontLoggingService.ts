import {
  ILogger,
  LogLevel,
  LogEntry,
  ErrorContext,
  isDomainError,
  extractErrorInfo
} from '@lazy-map/domain';

/**
 * Frontend logging service implementation for browser environments
 * Uses browser console with structured formatting
 */
export class FrontLoggingService implements ILogger {
  private readonly baseContext: Partial<ErrorContext>;
  private readonly loggerContext: string;
  private _correlationId?: string;

  constructor(context?: string, baseContext?: Partial<ErrorContext>, correlationId?: string) {
    this.loggerContext = context || 'LazyMapFrontend';
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
   * Format log entry for browser console
   */
  private formatForConsole(entry: LogEntry): string {
    const parts: string[] = [];

    // Add timestamp
    const time = entry.timestamp.toLocaleTimeString();
    parts.push(`[${time}]`);

    // Add logger context
    parts.push(`[${this.loggerContext}]`);

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

    return parts.join(' ');
  }

  /**
   * Log at the specified level using browser console
   */
  private log(level: LogLevel, message: string, context?: ErrorContext, metadata?: Record<string, any>): void {
    const entry = this.createLogEntry(level, message, context, metadata);
    const formattedMessage = this.formatForConsole(entry);

    // Add metadata as a separate log if present
    const hasMetadata = metadata && Object.keys(metadata).length > 0;

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(formattedMessage);
        if (hasMetadata) console.debug('  └─', metadata);
        break;
      case LogLevel.INFO:
        console.info(formattedMessage);
        if (hasMetadata) console.info('  └─', metadata);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage);
        if (hasMetadata) console.warn('  └─', metadata);
        break;
      case LogLevel.ERROR:
        console.error(formattedMessage);
        if (hasMetadata) console.error('  └─', metadata);
        break;
      case LogLevel.CRITICAL:
        console.error(`🔥 CRITICAL: ${formattedMessage}`);
        if (hasMetadata) console.error('  └─', metadata);
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
      isStructuredError: isDomainError(error),
      stack: error?.stack
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
    return new FrontLoggingService(
      this.loggerContext,
      { ...this.baseContext, ...context }
    );
  }

  /**
   * Create a logger with correlation ID for request tracing
   */
  withCorrelationId(correlationId: string): ILogger {
    return new FrontLoggingService(this.loggerContext, this.baseContext, correlationId);
  }
}
