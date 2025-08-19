import {
  BiomeType,
  Dimensions,
  EnhancedForestGenerationSettings,
  FeatureArea,
  Forest,
  Grassland,
  GrasslandGenerationSettings,
  IVegetationGenerationService,
  Position,
  VegetationGenerationResult
} from '@lazy-map/domain';

import {
  IRandomGeneratorPort,
  INotificationPort
} from '../../../ports/output';

/**
 * Command for generating diverse vegetation
 */
export interface GenerateVegetationCommand {
  // Area to generate vegetation in
  area: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  
  // Type of vegetation to generate
  vegetationType: 'forest' | 'grassland' | 'mixed';
  
  // Biome context
  biome: BiomeType;
  
  // Forest-specific settings (if applicable)
  forestSettings?: Partial<EnhancedForestGenerationSettings>;
  
  // Grassland-specific settings (if applicable)
  grasslandSettings?: Partial<GrasslandGenerationSettings>;
  
  // Generation parameters
  seed?: number;
  name?: string;
  
  // Environmental factors
  climate?: {
    temperature: number; // Celsius
    precipitation: number; // mm/year
    humidity: number; // 0-1
    windSpeed: number; // km/h
  };
  
  // Terrain factors
  terrain?: {
    elevation: number; // meters
    slope: number; // degrees
    aspect: 'north' | 'south' | 'east' | 'west' | 'northeast' | 'northwest' | 'southeast' | 'southwest';
    soilType: 'clay' | 'loam' | 'sand' | 'rocky' | 'peat';
  };
}

/**
 * Result of vegetation generation
 */
export interface VegetationOperationResult {
  success: boolean;
  forest?: Forest;
  grassland?: Grassland;
  generationResult?: VegetationGenerationResult;
  error?: string;
  warnings?: string[];
  processingTime?: number;
}

/**
 * Use case for generating enhanced vegetation with diverse plant life
 */
export class GenerateVegetationUseCase {
  constructor(
    private readonly vegetationService: IVegetationGenerationService,
    private readonly randomGeneratorPort: IRandomGeneratorPort,
    private readonly notificationPort: INotificationPort
  ) {}

  async execute(command: GenerateVegetationCommand): Promise<VegetationOperationResult> {
    const startTime = Date.now();
    
    try {
      // Validate command
      const validationResult = this.validateCommand(command);
      if (!validationResult.isValid) {
        return {
          success: false,
          error: `Validation failed: ${validationResult.errors.join(', ')}`,
          warnings: validationResult.warnings
        };
      }

      // Initialize random generator with seed
      const seededRng = this.randomGeneratorPort.createSeeded(command.seed);
      const randomGenerator = new (await import('../../../common/adapters')).RandomGeneratorAdapter(seededRng);

      // Create feature area
      const area = new FeatureArea(
        new Position(command.area.x, command.area.y),
        new Dimensions(command.area.width, command.area.height)
      );

      // Generate vegetation based on type
      let result: VegetationOperationResult;

      switch (command.vegetationType) {
        case 'forest':
          result = await this.generateForest(area, command, randomGenerator);
          break;
          
        case 'grassland':
          result = await this.generateGrassland(area, command, randomGenerator);
          break;
          
        case 'mixed':
          result = await this.generateMixedVegetation(area, command, randomGenerator);
          break;
          
        default:
          return {
            success: false,
            error: `Unknown vegetation type: ${command.vegetationType}`
          };
      }

      // Add processing time
      result.processingTime = Date.now() - startTime;

      // Send notifications
      if (result.success) {
        await this.notificationPort.notifySuccess(
          'Vegetation Generation Complete',
          `Generated ${command.vegetationType} with ${result.generationResult?.generatedPlants || 0} plants`
        );
      }

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      await this.notificationPort.notifyError(
        'Vegetation Generation Failed',
        errorMessage,
        { command, timestamp: new Date() }
      );

      return {
        success: false,
        error: errorMessage,
        processingTime: Date.now() - startTime
      };
    }
  }

  private async generateForest(
    area: FeatureArea,
    command: GenerateVegetationCommand,
    randomGenerator: any
  ): Promise<VegetationOperationResult> {
    // Get default settings and merge with user settings
    const defaultSettings = this.vegetationService.getDefaultForestSettings(command.biome);
    const settings = this.mergeForestSettings(defaultSettings, command.forestSettings || {});

    // Apply environmental modifications
    this.applyEnvironmentalFactors(settings, command);

    // Validate settings
    const validationErrors = this.vegetationService.validateForestSettings(settings);
    if (validationErrors.length > 0) {
      return {
        success: false,
        error: `Forest settings validation failed: ${validationErrors.join(', ')}`
      };
    }

    // Generate forest
    const { forest, result } = await this.vegetationService.generateEnhancedForest(
      area,
      settings,
      command.biome,
      randomGenerator
    );

    return {
      success: result.success,
      forest: result.success ? forest : undefined,
      generationResult: result,
      error: result.error,
      warnings: result.warnings
    };
  }

  private async generateGrassland(
    area: FeatureArea,
    command: GenerateVegetationCommand,
    randomGenerator: any
  ): Promise<VegetationOperationResult> {
    // Get default settings and merge with user settings
    const defaultSettings = this.vegetationService.getDefaultGrasslandSettings(command.biome);
    const settings = this.mergeGrasslandSettings(defaultSettings, command.grasslandSettings || {});

    // Apply environmental modifications
    this.applyEnvironmentalFactorsToGrassland(settings, command);

    // Validate settings
    const validationErrors = this.vegetationService.validateGrasslandSettings(settings);
    if (validationErrors.length > 0) {
      return {
        success: false,
        error: `Grassland settings validation failed: ${validationErrors.join(', ')}`
      };
    }

    // Generate grassland
    const { grassland, result } = await this.vegetationService.generateGrassland(
      area,
      settings,
      command.biome,
      randomGenerator
    );

    return {
      success: result.success,
      grassland: result.success ? grassland : undefined,
      generationResult: result,
      error: result.error,
      warnings: result.warnings
    };
  }

  private async generateMixedVegetation(
    area: FeatureArea,
    command: GenerateVegetationCommand,
    randomGenerator: any
  ): Promise<VegetationOperationResult> {
    // Create patches of different vegetation types
    const forestArea = new FeatureArea(
      area.position,
      new Dimensions(Math.floor(area.dimensions.width * 0.6), area.dimensions.height)
    );

    const grasslandArea = new FeatureArea(
      new Position(area.position.x + forestArea.dimensions.width, area.position.y),
      new Dimensions(area.dimensions.width - forestArea.dimensions.width, area.dimensions.height)
    );

    // Generate both types
    const forestResult = await this.generateForest(forestArea, command, randomGenerator);
    const grasslandResult = await this.generateGrassland(grasslandArea, command, randomGenerator);

    // Generate transition zone
    const transitionPlants = await this.vegetationService.generateTransitionZone(
      new FeatureArea(
        new Position(forestArea.position.x + forestArea.dimensions.width - 2, area.position.y),
        new Dimensions(4, area.dimensions.height)
      ),
      BiomeType.TEMPERATE_FOREST,
      BiomeType.TEMPERATE_GRASSLAND,
      4,
      randomGenerator
    );

    const combinedResult: VegetationGenerationResult = {
      success: forestResult.success && grasslandResult.success,
      generatedPlants: (forestResult.generationResult?.generatedPlants || 0) + 
                      (grasslandResult.generationResult?.generatedPlants || 0) + 
                      transitionPlants.length,
      speciesCount: (forestResult.generationResult?.speciesCount || 0) + 
                   (grasslandResult.generationResult?.speciesCount || 0),
      coveragePercentage: ((forestResult.generationResult?.coveragePercentage || 0) + 
                          (grasslandResult.generationResult?.coveragePercentage || 0)) / 2,
      biodiversityIndex: Math.max(
        forestResult.generationResult?.biodiversityIndex || 0,
        grasslandResult.generationResult?.biodiversityIndex || 0
      ),
      warnings: [
        ...(forestResult.warnings || []),
        ...(grasslandResult.warnings || [])
      ]
    };

    return {
      success: combinedResult.success,
      forest: forestResult.forest,
      grassland: grasslandResult.grassland,
      generationResult: combinedResult,
      warnings: combinedResult.warnings
    };
  }

  private validateCommand(command: GenerateVegetationCommand): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate area
    if (command.area.width <= 0 || command.area.height <= 0) {
      errors.push('Area width and height must be positive');
    }

    if (command.area.width * command.area.height > 10000) {
      warnings.push('Large area generation may take significant time');
    }

    // Validate vegetation type
    if (!['forest', 'grassland', 'mixed'].includes(command.vegetationType)) {
      errors.push('Invalid vegetation type');
    }

    // Validate biome
    if (!Object.values(BiomeType).includes(command.biome)) {
      errors.push('Invalid biome type');
    }

    // Validate climate if provided
    if (command.climate) {
      if (command.climate.temperature < -50 || command.climate.temperature > 60) {
        warnings.push('Extreme temperature may affect vegetation generation');
      }
      if (command.climate.precipitation < 0) {
        errors.push('Precipitation cannot be negative');
      }
    }

    // Validate terrain if provided
    if (command.terrain) {
      if (command.terrain.slope < 0 || command.terrain.slope > 90) {
        errors.push('Slope must be between 0 and 90 degrees');
      }
      if (command.terrain.elevation < 0) {
        errors.push('Elevation cannot be negative');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  private mergeForestSettings(
    defaultSettings: EnhancedForestGenerationSettings,
    userSettings: Partial<EnhancedForestGenerationSettings>
  ): EnhancedForestGenerationSettings {
    return {
      ...defaultSettings,
      ...userSettings
    };
  }

  private mergeGrasslandSettings(
    defaultSettings: GrasslandGenerationSettings,
    userSettings: Partial<GrasslandGenerationSettings>
  ): GrasslandGenerationSettings {
    return {
      ...defaultSettings,
      ...userSettings
    };
  }

  private applyEnvironmentalFactors(
    settings: EnhancedForestGenerationSettings,
    command: GenerateVegetationCommand
  ): void {
    if (command.climate) {
      // Modify settings based on climate
      if (command.climate.precipitation < 500) {
        settings.treeDensity *= 0.7; // Reduce density in dry climates
        settings.moisture *= 0.6;
      }
      
      if (command.climate.temperature < 0) {
        settings.preferredTreeSpecies = settings.preferredTreeSpecies.filter(
          species => ['pine', 'cedar'].some(cold => species.includes(cold))
        );
      }
    }

    if (command.terrain) {
      // Modify settings based on terrain
      if (command.terrain.slope > 30) {
        settings.treeDensity *= 0.8; // Reduce density on steep slopes
        settings.naturalDisturbance *= 1.5; // More disturbance on slopes
      }
      
      if (command.terrain.elevation > 2000) {
        settings.treeDensity *= 0.6; // Reduce density at high elevation
        settings.speciesDiversity *= 0.8; // Less diversity at altitude
      }
    }
  }

  private applyEnvironmentalFactorsToGrassland(
    settings: GrasslandGenerationSettings,
    command: GenerateVegetationCommand
  ): void {
    if (command.climate) {
      // Modify grassland settings based on climate
      if (command.climate.precipitation > 1000) {
        settings.grassDensity *= 1.2; // Higher density in wet climates
        settings.soilMoisture = Math.min(1.0, settings.soilMoisture * 1.3);
      }
      
      if (command.climate.windSpeed > 20) {
        settings.averageHeight *= 0.7; // Plants grow shorter in windy areas
        settings.windExposure = Math.min(1.0, settings.windExposure * 1.2);
      }
    }

    if (command.terrain) {
      // Modify settings based on terrain
      if (command.terrain.soilType === 'sand') {
        settings.grassPercentage *= 1.3;
        settings.wildflowerPercentage *= 0.7;
        settings.drainageQuality = Math.max(0.8, settings.drainageQuality);
      }
      
      if (command.terrain.soilType === 'clay') {
        settings.soilMoisture = Math.min(1.0, settings.soilMoisture * 1.2);
        settings.drainageQuality *= 0.6;
      }
    }
  }
}