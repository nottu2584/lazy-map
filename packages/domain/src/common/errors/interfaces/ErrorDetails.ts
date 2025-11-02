import { ErrorCategory, ErrorSeverity } from '../enums';
import { ErrorContext } from './ErrorContext';
import { ErrorRecovery } from './ErrorRecovery';

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