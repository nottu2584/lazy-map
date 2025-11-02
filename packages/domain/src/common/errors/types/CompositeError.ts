import { DomainError } from '../base/DomainError';
import { ErrorCategory, ErrorSeverity } from '../enums';
import { ErrorContext } from '../interfaces';

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