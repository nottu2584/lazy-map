import { ValidationError } from '../../common/errors';

/**
 * Topography constants for terrain generation
 * Used for noise-based elevation and relief calculations
 */
export const TopographyConstants = {
  // Noise generation bounds
  MIN_OCTAVES: 2,
  MAX_OCTAVES: 6,
  DEFAULT_OCTAVES: 4,

  MIN_PERSISTENCE: 0.4,
  MAX_PERSISTENCE: 0.8,
  DEFAULT_PERSISTENCE: 0.6,

  // Relief multiplier bounds (percentage of map size used as elevation range)
  MIN_RELIEF: 0.2,
  MAX_RELIEF: 0.8,
  DEFAULT_RELIEF: 0.4,

  // Noise scale (fixed - scale-adaptive by map size)
  NOISE_SCALE: 0.02,

  // Multiplier bounds
  MIN_RUGGEDNESS: 0.5,
  MAX_RUGGEDNESS: 2.0,
  DEFAULT_RUGGEDNESS: 1.0,

  MIN_VARIANCE: 0.5,
  MAX_VARIANCE: 2.0,
  DEFAULT_VARIANCE: 1.0,
} as const;

/**
 * Configuration for topography layer generation
 * Immutable value object following Clean Architecture
 */
export class TopographyConfig {
  private constructor(
    public readonly terrainRuggedness: number,
    public readonly elevationVariance: number
  ) {
    Object.freeze(this);
  }

  /**
   * Create topography configuration with validation
   * @param terrainRuggedness Controls terrain detail and roughness (0.5-2.0)
   * @param elevationVariance Controls how mountainous the terrain is (0.5-2.0)
   */
  static create(
    terrainRuggedness: number = TopographyConstants.DEFAULT_RUGGEDNESS,
    elevationVariance: number = TopographyConstants.DEFAULT_VARIANCE
  ): TopographyConfig {
    // Validate terrain ruggedness
    if (terrainRuggedness < TopographyConstants.MIN_RUGGEDNESS) {
      throw new ValidationError(
        'TOPOGRAPHY_CONFIG_INVALID_RUGGEDNESS_MIN',
        `Terrain ruggedness ${terrainRuggedness} is below minimum ${TopographyConstants.MIN_RUGGEDNESS}`,
        `Terrain ruggedness must be at least ${TopographyConstants.MIN_RUGGEDNESS}`,
        {
          component: 'TopographyConfig',
          operation: 'create',
          metadata: {
            providedValue: terrainRuggedness,
            minimumValue: TopographyConstants.MIN_RUGGEDNESS,
            maximumValue: TopographyConstants.MAX_RUGGEDNESS
          }
        },
        [
          `Use a ruggedness multiplier between ${TopographyConstants.MIN_RUGGEDNESS} and ${TopographyConstants.MAX_RUGGEDNESS}`,
          '0.5 = smooth terrain, 1.0 = moderate, 2.0 = extremely broken'
        ]
      );
    }
    if (terrainRuggedness > TopographyConstants.MAX_RUGGEDNESS) {
      throw new ValidationError(
        'TOPOGRAPHY_CONFIG_INVALID_RUGGEDNESS_MAX',
        `Terrain ruggedness ${terrainRuggedness} exceeds maximum ${TopographyConstants.MAX_RUGGEDNESS}`,
        `Terrain ruggedness cannot exceed ${TopographyConstants.MAX_RUGGEDNESS}`,
        {
          component: 'TopographyConfig',
          operation: 'create',
          metadata: {
            providedValue: terrainRuggedness,
            minimumValue: TopographyConstants.MIN_RUGGEDNESS,
            maximumValue: TopographyConstants.MAX_RUGGEDNESS
          }
        },
        [
          `Use a ruggedness multiplier between ${TopographyConstants.MIN_RUGGEDNESS} and ${TopographyConstants.MAX_RUGGEDNESS}`,
          '2.0 represents maximum terrain roughness and detail'
        ]
      );
    }

    // Validate elevation variance
    if (elevationVariance < TopographyConstants.MIN_VARIANCE) {
      throw new ValidationError(
        'TOPOGRAPHY_CONFIG_INVALID_VARIANCE_MIN',
        `Elevation variance ${elevationVariance} is below minimum ${TopographyConstants.MIN_VARIANCE}`,
        `Elevation variance must be at least ${TopographyConstants.MIN_VARIANCE}`,
        {
          component: 'TopographyConfig',
          operation: 'create',
          metadata: {
            providedValue: elevationVariance,
            minimumValue: TopographyConstants.MIN_VARIANCE,
            maximumValue: TopographyConstants.MAX_VARIANCE
          }
        },
        [
          `Use a variance multiplier between ${TopographyConstants.MIN_VARIANCE} and ${TopographyConstants.MAX_VARIANCE}`,
          '0.5 = flat terrain, 1.0 = moderate hills, 2.0 = mountainous'
        ]
      );
    }
    if (elevationVariance > TopographyConstants.MAX_VARIANCE) {
      throw new ValidationError(
        'TOPOGRAPHY_CONFIG_INVALID_VARIANCE_MAX',
        `Elevation variance ${elevationVariance} exceeds maximum ${TopographyConstants.MAX_VARIANCE}`,
        `Elevation variance cannot exceed ${TopographyConstants.MAX_VARIANCE}`,
        {
          component: 'TopographyConfig',
          operation: 'create',
          metadata: {
            providedValue: elevationVariance,
            minimumValue: TopographyConstants.MIN_VARIANCE,
            maximumValue: TopographyConstants.MAX_VARIANCE
          }
        },
        [
          `Use a variance multiplier between ${TopographyConstants.MIN_VARIANCE} and ${TopographyConstants.MAX_VARIANCE}`,
          '2.0 represents maximum elevation variance (mountainous terrain)'
        ]
      );
    }

    return new TopographyConfig(terrainRuggedness, elevationVariance);
  }

  /**
   * Create default configuration (moderate terrain)
   */
  static default(): TopographyConfig {
    return TopographyConfig.create();
  }

  /**
   * Calculate noise octaves based on ruggedness
   * Piecewise linear: 0.5 → 2 octaves, 1.0 → 4 octaves, 2.0 → 6 octaves
   * More octaves = more terrain detail and roughness
   */
  getNoiseOctaves(): number {
    if (this.terrainRuggedness <= TopographyConstants.DEFAULT_RUGGEDNESS) {
      // Interpolate from MIN to DEFAULT
      const t = (this.terrainRuggedness - TopographyConstants.MIN_RUGGEDNESS) /
                (TopographyConstants.DEFAULT_RUGGEDNESS - TopographyConstants.MIN_RUGGEDNESS);
      const value = TopographyConstants.MIN_OCTAVES +
                    t * (TopographyConstants.DEFAULT_OCTAVES - TopographyConstants.MIN_OCTAVES);
      return Math.round(value);
    } else {
      // Interpolate from DEFAULT to MAX
      const t = (this.terrainRuggedness - TopographyConstants.DEFAULT_RUGGEDNESS) /
                (TopographyConstants.MAX_RUGGEDNESS - TopographyConstants.DEFAULT_RUGGEDNESS);
      const value = TopographyConstants.DEFAULT_OCTAVES +
                    t * (TopographyConstants.MAX_OCTAVES - TopographyConstants.DEFAULT_OCTAVES);
      return Math.round(value);
    }
  }

  /**
   * Calculate noise persistence based on ruggedness
   * Piecewise linear: 0.5 → 0.4, 1.0 → 0.6, 2.0 → 0.8
   * Higher persistence = more pronounced features vs. fine detail
   */
  getNoisePersistence(): number {
    if (this.terrainRuggedness <= TopographyConstants.DEFAULT_RUGGEDNESS) {
      // Interpolate from MIN to DEFAULT
      const t = (this.terrainRuggedness - TopographyConstants.MIN_RUGGEDNESS) /
                (TopographyConstants.DEFAULT_RUGGEDNESS - TopographyConstants.MIN_RUGGEDNESS);
      return TopographyConstants.MIN_PERSISTENCE +
             t * (TopographyConstants.DEFAULT_PERSISTENCE - TopographyConstants.MIN_PERSISTENCE);
    } else {
      // Interpolate from DEFAULT to MAX
      const t = (this.terrainRuggedness - TopographyConstants.DEFAULT_RUGGEDNESS) /
                (TopographyConstants.MAX_RUGGEDNESS - TopographyConstants.DEFAULT_RUGGEDNESS);
      return TopographyConstants.DEFAULT_PERSISTENCE +
             t * (TopographyConstants.MAX_PERSISTENCE - TopographyConstants.DEFAULT_PERSISTENCE);
    }
  }

  /**
   * Get noise scale (currently fixed, scale-adaptive by map size)
   * Controls the frequency of terrain features
   */
  getNoiseScale(): number {
    return TopographyConstants.NOISE_SCALE;
  }

  /**
   * Calculate relief multiplier based on variance
   * Piecewise linear: 0.5 → 0.2, 1.0 → 0.4, 2.0 → 0.8
   * This is the percentage of map size used as elevation range
   * Example: 50x50 map (250ft) with variance 1.0 = 100ft elevation range
   */
  getReliefMultiplier(): number {
    if (this.elevationVariance <= TopographyConstants.DEFAULT_VARIANCE) {
      // Interpolate from MIN to DEFAULT
      const t = (this.elevationVariance - TopographyConstants.MIN_VARIANCE) /
                (TopographyConstants.DEFAULT_VARIANCE - TopographyConstants.MIN_VARIANCE);
      return TopographyConstants.MIN_RELIEF +
             t * (TopographyConstants.DEFAULT_RELIEF - TopographyConstants.MIN_RELIEF);
    } else {
      // Interpolate from DEFAULT to MAX
      const t = (this.elevationVariance - TopographyConstants.DEFAULT_VARIANCE) /
                (TopographyConstants.MAX_VARIANCE - TopographyConstants.DEFAULT_VARIANCE);
      return TopographyConstants.DEFAULT_RELIEF +
             t * (TopographyConstants.MAX_RELIEF - TopographyConstants.DEFAULT_RELIEF);
    }
  }

  /**
   * Calculate zone multiplier adjustment
   * Scales the ElevationZone base multipliers (LOWLAND: 0.3, FOOTHILLS: 0.6, etc.)
   * proportionally based on variance
   */
  getZoneMultiplierAdjustment(): number {
    return this.elevationVariance;
  }

  /**
   * Check equality
   */
  equals(other: TopographyConfig): boolean {
    return (
      this.terrainRuggedness === other.terrainRuggedness &&
      this.elevationVariance === other.elevationVariance
    );
  }

  /**
   * Create a string representation for debugging
   */
  toString(): string {
    return `TopographyConfig(ruggedness=${this.terrainRuggedness}, ` +
           `variance=${this.elevationVariance}, ` +
           `octaves=${this.getNoiseOctaves()}, ` +
           `persistence=${this.getNoisePersistence().toFixed(2)}, ` +
           `relief=${this.getReliefMultiplier().toFixed(2)})`;
  }
}
