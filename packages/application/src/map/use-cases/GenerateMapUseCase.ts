import { 
  GridMap, 
  Dimensions,
  IMapGenerationService,
  IVegetationGenerationService,
  IFeatureMixingService,
  MapGenerationSettings as DomainMapSettings,
  BiomeType,
  EnhancedForestGenerationSettings,
  CoordinatedRandomGenerator,
  SeedUtils
} from '@lazy-map/domain';
import { GenerateMapCommand, MapGenerationResult } from '../ports/IMapGenerationPort';
import { IMapPersistencePort } from '../ports';
import { IRandomGeneratorPort, INotificationPort } from '../../common/ports';
import { RandomGeneratorAdapter } from '../../common/adapters';

/**
 * Use case for generating new maps
 */
export class GenerateMapUseCase {
  constructor(
    private readonly mapGenerationService: IMapGenerationService,
    private readonly vegetationGenerationService: IVegetationGenerationService,
    private readonly featureMixingService: IFeatureMixingService,
    private readonly mapPersistence: IMapPersistencePort,
    private readonly randomGenerator: IRandomGeneratorPort,
    private readonly notificationPort: INotificationPort
  ) {}

  async execute(command: GenerateMapCommand): Promise<MapGenerationResult> {
    const startTime = Date.now();
    
    try {
      // Validate command
      const validationResult = await this.validateCommand(command);
      if (!validationResult.isValid) {
        return {
          success: false,
          error: `Validation failed: ${validationResult.errors.join(', ')}`,
          warnings: validationResult.warnings
        };
      }

      // Create dimensions
      const dimensions = new Dimensions(command.width, command.height);
      
      // Create empty map first
      const map = GridMap.createEmpty(
        command.name,
        dimensions,
        command.cellSize || 32,
        command.author
      );

      await this.notificationPort.notifyMapGenerationProgress(
        map.id.value,
        0.1,
        'Map structure created',
        5
      );

      // Convert command to domain settings
      const settings = this.commandToDomainSettings(command);
      
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
          command.seed
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

      return {
        success: true,
        map: generationResult.map,
        generationTime,
        featuresGenerated,
        warnings: generationResult.warnings
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
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
    map: GridMap,
    forestSettings: NonNullable<GenerateMapCommand['forestSettings']>,
    seed?: number
  ): Promise<number> {
    let forestCount = 0;
    const seededRng = this.randomGenerator.createSeeded(seed);
    const randomGen = new RandomGeneratorAdapter(seededRng);

    // Convert forest settings to enhanced format
    const enhancedSettings: EnhancedForestGenerationSettings = {
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
        const area = new (await import('@lazy-map/domain')).FeatureArea(
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
          // Add forest to map (this would need proper integration with GridMap)
          forestCount++;
        }
      } catch (error) {
        // Log error but continue generating other forests
        console.warn(`Failed to generate forest ${i}:`, error);
      }
    }
    
    return forestCount;
  }

  private async applyFeatureMixing(_map: GridMap): Promise<void> {
    // Apply feature mixing logic using the feature mixing service
    // This would blend overlapping features on tiles
  }
}