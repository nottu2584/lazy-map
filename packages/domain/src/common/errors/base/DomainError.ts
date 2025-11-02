import { ErrorDetails, ErrorContext, ErrorRecovery } from '../interfaces';

/**
 * Base domain error class for Clean Architecture
 * This is the foundation for all domain-level errors
 */
export abstract class DomainError extends Error {
  public readonly details: ErrorDetails;
  public readonly timestamp: Date;

  constructor(details: ErrorDetails, cause?: Error) {
    super(details.message);
    this.name = this.constructor.name;
    this.details = {
      ...details,
      context: {
        timestamp: new Date(),
        ...details.context
      }
    };
    this.timestamp = new Date();

    // Maintain stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }

    // Chain original error if provided
    if (cause) {
      (this as any).cause = cause;
    }
  }

  /**
   * Get error code for logging/monitoring
   */
  get code(): string {
    return this.details.code;
  }

  /**
   * Get user-friendly message
   */
  get userMessage(): string {
    return this.details.userMessage || this.details.message;
  }

  /**
   * Check if error is retryable
   */
  get isRetryable(): boolean {
    return this.details.recovery?.canRetry || false;
  }

  /**
   * Get error for API responses
   */
  toApiResponse(): {
    error: string;
    code: string;
    category: string;
    suggestions?: string[];
    canRetry?: boolean;
  } {
    return {
      error: this.userMessage,
      code: this.details.code,
      category: this.details.category,
      suggestions: this.details.suggestions,
      canRetry: this.details.recovery?.canRetry
    };
  }

  /**
   * Get error information for logging (data only, no actual logging)
   */
  toLogData(): {
    code: string;
    message: string;
    category: string;
    severity: string;
    context?: ErrorContext;
    stack?: string;
    recovery?: ErrorRecovery;
  } {
    return {
      code: this.details.code,
      message: this.details.message,
      category: this.details.category,
      severity: this.details.severity,
      context: this.details.context,
      stack: this.stack,
      recovery: this.details.recovery
    };
  }
}