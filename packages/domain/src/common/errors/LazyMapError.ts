/**
 * Error categories for standardized error handling
 */
export enum ErrorCategory {
  VALIDATION = 'VALIDATION',
  DOMAIN_RULE = 'DOMAIN_RULE', 
  DETERMINISTIC = 'DETERMINISTIC',
  INFRASTRUCTURE = 'INFRASTRUCTURE',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  CONFIGURATION = 'CONFIGURATION',
  EXTERNAL_SERVICE = 'EXTERNAL_SERVICE'
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
}

/**
 * Base error class for the lazy-map domain
 */
export abstract class LazyMapError extends Error {
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
   * Get error for API responses
   */
  toApiResponse(): {
    error: string;
    code: string;
    category: string;
    suggestions?: string[];
  } {
    return {
      error: this.userMessage,
      code: this.details.code,
      category: this.details.category,
      suggestions: this.details.suggestions
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
  } {
    return {
      code: this.details.code,
      message: this.details.message,
      category: this.details.category,
      severity: this.details.severity,
      context: this.details.context,
      stack: this.stack
    };
  }
}

/**
 * Validation-related errors
 */
export class ValidationError extends LazyMapError {
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
      category: ErrorCategory.VALIDATION,
      severity: ErrorSeverity.MEDIUM,
      context,
      suggestions
    });
  }
}

/**
 * Domain rule violation errors
 */
export class DomainRuleError extends LazyMapError {
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
      category: ErrorCategory.DOMAIN_RULE,
      severity: ErrorSeverity.HIGH,
      context,
      suggestions
    });
  }
}

/**
 * Deterministic generation errors
 */
export class DeterministicError extends LazyMapError {
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
      suggestions
    });
  }
}

/**
 * Infrastructure-related errors
 */
export class InfrastructureError extends LazyMapError {
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
      category: ErrorCategory.INFRASTRUCTURE,
      severity: ErrorSeverity.HIGH,
      context,
      suggestions
    });
  }
}

/**
 * Not found errors
 */
export class NotFoundError extends LazyMapError {
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
      ]
    });
  }
}