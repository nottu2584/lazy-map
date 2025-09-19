import { SpatialBounds, IHydrographyService, IRandomGenerator, Position, River, RiverGenerationSettings } from '@lazy-map/domain';

/**
 * Command for generating a river
 */
export interface GenerateRiverCommand {
  area: SpatialBounds;
  settings: RiverGenerationSettings;
  source?: Position;
  mouth?: Position;
  seed?: string;
}

/**
 * Result of river generation
 */
export interface GenerateRiverResult {
  success: boolean;
  river?: River;
  tributaries: River[];
  warnings: string[];
  error?: string;
}

/**
 * Use case for generating individual rivers with natural flow patterns
 */
export class GenerateRiverUseCase {
  constructor(
    private readonly hydrographicService: IHydrographyService,
    private readonly randomGenerator: IRandomGenerator
  ) {}

  async execute(command: GenerateRiverCommand): Promise<GenerateRiverResult> {
    try {
      // Set up random generator with seed if provided
      if (command.seed) {
        const seedValue = typeof command.seed === 'string' ? 
          command.seed.split('').reduce((a, b) => a + b.charCodeAt(0), 0) : 
          command.seed;
        this.randomGenerator.seed(seedValue);
      }

      // Validate the command
      this.validateCommand(command);

      // Generate the main river
      const river = await this.hydrographicService.generateRiver(
        command.area,
        command.settings,
        command.source,
        command.mouth,
        this.randomGenerator
      );

      // Generate tributaries if allowed
      let tributaries: River[] = [];
      if (command.settings.allowTributaries && command.settings.maxTributaries > 0) {
        tributaries = await this.hydrographicService.generateTributaries(
          river,
          command.settings,
          command.area,
          this.randomGenerator
        );

        // Connect tributaries to the main river
        for (const tributary of tributaries) {
          river.addTributary(tributary);
        }
      }

      // Validate the generated river system
      const systemValidation = this.hydrographicService.validateWaterSystem([river, ...tributaries], [], []);
      
      const warnings: string[] = [];
      if (!systemValidation.isValid) {
        warnings.push(...systemValidation.errors.map(error => `River validation: ${error}`));
      }

      // Additional river-specific validations
      this.validateGeneratedRiver(river, command.settings, warnings);

      return {
        success: true,
        river,
        tributaries,
        warnings,
      };
    } catch (error: unknown) {
      return {
        success: false,
        tributaries: [],
        warnings: [],
        error: error instanceof Error ? error.message : 'Unknown error occurred during river generation'
      };
    }
  }

  private validateCommand(command: GenerateRiverCommand): void {
    if (!command.area || !command.area.isValid()) {
      throw new Error('Invalid area provided for river generation');
    }

    if (!command.settings) {
      throw new Error('River generation settings are required');
    }

    // Validate length constraints
    if (command.settings.minLength < 0 || command.settings.maxLength < 0) {
      throw new Error('River length constraints must be non-negative');
    }

    if (command.settings.minLength >= command.settings.maxLength) {
      throw new Error('Maximum river length must be greater than minimum length');
    }

    // Validate width settings
    if (command.settings.averageWidth <= 0) {
      throw new Error('Average river width must be positive');
    }

    if (command.settings.widthVariation < 0 || command.settings.widthVariation > 1) {
      throw new Error('Width variation must be between 0 and 1');
    }

    // Validate flow characteristics
    if (command.settings.baseFlowVelocity < 0 || command.settings.baseFlowVelocity > 10) {
      throw new Error('Base flow velocity must be between 0 and 10');
    }

    if (command.settings.meandering < 0 || command.settings.meandering > 1) {
      throw new Error('Meandering must be between 0 and 1');
    }

    // Validate tributary settings
    if (command.settings.allowTributaries) {
      if (command.settings.maxTributaries < 0) {
        throw new Error('Maximum tributaries must be non-negative');
      }

      if (command.settings.tributaryChance < 0 || command.settings.tributaryChance > 1) {
        throw new Error('Tributary chance must be between 0 and 1');
      }
    }

    // Validate source and mouth positions if provided
    if (command.source && !command.area.contains(command.source)) {
      throw new Error('River source must be within the specified area');
    }

    if (command.mouth && !command.area.contains(command.mouth)) {
      throw new Error('River mouth must be within the specified area');
    }

    // Ensure source and mouth are different if both provided
    if (command.source && command.mouth && command.source.equals(command.mouth)) {
      throw new Error('River source and mouth cannot be the same position');
    }
  }

  private validateGeneratedRiver(river: River, settings: RiverGenerationSettings, warnings: string[]): void {
    // Check if river length meets requirements
    if (river.length < settings.minLength) {
      warnings.push(`River length (${river.length}) is below minimum requirement (${settings.minLength})`);
    }

    if (river.length > settings.maxLength) {
      warnings.push(`River length (${river.length}) exceeds maximum limit (${settings.maxLength})`);
    }

    // Check if river has required source/mouth
    if (settings.requireSource && !river.source) {
      warnings.push('River is missing a required source point');
    }

    if (settings.requireMouth && !river.mouth) {
      warnings.push('River is missing a required mouth point');
    }

    // Check tributary constraints
    if (settings.allowTributaries && river.tributaries.length > settings.maxTributaries) {
      warnings.push(`River has ${river.tributaries.length} tributaries, exceeding maximum of ${settings.maxTributaries}`);
    }

    // Check water quality
    if (!river.waterQuality.supportsFish && settings.waterQuality.supportsFish) {
      warnings.push('Generated river water quality does not support fish as expected');
    }

    // Check flow characteristics
    if (river.averageFlowVelocity === 0 && settings.baseFlowVelocity > 0) {
      warnings.push('River has no flow despite expected base flow velocity');
    }
  }
}