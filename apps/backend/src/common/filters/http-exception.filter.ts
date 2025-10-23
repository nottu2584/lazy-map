import { ILogger } from '@lazy-map/domain';
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Inject,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * HTTP Exception Filter
 * Handles standard NestJS HttpExceptions with consistent formatting and logging
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(
    @Inject('ILogger')
    private readonly logger: ILogger
  ) {}

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    // Generate correlation ID
    const correlationId = request.headers['x-correlation-id'] as string ||
                          this.generateCorrelationId();

    // Parse exception response
    const errorDetails = this.parseExceptionResponse(exceptionResponse);

    // Log the exception
    this.logHttpException(exception, request, correlationId);

    // Build error response
    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      correlationId,
      error: {
        code: errorDetails.code || this.getErrorCodeFromStatus(status),
        message: errorDetails.message || exception.message,
        ...(errorDetails.details && { details: errorDetails.details }),
        ...(errorDetails.validationErrors && {
          validationErrors: errorDetails.validationErrors
        }),
      },
      // Add rate limit info if applicable
      ...(status === 429 && {
        rateLimit: {
          limit: request.headers['x-ratelimit-limit'],
          remaining: request.headers['x-ratelimit-remaining'],
          reset: request.headers['x-ratelimit-reset'],
        }
      }),
    };

    // Set response headers
    response.setHeader('X-Correlation-Id', correlationId);

    // Set cache control for client errors
    if (status >= 400 && status < 500) {
      response.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }

    response.status(status).json(errorResponse);
  }

  /**
   * Parses exception response to extract details
   */
  private parseExceptionResponse(response: string | object): {
    code?: string;
    message?: string;
    details?: any;
    validationErrors?: any[];
  } {
    if (typeof response === 'string') {
      return { message: response };
    }

    const res = response as any;
    return {
      code: res.error,
      message: res.message || res.error,
      details: res.details,
      validationErrors: res.validationErrors,
    };
  }

  /**
   * Logs HTTP exception with appropriate level
   */
  private logHttpException(
    exception: HttpException,
    request: Request,
    correlationId: string
  ): void {
    const status = exception.getStatus();
    const logContext = {
      correlationId,
      statusCode: status,
      request: {
        method: request.method,
        url: request.url,
        query: request.query,
        params: request.params,
        headers: this.sanitizeHeaders(request.headers),
        ip: request.ip,
        userAgent: request.headers['user-agent'],
      },
    };

    const message = `HTTP ${status}: ${exception.message}`;

    // Log based on status code
    if (status >= 500) {
      this.logger.error(message, {
        component: 'HttpExceptionFilter',
        operation: 'catch',
        metadata: {
          stack: exception.stack || '',
          ...logContext
        }
      });
    } else if (status === 429) {
      // Rate limiting
      this.logger.warn(`Rate limit exceeded: ${message}`, {
        component: 'HttpExceptionFilter',
        operation: 'catch',
        metadata: logContext
      });
    } else if (status >= 400) {
      // Client errors - log at debug level
      this.logger.debug(message, {
        component: 'HttpExceptionFilter',
        operation: 'catch',
        metadata: logContext
      });
    } else {
      this.logger.info(message, {
        component: 'HttpExceptionFilter',
        operation: 'catch',
        metadata: logContext
      });
    }
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
      406: 'NOT_ACCEPTABLE',
      408: 'REQUEST_TIMEOUT',
      409: 'CONFLICT',
      410: 'GONE',
      411: 'LENGTH_REQUIRED',
      412: 'PRECONDITION_FAILED',
      413: 'PAYLOAD_TOO_LARGE',
      414: 'URI_TOO_LONG',
      415: 'UNSUPPORTED_MEDIA_TYPE',
      416: 'RANGE_NOT_SATISFIABLE',
      417: 'EXPECTATION_FAILED',
      422: 'UNPROCESSABLE_ENTITY',
      423: 'LOCKED',
      424: 'FAILED_DEPENDENCY',
      426: 'UPGRADE_REQUIRED',
      428: 'PRECONDITION_REQUIRED',
      429: 'TOO_MANY_REQUESTS',
      431: 'REQUEST_HEADER_FIELDS_TOO_LARGE',
      451: 'UNAVAILABLE_FOR_LEGAL_REASONS',
      500: 'INTERNAL_SERVER_ERROR',
      501: 'NOT_IMPLEMENTED',
      502: 'BAD_GATEWAY',
      503: 'SERVICE_UNAVAILABLE',
      504: 'GATEWAY_TIMEOUT',
      505: 'HTTP_VERSION_NOT_SUPPORTED',
      507: 'INSUFFICIENT_STORAGE',
      508: 'LOOP_DETECTED',
      510: 'NOT_EXTENDED',
      511: 'NETWORK_AUTHENTICATION_REQUIRED',
    };

    return statusCodes[status] || 'HTTP_ERROR';
  }

  /**
   * Sanitizes headers to remove sensitive information
   */
  private sanitizeHeaders(headers: any): any {
    const sanitized = { ...headers };
    const sensitiveHeaders = [
      'authorization',
      'cookie',
      'x-api-key',
      'x-auth-token',
      'x-access-token',
    ];

    sensitiveHeaders.forEach(header => {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  /**
   * Generates correlation ID for request tracing
   */
  private generateCorrelationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }
}