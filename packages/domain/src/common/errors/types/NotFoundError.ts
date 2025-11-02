import { DomainError } from '../base/DomainError';
import { ErrorCategory, ErrorSeverity } from '../enums';
import { ErrorContext } from '../interfaces';

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