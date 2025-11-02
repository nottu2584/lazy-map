import { DomainError } from '../base/DomainError';
import { ErrorCategory, ErrorSeverity } from '../enums';
import { ErrorContext } from '../interfaces';

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