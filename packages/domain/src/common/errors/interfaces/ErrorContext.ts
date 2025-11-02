/**
 * Error context information for better debugging
 */
export interface ErrorContext {
  component?: string;      // Which component threw the error
  operation?: string;      // What operation was being performed
  entityId?: string;       // ID of entity being operated on
  userId?: string;         // User who triggered the operation
  timestamp?: Date;        // When the error occurred
  correlationId?: string;  // For tracing across services
  metadata?: Record<string, any>; // Additional context
}