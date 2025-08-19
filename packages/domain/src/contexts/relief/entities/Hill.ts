import { MapFeature, FeatureId, FeatureCategory } from '../../../common/entities/MapFeature';
import { FeatureArea } from '../../../common/value-objects/FeatureArea';

/**
 * Hill-specific feature type
 */
export const HILL_FEATURE_TYPE = 'hill';

/**
 * Hill formation types
 */
export enum HillFormation {
  ISOLATED = 'isolated',
  ROLLING = 'rolling',
  CLUSTERED = 'clustered',
  TERRACED = 'terraced',
}

/**
 * Hill composition types
 */
export enum HillComposition {
  GRASSY = 'grassy',
  ROCKY = 'rocky',
  FORESTED = 'forested',
  BARREN = 'barren',
}

/**
 * Hill entity representing a raised area of land
 * that is lower and less steep than a mountain
 */
export class Hill extends MapFeature {
  constructor(
    id: FeatureId,
    name: string,
    area: FeatureArea,
    public readonly formation: HillFormation,
    public readonly composition: HillComposition,
    public readonly maxElevation: number,
    public readonly steepness: number = 0.4,
    public readonly erosionFactor: number = 0.2,
    priority: number = 2
  ) {
    super(id, name, FeatureCategory.RELIEF, area, priority);
    this.validateElevation(maxElevation);
    this.validateSteepness(steepness);
    this.validateErosionFactor(erosionFactor);
  }

  getType(): string {
    return HILL_FEATURE_TYPE;
  }

  canMixWith(other: MapFeature): boolean {
    // Hills can mix with natural features like forests
    if (other.category === FeatureCategory.NATURAL) {
      return true;
    }
    
    // Hills can mix with cultural features like territories
    if (other.category === FeatureCategory.CULTURAL) {
      return true;
    }
    
    // Hills can sometimes mix with artificial features like roads
    if (other.category === FeatureCategory.ARTIFICIAL) {
      const otherType = other.getType();
      return otherType === 'road' || otherType === 'path';
    }
    
    // Hills cannot mix with other relief features
    return false;
  }

  /**
   * Calculates the movement penalty for traversing this hill
   */
  getMovementPenalty(): number {
    return this.steepness * (1 + this.erosionFactor);
  }

  /**
   * Determines if the hill provides a line of sight advantage
   */
  providesLineOfSightAdvantage(): boolean {
    return this.maxElevation > 50 && this.steepness > 0.3;
  }

  /**
   * Checks if this hill type would typically have a water source
   */
  canHaveWaterSource(): boolean {
    return this.formation === HillFormation.ISOLATED || 
           this.formation === HillFormation.TERRACED;
  }

  /**
   * Gets the elevation profile at a given position
   */
  getElevationProfile(distance: number): number {
    const radius = Math.max(this.area.dimensions.width, this.area.dimensions.height) / 2;
    const normalizedDistance = Math.min(distance / radius, 1);
    
    // Bell curve-like elevation profile
    return this.maxElevation * Math.exp(-Math.pow(normalizedDistance * 2 - 1, 2) / (2 * this.steepness));
  }

  private validateElevation(elevation: number): void {
    if (elevation <= 0) {
      throw new Error('Hill elevation must be positive');
    }
  }

  private validateSteepness(steepness: number): void {
    if (steepness < 0 || steepness > 1) {
      throw new Error('Hill steepness must be between 0 and 1');
    }
  }

  private validateErosionFactor(factor: number): void {
    if (factor < 0 || factor > 1) {
      throw new Error('Erosion factor must be between 0 and 1');
    }
  }
}