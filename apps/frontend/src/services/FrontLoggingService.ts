import type {
  ILogger,
  LogLevel,
  LogEntry,
  ErrorContext,
} from '@lazy-map/domain';

// Local LogLevel constants to avoid CommonJS import issues with Vite
const LogLevelEnum: Record<string, LogLevel> = {
  DEBUG: 'debug' as LogLevel,
  INFO: 'info' as LogLevel,
  WARN: 'warn' as LogLevel,
  ERROR: 'error' as LogLevel,
  CRITICAL: 'critical' as LogLevel
}

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
      case LogLevelEnum.DEBUG:
        console.debug(formattedMessage);
        if (hasMetadata) console.debug('  └─', metadata);
        break;
      case LogLevelEnum.INFO:
        console.info(formattedMessage);
        if (hasMetadata) console.info('  └─', metadata);
        break;
      case LogLevelEnum.WARN:
        console.warn(formattedMessage);
        if (hasMetadata) console.warn('  └─', metadata);
        break;
      case LogLevelEnum.ERROR:
        console.error(formattedMessage);
        if (hasMetadata) console.error('  └─', metadata);
        break;
      case LogLevelEnum.CRITICAL:
        console.error(`🔥 CRITICAL: ${formattedMessage}`);
        if (hasMetadata) console.error('  └─', metadata);
        break;
    }
  }

  debug(message: string, context?: ErrorContext, metadata?: Record<string, any>): void {
    this.log(LogLevelEnum.DEBUG, message, context, metadata);
  }

  info(message: string, context?: ErrorContext, metadata?: Record<string, any>): void {
    this.log(LogLevelEnum.INFO, message, context, metadata);
  }

  warn(message: string, context?: ErrorContext, metadata?: Record<string, any>): void {
    this.log(LogLevelEnum.WARN, message, context, metadata);
  }

  error(message: string, context?: ErrorContext, metadata?: Record<string, any>): void {
    this.log(LogLevelEnum.ERROR, message, context, metadata);
  }

  critical(message: string, context?: ErrorContext, metadata?: Record<string, any>): void {
    this.log(LogLevelEnum.CRITICAL, message, context, metadata);
  }

  /**
   * Log structured error objects
   */
  logError(error: any, context?: ErrorContext): void {
    // Extract error information
    const message = error?.message || String(error);
    const stack = error?.stack;

    // Check if it's a domain error with additional properties
    const errorCode = error?.code;
    const errorCategory = error?.category;
    const severity = error?.severity;

    // Determine log level
    let level = LogLevelEnum.ERROR;
    if (severity === 'CRITICAL') {
      level = LogLevelEnum.CRITICAL;
    } else if (severity === 'LOW') {
      level = LogLevelEnum.WARN;
    }

    // Build formatted message
    let formattedMessage = message;
    if (errorCode) {
      formattedMessage = `[${errorCode}] ${formattedMessage}`;
    }
    if (errorCategory) {
      formattedMessage = `${errorCategory}: ${formattedMessage}`;
    }

    this.log(level, formattedMessage, context, {
      errorCode,
      errorCategory,
      severity,
      stack
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
    const level = result === 'failed' ? LogLevelEnum.ERROR : LogLevelEnum.INFO;
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
