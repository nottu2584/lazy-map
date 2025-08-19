import { SubTilePosition } from '../../../common/value-objects/Position';

/**
 * Base plant categories for different types of vegetation
 */
export enum PlantCategory {
  TREE = 'tree',
  SHRUB = 'shrub',
  HERBACEOUS = 'herbaceous', // Flowers, grasses, ferns
  MOSS = 'moss',
  VINE = 'vine',
  AQUATIC = 'aquatic'
}

/**
 * Plant growth forms
 */
export enum PlantGrowthForm {
  // Trees
  BROADLEAF_TREE = 'broadleaf_tree',
  CONIFER_TREE = 'conifer_tree',
  PALM_TREE = 'palm_tree',
  
  // Shrubs
  BUSH = 'bush',
  SHRUB = 'shrub',
  BRAMBLE = 'bramble',
  
  // Herbaceous
  GRASS = 'grass',
  WILDFLOWER = 'wildflower',
  FERN = 'fern',
  HERB = 'herb',
  BULB = 'bulb',
  
  // Ground cover
  MOSS = 'moss',
  LICHEN = 'lichen',
  GROUND_COVER = 'ground_cover',
  
  // Vines
  CLIMBING_VINE = 'climbing_vine',
  GROUND_VINE = 'ground_vine',
  
  // Aquatic
  WATER_LILY = 'water_lily',
  REED = 'reed',
  ALGAE = 'algae'
}

/**
 * Plant size categories
 */
export enum PlantSize {
  TINY = 'tiny',        // < 0.1m (mosses, small flowers)
  SMALL = 'small',      // 0.1-0.5m (grass, small flowers)
  MEDIUM = 'medium',    // 0.5-2m (shrubs, large flowers)
  LARGE = 'large',      // 2-10m (small trees, large shrubs)
  HUGE = 'huge',        // 10-30m (mature trees)
  MASSIVE = 'massive'   // > 30m (ancient trees)
}

/**
 * Seasonal behavior patterns
 */
export enum SeasonalBehavior {
  EVERGREEN = 'evergreen',
  DECIDUOUS = 'deciduous',
  ANNUAL = 'annual',
  BIENNIAL = 'biennial',
  PERENNIAL = 'perennial'
}

/**
 * Plant species types
 */
export enum PlantSpecies {
  // Trees
  OAK = 'oak',
  PINE = 'pine',
  BIRCH = 'birch',
  MAPLE = 'maple',
  CEDAR = 'cedar',
  WILLOW = 'willow',
  FRUIT_TREE = 'fruit_tree',
  DEAD_TREE = 'dead_tree',
  
  // Shrubs
  BLUEBERRY_BUSH = 'blueberry_bush',
  ROSE_BUSH = 'rose_bush',
  HAZEL = 'hazel',
  ELDERBERRY = 'elderberry',
  BLACKTHORN = 'blackthorn',
  
  // Flowers
  WILDFLOWER_MIX = 'wildflower_mix',
  DAISY = 'daisy',
  POPPY = 'poppy',
  SUNFLOWER = 'sunflower',
  LAVENDER = 'lavender',
  
  // Grasses
  PRAIRIE_GRASS = 'prairie_grass',
  TALL_GRASS = 'tall_grass',
  MEADOW_GRASS = 'meadow_grass',
  SEDGE = 'sedge',
  
  // Ferns
  BRACKEN_FERN = 'bracken_fern',
  ROYAL_FERN = 'royal_fern',
  MAIDENHAIR_FERN = 'maidenhair_fern',
  
  // Ground cover
  MOSS = 'moss',
  LICHEN = 'lichen',
  CLOVER = 'clover',
  THYME = 'thyme',
  
  // Vines
  IVY = 'ivy',
  GRAPE_VINE = 'grape_vine',
  HONEYSUCKLE = 'honeysuckle'
}

/**
 * Base plant properties
 */
export interface PlantProperties {
  // Growth characteristics
  maxHeight: number;
  maxWidth: number;
  growthRate: number; // 0-1 scale
  
  // Visual properties
  foliageColor: string[];
  flowerColor?: string[];
  bloomingSeason?: string[];
  
  // Ecological properties
  soilPreference: string[];
  lightRequirement: 'full_sun' | 'partial_shade' | 'full_shade';
  waterRequirement: 'low' | 'medium' | 'high';
  hardiness: number; // Cold tolerance
  
  // Special traits
  isEdible?: boolean;
  isMedicinal?: boolean;
  isFragrant?: boolean;
  attractsPollinators?: boolean;
  providesNesting?: boolean;
}

/**
 * Base plant entity for all vegetation types
 */
export abstract class Plant {
  constructor(
    public readonly id: string,
    public readonly species: PlantSpecies,
    public readonly category: PlantCategory,
    public readonly growthForm: PlantGrowthForm,
    public readonly position: SubTilePosition,
    public readonly size: PlantSize,
    public readonly health: number = 1.0,
    public readonly age: number = 1,
    public readonly properties: PlantProperties,
    public readonly customProperties: Record<string, any> = {}
  ) {
    this.validatePlant();
  }

  private validatePlant(): void {
    if (this.health < 0 || this.health > 1) {
      throw new Error('Plant health must be between 0 and 1');
    }
    if (this.age < 0) {
      throw new Error('Plant age cannot be negative');
    }
  }

  /**
   * Get current height based on age and growth properties
   */
  getCurrentHeight(): number {
    const maturityFactor = Math.min(1, this.age / this.getMaturityAge());
    return this.properties.maxHeight * maturityFactor * this.health;
  }

  /**
   * Get current width/spread based on age and growth properties
   */
  getCurrentWidth(): number {
    const maturityFactor = Math.min(1, this.age / this.getMaturityAge());
    return this.properties.maxWidth * maturityFactor * this.health;
  }

  /**
   * Get visual coverage area in tile units
   */
  getCoverageRadius(): number {
    return this.getCurrentWidth() / 2;
  }

  /**
   * Check if plant is flowering (if applicable)
   */
  isFlowering(currentSeason?: string): boolean {
    if (!this.properties.flowerColor || !this.properties.bloomingSeason) {
      return false;
    }
    if (!currentSeason) return true;
    return this.properties.bloomingSeason.includes(currentSeason);
  }

  /**
   * Get age at which plant reaches maturity
   */
  abstract getMaturityAge(): number;

  /**
   * Check if two plants can coexist in the same area
   */
  abstract canCoexistWith(other: Plant): boolean;
}

/**
 * Tree-specific plant implementation
 */
export class TreePlant extends Plant {
  constructor(
    id: string,
    species: PlantSpecies,
    position: SubTilePosition,
    size: PlantSize,
    health: number = 1.0,
    age: number = 1,
    properties: PlantProperties,
    public readonly trunkDiameter: number,
    public readonly canopyDensity: number = 0.7,
    public readonly hasVines: boolean = false,
    customProperties: Record<string, any> = {}
  ) {
    super(id, species, PlantCategory.TREE, PlantGrowthForm.BROADLEAF_TREE, position, size, health, age, properties, customProperties);
  }

  getMaturityAge(): number {
    switch (this.size) {
      case PlantSize.TINY:
      case PlantSize.SMALL: return 10;
      case PlantSize.MEDIUM: return 25;
      case PlantSize.LARGE: return 50;
      case PlantSize.HUGE: return 100;
      case PlantSize.MASSIVE: return 200;
      default: return 25;
    }
  }

  canCoexistWith(other: Plant): boolean {
    if (other.category === PlantCategory.TREE) {
      // Trees compete for space based on canopy
      const distance = this.getDistanceTo(other);
      const minDistance = (this.getCoverageRadius() + other.getCoverageRadius()) * 0.7;
      return distance > minDistance;
    }
    // Trees can coexist with most other plants
    return true;
  }

  private getDistanceTo(other: Plant): number {
    const dx = this.position.tileX + this.position.offsetX - (other.position.tileX + other.position.offsetX);
    const dy = this.position.tileY + this.position.offsetY - (other.position.tileY + other.position.offsetY);
    return Math.sqrt(dx * dx + dy * dy);
  }
}

/**
 * Shrub-specific plant implementation
 */
export class ShrubPlant extends Plant {
  constructor(
    id: string,
    species: PlantSpecies,
    position: SubTilePosition,
    size: PlantSize,
    health: number = 1.0,
    age: number = 1,
    properties: PlantProperties,
    public readonly berryYield?: number,
    customProperties: Record<string, any> = {}
  ) {
    super(id, species, PlantCategory.SHRUB, PlantGrowthForm.SHRUB, position, size, health, age, properties, customProperties);
  }

  getMaturityAge(): number {
    switch (this.size) {
      case PlantSize.TINY:
      case PlantSize.SMALL: return 2;
      case PlantSize.MEDIUM: return 5;
      case PlantSize.LARGE: return 10;
      default: return 5;
    }
  }

  canCoexistWith(other: Plant): boolean {
    if (other.category === PlantCategory.TREE) {
      // Can grow under partial canopy
      return other instanceof TreePlant && other.canopyDensity < 0.8;
    }
    if (other.category === PlantCategory.SHRUB) {
      const distance = this.getDistanceTo(other);
      return distance > (this.getCoverageRadius() + other.getCoverageRadius()) * 0.5;
    }
    return true;
  }

  private getDistanceTo(other: Plant): number {
    const dx = this.position.tileX + this.position.offsetX - (other.position.tileX + other.position.offsetX);
    const dy = this.position.tileY + this.position.offsetY - (other.position.tileY + other.position.offsetY);
    return Math.sqrt(dx * dx + dy * dy);
  }
}

/**
 * Herbaceous plant implementation (flowers, grasses, ferns)
 */
export class HerbaceousPlant extends Plant {
  constructor(
    id: string,
    species: PlantSpecies,
    growthForm: PlantGrowthForm,
    position: SubTilePosition,
    size: PlantSize,
    health: number = 1.0,
    age: number = 1,
    properties: PlantProperties,
    public readonly clusterSize: number = 1, // Number of individual plants in cluster
    customProperties: Record<string, any> = {}
  ) {
    super(id, species, PlantCategory.HERBACEOUS, growthForm, position, size, health, age, properties, customProperties);
  }

  getMaturityAge(): number {
    switch (this.properties.soilPreference.includes('annual') ? 'annual' : 'perennial') {
      case 'annual': return 1;
      default: return 3;
    }
  }

  canCoexistWith(other: Plant): boolean {
    // Most herbaceous plants are very tolerant
    if (other.category === PlantCategory.TREE) {
      // Can grow under light canopy
      return !(other instanceof TreePlant) || other.canopyDensity < 0.9;
    }
    return true;
  }
}

/**
 * Ground cover plant implementation (mosses, lichens)
 */
export class GroundCoverPlant extends Plant {
  constructor(
    id: string,
    species: PlantSpecies,
    position: SubTilePosition,
    health: number = 1.0,
    age: number = 1,
    properties: PlantProperties,
    public readonly coverage: number = 0.5, // How much of the tile area is covered
    customProperties: Record<string, any> = {}
  ) {
    super(id, species, PlantCategory.MOSS, PlantGrowthForm.MOSS, position, PlantSize.TINY, health, age, properties, customProperties);
  }

  getMaturityAge(): number {
    return 2;
  }

  canCoexistWith(other: Plant): boolean {
    // Mosses can grow almost anywhere
    return true;
  }
}