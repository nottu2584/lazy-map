import { DomainError } from '../base/DomainError';
import { ErrorCategory, ErrorSeverity } from '../enums';
import { ErrorContext, ErrorRecovery } from '../interfaces';

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