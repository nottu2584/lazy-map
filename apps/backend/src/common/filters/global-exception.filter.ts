import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ILogger } from '@lazy-map/domain';

/**
 * Global Exception Filter
 * Catches all exceptions not handled by other filters
 * Provides consistent error responses and logging
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(
    @Inject('ILogger')
    private readonly logger: ILogger
  ) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Handle different exception types
    const { httpStatus, errorResponse } = this.processException(
      exception,
      request
    );

    // Generate correlation ID
    const correlationId = request.headers['x-correlation-id'] as string ||
                          this.generateCorrelationId();

    // Log the error
    this.logError(exception, request, correlationId, httpStatus);

    // Prepare final response
    const finalResponse = {
      statusCode: httpStatus,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      correlationId,
      ...errorResponse,
    };

    // Set correlation ID header
    response.setHeader('X-Correlation-Id', correlationId);

    response.status(httpStatus).json(finalResponse);
  }

  /**
   * Processes different types of exceptions
   */
  private processException(exception: unknown, _request: Request): {
    httpStatus: number;
    errorResponse: any;
  } {
    // Handle NestJS HttpException
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      return {
        httpStatus: status,
        errorResponse: {
          error: typeof exceptionResponse === 'string'
            ? {
                message: exceptionResponse,
                code: this.getErrorCodeFromStatus(status),
              }
            : {
                message: (exceptionResponse as any).message || exception.message,
                code: (exceptionResponse as any).error ||
                      this.getErrorCodeFromStatus(status),
                details: (exceptionResponse as any).details,
              }
        }
      };
    }

    // Handle native JavaScript errors
    if (exception instanceof Error) {
      // Check for specific error types
      if (exception.name === 'ValidationError') {
        // Mongoose/Class-validator validation errors
        return {
          httpStatus: HttpStatus.BAD_REQUEST,
          errorResponse: {
            error: {
              message: 'Validation failed',
              code: 'VALIDATION_ERROR',
              details: this.extractValidationErrors(exception),
            }
          }
        };
      }

      if (exception.message.includes('ECONNREFUSED')) {
        return {
          httpStatus: HttpStatus.SERVICE_UNAVAILABLE,
          errorResponse: {
            error: {
              message: 'Service temporarily unavailable',
              code: 'SERVICE_UNAVAILABLE',
              details: {
                reason: 'Unable to connect to required service',
              }
            }
          }
        };
      }

      // Generic error
      return {
        httpStatus: HttpStatus.INTERNAL_SERVER_ERROR,
        errorResponse: {
          error: {
            message: this.isProduction()
              ? 'An unexpected error occurred'
              : exception.message,
            code: 'INTERNAL_ERROR',
            ...(this.isProduction() ? {} : { stack: exception.stack }),
          }
        }
      };
    }

    // Handle unknown exceptions
    return {
      httpStatus: HttpStatus.INTERNAL_SERVER_ERROR,
      errorResponse: {
        error: {
          message: 'An unexpected error occurred',
          code: 'UNKNOWN_ERROR',
          ...(this.isProduction() ? {} : { details: exception }),
        }
      }
    };
  }

  /**
   * Logs error with appropriate context
   */
  private logError(
    exception: unknown,
    request: Request,
    correlationId: string,
    httpStatus: number
  ): void {
    const logContext = {
      correlationId,
      request: {
        method: request.method,
        url: request.url,
        headers: this.sanitizeHeaders(request.headers),
        ip: request.ip,
        userAgent: request.headers['user-agent'],
        body: this.sanitizeBody(request.body),
      },
      httpStatus,
    };

    // Determine log level based on status code
    if (httpStatus >= 500) {
      this.logger.error(
        `Unhandled exception: ${this.getErrorMessage(exception)}`,
        {
          component: 'GlobalExceptionFilter',
          operation: 'catch',
          metadata: {
            stack: this.getErrorStack(exception),
            ...logContext
          }
        }
      );
    } else if (httpStatus >= 400) {
      this.logger.warn(
        `Client error: ${this.getErrorMessage(exception)}`,
        {
          component: 'GlobalExceptionFilter',
          operation: 'catch',
          metadata: logContext
        }
      );
    } else {
      this.logger.info(
        `Exception handled: ${this.getErrorMessage(exception)}`,
        {
          component: 'GlobalExceptionFilter',
          operation: 'catch',
          metadata: logContext
        }
      );
    }
  }

  /**
   * Extracts validation errors from validation exceptions
   */
  private extractValidationErrors(exception: any): any {
    // Handle class-validator errors
    if (exception.errors && Array.isArray(exception.errors)) {
      return exception.errors.map((err: any) => ({
        field: err.property,
        constraints: err.constraints,
        value: err.value,
      }));
    }

    // Handle mongoose validation errors
    if (exception.errors && typeof exception.errors === 'object') {
      return Object.keys(exception.errors).map(key => ({
        field: key,
        message: (exception.errors as any)[key].message,
      }));
    }

    return exception.message;
  }

  /**
   * Gets error message from exception
   */
  private getErrorMessage(exception: unknown): string {
    if (exception instanceof Error) {
      return exception.message;
    }
    if (exception instanceof HttpException) {
      return exception.message;
    }
    if (typeof exception === 'string') {
      return exception;
    }
    return 'Unknown error';
  }

  /**
   * Gets error stack from exception
   */
  private getErrorStack(exception: unknown): string {
    if (exception instanceof Error) {
      return exception.stack || '';
    }
    return '';
  }

  /**
   * Maps HTTP status to error code
   */
  private getErrorCodeFromStatus(status: number): string {
    const statusCodes: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      405: 'METHOD_NOT_ALLOWED',
      409: 'CONFLICT',
      422: 'UNPROCESSABLE_ENTITY',
      429: 'TOO_MANY_REQUESTS',
      500: 'INTERNAL_SERVER_ERROR',
      502: 'BAD_GATEWAY',
      503: 'SERVICE_UNAVAILABLE',
      504: 'GATEWAY_TIMEOUT',
    };

    return statusCodes[status] || 'ERROR';
  }

  /**
   * Sanitizes request headers
   */
  private sanitizeHeaders(headers: any): any {
    const sanitized = { ...headers };
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key', 'x-auth-token'];

    sensitiveHeaders.forEach(header => {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  /**
   * Sanitizes request body for logging
   * Returns sanitized string representation to avoid prototype pollution concerns
   */
  private sanitizeBody(body: any): string | null {
    if (!body) return null;

    try {
      // Convert to JSON string for safe logging
      const jsonString = JSON.stringify(body);

      // Redact sensitive fields using regex
      const sensitivePatterns = [
        /"password"\s*:\s*"[^"]*"/gi,
        /"token"\s*:\s*"[^"]*"/gi,
        /"secret"\s*:\s*"[^"]*"/gi,
        /"apiKey"\s*:\s*"[^"]*"/gi,
        /"creditCard"\s*:\s*"[^"]*"/gi,
      ];

      let sanitized = jsonString;
      for (const pattern of sensitivePatterns) {
        sanitized = sanitized.replace(pattern, (match) => {
          const key = match.split(':')[0];
          return `${key}:"[REDACTED]"`;
        });
      }

      return sanitized;
    } catch (error) {
      // If JSON serialization fails, return safe fallback
      return '[Unable to sanitize body]';
    }
  }

  /**
   * Checks if running in production
   */
  private isProduction(): boolean {
    return process.env.NODE_ENV === 'production';
  }

  /**
   * Generates correlation ID
   */
  private generateCorrelationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }
}