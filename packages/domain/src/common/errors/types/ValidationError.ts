import { DomainError } from '../base/DomainError';
import { ErrorCategory, ErrorSeverity } from '../enums';
import { ErrorContext, ErrorRecovery } from '../interfaces';

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