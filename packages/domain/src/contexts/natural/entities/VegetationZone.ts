import { MapFeature, FeatureCategory } from '../../../common/entities/MapFeature';
import { FeatureId } from '../../../common/value-objects/FeatureId';
import { SpatialBounds } from '../../../common/value-objects/SpatialBounds';
import { PlantSpecies } from './plant/value-objects/PlantSpecies';

/**
 * Types of vegetation zones
 */
export enum VegetationZoneType {
  FOREST = 'forest',
  MEADOW = 'meadow',
  SHRUBLAND = 'shrubland',
  WETLAND_VEGETATION = 'wetland_vegetation',
  ALPINE_MEADOW = 'alpine_meadow',
  GRASSLAND = 'grassland'
}

/**
 * Properties for vegetation zones
 */
export interface VegetationProperties {
  dominantSpecies: PlantSpecies[];
  density: number; // 0-1 scale
  averageHeight: number; // meters
  canopyCoverage: number; // 0-1 scale
  seasonalVariation: boolean;
  ageClass: 'young' | 'mature' | 'old_growth' | 'mixed';
}

/**
 * Represents a generated plant instance (not stored, generated on-demand)
 */
export interface PlantInstance {
  species: PlantSpecies;
  x: number; // World position
  y: number; // World position
  age: number; // Years
  height: number; // Meters
  health: number; // 0-1
  category: 'tree' | 'shrub' | 'herb' | 'grass' | 'moss';
  // Tree-specific
  trunkDiameter?: number;
  canopyRadius?: number;
  // Shrub-specific
  stemCount?: number;
  // Ground cover specific
  coverage?: number;
}

/**
 * Configuration for plant generation within a zone
 */
export interface PlantDistribution {
  species: PlantSpecies[];
  density: number; // Plants per tile
  minSpacing: number; // Minimum distance between plants
  sizeVariation: number; // 0-1, how much size varies
  ageRange: [number, number]; // Min and max age
}

/**
 * Base class for vegetation zones
 * Represents an area of similar vegetation that can generate individual plants on-demand
 */
export abstract class VegetationZone extends MapFeature {
  constructor(
    id: FeatureId,
    name: string,
    area: SpatialBounds,
    public readonly vegetationType: VegetationZoneType,
    public readonly vegetationProperties: VegetationProperties,
    priority: number = 3
  ) {
    super(id, name, FeatureCategory.NATURAL, area, priority);
    this.validateVegetationProperties();
  }

  private validateVegetationProperties(): void {
    if (this.vegetationProperties.density < 0 || this.vegetationProperties.density > 1) {
      throw new Error('Vegetation density must be between 0 and 1');
    }
    if (this.vegetationProperties.canopyCoverage < 0 || this.vegetationProperties.canopyCoverage > 1) {
      throw new Error('Canopy coverage must be between 0 and 1');
    }
    if (this.vegetationProperties.averageHeight < 0) {
      throw new Error('Average height cannot be negative');
    }
  }

  getType(): string {
    return this.vegetationType;
  }

  /**
   * Generate plants for a specific tile within this zone
   * This is deterministic - same inputs always produce same outputs
   */
  abstract generatePlantsForTile(
    tileX: number,
    tileY: number,
    seed: number,
    environmentalFactors?: {
      moisture?: number;
      elevation?: number;
      slope?: number;
      isEdge?: boolean;
    }
  ): PlantInstance[];

  /**
   * Get the plant distribution configuration for this zone
   */
  protected abstract getPlantDistributions(): {
    trees?: PlantDistribution;
    shrubs?: PlantDistribution;
    herbaceous?: PlantDistribution;
    groundCover?: PlantDistribution;
  };

  /**
   * Check if this vegetation zone can mix with another feature
   */

  /**
   * Helper: Create a deterministic random number generator
   */
  protected createSeededRandom(seed: number): () => number {
    let value = seed;
    return () => {
      value = (value * 1664525 + 1013904223) % 2147483647;
      return value / 2147483647;
    };
  }

  /**
   * Helper: Hash multiple values into a seed
   */
  protected hashValues(...values: (string | number)[]): number {
    let hash = 0;
    const str = values.join('-');
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Helper: Select species based on weights
   */
  protected selectSpecies(
    species: PlantSpecies[],
    random: () => number
  ): PlantSpecies {
    if (species.length === 0) {
      throw new Error('No species available to select from');
    }
    return species[Math.floor(random() * species.length)];
  }
}
