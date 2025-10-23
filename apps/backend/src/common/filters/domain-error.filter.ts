import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { Request, Response } from 'express';
import {
  DomainError,
  ValidationError,
  NotFoundError,
  DomainRuleError,
  InfrastructureError,
  ErrorSeverity,
  ErrorCategory,
  ErrorContext,
  ILogger,
} from '@lazy-map/domain';

/**
 * Domain Error Exception Filter
 * Handles all DomainError instances and converts them to appropriate HTTP responses
 * Following Clean Architecture: Infrastructure layer handling domain errors
 */
@Catch(DomainError)
export class DomainErrorFilter implements ExceptionFilter {
  constructor(
    @Inject('ILogger')
    private readonly logger: ILogger
  ) {}

  catch(exception: DomainError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Map domain error to HTTP status code
    const httpStatus = this.mapErrorToHttpStatus(exception);

    // Generate correlation ID for request tracing
    const correlationId = request.headers['x-correlation-id'] as string ||
                          this.generateCorrelationId();

    // Log the error with appropriate severity
    this.logError(exception, request, correlationId);

    // Prepare error response
    const errorResponse = {
      statusCode: httpStatus,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      correlationId,
      error: {
        code: exception.code,
        message: exception.userMessage || exception.message,
        category: exception.details.category,
        severity: exception.details.severity,
        details: this.sanitizeErrorDetails(exception),
        suggestions: exception.details.suggestions,
      },
      ...(this.shouldIncludeRetryInfo(exception) && {
        retry: {
          canRetry: exception.details.recovery?.canRetry || false,
          retryAfterMs: exception.details.recovery?.retryAfterMs,
          maxRetries: exception.details.recovery?.maxRetries,
        }
      })
    };

    // Set retry header if applicable
    if (exception.details.recovery?.canRetry && exception.details.recovery?.retryAfterMs) {
      response.setHeader('Retry-After',
        Math.ceil(exception.details.recovery.retryAfterMs / 1000).toString());
    }

    // Set correlation ID header for tracking
    response.setHeader('X-Correlation-Id', correlationId);

    response.status(httpStatus).json(errorResponse);
  }

  /**
   * Maps domain errors to appropriate HTTP status codes
   */
  private mapErrorToHttpStatus(error: DomainError): number {
    // Check if error is an instance of specific error types
    if (error instanceof ValidationError) {
      return HttpStatus.BAD_REQUEST; // 400
    }

    if (error instanceof NotFoundError) {
      return HttpStatus.NOT_FOUND; // 404
    }

    if (error instanceof DomainRuleError) {
      return HttpStatus.UNPROCESSABLE_ENTITY; // 422
    }

    if (error instanceof InfrastructureError) {
      return HttpStatus.SERVICE_UNAVAILABLE; // 503
    }

    // Map by category if specific type not matched
    switch (error.details.category) {
      case ErrorCategory.VALIDATION:
        return HttpStatus.BAD_REQUEST;
      case ErrorCategory.AUTHENTICATION:
        return HttpStatus.UNAUTHORIZED; // 401
      case ErrorCategory.AUTHORIZATION:
        return HttpStatus.FORBIDDEN; // 403
      case ErrorCategory.NOT_FOUND:
        return HttpStatus.NOT_FOUND;
      case ErrorCategory.EXTERNAL_SERVICE:
        return HttpStatus.BAD_GATEWAY; // 502
      case ErrorCategory.CONFIGURATION:
        return HttpStatus.INTERNAL_SERVER_ERROR; // 500
      default:
        // Map by severity for remaining cases
        return error.details.severity === ErrorSeverity.CRITICAL
          ? HttpStatus.INTERNAL_SERVER_ERROR
          : HttpStatus.UNPROCESSABLE_ENTITY;
    }
  }

  /**
   * Logs error with appropriate severity level
   */
  private logError(
    error: DomainError,
    request: Request,
    correlationId: string
  ): void {
    const logContext = {
      correlationId,
      request: {
        method: request.method,
        url: request.url,
        headers: this.sanitizeHeaders(request.headers),
        ip: request.ip,
        userAgent: request.headers['user-agent'],
      },
      error: error.toLogData(),
    };

    const errorContext: ErrorContext = {
      component: 'DomainErrorFilter',
      operation: 'logError',
      correlationId,
      timestamp: new Date(),
      metadata: {
        request: logContext.request,
        error: logContext.error
      }
    };

    switch (error.details.severity) {
      case ErrorSeverity.CRITICAL:
        this.logger.critical(
          `Critical domain error: ${error.message}`,
          errorContext
        );
        break;
      case ErrorSeverity.HIGH:
        this.logger.error(
          `Domain error: ${error.message}`,
          errorContext
        );
        break;
      case ErrorSeverity.MEDIUM:
        this.logger.warn(
          `Domain warning: ${error.message}`,
          errorContext
        );
        break;
      case ErrorSeverity.LOW:
        this.logger.debug(
          `Domain notice: ${error.message}`,
          errorContext
        );
        break;
      default:
        this.logger.info(
          `Domain error: ${error.message}`,
          errorContext
        );
    }
  }

  /**
   * Sanitizes error details to avoid exposing sensitive information
   */
  private sanitizeErrorDetails(error: DomainError): any {
    const context = error.details.context || {};

    // Convert to a plain object for sanitization
    const sanitized: any = {
      component: context.component,
      operation: context.operation,
      entityId: context.entityId,
      userId: context.userId,
      timestamp: context.timestamp,
      correlationId: context.correlationId,
      metadata: context.metadata ? { ...context.metadata } : undefined
    };

    // Remove potentially sensitive fields
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'credentials'];

    // Sanitize top-level fields
    Object.keys(sanitized).forEach(key => {
      if (sanitized[key] && sensitiveFields.some(field => key.toLowerCase().includes(field))) {
        sanitized[key] = '[REDACTED]';
      }
    });

    // Sanitize metadata if present
    if (sanitized.metadata) {
      Object.keys(sanitized.metadata).forEach(key => {
        if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
          sanitized.metadata[key] = '[REDACTED]';
        }
      });
    }

    return sanitized;
  }

  /**
   * Sanitizes request headers to avoid logging sensitive information
   */
  private sanitizeHeaders(headers: any): any {
    const sanitized = { ...headers };
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];

    sensitiveHeaders.forEach(header => {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  /**
   * Determines if retry information should be included in response
   */
  private shouldIncludeRetryInfo(error: DomainError): boolean {
    return error.details.recovery?.canRetry === true &&
           error.details.category !== ErrorCategory.AUTHENTICATION &&
           error.details.category !== ErrorCategory.AUTHORIZATION;
  }

  /**
   * Generates a correlation ID for request tracing
   */
  private generateCorrelationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }
}