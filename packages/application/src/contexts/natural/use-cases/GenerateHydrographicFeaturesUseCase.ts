import { SpatialBounds, HydrographicGenerationResult, HydrographicGenerationSettings, IHydrographyService, IRandomGenerator } from '@lazy-map/domain';

/**
 * Command for generating hydrographic features
 */
export interface GenerateHydrographicFeaturesCommand {
  area: SpatialBounds;
  settings: HydrographicGenerationSettings;
  seed?: string;
}

/**
 * Use case for generating hydrographic features (rivers, lakes, springs, etc.)
 */
export class GenerateHydrographicFeaturesUseCase {
  constructor(
    private readonly hydrographicService: IHydrographyService,
    private readonly randomGenerator: IRandomGenerator
  ) {}

  async execute(command: GenerateHydrographicFeaturesCommand): Promise<HydrographicGenerationResult> {
    try {
      // Set up random generator with seed if provided
      if (command.seed) {
        const seedValue = typeof command.seed === 'string' ? 
          command.seed.split('').reduce((a, b) => a + b.charCodeAt(0), 0) : 
          command.seed;
        this.randomGenerator.seed(seedValue);
      }

      // Validate the area and settings
      this.validateCommand(command);

      // Generate the complete water system
      const result = await this.hydrographicService.generateWaterSystem(
        command.area,
        command.settings,
        this.randomGenerator
      );

      // Additional validation of the generated system
      if (result.success) {
        const systemValidation = this.hydrographicService.validateWaterSystem(
          result.rivers,
          result.lakes,
          result.springs
        );

        if (!systemValidation.isValid) {
          result.warnings.push(...systemValidation.errors.map(error => `System validation: ${error}`));
        }
      }

      return result;
    } catch (error: unknown) {
      return {
        success: false,
        rivers: [],
        lakes: [],
        springs: [],
        ponds: [],
        wetlands: [],
        totalWaterCoverage: 0,
        interconnectionScore: 0,
        biodiversityScore: 0,
        generationTime: 0,
        warnings: [],
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  private validateCommand(command: GenerateHydrographicFeaturesCommand): void {
    if (!command.area || !command.area.isValid()) {
      throw new Error('Invalid area provided for hydrographic generation');
    }

    if (!command.settings) {
      throw new Error('Hydrographic generation settings are required');
    }

    // Validate density settings
    const densitySettings = [
      command.settings.riverDensity,
      command.settings.lakeDensity,
      command.settings.springDensity,
      command.settings.pondDensity,
      command.settings.wetlandDensity
    ];

    densitySettings.forEach((density, index) => {
      if (density < 0 || density > 1) {
        const featureTypes = ['river', 'lake', 'spring', 'pond', 'wetland'];
        throw new Error(`${featureTypes[index]} density must be between 0 and 1`);
      }
    });

    // Validate naturalism level
    if (command.settings.naturalismLevel < 0 || command.settings.naturalismLevel > 1) {
      throw new Error('Naturalism level must be between 0 and 1');
    }
  }
}