import { LazyMapError } from './LazyMapError';

/**
 * Type guard to check if an error is a LazyMapError
 */
export function isLazyMapError(error: any): error is LazyMapError {
  return error instanceof LazyMapError;
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
  if (isLazyMapError(error)) {
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