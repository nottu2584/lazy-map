import { DomainError } from '../base/DomainError';
import { ErrorCategory, ErrorSeverity } from '../enums';
import { ErrorContext, ErrorRecovery } from '../interfaces';

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