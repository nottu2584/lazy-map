import { 
  Controller, 
  Post, 
  Body, 
  HttpException, 
  HttpStatus,
  Headers,
  Inject
} from '@nestjs/common';
import { ILogger } from '@lazy-map/domain';
import { LOGGER_TOKEN } from '@lazy-map/infrastructure';
import { GenerateMapDto } from '../dto';
import { isDomainError } from '@lazy-map/domain';

/**
 * Example controller showing integration of the logging system
 * with NestJS controllers and proper error handling
 */
@Controller('examples/logging')
export class LoggingExampleController {
  constructor(
    @Inject(LOGGER_TOKEN) private readonly logger: ILogger
  ) {}

  @Post('generate-map')
  async generateMap(
    @Body() generateMapDto: GenerateMapDto,
    @Headers('x-correlation-id') correlationId?: string
  ) {
    // Create a child logger with correlation ID and operation context
    const operationLogger = this.logger
      .withCorrelationId(correlationId || this.generateCorrelationId())
      .child({
        component: 'LoggingExampleController',
        operation: 'generateMap',
        entityId: `map-${Date.now()}`
      });

    try {
      // Log the start of the operation
      operationLogger.info('Map generation request received', {
        userId: 'example-user',
        metadata: {
          dimensions: generateMapDto.dimensions,
          seed: generateMapDto.seed,
          terrainDistribution: generateMapDto.terrainDistribution
        }
      });

      // Simulate validation
      this.validateMapRequest(generateMapDto, operationLogger);

      // Simulate map generation process
      const result = await this.simulateMapGeneration(generateMapDto, operationLogger);

      // Log successful completion
      operationLogger.info('Map generation completed successfully', {
        userId: 'example-user',
        metadata: {
          mapId: result.id,
          processingTime: result.processingTime
        }
      });

      return {
        success: true,
        data: result,
        correlationId: operationLogger.correlationId
      };

    } catch (error) {
      // Log the error using the structured error logging
      operationLogger.logError(error, {
        userId: 'example-user',
        metadata: {
          requestPayload: generateMapDto
        }
      });

      // Handle different error types appropriately
      if (isDomainError(error)) {
        // DomainError has structured information
        throw new HttpException(
          {
            message: error.message,
            code: error.code,
            correlationId: operationLogger.correlationId
          },
          this.mapErrorToHttpStatus(error.details.severity)
        );
      } else {
        // Standard error
        throw new HttpException(
          {
            message: 'Internal server error',
            correlationId: operationLogger.correlationId
          },
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
    }
  }

  @Post('example/use-case-logging')
  async demonstrateUseCaseLogging(@Headers('x-correlation-id') correlationId?: string) {
    const logger = this.logger.withCorrelationId(correlationId || this.generateCorrelationId());
    
    const useCaseName = 'ExampleUseCase';
    const operation = 'execute';
    const userId = 'demo-user';

    try {
      // Log use case start
      logger.logUseCase(useCaseName, operation, 'started', {
        userId,
        metadata: {
          startTime: new Date().toISOString()
        }
      });

      // Simulate some work
      await this.simulateWork(logger);

      // Log successful completion
      logger.logUseCase(useCaseName, operation, 'completed', {
        userId,
        metadata: {
          duration: '150ms',
          result: 'success'
        }
      });

      return {
        success: true,
        message: 'Use case completed successfully',
        correlationId: logger.correlationId
      };

    } catch (error) {
      // Log use case failure
      logger.logUseCase(useCaseName, operation, 'failed', {
        userId,
        metadata: {
          errorType: error.constructor.name,
          errorMessage: error.message
        }
      });

      throw error;
    }
  }

  @Post('example/performance-logging')
  async demonstratePerformanceLogging(@Headers('x-correlation-id') correlationId?: string) {
    const logger = this.logger.withCorrelationId(correlationId || this.generateCorrelationId());
    const startTime = Date.now();

    logger.debug('Performance tracking started', {
      component: 'PerformanceExample',
      operation: 'processData'
    });

    try {
      // Simulate processing steps with timing
      await this.simulateStep1(logger);
      await this.simulateStep2(logger);
      await this.simulateStep3(logger);

      const totalTime = Date.now() - startTime;

      logger.info('Performance tracking completed', 
        {
          component: 'PerformanceExample',
          operation: 'processData'
        },
        {
          totalExecutionTime: `${totalTime}ms`,
          memoryUsage: process.memoryUsage(),
          steps: 3
        }
      );

      return {
        success: true,
        executionTime: `${totalTime}ms`,
        correlationId: logger.correlationId
      };

    } catch (error) {
      const totalTime = Date.now() - startTime;
      
      logger.error('Performance tracking failed', {
        component: 'PerformanceExample',
        operation: 'processData',
        metadata: {
          failureTime: `${totalTime}ms`,
          error: error.message
        }
      });

      throw error;
    }
  }

  private validateMapRequest(dto: GenerateMapDto, logger: ILogger): void {
    logger.debug('Validating map generation request', {
      component: 'LoggingExampleController',
      operation: 'validateMapRequest'
    });

    // Example validation with logging
    if (!dto.dimensions || dto.dimensions.width <= 0 || dto.dimensions.height <= 0) {
      logger.warn('Invalid dimensions provided', {
        component: 'LoggingExampleController',
        operation: 'validateMapRequest',
        metadata: {
          providedDimensions: dto.dimensions
        }
      });
      
      throw new Error('Invalid map dimensions');
    }

    logger.debug('Map request validation passed', {
      component: 'LoggingExampleController',
      operation: 'validateMapRequest'
    });
  }

  private async simulateMapGeneration(dto: GenerateMapDto, logger: ILogger) {
    const stepLogger = logger.child({
      component: 'MapGenerationSimulator'
    });

    stepLogger.debug('Starting terrain generation');
    await new Promise(resolve => setTimeout(resolve, 100));

    stepLogger.debug('Starting feature placement');
    await new Promise(resolve => setTimeout(resolve, 50));

    stepLogger.debug('Finalizing map structure');
    await new Promise(resolve => setTimeout(resolve, 30));

    return {
      id: `map-${Date.now()}`,
      processingTime: '180ms',
      dimensions: dto.dimensions,
      seed: dto.seed
    };
  }

  private async simulateWork(logger: ILogger): Promise<void> {
    const workLogger = logger.child({
      component: 'WorkSimulator'
    });

    workLogger.debug('Processing step 1');
    await new Promise(resolve => setTimeout(resolve, 50));

    workLogger.debug('Processing step 2');
    await new Promise(resolve => setTimeout(resolve, 50));

    workLogger.debug('Processing step 3');
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  private async simulateStep1(logger: ILogger): Promise<void> {
    const startTime = Date.now();
    await new Promise(resolve => setTimeout(resolve, 30));
    
    logger.debug('Step 1 completed', 
      { component: 'PerformanceExample', operation: 'step1' },
      { executionTime: `${Date.now() - startTime}ms` }
    );
  }

  private async simulateStep2(logger: ILogger): Promise<void> {
    const startTime = Date.now();
    await new Promise(resolve => setTimeout(resolve, 40));
    
    logger.debug('Step 2 completed', 
      { component: 'PerformanceExample', operation: 'step2' },
      { executionTime: `${Date.now() - startTime}ms` }
    );
  }

  private async simulateStep3(logger: ILogger): Promise<void> {
    const startTime = Date.now();
    await new Promise(resolve => setTimeout(resolve, 20));
    
    logger.debug('Step 3 completed', 
      { component: 'PerformanceExample', operation: 'step3' },
      { executionTime: `${Date.now() - startTime}ms` }
    );
  }

  private generateCorrelationId(): string {
    return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private mapErrorToHttpStatus(severity: any): HttpStatus {
    switch (severity) {
      case 'CRITICAL':
        return HttpStatus.INTERNAL_SERVER_ERROR;
      case 'HIGH':
        return HttpStatus.BAD_REQUEST;
      case 'MEDIUM':
        return HttpStatus.UNPROCESSABLE_ENTITY;
      case 'LOW':
        return HttpStatus.BAD_REQUEST;
      default:
        return HttpStatus.INTERNAL_SERVER_ERROR;
    }
  }
}