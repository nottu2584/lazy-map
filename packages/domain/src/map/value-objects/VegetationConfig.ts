import { ValidationError } from '../../common/errors';

/**
 * Forestry constants based on real-world data
 * Used for realistic tree density calculations
 */
export const ForestryConstants = {
  // Basal area standards (ft²/acre) from US Forest Service
  BASAL_AREA_SPARSE: 50,      // Woodland/savanna
  BASAL_AREA_MODERATE: 100,   // Normal forest
  BASAL_AREA_DENSE: 150,      // Dense old-growth
  BASAL_AREA_MAXIMUM: 200,    // Extreme jungle/thicket

  // Tile and survey measurements
  TILE_SIZE_FT2: 25,           // 5ft × 5ft per tile
  TILES_PER_ACRE: 1742.4,      // 43,560 ft² / 25 ft²

  // Tree measurements
  AVG_TREE_DIAMETER_FT: 1.0,   // 12 inches DBH (diameter at breast height)
  SURVEY_RADIUS_TILES: 3,      // 15 feet radius for basal area survey

  // Density multiplier bounds
  MIN_DENSITY: 0.0,            // No vegetation
  MAX_DENSITY: 2.0,            // Maximum realistic density
  DEFAULT_DENSITY: 1.0,        // Normal/moderate forest
} as const;

/**
 * Configuration for vegetation layer generation
 * Immutable value object following Clean Architecture
 */
export class VegetationConfig {
  private constructor(
    public readonly densityMultiplier: number,
    public readonly targetBasalArea?: number,
    public readonly avgTreeDiameter?: number,
    public readonly forestSurveyRadius?: number
  ) {
    Object.freeze(this);
  }

  /**
   * Create vegetation configuration with validation
   * @param densityMultiplier Controls overall vegetation density (0.0-2.0)
   * @param options Advanced forestry parameters (optional)
   */
  static create(
    densityMultiplier: number = ForestryConstants.DEFAULT_DENSITY,
    options?: {
      targetBasalArea?: number;
      avgTreeDiameter?: number;
      forestSurveyRadius?: number;
    }
  ): VegetationConfig {
    // Validate density multiplier
    if (densityMultiplier < ForestryConstants.MIN_DENSITY) {
      throw new ValidationError(
        'VEGETATION_CONFIG_INVALID_DENSITY_MIN',
        `Density multiplier ${densityMultiplier} is below minimum ${ForestryConstants.MIN_DENSITY}`,
        `Vegetation density must be at least ${ForestryConstants.MIN_DENSITY}`,
        {
          component: 'VegetationConfig',
          operation: 'create',
          metadata: {
            providedValue: densityMultiplier,
            minimumValue: ForestryConstants.MIN_DENSITY,
            maximumValue: ForestryConstants.MAX_DENSITY
          }
        },
        [
          `Use a density multiplier between ${ForestryConstants.MIN_DENSITY} and ${ForestryConstants.MAX_DENSITY}`,
          '0.0 = no vegetation, 1.0 = normal forest, 2.0 = dense jungle'
        ]
      );
    }
    if (densityMultiplier > ForestryConstants.MAX_DENSITY) {
      throw new ValidationError(
        'VEGETATION_CONFIG_INVALID_DENSITY_MAX',
        `Density multiplier ${densityMultiplier} exceeds maximum ${ForestryConstants.MAX_DENSITY}`,
        `Vegetation density cannot exceed ${ForestryConstants.MAX_DENSITY}`,
        {
          component: 'VegetationConfig',
          operation: 'create',
          metadata: {
            providedValue: densityMultiplier,
            minimumValue: ForestryConstants.MIN_DENSITY,
            maximumValue: ForestryConstants.MAX_DENSITY
          }
        },
        [
          `Use a density multiplier between ${ForestryConstants.MIN_DENSITY} and ${ForestryConstants.MAX_DENSITY}`,
          '2.0 represents maximum realistic vegetation density'
        ]
      );
    }

    // Validate optional parameters
    if (options?.targetBasalArea !== undefined && options.targetBasalArea < 0) {
      throw new ValidationError(
        'VEGETATION_CONFIG_INVALID_BASAL_AREA',
        `Target basal area ${options.targetBasalArea} cannot be negative`,
        'Basal area must be a positive value',
        {
          component: 'VegetationConfig',
          operation: 'create',
          metadata: { providedValue: options.targetBasalArea }
        },
        ['Use a basal area value >= 0 ft²/acre', 'Typical values: 50-200 ft²/acre']
      );
    }
    if (options?.avgTreeDiameter !== undefined && options.avgTreeDiameter <= 0) {
      throw new ValidationError(
        'VEGETATION_CONFIG_INVALID_TREE_DIAMETER',
        `Average tree diameter ${options.avgTreeDiameter} must be positive`,
        'Tree diameter must be greater than zero',
        {
          component: 'VegetationConfig',
          operation: 'create',
          metadata: { providedValue: options.avgTreeDiameter }
        },
        ['Use a diameter > 0 feet', 'Default is 1.0 ft (12 inches DBH)']
      );
    }
    if (options?.forestSurveyRadius !== undefined && options.forestSurveyRadius < 1) {
      throw new ValidationError(
        'VEGETATION_CONFIG_INVALID_SURVEY_RADIUS',
        `Forest survey radius ${options.forestSurveyRadius} must be at least 1 tile`,
        'Survey radius must be at least 1 tile',
        {
          component: 'VegetationConfig',
          operation: 'create',
          metadata: { providedValue: options.forestSurveyRadius }
        },
        ['Use a survey radius >= 1 tile', 'Default is 3 tiles (15 feet)']
      );
    }

    return new VegetationConfig(
      densityMultiplier,
      options?.targetBasalArea,
      options?.avgTreeDiameter ?? ForestryConstants.AVG_TREE_DIAMETER_FT,
      options?.forestSurveyRadius ?? ForestryConstants.SURVEY_RADIUS_TILES
    );
  }

  /**
   * Create default configuration (moderate forest)
   */
  static default(): VegetationConfig {
    return VegetationConfig.create();
  }

  /**
   * Calculate target basal area based on density multiplier
   * Interpolates between sparse and maximum basal area
   */
  getTargetBasalArea(): number {
    if (this.targetBasalArea !== undefined) {
      return this.targetBasalArea;
    }

    // Interpolate between sparse and maximum
    const range = ForestryConstants.BASAL_AREA_MAXIMUM - ForestryConstants.BASAL_AREA_SPARSE;
    const normalizedDensity = Math.min(this.densityMultiplier / ForestryConstants.MAX_DENSITY, 1);

    return ForestryConstants.BASAL_AREA_SPARSE + (range * normalizedDensity);
  }

  /**
   * Calculate tree placement probability per tile
   * Based on target basal area and average tree size
   */
  getTreeProbability(): number {
    const targetBasalArea = this.getTargetBasalArea();
    const diameter = this.avgTreeDiameter ?? ForestryConstants.AVG_TREE_DIAMETER_FT;

    // Calculate average tree basal area
    const avgTreeBasalArea = Math.PI * Math.pow(diameter / 2, 2);

    // Trees per acre needed to achieve target basal area
    const treesPerAcre = targetBasalArea / avgTreeBasalArea;

    // Convert to probability per tile
    return treesPerAcre / ForestryConstants.TILES_PER_ACRE;
  }

  /**
   * Get forest coverage percentage (0.0-1.0)
   * How much of the map should be classified as forest patches
   */
  getForestCoverage(): number {
    // Interpolate between 20% and 80% based on density
    const minCoverage = 0.2;
    const maxCoverage = 0.8;
    const normalizedDensity = Math.min(this.densityMultiplier / ForestryConstants.MAX_DENSITY, 1);

    return minCoverage + (maxCoverage - minCoverage) * normalizedDensity;
  }

  /**
   * Get understory (shrub/bush) probability
   * Secondary vegetation density
   */
  getUnderstoryProbability(): number {
    // Base 40% chance, scales up to 80% at maximum density
    return 0.4 * Math.min(this.densityMultiplier, 2.0);
  }

  /**
   * Get ground cover density (0.0-1.0)
   * Grass, moss, ferns
   */
  getGroundCoverDensity(): number {
    // Base 80% coverage, scales with density
    return 0.8 * Math.min(this.densityMultiplier, 1.5);
  }

  /**
   * Classify basal area measurement into density category
   * @param basalAreaPerAcre Measured basal area in ft²/acre
   */
  static classifyDensity(basalAreaPerAcre: number): 'none' | 'sparse' | 'moderate' | 'dense' {
    if (basalAreaPerAcre >= ForestryConstants.BASAL_AREA_DENSE) {
      return 'dense';
    }
    if (basalAreaPerAcre >= ForestryConstants.BASAL_AREA_MODERATE) {
      return 'moderate';
    }
    if (basalAreaPerAcre >= ForestryConstants.BASAL_AREA_SPARSE) {
      return 'sparse';
    }
    return 'none';
  }

  /**
   * Check equality
   */
  equals(other: VegetationConfig): boolean {
    return (
      this.densityMultiplier === other.densityMultiplier &&
      this.targetBasalArea === other.targetBasalArea &&
      this.avgTreeDiameter === other.avgTreeDiameter &&
      this.forestSurveyRadius === other.forestSurveyRadius
    );
  }

  /**
   * Create a string representation for debugging
   */
  toString(): string {
    return `VegetationConfig(density=${this.densityMultiplier}, ` +
           `basalArea=${this.getTargetBasalArea().toFixed(1)} ft²/acre, ` +
           `treeProbability=${(this.getTreeProbability() * 100).toFixed(1)}%)`;
  }
}
