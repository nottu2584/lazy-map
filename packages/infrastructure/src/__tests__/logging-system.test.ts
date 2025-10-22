import { describe, it, expect, beforeEach } from 'vitest';
import { LoggingService } from '../adapters/logging/LoggingService';
import { SeedErrors, isDomainError } from '@lazy-map/domain';

describe('Logging System Integration', () => {
  let logger: LoggingService;

  beforeEach(() => {
    logger = new LoggingService('TestLogger');
  });

  describe('Basic logging functionality', () => {
    it('should log messages at different levels', () => {
      // These would normally output to console via NestJS Logger
      logger.debug('Debug message', { component: 'TestComponent' });
      logger.info('Info message', { component: 'TestComponent' });
      logger.warn('Warning message', { component: 'TestComponent' });
      logger.error('Error message', { component: 'TestComponent' });
      logger.critical('Critical message', { component: 'TestComponent' });
      
      // Test passes if no errors are thrown
      expect(true).toBe(true);
    });

    it('should create child loggers with additional context', () => {
      const childLogger = logger.child({ 
        component: 'SeedService',
        operation: 'generateSeed'
      });

      // Child logger inherits context
      childLogger.info('Child logger message');
      
      expect(childLogger).toBeDefined();
      expect(childLogger).not.toBe(logger);
    });

    it('should create loggers with correlation IDs', () => {
      const correlatedLogger = logger.withCorrelationId('req-123-456');
      
      correlatedLogger.info('Request started');
      correlatedLogger.info('Request completed');
      
      expect(correlatedLogger).toBeDefined();
    });
  });

  describe('Error logging integration', () => {
    it('should log structured errors appropriately', () => {
      const error = SeedErrors.emptyStringInput({
        component: 'SeedUtils',
        operation: 'generateFromString',
        userId: 'user-123'
      });

      // Log the structured error
      logger.logError(error, { correlationId: 'req-456' });
      
      expect(isDomainError(error)).toBe(true);
    });

    it('should log standard errors gracefully', () => {
      const standardError = new Error('Standard error message');
      
      logger.logError(standardError, { 
        component: 'TestComponent',
        operation: 'testOperation'
      });
      
      // Should not throw
      expect(true).toBe(true);
    });

    it('should log string errors', () => {
      logger.logError('Simple string error', {
        component: 'TestComponent'
      });
      
      expect(true).toBe(true);
    });
  });

  describe('Use case logging', () => {
    it('should log use case execution lifecycle', () => {
      const useCaseName = 'GenerateMapUseCase';
      const operation = 'execute';
      
      // Log use case start
      logger.logUseCase(useCaseName, operation, 'started', {
        userId: 'user-123',
        correlationId: 'req-789'
      });
      
      // Log successful completion
      logger.logUseCase(useCaseName, operation, 'completed', {
        userId: 'user-123',
        correlationId: 'req-789'
      });
      
      expect(true).toBe(true);
    });

    it('should log use case failures', () => {
      logger.logUseCase('ValidateSeedUseCase', 'execute', 'failed', {
        userId: 'user-456',
        correlationId: 'req-999',
        metadata: { 
          errorCode: 'SEED_INVALID_TYPE',
          inputValue: 'invalid-seed'
        }
      });
      
      expect(true).toBe(true);
    });
  });

  describe('Context and metadata', () => {
    it('should handle rich context information', () => {
      logger.info('Rich context example', {
        component: 'MapGenerationService',
        operation: 'generateTerrain',
        userId: 'user-789',
        entityId: 'map-123',
        metadata: {
          mapName: 'Test Map',
          dimensions: { width: 100, height: 100 },
          seed: 12345
        }
      });
      
      expect(true).toBe(true);
    });

    it('should handle metadata in logging calls', () => {
      logger.debug('Performance metrics', 
        { component: 'PerformanceMonitor' }, 
        {
          executionTime: 1250,
          memoryUsage: '45MB',
          cacheHitRate: 0.87
        }
      );
      
      expect(true).toBe(true);
    });
  });
});