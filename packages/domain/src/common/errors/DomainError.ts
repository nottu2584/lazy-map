/**
 * Error categories for standardized error handling
 */
export enum ErrorCategory {
  // Core categories
  VALIDATION = 'VALIDATION',
  DOMAIN_RULE = 'DOMAIN_RULE',
  DETERMINISTIC = 'DETERMINISTIC',
  INFRASTRUCTURE = 'INFRASTRUCTURE',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  CONFIGURATION = 'CONFIGURATION',
  EXTERNAL_SERVICE = 'EXTERNAL_SERVICE',

  // Domain context categories
  RELIEF_GENERATION = 'RELIEF_GENERATION',
  NATURAL_FEATURES = 'NATURAL_FEATURES',
  ARTIFICIAL_STRUCTURES = 'ARTIFICIAL_STRUCTURES',
  CULTURAL_ELEMENTS = 'CULTURAL_ELEMENTS',
  MAP_AGGREGATION = 'MAP_AGGREGATION'
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'LOW',       // Warnings, non-blocking issues
  MEDIUM = 'MEDIUM', // Recoverable errors
  HIGH = 'HIGH',     // Critical errors that block operations
  CRITICAL = 'CRITICAL' // System-level failures
}

/**
 * Error recovery strategy
 */
export interface ErrorRecovery {
  canRetry: boolean;
  retryAfterMs?: number;
  maxRetries?: number;
  fallbackValue?: any;
  compensationAction?: () => Promise<void>;
}

/**
 * Error context information for better debugging
 */
export interface ErrorContext {
  component?: string;      // Which component threw the error
  operation?: string;      // What operation was being performed
  entityId?: string;       // ID of entity being operated on
  userId?: string;         // User who triggered the operation
  timestamp?: Date;        // When the error occurred
  correlationId?: string;  // For tracing across services
  metadata?: Record<string, any>; // Additional context
}

/**
 * Structured error details
 */
export interface ErrorDetails {
  code: string;           // Unique error code (e.g., "SEED_EMPTY_STRING")
  message: string;        // Human-readable message
  category: ErrorCategory;
  severity: ErrorSeverity;
  context?: ErrorContext;
  userMessage?: string;   // User-friendly message (different from technical message)
  suggestions?: string[]; // How to fix the error
  relatedErrors?: string[]; // Related error codes
  recovery?: ErrorRecovery; // Recovery strategy
}

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

/**
 * Validation-related errors
 */
export class ValidationError extends DomainError {
  constructor(
    code: string,
    message: string,
    userMessage?: string,
    context?: ErrorContext,
    suggestions?: string[],
    recovery?: ErrorRecovery
  ) {
    super({
      code,
      message,
      userMessage,
      category: ErrorCategory.VALIDATION,
      severity: ErrorSeverity.MEDIUM,
      context,
      suggestions,
      recovery
    });
  }
}

/**
 * Domain rule violation errors
 */
export class DomainRuleError extends DomainError {
  constructor(
    code: string,
    message: string,
    userMessage?: string,
    context?: ErrorContext,
    suggestions?: string[],
    recovery?: ErrorRecovery
  ) {
    super({
      code,
      message,
      userMessage,
      category: ErrorCategory.DOMAIN_RULE,
      severity: ErrorSeverity.HIGH,
      context,
      suggestions,
      recovery
    });
  }
}

/**
 * Deterministic generation errors
 */
export class DeterministicError extends DomainError {
  constructor(
    code: string,
    message: string,
    userMessage?: string,
    context?: ErrorContext,
    suggestions?: string[]
  ) {
    super({
      code,
      message,
      userMessage,
      category: ErrorCategory.DETERMINISTIC,
      severity: ErrorSeverity.CRITICAL,
      context,
      suggestions,
      recovery: { canRetry: false } // Deterministic errors should not be retried
    });
  }
}

/**
 * Infrastructure-related errors
 */
export class InfrastructureError extends DomainError {
  constructor(
    code: string,
    message: string,
    userMessage?: string,
    context?: ErrorContext,
    suggestions?: string[],
    recovery?: ErrorRecovery
  ) {
    super({
      code,
      message,
      userMessage,
      category: ErrorCategory.INFRASTRUCTURE,
      severity: ErrorSeverity.HIGH,
      context,
      suggestions,
      recovery: recovery || { canRetry: true, maxRetries: 3, retryAfterMs: 1000 }
    });
  }
}

/**
 * Not found errors
 */
export class NotFoundError extends DomainError {
  constructor(
    resource: string,
    identifier: string,
    context?: ErrorContext
  ) {
    super({
      code: `${resource.toUpperCase()}_NOT_FOUND`,
      message: `${resource} with identifier '${identifier}' was not found`,
      userMessage: `The requested ${resource} could not be found`,
      category: ErrorCategory.NOT_FOUND,
      severity: ErrorSeverity.MEDIUM,
      context: {
        ...context,
        component: resource,
        entityId: identifier
      },
      suggestions: [
        `Verify the ${resource} identifier is correct`,
        `Check if the ${resource} has been deleted`,
        'Refresh and try again'
      ],
      recovery: { canRetry: false }
    });
  }
}

/**
 * Composite error for multiple error aggregation
 */
export class CompositeError extends DomainError {
  public readonly errors: DomainError[];

  constructor(
    errors: DomainError[],
    message?: string,
    context?: ErrorContext
  ) {
    const highestSeverity = errors.reduce((max, err) => {
      const severityOrder = [ErrorSeverity.LOW, ErrorSeverity.MEDIUM, ErrorSeverity.HIGH, ErrorSeverity.CRITICAL];
      const currentIndex = severityOrder.indexOf(err.details.severity);
      const maxIndex = severityOrder.indexOf(max);
      return currentIndex > maxIndex ? err.details.severity : max;
    }, ErrorSeverity.LOW);

    super({
      code: 'COMPOSITE_ERROR',
      message: message || `Multiple errors occurred (${errors.length} errors)`,
      userMessage: 'Multiple issues occurred. Please review all errors.',
      category: ErrorCategory.DOMAIN_RULE,
      severity: highestSeverity,
      context: {
        ...context,
        metadata: {
          errorCount: errors.length,
          errorCodes: errors.map(e => e.code)
        }
      },
      suggestions: Array.from(new Set(errors.flatMap(e => e.details.suggestions || []))),
      recovery: {
        canRetry: errors.some(e => e.isRetryable)
      }
    });

    this.errors = errors;
  }

  /**
   * Get all error messages
   */
  getAllMessages(): string[] {
    return this.errors.map(e => e.message);
  }

  /**
   * Get errors by category
   */
  getErrorsByCategory(category: ErrorCategory): DomainError[] {
    return this.errors.filter(e => e.details.category === category);
  }
}