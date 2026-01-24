import { ValidationError } from '../../common/errors';

/**
 * Hydrology constants for water feature generation
 * Used for stream, spring, and pool placement calculations
 */
export const HydrologyConstants = {
  // Water abundance bounds
  MIN_ABUNDANCE: 0.5,
  MAX_ABUNDANCE: 2.0,
  DEFAULT_ABUNDANCE: 1.0,

  // Spring placement thresholds
  DEFAULT_SPRING_THRESHOLD: 0.8,
  DEFAULT_SLOPE_BONUS: 0.3,

  // Pool formation
  DEFAULT_POOL_THRESHOLD: 0.7,
} as const;

/**
 * Configuration for hydrology layer generation
 * Immutable value object following Clean Architecture
 */
export class HydrologyConfig {
  private constructor(
    public readonly waterAbundance: number
  ) {
    Object.freeze(this);
  }

  /**
   * Create hydrology configuration with validation
   * @param waterAbundance Controls frequency of water features (0.5-2.0)
   */
  static create(
    waterAbundance: number = HydrologyConstants.DEFAULT_ABUNDANCE
  ): HydrologyConfig {
    // Validate water abundance
    if (waterAbundance < HydrologyConstants.MIN_ABUNDANCE) {
      throw new ValidationError(
        'HYDROLOGY_CONFIG_INVALID_ABUNDANCE_MIN',
        `Water abundance ${waterAbundance} is below minimum ${HydrologyConstants.MIN_ABUNDANCE}`,
        `Water abundance must be at least ${HydrologyConstants.MIN_ABUNDANCE}`,
        {
          component: 'HydrologyConfig',
          operation: 'create',
          metadata: {
            providedValue: waterAbundance,
            minimumValue: HydrologyConstants.MIN_ABUNDANCE,
            maximumValue: HydrologyConstants.MAX_ABUNDANCE
          }
        },
        [
          `Use an abundance multiplier between ${HydrologyConstants.MIN_ABUNDANCE} and ${HydrologyConstants.MAX_ABUNDANCE}`,
          '0.5 = dry terrain, 1.0 = moderate water, 2.0 = abundant water features'
        ]
      );
    }
    if (waterAbundance > HydrologyConstants.MAX_ABUNDANCE) {
      throw new ValidationError(
        'HYDROLOGY_CONFIG_INVALID_ABUNDANCE_MAX',
        `Water abundance ${waterAbundance} exceeds maximum ${HydrologyConstants.MAX_ABUNDANCE}`,
        `Water abundance cannot exceed ${HydrologyConstants.MAX_ABUNDANCE}`,
        {
          component: 'HydrologyConfig',
          operation: 'create',
          metadata: {
            providedValue: waterAbundance,
            minimumValue: HydrologyConstants.MIN_ABUNDANCE,
            maximumValue: HydrologyConstants.MAX_ABUNDANCE
          }
        },
        [
          `Use an abundance multiplier between ${HydrologyConstants.MIN_ABUNDANCE} and ${HydrologyConstants.MAX_ABUNDANCE}`,
          '2.0 represents maximum water abundance'
        ]
      );
    }

    return new HydrologyConfig(waterAbundance);
  }

  /**
   * Create default configuration (moderate water features)
   */
  static default(): HydrologyConfig {
    return HydrologyConfig.create();
  }

  /**
   * Get stream formation threshold multiplier
   * INVERSE relationship: lower abundance = higher threshold = fewer streams
   * Formula: 2.0 - abundance (clamped to minimum 0.5×)
   *
   * Examples:
   * - 0.5 → 1.5× threshold (fewer streams)
   * - 1.0 → 1.0× threshold (default)
   * - 2.0 → 0.5× threshold (many streams, clamped)
   */
  getStreamThresholdMultiplier(): number {
    const multiplier = 2.0 - this.waterAbundance;
    return Math.max(0.5, multiplier); // Clamp to prevent too many streams
  }

  /**
   * Get spring placement threshold adjustment
   * Lower threshold = more springs
   * Piecewise linear mapping around default (1.0 → 0.80):
   * - 0.5 → 0.95 threshold (few springs)
   * - 1.0 → 0.80 threshold (default)
   * - 2.0 → 0.65 threshold (many springs)
   */
  getSpringThreshold(): number {
    if (this.waterAbundance <= HydrologyConstants.DEFAULT_ABUNDANCE) {
      // Interpolate from dry (0.95) to default (0.80)
      const t = (this.waterAbundance - HydrologyConstants.MIN_ABUNDANCE) /
                (HydrologyConstants.DEFAULT_ABUNDANCE - HydrologyConstants.MIN_ABUNDANCE);
      return 0.95 - t * (0.95 - HydrologyConstants.DEFAULT_SPRING_THRESHOLD);
    } else {
      // Interpolate from default (0.80) to wet (0.65)
      const t = (this.waterAbundance - HydrologyConstants.DEFAULT_ABUNDANCE) /
                (HydrologyConstants.MAX_ABUNDANCE - HydrologyConstants.DEFAULT_ABUNDANCE);
      return HydrologyConstants.DEFAULT_SPRING_THRESHOLD - t * (HydrologyConstants.DEFAULT_SPRING_THRESHOLD - 0.65);
    }
  }

  /**
   * Get pool formation threshold adjustment
   * Similar to spring threshold, but for standing water
   * Piecewise linear mapping:
   * - 0.5 → 0.85 threshold (few pools)
   * - 1.0 → 0.70 threshold (default)
   * - 2.0 → 0.55 threshold (many pools)
   */
  getPoolThreshold(): number {
    if (this.waterAbundance <= HydrologyConstants.DEFAULT_ABUNDANCE) {
      // Interpolate from dry (0.85) to default (0.70)
      const t = (this.waterAbundance - HydrologyConstants.MIN_ABUNDANCE) /
                (HydrologyConstants.DEFAULT_ABUNDANCE - HydrologyConstants.MIN_ABUNDANCE);
      return 0.85 - t * (0.85 - HydrologyConstants.DEFAULT_POOL_THRESHOLD);
    } else {
      // Interpolate from default (0.70) to wet (0.55)
      const t = (this.waterAbundance - HydrologyConstants.DEFAULT_ABUNDANCE) /
                (HydrologyConstants.MAX_ABUNDANCE - HydrologyConstants.DEFAULT_ABUNDANCE);
      return HydrologyConstants.DEFAULT_POOL_THRESHOLD - t * (HydrologyConstants.DEFAULT_POOL_THRESHOLD - 0.55);
    }
  }

  /**
   * Get spring frequency bonus on slopes
   * Direct multiplier on slope bonus
   * - 0.5 → 0.15 bonus (reduced spring frequency on slopes)
   * - 1.0 → 0.30 bonus (default)
   * - 2.0 → 0.60 bonus (increased spring frequency on slopes)
   */
  getSlopeSpringBonus(): number {
    return HydrologyConstants.DEFAULT_SLOPE_BONUS * this.waterAbundance;
  }

  /**
   * Check equality
   */
  equals(other: HydrologyConfig): boolean {
    return this.waterAbundance === other.waterAbundance;
  }

  /**
   * Create a string representation for debugging
   */
  toString(): string {
    return `HydrologyConfig(abundance=${this.waterAbundance}, ` +
           `streamThresholdMult=${this.getStreamThresholdMultiplier().toFixed(2)}, ` +
           `springThreshold=${this.getSpringThreshold().toFixed(2)}, ` +
           `poolThreshold=${this.getPoolThreshold().toFixed(2)})`;
  }
}
