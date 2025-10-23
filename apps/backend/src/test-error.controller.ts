import {
  DomainRuleError,
  InfrastructureError,
  NotFoundError,
  ValidationError,
} from '@lazy-map/domain';
import {
  BadRequestException,
  Controller,
  Get,
  HttpException,
  NotFoundException,
  UnauthorizedException
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

/**
 * Test Error Controller
 * FOR DEVELOPMENT ONLY - Remove in production
 * Demonstrates error handling with different exception types
 */
@ApiTags('test-errors')
@Controller('test-errors')
export class TestErrorController {

  @Get('domain/validation')
  @ApiOperation({ summary: 'Test domain validation error' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  testValidationError() {
    throw new ValidationError(
      'TEST_VALIDATION_ERROR',
      'This is a test validation error',
      'Test validation failed',
      {
        component: 'TestController',
        operation: 'testValidation',
        metadata: { input: { testField: 'invalid value' } }
      },
      ['Ensure test field is valid', 'Check input format']
    );
  }

  @Get('domain/not-found')
  @ApiOperation({ summary: 'Test domain not found error' })
  @ApiResponse({ status: 404, description: 'Not found error' })
  testNotFoundError() {
    throw new NotFoundError(
      'TestResource',
      '123',
      {
        component: 'TestController',
        operation: 'findResource'
      }
    );
  }

  @Get('domain/business-rule')
  @ApiOperation({ summary: 'Test domain business rule violation' })
  @ApiResponse({ status: 422, description: 'Business rule violation' })
  testDomainRuleError() {
    throw new DomainRuleError(
      'TEST_BUSINESS_RULE_VIOLATION',
      'Test business rule has been violated',
      'Operation not allowed',
      {
        component: 'TestController',
        operation: 'validateRule',
        metadata: {
          rule: 'TEST_RULE',
          currentValue: 100,
          maxAllowed: 50
        }
      },
      ['Reduce the value below maximum', 'Contact administrator for limit increase']
    );
  }

  @Get('domain/infrastructure')
  @ApiOperation({ summary: 'Test infrastructure error' })
  @ApiResponse({ status: 503, description: 'Infrastructure error' })
  testInfrastructureError() {
    throw new InfrastructureError(
      'TEST_INFRASTRUCTURE_ERROR',
      'Test database connection failed',
      'Service temporarily unavailable',
      {
        component: 'TestController',
        operation: 'connectDatabase',
        metadata: {
          service: 'TestDatabase',
          host: 'localhost',
          port: 5432
        }
      },
      ['Check database connection', 'Verify network connectivity'],
      {
        canRetry: true,
        retryAfterMs: 5000,
        maxRetries: 3
      }
    );
  }

  @Get('http/bad-request')
  @ApiOperation({ summary: 'Test HTTP bad request' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  testBadRequest() {
    throw new BadRequestException({
      message: 'Invalid request parameters',
      error: 'BAD_REQUEST',
      details: {
        field: 'testField',
        reason: 'Must be a positive number'
      }
    });
  }

  @Get('http/not-found')
  @ApiOperation({ summary: 'Test HTTP not found' })
  @ApiResponse({ status: 404, description: 'Not found' })
  testHttpNotFound() {
    throw new NotFoundException('Test resource not found');
  }

  @Get('http/unauthorized')
  @ApiOperation({ summary: 'Test HTTP unauthorized' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  testUnauthorized() {
    throw new UnauthorizedException({
      message: 'Invalid authentication credentials',
      error: 'UNAUTHORIZED',
      details: {
        realm: 'TestAPI',
        authType: 'Bearer'
      }
    });
  }

  @Get('http/custom')
  @ApiOperation({ summary: 'Test custom HTTP exception' })
  @ApiResponse({ status: 418, description: "I'm a teapot" })
  testCustomHttpException() {
    throw new HttpException(
      {
        message: "I'm a teapot",
        error: 'TEAPOT',
        details: {
          reason: 'The server refuses to brew coffee because it is a teapot'
        }
      },
      418
    );
  }

  @Get('unexpected/error')
  @ApiOperation({ summary: 'Test unexpected JavaScript error' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  testUnexpectedError() {
    // Simulate an unexpected error
    const obj: any = null;
    return obj.someMethod(); // This will throw TypeError
  }

  @Get('unexpected/throw-string')
  @ApiOperation({ summary: 'Test throwing a string' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  testThrowString() {
    throw 'This is a string error'; // Bad practice but should be handled
  }

  @Get('unexpected/throw-object')
  @ApiOperation({ summary: 'Test throwing an object' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  testThrowObject() {
    throw { error: 'custom', details: 'This is a custom object' };
  }

  @Get('success')
  @ApiOperation({ summary: 'Test successful response' })
  @ApiResponse({ status: 200, description: 'Success' })
  testSuccess() {
    return {
      success: true,
      message: 'This endpoint works correctly',
      timestamp: new Date().toISOString()
    };
  }
}