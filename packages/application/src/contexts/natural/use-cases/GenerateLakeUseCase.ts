import { FeatureArea, IHydrographicGenerationService, IRandomGenerator, Lake, LakeGenerationSettings, LakeSize, Position } from '@lazy-map/domain';

/**
 * Command for generating a lake
 */
export interface GenerateLakeCommand {
  area: FeatureArea;
  settings: LakeGenerationSettings;
  connectToRivers?: boolean;
  seed?: string;
}

/**
 * Result of lake generation
 */
export interface GenerateLakeResult {
  success: boolean;
  lake?: Lake;
  bestFishingSpots: Position[];
  bestSwimmingAreas: Position[];
  bestCampingSpots: Position[];
  warnings: string[];
  error?: string;
}

/**
 * Use case for generating lakes with natural characteristics
 */
export class GenerateLakeUseCase {
  constructor(
    private readonly hydrographicService: IHydrographicGenerationService,
    private readonly randomGenerator: IRandomGenerator
  ) {}

  async execute(command: GenerateLakeCommand): Promise<GenerateLakeResult> {
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

      // Generate the lake
      const lake = await this.hydrographicService.generateLake(
        command.area,
        command.settings,
        this.randomGenerator
      );

      // Generate natural shoreline if not already done
      if (lake.shoreline.length === 0) {
        const shorelinePointCount = this.calculateShorelinePointCount(lake.sizeCategory, command.settings.shorelineComplexity);
        lake.generateNaturalShoreline(shorelinePointCount);
      }

      // Get activity spots
      const bestFishingSpots = lake.getBestFishingSpots();
      const bestSwimmingAreas = lake.getBestSwimmingAreas().map((point: any) => point.position);
      const bestCampingSpots = lake.getCampingSpots().map((point: any) => point.position);

      // Validate the generated lake
      const warnings: string[] = [];
      this.validateGeneratedLake(lake, command.settings, warnings);

      return {
        success: true,
        lake,
        bestFishingSpots,
        bestSwimmingAreas,
        bestCampingSpots,
        warnings,
      };
    } catch (error) {
      return {
        success: false,
        bestFishingSpots: [],
        bestSwimmingAreas: [],
        bestCampingSpots: [],
        warnings: [],
        error: error instanceof Error ? error.message : 'Unknown error occurred during lake generation'
      };
    }
  }

  private validateCommand(command: GenerateLakeCommand): void {
    if (!command.area || !command.area.isValid()) {
      throw new Error('Invalid area provided for lake generation');
    }

    if (!command.settings) {
      throw new Error('Lake generation settings are required');
    }

    // Validate size constraints
    if (command.settings.minSize < 0 || command.settings.maxSize < 0) {
      throw new Error('Lake size constraints must be non-negative');
    }

    if (command.settings.minSize >= command.settings.maxSize) {
      throw new Error('Maximum lake size must be greater than minimum size');
    }

    // Check if area can accommodate minimum lake size
    if (command.area.dimensions.area < command.settings.minSize) {
      throw new Error('Provided area is too small for minimum lake size requirement');
    }

    // Validate shape characteristics
    if (command.settings.irregularity < 0 || command.settings.irregularity > 1) {
      throw new Error('Irregularity must be between 0 and 1');
    }

    // Validate depth characteristics
    if (command.settings.averageDepth < 0 || command.settings.maxDepth < 0) {
      throw new Error('Lake depth values must be non-negative');
    }

    if (command.settings.averageDepth > command.settings.maxDepth) {
      throw new Error('Average depth cannot exceed maximum depth');
    }

    if (command.settings.shallowAreas < 0 || command.settings.shallowAreas > 1) {
      throw new Error('Shallow areas proportion must be between 0 and 1');
    }

    // Validate feature generation settings
    if (command.settings.generateIslands) {
      if (command.settings.islandChance < 0 || command.settings.islandChance > 1) {
        throw new Error('Island chance must be between 0 and 1');
      }
    }

    // Validate shoreline settings
    if (command.settings.shorelineComplexity < 0 || command.settings.shorelineComplexity > 1) {
      throw new Error('Shoreline complexity must be between 0 and 1');
    }

    if (command.settings.accessibilityRatio < 0 || command.settings.accessibilityRatio > 1) {
      throw new Error('Accessibility ratio must be between 0 and 1');
    }
  }

  private calculateShorelinePointCount(sizeCategory: LakeSize, complexity: number): number {
    const basePointCounts = {
      [LakeSize.POND]: 8,
      [LakeSize.SMALL_LAKE]: 12,
      [LakeSize.MEDIUM_LAKE]: 16,
      [LakeSize.LARGE_LAKE]: 24,
      [LakeSize.GREAT_LAKE]: 32
    };

    const baseCount = basePointCounts[sizeCategory];
    const complexityMultiplier = 1 + (complexity * 1.5); // Up to 2.5x more points for high complexity
    
    return Math.round(baseCount * complexityMultiplier);
  }

  private validateGeneratedLake(lake: Lake, settings: LakeGenerationSettings, warnings: string[]): void {
    // Check size requirements
    const actualSize = lake.area.dimensions.area;
    if (actualSize < settings.minSize) {
      warnings.push(`Lake size (${actualSize}) is below minimum requirement (${settings.minSize})`);
    }

    if (actualSize > settings.maxSize) {
      warnings.push(`Lake size (${actualSize}) exceeds maximum limit (${settings.maxSize})`);
    }

    // Check depth requirements
    if (lake.averageDepth < settings.averageDepth * 0.8 || lake.averageDepth > settings.averageDepth * 1.2) {
      warnings.push(`Lake average depth (${lake.averageDepth}) significantly differs from target (${settings.averageDepth})`);
    }

    if (lake.maxDepth < settings.maxDepth * 0.8 || lake.maxDepth > settings.maxDepth * 1.2) {
      warnings.push(`Lake maximum depth (${lake.maxDepth}) significantly differs from target (${settings.maxDepth})`);
    }

    // Check island generation
    if (settings.generateIslands && settings.islandChance > 0.5 && !lake.hasIslands) {
      warnings.push('Lake was expected to have islands but none were generated');
    }

    // Check inlet/outlet generation
    if (settings.generateInlets && !lake.hasInflow) {
      warnings.push('Lake was expected to have inlets but none were generated');
    }

    if (settings.generateOutlets && !lake.hasOutflow) {
      warnings.push('Lake was expected to have outlets but none were generated');
    }

    // Check water quality
    if (!lake.waterQuality.supportsFish && lake.sizeCategory !== LakeSize.POND) {
      warnings.push('Large lake has poor water quality that may not support aquatic life');
    }

    if (!lake.waterQuality.isSafeForSwimming && lake.isNavigable) {
      warnings.push('Navigable lake has water quality unsafe for swimming');
    }

    // Check accessibility
    const accessiblePoints = lake.getAccessibleShorelinePoints();
    const totalPoints = lake.shoreline.length;
    if (totalPoints > 0) {
      const actualAccessibilityRatio = accessiblePoints.length / totalPoints;
      const targetRatio = settings.accessibilityRatio;
      
      if (Math.abs(actualAccessibilityRatio - targetRatio) > 0.2) {
        warnings.push(`Lake accessibility ratio (${actualAccessibilityRatio.toFixed(2)}) differs significantly from target (${targetRatio})`);
      }
    }

    // Check thermal stability consistency
    if (settings.thermalStability && lake.canFreeze) {
      warnings.push('Lake is marked as thermally stable but may still freeze based on its characteristics');
    }

    // Check formation consistency
    if (lake.formation !== settings.formation) {
      warnings.push(`Lake formation type (${lake.formation}) differs from requested type (${settings.formation})`);
    }
  }
}