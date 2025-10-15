import { ILogger } from '@lazy-map/domain';
import { SeedErrors, isLazyMapError } from '@lazy-map/domain';

/**
 * Example use case demonstrating logging system integration
 * Shows how to structure logging in application layer use cases
 */
export class GenerateMapUseCase {
  constructor(private readonly logger: ILogger) {}

  async execute(input: {
    mapName: string;
    dimensions: { width: number; height: number };
    seed?: string | number;
    userId: string;
    correlationId?: string;
  }): Promise<{ mapId: string; processingTime: number }> {
    // Create operation-specific logger with correlation ID and context
    const operationLogger = this.logger
      .withCorrelationId(input.correlationId || this.generateCorrelationId())
      .child({
        component: 'GenerateMapUseCase',
        operation: 'execute',
        userId: input.userId,
        entityId: `map-${Date.now()}`
      });

    const startTime = Date.now();

    try {
      // Log use case start
      operationLogger.logUseCase('GenerateMapUseCase', 'execute', 'started', {
        metadata: {
          mapName: input.mapName,
          dimensions: input.dimensions,
          seedType: typeof input.seed,
          hasCustomSeed: input.seed !== undefined
        }
      });

      // Validate input with detailed logging
      const validatedInput = await this.validateInput(input, operationLogger);

      // Generate seed with error handling
      const processedSeed = await this.processSeed(validatedInput.seed, operationLogger);

      // Generate map phases with progress logging
      const terrain = await this.generateTerrain(validatedInput, processedSeed, operationLogger);
      const features = await this.generateFeatures(terrain, operationLogger);
      const finalMap = await this.finalizeMa(features, operationLogger);

      const processingTime = Date.now() - startTime;

      // Log successful completion with metrics
      operationLogger.logUseCase('GenerateMapUseCase', 'execute', 'completed', {
        metadata: {
          mapId: finalMap.id,
          processingTime: `${processingTime}ms`,
          terrainComplexity: terrain.complexity,
          featureCount: features.length
        }
      });

      operationLogger.info('Map generation completed successfully', {
        metadata: {
          mapId: finalMap.id,
          processingTimeMs: processingTime,
          efficiency: this.calculateEfficiency(processingTime, validatedInput.dimensions)
        }
      });

      return {
        mapId: finalMap.id,
        processingTime
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;

      // Log use case failure with context
      operationLogger.logUseCase('GenerateMapUseCase', 'execute', 'failed', {
        metadata: {
          failurePoint: this.identifyFailurePoint(error),
          processingTimeMs: processingTime,
          inputData: {
            mapName: input.mapName,
            dimensions: input.dimensions
          }
        }
      });

      // Log the structured error
      operationLogger.logError(error, {
        metadata: {
          recoveryAttempts: 0,
          canRetry: this.isRetryableError(error)
        }
      });

      // Re-throw for upper layers to handle
      throw error;
    }
  }

  private async validateInput(
    input: any, 
    logger: ILogger
  ): Promise<{ mapName: string; dimensions: { width: number; height: number }; seed?: string | number }> {
    const validationLogger = logger.child({
      component: 'GenerateMapUseCase',
      operation: 'validateInput'
    });

    validationLogger.debug('Starting input validation');

    // Validate map name
    if (!input.mapName || input.mapName.trim().length === 0) {
      const error = new Error('Map name is required');
      validationLogger.warn('Map name validation failed', {
        metadata: { providedName: input.mapName }
      });
      throw error;
    }

    // Validate dimensions
    if (!input.dimensions || input.dimensions.width <= 0 || input.dimensions.height <= 0) {
      const error = new Error('Invalid map dimensions');
      validationLogger.warn('Dimensions validation failed', {
        metadata: { providedDimensions: input.dimensions }
      });
      throw error;
    }

    // Log validation success
    validationLogger.debug('Input validation completed successfully', {
      metadata: {
        mapName: input.mapName,
        dimensions: input.dimensions,
        hasSeed: input.seed !== undefined
      }
    });

    return {
      mapName: input.mapName.trim(),
      dimensions: input.dimensions,
      seed: input.seed
    };
  }

  private async processSeed(seed: string | number | undefined, logger: ILogger): Promise<number> {
    const seedLogger = logger.child({
      component: 'GenerateMapUseCase',
      operation: 'processSeed'
    });

    try {
      seedLogger.debug('Processing seed input', {
        metadata: {
          seedType: typeof seed,
          hasCustomSeed: seed !== undefined
        }
      });

      let processedSeed: number;

      if (seed === undefined) {
        // Generate random seed
        processedSeed = Math.floor(Math.random() * 1000000);
        seedLogger.info('Generated random seed', {
          metadata: { generatedSeed: processedSeed }
        });
      } else if (typeof seed === 'number') {
        processedSeed = seed;
        seedLogger.debug('Using provided numeric seed', {
          metadata: { providedSeed: seed }
        });
      } else if (typeof seed === 'string') {
        // Convert string to seed using the domain service
        // This would normally call a proper domain service
        if (seed.trim().length === 0) {
          throw SeedErrors.emptyStringInput({
            component: 'GenerateMapUseCase',
            operation: 'processSeed'
          });
        }
        
        processedSeed = this.hashStringToNumber(seed);
        seedLogger.info('Converted string seed to number', {
          metadata: { 
            originalString: seed,
            hashedSeed: processedSeed 
          }
        });
      } else {
        throw new Error(`Invalid seed type: ${typeof seed}`);
      }

      seedLogger.debug('Seed processing completed', {
        metadata: { finalSeed: processedSeed }
      });

      return processedSeed;

    } catch (error) {
      seedLogger.logError(error, {
        metadata: {
          originalSeed: seed,
          seedType: typeof seed
        }
      });
      throw error;
    }
  }

  private async generateTerrain(
    input: { dimensions: { width: number; height: number } },
    seed: number,
    logger: ILogger
  ): Promise<{ id: string; complexity: number }> {
    const terrainLogger = logger.child({
      component: 'TerrainGenerator',
      operation: 'generateTerrain'
    });

    const startTime = Date.now();
    
    terrainLogger.info('Starting terrain generation', {
      metadata: {
        dimensions: input.dimensions,
        seed,
        estimatedComplexity: input.dimensions.width * input.dimensions.height
      }
    });

    // Simulate terrain generation phases
    await this.simulateTerrainPhase('heightmap', terrainLogger);
    await this.simulateTerrainPhase('biomes', terrainLogger);
    await this.simulateTerrainPhase('textures', terrainLogger);

    const generationTime = Date.now() - startTime;
    const complexity = Math.floor((input.dimensions.width * input.dimensions.height) / 1000);

    terrainLogger.info('Terrain generation completed', 
      {
        metadata: {
          generationTimeMs: generationTime,
          complexity,
          efficiency: generationTime / (input.dimensions.width * input.dimensions.height)
        }
      }
    );

    return {
      id: `terrain-${Date.now()}`,
      complexity
    };
  }

  private async generateFeatures(
    terrain: { id: string; complexity: number },
    logger: ILogger
  ): Promise<Array<{ type: string; position: { x: number; y: number } }>> {
    const featureLogger = logger.child({
      component: 'FeatureGenerator',
      operation: 'generateFeatures'
    });

    featureLogger.info('Starting feature generation', {
      metadata: {
        terrainId: terrain.id,
        terrainComplexity: terrain.complexity
      }
    });

    // Generate features based on terrain complexity
    const featureCount = Math.min(terrain.complexity * 2, 50);
    const features = [];

    for (let i = 0; i < featureCount; i++) {
      features.push({
        type: ['forest', 'mountain', 'river', 'village'][i % 4],
        position: { x: Math.random() * 100, y: Math.random() * 100 }
      });
    }

    featureLogger.info('Feature generation completed', {
      metadata: {
        featureCount: features.length,
        featureTypes: features.reduce((acc, f) => {
          acc[f.type] = (acc[f.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      }
    });

    return features;
  }

  private async finalizeMa(
    features: Array<{ type: string; position: { x: number; y: number } }>,
    logger: ILogger
  ): Promise<{ id: string }> {
    const finalizationLogger = logger.child({
      component: 'MapFinalizer',
      operation: 'finalizeMap'
    });

    finalizationLogger.debug('Starting map finalization', {
      metadata: { featureCount: features.length }
    });

    // Simulate finalization steps
    await new Promise(resolve => setTimeout(resolve, 50)); // Validation
    await new Promise(resolve => setTimeout(resolve, 30)); // Optimization
    await new Promise(resolve => setTimeout(resolve, 20)); // Serialization

    const mapId = `map-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    finalizationLogger.info('Map finalization completed', {
      metadata: {
        finalMapId: mapId,
        totalFeatures: features.length
      }
    });

    return { id: mapId };
  }

  private async simulateTerrainPhase(phase: string, logger: ILogger): Promise<void> {
    const phaseLogger = logger.child({
      component: 'TerrainGenerator',
      operation: phase
    });

    const startTime = Date.now();
    phaseLogger.debug(`Starting ${phase} generation`);

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));

    const phaseTime = Date.now() - startTime;
    phaseLogger.debug(`${phase} generation completed`, 
      {}, 
      { processingTimeMs: phaseTime }
    );
  }

  private hashStringToNumber(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private generateCorrelationId(): string {
    return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private calculateEfficiency(processingTime: number, dimensions: { width: number; height: number }): number {
    const cellCount = dimensions.width * dimensions.height;
    return cellCount / processingTime; // cells per millisecond
  }

  private identifyFailurePoint(error: any): string {
    if (isLazyMapError(error)) {
      return error.details.context?.operation || 'unknown';
    }
    return error.constructor.name || 'unknown';
  }

  private isRetryableError(error: any): boolean {
    if (isLazyMapError(error)) {
      // Deterministic errors are generally not retryable
      return error.details.category !== 'DETERMINISTIC';
    }
    // Standard errors might be retryable depending on type
    return !error.message.includes('validation');
  }
}