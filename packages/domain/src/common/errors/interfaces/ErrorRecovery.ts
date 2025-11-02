/**
 * Error recovery strategy
 */
export interface ErrorRecovery {
  canRetry: boolean;
  retryAfterMs?: number;
  maxRetries?: number;
  fallbackValue?: any;
  compensationAction?: () => Promise<void>;
}