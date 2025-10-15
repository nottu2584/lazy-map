import { 
  MapGrid, 
  Dimensions,
  IMapGenerationService,
  IVegetationService,
  IFeatureMixingService,
  MapGenerationSettings as DomainMapSettings,
  BiomeType,
  ForestGenerationOptions,
  SeedService,
  UserId,
  ILogger
} from '@lazy-map/domain';
import { GenerateMapCommand, MapGenerationResult } from '../ports/IMapGenerationPort';
import { IMapPersistencePort } from '../ports';
import { IRandomGeneratorPort, INotificationPort } from '../../common/ports';
import { RandomGeneratorAdapter } from '../../common/adapters';

/**
 * Use case for generating new maps
 */
export class GenerateMapUseCase {
  private readonly seedService = new SeedService();
  
  constructor(
    private readonly mapGenerationService: IMapGenerationService,
    private readonly vegetationGenerationService: IVegetationService,
    private readonly featureMixingService: IFeatureMixingService,
    private readonly mapPersistence: IMapPersistencePort,
    private readonly randomGenerator: IRandomGeneratorPort,
    private readonly notificationPort: INotificationPort,
    private readonly logger: ILogger
  ) {}

  async execute(command: GenerateMapCommand): Promise<MapGenerationResult> {
    const operationLogger = this.logger.child({
      component: 'GenerateMapUseCase',
      operation: 'execute',
      userId: command.userId
    });

    const startTime = Date.now();
    
    try {
      operationLogger.logUseCase('GenerateMapUseCase', 'execute', 'started', {
        metadata: {
          mapName: command.name,
          dimensions: { width: command.width, height: command.height },
          seed: command.seed,
          author: command.author
        }
      });

      // Validate command
      const validationResult = await this.validateCommand(command);
      if (!validationResult.isValid) {
        operationLogger.logUseCase('GenerateMapUseCase', 'execute', 'failed', {
          metadata: {
            reason: 'validation-failed',
            errors: validationResult.errors,
            warnings: validationResult.warnings
          }
        });

        return {
          success: false,
          error: `Validation failed: ${validationResult.errors.join(', ')}`,
          warnings: validationResult.warnings
        };
      }

      // Create dimensions
      const dimensions = new Dimensions(command.width, command.height);
      
      // Create empty map first
      const ownerUserId = command.userId ? UserId.fromString(command.userId) : undefined;
      const map = MapGrid.createEmpty(
        command.name,
        dimensions,
        command.cellSize || 32,
        command.author,
        ownerUserId
      );

      await this.notificationPort.notifyMapGenerationProgress(
        map.id.value,
        0.1,
        'Map structure created',
        5
      );

      // Convert command to domain settings
      const settings = this.commandToDomainSettings(command);
      
      // Ensure we have a deterministic seed
      const deterministicSeed = this.ensureSeed(command);
      settings.seed = deterministicSeed;
      
      // Generate base map with terrain
      const generationResult = await this.mapGenerationService.generateMap(settings);
      
      await this.notificationPort.notifyMapGenerationProgress(
        map.id.value,
        0.4,
        'Terrain generated',
        5
      );

      // Generate forests if requested
      let featuresGenerated = generationResult.featuresGenerated;
      if (command.generateForests && command.forestSettings) {
        const forestCount = await this.generateForests(
          generationResult.map,
          command.forestSettings,
          deterministicSeed
        );
        featuresGenerated += forestCount;
        
        await this.notificationPort.notifyMapGenerationProgress(
          map.id.value,
          0.7,
          'Forests generated',
          5
        );
      }

      // Apply feature mixing
      await this.applyFeatureMixing(generationResult.map);
      
      await this.notificationPort.notifyMapGenerationProgress(
        map.id.value,
        0.9,
        'Features mixed',
        5
      );

      // Save the generated map
      await this.mapPersistence.saveMap(generationResult.map);
      
      const generationTime = Date.now() - startTime;
      
      await this.notificationPort.notifyMapGenerationComplete(
        generationResult.map.id.value,
        generationResult.map.name,
        generationTime,
        featuresGenerated
      );

      const processingTime = Date.now() - startTime;

      operationLogger.logUseCase('GenerateMapUseCase', 'execute', 'completed', {
        metadata: {
          mapId: generationResult.map?.id || 'unknown',
          processingTimeMs: processingTime,
          featuresGenerated,
          seed: deterministicSeed
        }
      });

      operationLogger.info('Map generation completed successfully', {
        metadata: {
          mapName: command.name,
          processingTimeMs: processingTime,
          featuresGenerated,
          warnings: generationResult.warnings?.length || 0
        }
      });

      return {
        success: true,
        map: generationResult.map,
        generationTime,
        featuresGenerated,
        warnings: generationResult.warnings,
        metadata: {
          seed: deterministicSeed,
          algorithmVersion: '1.0.0',
          generatedAt: new Date().toISOString(),
          parameters: {
            dimensions: { width: command.width, height: command.height },
            cellSize: command.cellSize || 32,
            terrainDistribution: command.terrainDistribution || {
              grassland: 0.4,
              forest: 0.3,
              mountain: 0.2,
              water: 0.1
            },
            elevationSettings: {
              variance: command.elevationVariance ?? 0.3,
              multiplier: command.elevationMultiplier ?? 1.0,
              addHeightNoise: command.addHeightNoise ?? false,
              heightVariance: command.heightVariance ?? 0.2
            },
            featureFlags: {
              generateRivers: command.generateRivers ?? false,
              generateRoads: command.generateRoads ?? false,
              generateBuildings: command.generateBuildings ?? false,
              generateForests: command.generateForests ?? true
            },
            biomeType: command.biomeType || 'temperate'
          }
        }
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      const processingTime = Date.now() - startTime;

      operationLogger.logUseCase('GenerateMapUseCase', 'execute', 'failed', {
        metadata: {
          processingTimeMs: processingTime,
          errorMessage,
          mapName: command.name
        }
      });

      operationLogger.logError(error, {
        metadata: {
          command: {
            name: command.name,
            dimensions: { width: command.width, height: command.height },
            seed: command.seed
          }
        }
      });
      
      await this.notificationPort.notifyError(
        'Map Generation Failed',
        errorMessage,
        { command, timestamp: new Date() }
      );

      return {
        success: false,
        error: errorMessage,
        generationTime: Date.now() - startTime
      };
    }
  }

  /**
   * Ensures we always have a deterministic seed based on map parameters
   * This prevents non-reproducible map generation
   */
  private ensureSeed(command: GenerateMapCommand): number {
    // If explicit seed is provided, validate and use it
    if (command.seed !== undefined && command.seed !== null) {
      const validation = this.seedService.validateSeedInput(command.seed);
      if (validation.isValid && validation.seed) {
        return validation.seed.getValue();
      }
    }

    // Generate deterministic seed from map parameters
    // This ensures identical parameters always produce identical maps
    const seedInput = this.createSeedInputFromParameters(command);
    const deterministicSeed = this.seedService.generateSeed(seedInput);
    
    // Log the deterministic seed generation for audit trail
    this.logger.debug('Deterministic seed generated for map', {
      component: 'GenerateMapUseCase',
      operation: 'ensureDeterministicSeed',
      metadata: {
        mapName: command.name,
        generatedSeed: deterministicSeed.getValue(),
        seedInput: seedInput.substring(0, 100) + '...' // Truncate for logging
      }
    });
    
    return deterministicSeed.getValue();
  }

  /**
   * Creates a deterministic string from map parameters for seed generation
   */
  private createSeedInputFromParameters(command: GenerateMapCommand): string {
    const params = {
      name: command.name?.trim() || 'unnamed',
      dimensions: `${command.width}x${command.height}`,
      cellSize: command.cellSize || 32,
      terrain: JSON.stringify(command.terrainDistribution || {}),
      elevation: `${command.elevationVariance}_${command.elevationMultiplier}_${command.addHeightNoise}_${command.heightVariance}`,
      features: `${command.generateForests}_${command.generateRivers}_${command.generateRoads}_${command.generateBuildings}`,
      biome: command.biomeType || 'temperate',
      forest: command.forestSettings ? JSON.stringify(command.forestSettings) : 'none'
    };

    // Create deterministic string that changes when parameters change
    return `map:${params.name}:${params.dimensions}:${params.cellSize}:${params.terrain}:${params.elevation}:${params.features}:${params.biome}:${params.forest}`;
  }

  private async validateCommand(command: GenerateMapCommand): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic validation
    if (!command.name || command.name.trim().length === 0) {
      errors.push('Map name is required');
    }

    if (command.width <= 0 || command.height <= 0) {
      errors.push('Map dimensions must be positive');
    }

    if (command.width > 1000 || command.height > 1000) {
      warnings.push('Large maps may take significant time to generate');
    }

    if (command.cellSize && command.cellSize <= 0) {
      errors.push('Cell size must be positive');
    }

    // Forest settings validation
    if (command.generateForests && command.forestSettings) {
      const forestSettings = command.forestSettings;
      
      if (forestSettings.forestDensity && 
          (forestSettings.forestDensity < 0 || forestSettings.forestDensity > 1)) {
        errors.push('Forest density must be between 0 and 1');
      }

      if (forestSettings.treeDensity && 
          (forestSettings.treeDensity < 0 || forestSettings.treeDensity > 1)) {
        errors.push('Tree density must be between 0 and 1');
      }

      if (forestSettings.treeClumping && 
          (forestSettings.treeClumping < 0 || forestSettings.treeClumping > 1)) {
        errors.push('Tree clumping must be between 0 and 1');
      }
    }

    // Terrain distribution validation
    if (command.terrainDistribution) {
      const total = Object.values(command.terrainDistribution).reduce((sum: number, val) => sum + (val as number), 0);
      if (Math.abs(total - 1.0) > 0.01) {
        warnings.push('Terrain distribution should sum to 1.0');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  private commandToDomainSettings(command: GenerateMapCommand): DomainMapSettings {
    return {
      dimensions: new Dimensions(command.width, command.height),
      cellSize: command.cellSize || 32,
      seed: command.seed,
      terrainDistribution: command.terrainDistribution || {},
      elevationVariance: command.elevationVariance || 0.3,
      elevationMultiplier: command.elevationMultiplier || 1.0,
      addHeightNoise: command.addHeightNoise || false,
      heightVariance: command.heightVariance || 0.2,
      inclinationChance: command.inclinationChance || 0.3,
      generateRivers: command.generateRivers || false,
      generateRoads: command.generateRoads || false,
      generateBuildings: command.generateBuildings || false,
      biomeType: command.biomeType || 'temperate'
    };
  }

  private async generateForests(
    map: MapGrid,
    forestSettings: NonNullable<GenerateMapCommand['forestSettings']>,
    seed?: number
  ): Promise<number> {
    let forestCount = 0;
    const seededRng = this.randomGenerator.createSeeded(seed);
    const randomGen = new RandomGeneratorAdapter(seededRng);

    // Convert forest settings to enhanced format
    const enhancedSettings: ForestGenerationOptions = {
      treeDensity: forestSettings.treeDensity || 0.6,
      treeClumping: forestSettings.treeClumping || 0.7,
      allowTreeOverlap: forestSettings.allowTreeOverlap || false,
      enableInosculation: forestSettings.enableInosculation || false,
      preferredTreeSpecies: [],
      
      // Enhanced understory settings
      generateUnderstory: true,
      understoryDensity: 0.4,
      shrubDensity: 0.3,
      fernDensity: 0.2,
      flowerDensity: 0.1,
      mossCoverage: 0.15,
      
      // Diversity settings
      speciesDiversity: 0.7,
      ageVariation: 0.8,
      naturalDisturbance: 0.05,
      
      // Size distribution
      saplingChance: 0.2,
      youngChance: 0.3,
      matureChance: 0.4,
      ancientChance: 0.1,
      
      // Environmental factors
      soilFertility: 0.7,
      moisture: 0.6,
      lightLevel: 1.0,
      
      // Special features
      hasVines: true,
      vineChance: 0.1,
      hasDeadFalls: true,
      clearingChance: 0.02
    };

    // Calculate number of forests to generate
    const forestDensity = forestSettings.forestDensity || 0.3;
    const targetForestCount = Math.floor(map.dimensions.area * forestDensity / 100);
    
    // Generate forests across the map
    for (let i = 0; i < targetForestCount; i++) {
      // Generate random forest area (simplified)
      const forestSize = randomGen.nextInt(5, 15); // 5x5 to 15x15 forest area
      const x = randomGen.nextInt(0, map.dimensions.width - forestSize);
      const y = randomGen.nextInt(0, map.dimensions.height - forestSize);
      
      try {
        const area = new (await import('@lazy-map/domain')).SpatialBounds(
          new (await import('@lazy-map/domain')).Position(x, y),
          new Dimensions(forestSize, forestSize)
        );
        
        // Use vegetation service to generate forest
        const result = await this.vegetationGenerationService.generateEnhancedForest(
          area,
          enhancedSettings,
          BiomeType.TEMPERATE_FOREST, // Default biome
          randomGen
        );
        
        if (result.result.success) {
          // Add forest to map (this would need proper integration with MapGrid)
          forestCount++;
        }
      } catch (error) {
        // Log error but continue generating other forests
        this.logger.warn('Failed to generate forest', {
          component: 'GenerateMapUseCase',
          operation: 'generateForests',
          metadata: {
            forestIndex: i,
            errorMessage: error instanceof Error ? error.message : String(error)
          }
        });
        this.logger.logError(error, {
          component: 'GenerateMapUseCase',
          operation: 'generateForests'
        });
      }
    }
    
    return forestCount;
  }

  private async applyFeatureMixing(_map: MapGrid): Promise<void> {
    // Apply feature mixing logic using the feature mixing service
    // This would blend overlapping features on tiles
  }
}