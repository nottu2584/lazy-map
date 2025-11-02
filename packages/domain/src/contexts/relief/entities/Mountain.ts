import { MapFeature, FeatureCategory } from '../../../common/entities/MapFeature';
import { FeatureId } from '../../../common/entities/../value-objects';
import { SpatialBounds } from '../../../common/value-objects/SpatialBounds';

/**
 * Mountain-specific feature type
 */
export const MOUNTAIN_FEATURE_TYPE = 'mountain';

/**
 * Mountain types
 */
export enum MountainType {
  ROCKY = 'rocky',
  VOLCANIC = 'volcanic',
  SNOW_CAPPED = 'snow_capped',
  FORESTED = 'forested',
}

/**
 * Height classification for mountains
 */
export enum MountainHeight {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  VERY_HIGH = 'very_high',
}

/**
 * Mountain entity representing a large raised area of land
 */
export class Mountain extends MapFeature {
  constructor(
    id: FeatureId,
    name: string,
    area: SpatialBounds,
    public readonly mountainType: MountainType,
    public readonly heightClassification: MountainHeight,
    public readonly peakElevation: number,
    public readonly hasRidges: boolean = true,
    public readonly ruggednessFactor: number = 0.7,
    priority: number = 3,
  ) {
    super(id, name, FeatureCategory.RELIEF, area, priority);
    this.validateElevation(peakElevation);
    this.validateRuggednessFactor(ruggednessFactor);
  }

  getType(): string {
    return MOUNTAIN_FEATURE_TYPE;
  }


  /**
   * Gets the average slope of the mountain
   */
  getAverageSlope(): number {
    const width = this.area.dimensions.width;
    return this.peakElevation / (width / 2);
  }

  /**
   * Checks if the mountain is passable at a given elevation threshold
   */
  isPassableAt(elevationThreshold: number): boolean {
    return this.peakElevation <= elevationThreshold;
  }

  /**
   * Gets the elevation at a specific point relative to the mountain center
   * Assumes a conical shape with maximum elevation at center
   */
  getElevationAt(distanceFromCenter: number): number {
    const radius = Math.max(this.area.dimensions.width, this.area.dimensions.height) / 2;
    if (distanceFromCenter > radius) {
      return 0;
    }

    return this.peakElevation * (1 - distanceFromCenter / radius);
  }

  private validateElevation(elevation: number): void {
    if (elevation <= 0) {
      throw new Error('Mountain elevation must be positive');
    }
  }

  private validateRuggednessFactor(factor: number): void {
    if (factor < 0 || factor > 1) {
      throw new Error('Ruggedness factor must be between 0 and 1');
    }
  }
}
