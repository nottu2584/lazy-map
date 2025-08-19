import { 
  BiomeType,
  Dimensions,
  EnhancedForestGenerationSettings,
  FeatureArea,
  IVegetationGenerationService,
  PlantSpecies,
  Position
} from '@lazy-map/domain';
import { CreateForestCommand, FeatureOperationResult } from '../../../ports/input';
import { 
  IMapPersistencePort, 
  IRandomGeneratorPort, 
  INotificationPort 
} from '../../../ports/output';
import { RandomGeneratorAdapter } from '../../../common/adapters';

/**
 * Simplified use case for creating forest features using the vegetation service
 */
export class CreateForestUseCase {
  constructor(
    private readonly vegetationService: IVegetationGenerationService,
    private readonly mapPersistence: IMapPersistencePort,
    private readonly randomGeneratorPort: IRandomGeneratorPort,
    private readonly notificationPort: INotificationPort
  ) {}

  async execute(command: CreateForestCommand): Promise<FeatureOperationResult> {
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

      // Create feature area
      const area = new FeatureArea(
        new Position(command.x, command.y),
        new Dimensions(command.width, command.height)
      );

      // Convert command settings to enhanced forest settings
      const forestSettings: EnhancedForestGenerationSettings = {
        treeDensity: command.forestSettings.treeDensity,
        treeClumping: command.forestSettings.treeClumping,
        allowTreeOverlap: command.forestSettings.allowTreeOverlap,
        enableInosculation: command.forestSettings.enableInosculation,
        preferredTreeSpecies: this.convertSpeciesNames(command.forestSettings.preferredSpecies),
        
        // Enhanced understory settings
        generateUnderstory: true,
        understoryDensity: command.forestSettings.underbrushDensity || 0.4,
        shrubDensity: 0.3,
        fernDensity: 0.2,
        flowerDensity: 0.1,
        mossCoverage: 0.15,
        
        // Diversity and natural variation
        speciesDiversity: 0.7,
        ageVariation: 0.8,
        naturalDisturbance: 0.05,
        
        // Size distribution (keeping original if available, otherwise defaults)
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

      // Initialize random generator
      const seededRng = this.randomGeneratorPort.createSeeded(command.seed);
      const randomGenerator = new RandomGeneratorAdapter(seededRng);

      // Determine biome (simplified - could be more sophisticated)
      const biome = this.determineBiome(command.forestSettings.preferredSpecies);

      // Generate forest using vegetation service
      const { forest, result } = await this.vegetationService.generateEnhancedForest(
        area,
        forestSettings,
        biome,
        randomGenerator
      );

      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Forest generation failed'
        };
      }

      // Save forest to persistence  
      const mapId = { value: command.mapId } as any; // Convert string to MapId
      await this.mapPersistence.saveFeature(mapId, forest);

      // Notify success
      await this.notificationPort.notifyFeatureOperation(
        'created',
        'forest',
        command.name,
        command.mapId
      );

      return {
        success: true,
        feature: forest,
        warnings: result.warnings
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      await this.notificationPort.notifyError(
        'Forest Creation Failed',
        errorMessage,
        { command, timestamp: new Date() }
      );

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  private validateCommand(command: CreateForestCommand): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!command.mapId || command.mapId.trim().length === 0) {
      errors.push('Map ID is required');
    }

    if (!command.name || command.name.trim().length === 0) {
      errors.push('Forest name is required');
    }

    if (command.width <= 0 || command.height <= 0) {
      errors.push('Width and height must be positive');
    }

    if (command.forestSettings.treeDensity < 0 || command.forestSettings.treeDensity > 1) {
      errors.push('Tree density must be between 0 and 1');
    }

    if (command.width * command.height > 2500) {
      warnings.push('Large forest area may take significant time to generate');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  private convertSpeciesNames(preferredSpecies: string[]): PlantSpecies[] {
    // Convert string species names to the new PlantSpecies enum values
    const speciesMap: Record<string, PlantSpecies> = {
      'oak': PlantSpecies.OAK,
      'pine': PlantSpecies.PINE, 
      'birch': PlantSpecies.BIRCH,
      'maple': PlantSpecies.MAPLE,
      'cedar': PlantSpecies.CEDAR,
      'willow': PlantSpecies.WILLOW,
      'fruit': PlantSpecies.FRUIT_TREE,
      'dead': PlantSpecies.DEAD_TREE
    };

    return preferredSpecies.map(species => 
      speciesMap[species.toLowerCase()] || PlantSpecies.OAK
    );
  }

  private determineBiome(preferredSpecies: string[]): BiomeType {
    // Simple biome determination based on preferred species
    const hasConifer = preferredSpecies.some(s => ['pine', 'cedar'].includes(s.toLowerCase()));
    const hasBroadleaf = preferredSpecies.some(s => ['oak', 'maple', 'birch'].includes(s.toLowerCase()));

    if (hasConifer && !hasBroadleaf) {
      return BiomeType.BOREAL_FOREST;
    } else if (hasConifer && hasBroadleaf) {
      return BiomeType.TEMPERATE_FOREST;
    } else {
      return BiomeType.TEMPERATE_FOREST; // Default
    }
  }
}