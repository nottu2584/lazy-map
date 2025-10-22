import { DomainError } from './DomainError';

/**
 * Type guard to check if an error is a DomainError
 */
export function isDomainError(error: any): error is DomainError {
  return error instanceof DomainError;
}

/**
 * Extract error information for logging (data extraction only)
 */
export function extractErrorInfo(error: any): {
  code?: string;
  message: string;
  category?: string;
  severity?: string;
  context?: any;
} {
  if (isDomainError(error)) {
    return error.toLogData();
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    return {
      message: error.message,
      context: {
        name: error.name,
        stack: error.stack
      }
    };
  }

  // Handle string errors
  if (typeof error === 'string') {
    return {
      message: error
    };
  }

  // Handle unknown error types
  return {
    message: 'Unknown error occurred',
    context: { originalError: error }
  };
}