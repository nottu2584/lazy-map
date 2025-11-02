/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'LOW',       // Warnings, non-blocking issues
  MEDIUM = 'MEDIUM', // Recoverable errors
  HIGH = 'HIGH',     // Critical errors that block operations
  CRITICAL = 'CRITICAL' // System-level failures
}