import { Position } from '../../common/value-objects/Position';
import { MapFeature } from '../../common/entities/MapFeature';
import { FeatureId } from '../../common/value-objects/FeatureId';
import {
  RockType,
  PermeabilityLevel,
  TerrainFeature
} from '../../contexts/relief/value-objects/GeologicalFormation';
import { MoistureLevel } from '../../contexts/natural/value-objects/MoistureLevel';

/**
 * Tactical cover levels (different from TacticalProperties)
 */
export enum TacticalCoverLevel {
  NONE = 'none',           // No cover
  LIGHT = 'light',         // 1/4 cover (low wall, bushes)
  PARTIAL = 'partial',     // 1/2 cover (trees, boulders)
  HEAVY = 'heavy',         // 3/4 cover (walls, large rocks)
  TOTAL = 'total'          // Full cover (behind building)
}

/**
 * Tactical concealment levels (different from TacticalProperties)
 */
export enum TacticalConcealmentLevel {
  NONE = 'none',           // Open ground
  LIGHT = 'light',         // Tall grass
  MODERATE = 'moderate',   // Bushes, undergrowth
  HEAVY = 'heavy',         // Dense foliage
  TOTAL = 'total'          // Can't be seen
}

// Aliases for backward compatibility
export { TacticalCoverLevel as CoverLevel };
export { TacticalConcealmentLevel as ConcealmentLevel };

// Re-export imported types for convenience
export { MoistureLevel };

/**
 * Aspect directions for slope orientation
 */
export enum AspectDirection {
  NORTH = 'north',
  NORTHEAST = 'northeast',
  EAST = 'east',
  SOUTHEAST = 'southeast',
  SOUTH = 'south',
  SOUTHWEST = 'southwest',
  WEST = 'west',
  NORTHWEST = 'northwest',
  FLAT = 'flat' // No slope
}

/**
 * Vegetation types for tactical maps
 */
export enum VegetationType {
  NONE = 'none',           // Bare ground
  GRASS = 'grass',         // Short grass
  TALL_GRASS = 'tall_grass', // Tall grass (concealment)
  SHRUBS = 'shrubs',       // Bushes (light cover)
  SPARSE_TREES = 'sparse_trees', // Few trees
  DENSE_TREES = 'dense_trees', // Forest (heavy cover)
  UNDERGROWTH = 'undergrowth' // Dense undergrowth
}

/**
 * Represents a single tile (5ft x 5ft) in a tactical battlemap
 * Contains all layer data for complete terrain representation
 */
export class TacticalMapTile {
  // === Layer 0: Geological Foundation ===
  private bedrock: RockType;
  private soilDepth: number; // in feet
  private permeability: PermeabilityLevel;
  private geologicalFeatures: TerrainFeature[];

  // === Layer 1: Topographic Expression ===
  private elevation: number; // feet above base elevation
  private slope: number; // degrees (0-90)
  private aspect: AspectDirection;

  // === Layer 2: Hydrological Flow ===
  private flowAccumulation: number; // upstream contributing area
  private waterDepth: number; // feet of standing/flowing water
  private moisture: MoistureLevel;

  // === Layer 3: Vegetation Growth ===
  private vegetationType: VegetationType;
  private canopyCover: number; // percentage (0-100)

  // === Layer 4: Artificial Structures ===
  private hasStructure: boolean;
  private structureType?: string; // building, road, bridge, etc.

  // === Layer 5: Feature Points ===
  private features: FeatureId[];

  // === Tactical Properties (derived) ===
  private movementCost: number; // multiplier (1 = normal)
  private coverLevel: TacticalCoverLevel;
  private concealment: TacticalConcealmentLevel;

  // === Base Properties ===
  private readonly position: Position;

  constructor(position: Position) {
    this.position = position;

    // Initialize with defaults
    this.bedrock = RockType.GRANITIC;
    this.soilDepth = 2;
    this.permeability = PermeabilityLevel.MODERATE;
    this.geologicalFeatures = [];

    this.elevation = 0;
    this.slope = 0;
    this.aspect = AspectDirection.FLAT;

    this.flowAccumulation = 0;
    this.waterDepth = 0;
    this.moisture = MoistureLevel.MODERATE;

    this.vegetationType = VegetationType.GRASS;
    this.canopyCover = 0;

    this.hasStructure = false;
    this.features = [];

    // Calculate initial tactical properties
    this.movementCost = 1;
    this.coverLevel = TacticalCoverLevel.NONE;
    this.concealment = TacticalConcealmentLevel.NONE;
  }

  // === Geological Methods ===

  setGeology(
    bedrock: RockType,
    soilDepth: number,
    permeability: PermeabilityLevel,
    features: TerrainFeature[]
  ): void {
    this.bedrock = bedrock;
    this.soilDepth = Math.max(0, soilDepth);
    this.permeability = permeability;
    this.geologicalFeatures = features;
    this.updateTacticalProperties();
  }

  getBedrock(): RockType {
    return this.bedrock;
  }

  getSoilDepth(): number {
    return this.soilDepth;
  }

  getPermeability(): PermeabilityLevel {
    return this.permeability;
  }

  getGeologicalFeatures(): TerrainFeature[] {
    return [...this.geologicalFeatures];
  }

  // === Topographic Methods ===

  setTopography(elevation: number, slope: number, aspect: AspectDirection): void {
    this.elevation = elevation;
    this.slope = Math.max(0, Math.min(90, slope));
    this.aspect = aspect;
    this.updateTacticalProperties();
  }

  getElevation(): number {
    return this.elevation;
  }

  getSlope(): number {
    return this.slope;
  }

  getAspect(): AspectDirection {
    return this.aspect;
  }

  // === Hydrological Methods ===

  setHydrology(flowAccumulation: number, waterDepth: number, moisture: MoistureLevel): void {
    this.flowAccumulation = Math.max(0, flowAccumulation);
    this.waterDepth = Math.max(0, waterDepth);
    this.moisture = moisture;
    this.updateTacticalProperties();
  }

  getFlowAccumulation(): number {
    return this.flowAccumulation;
  }

  getWaterDepth(): number {
    return this.waterDepth;
  }

  getMoisture(): MoistureLevel {
    return this.moisture;
  }

  hasWater(): boolean {
    return this.waterDepth > 0;
  }

  // === Vegetation Methods ===

  setVegetation(type: VegetationType, canopyCover: number): void {
    this.vegetationType = type;
    this.canopyCover = Math.max(0, Math.min(100, canopyCover));
    this.updateTacticalProperties();
  }

  getVegetationType(): VegetationType {
    return this.vegetationType;
  }

  getCanopyCover(): number {
    return this.canopyCover;
  }

  // === Structure Methods ===

  setStructure(type: string | null): void {
    if (type) {
      this.hasStructure = true;
      this.structureType = type;
    } else {
      this.hasStructure = false;
      this.structureType = undefined;
    }
    this.updateTacticalProperties();
  }

  getHasStructure(): boolean {
    return this.hasStructure;
  }

  getStructureType(): string | undefined {
    return this.structureType;
  }

  // === Feature Methods ===

  addFeature(featureId: FeatureId): void {
    if (!this.features.some(f => f.value === featureId.value)) {
      this.features.push(featureId);
    }
  }

  removeFeature(featureId: FeatureId): void {
    this.features = this.features.filter(f => f.value !== featureId.value);
  }

  getFeatures(): FeatureId[] {
    return [...this.features];
  }

  // === Tactical Properties ===

  /**
   * Get the maximum cover level between two levels
   */
  private getMaxCoverLevel(a: TacticalCoverLevel, b: TacticalCoverLevel): TacticalCoverLevel {
    const levels = [TacticalCoverLevel.NONE, TacticalCoverLevel.LIGHT, TacticalCoverLevel.PARTIAL, TacticalCoverLevel.HEAVY, TacticalCoverLevel.TOTAL];
    const aIndex = levels.indexOf(a);
    const bIndex = levels.indexOf(b);
    return levels[Math.max(aIndex, bIndex)];
  }

  /**
   * Update tactical properties based on terrain
   */
  private updateTacticalProperties(): void {
    // Reset to defaults
    this.movementCost = 1;
    this.coverLevel = TacticalCoverLevel.NONE;
    this.concealment = TacticalConcealmentLevel.NONE;

    // === Movement Cost Calculation ===

    // Slope affects movement
    if (this.slope > 45) {
      this.movementCost = 4; // Very difficult
    } else if (this.slope > 30) {
      this.movementCost = 3; // Difficult
    } else if (this.slope > 15) {
      this.movementCost = 2; // Moderate
    } else if (this.slope > 5) {
      this.movementCost = 1.5; // Slight
    }

    // Water affects movement
    if (this.waterDepth > 3) {
      this.movementCost = Infinity; // Impassable (swimming required)
    } else if (this.waterDepth > 2) {
      this.movementCost = Math.max(this.movementCost, 4);
    } else if (this.waterDepth > 1) {
      this.movementCost = Math.max(this.movementCost, 3);
    } else if (this.waterDepth > 0) {
      this.movementCost = Math.max(this.movementCost, 2);
    }

    // Vegetation affects movement
    if (this.vegetationType === VegetationType.DENSE_TREES) {
      this.movementCost *= 1.5;
    } else if (this.vegetationType === VegetationType.UNDERGROWTH) {
      this.movementCost *= 2;
    } else if (this.vegetationType === VegetationType.SHRUBS) {
      this.movementCost *= 1.25;
    }

    // Geological features affect movement
    if (this.geologicalFeatures.includes(TerrainFeature.TALUS)) {
      this.movementCost *= 2; // Loose rocks
    }
    if (this.geologicalFeatures.includes(TerrainFeature.SINKHOLE)) {
      this.movementCost = Infinity; // Can't cross
    }

    // === Cover Calculation ===

    // Geological features provide cover
    if (this.geologicalFeatures.includes(TerrainFeature.TOWER) ||
        this.geologicalFeatures.includes(TerrainFeature.COLUMN)) {
      this.coverLevel = TacticalCoverLevel.TOTAL;
    } else if (this.geologicalFeatures.includes(TerrainFeature.CORESTONE) ||
               this.geologicalFeatures.includes(TerrainFeature.FIN)) {
      this.coverLevel = TacticalCoverLevel.HEAVY;
    } else if (this.geologicalFeatures.includes(TerrainFeature.LEDGE)) {
      this.coverLevel = TacticalCoverLevel.PARTIAL;
    }

    // Vegetation provides cover
    if (this.vegetationType === VegetationType.DENSE_TREES && this.canopyCover > 75) {
      this.coverLevel = this.getMaxCoverLevel(this.coverLevel, TacticalCoverLevel.HEAVY);
    } else if (this.vegetationType === VegetationType.SPARSE_TREES) {
      this.coverLevel = this.getMaxCoverLevel(this.coverLevel, TacticalCoverLevel.PARTIAL);
    } else if (this.vegetationType === VegetationType.SHRUBS) {
      this.coverLevel = this.getMaxCoverLevel(this.coverLevel, TacticalCoverLevel.LIGHT);
    }

    // Structures provide cover
    if (this.hasStructure) {
      if (this.structureType === 'building') {
        this.coverLevel = TacticalCoverLevel.TOTAL;
      } else if (this.structureType === 'wall' || this.structureType === 'bridge') {
        this.coverLevel = TacticalCoverLevel.HEAVY;
      }
    }

    // === Concealment Calculation ===

    // Vegetation provides concealment
    if (this.vegetationType === VegetationType.DENSE_TREES && this.canopyCover > 90) {
      this.concealment = TacticalConcealmentLevel.TOTAL;
    } else if (this.vegetationType === VegetationType.DENSE_TREES && this.canopyCover > 75) {
      this.concealment = TacticalConcealmentLevel.HEAVY;
    } else if (this.vegetationType === VegetationType.UNDERGROWTH) {
      this.concealment = TacticalConcealmentLevel.HEAVY;
    } else if (this.vegetationType === VegetationType.SHRUBS) {
      this.concealment = TacticalConcealmentLevel.MODERATE;
    } else if (this.vegetationType === VegetationType.TALL_GRASS) {
      this.concealment = TacticalConcealmentLevel.LIGHT;
    }

    // Some geological features provide concealment
    if (this.geologicalFeatures.includes(TerrainFeature.CAVE)) {
      this.concealment = TacticalConcealmentLevel.TOTAL;
    }
  }

  getMovementCost(): number {
    return this.movementCost;
  }

  getCoverLevel(): TacticalCoverLevel {
    return this.coverLevel;
  }

  getConcealmentLevel(): TacticalConcealmentLevel {
    return this.concealment;
  }

  // === Utility Methods ===

  getPosition(): Position {
    return this.position;
  }

  /**
   * Check if this tile is passable
   */
  isPassable(): boolean {
    return this.movementCost !== Infinity;
  }

  /**
   * Check if this tile blocks line of sight
   */
  blocksLineOfSight(): boolean {
    return this.coverLevel === TacticalCoverLevel.TOTAL ||
           this.concealment === TacticalConcealmentLevel.TOTAL ||
           this.geologicalFeatures.includes(TerrainFeature.TOWER) ||
           this.geologicalFeatures.includes(TerrainFeature.COLUMN) ||
           (this.hasStructure && this.structureType === 'building');
  }

  /**
   * Get a description of this tile for display
   */
  getDescription(): string {
    const parts: string[] = [];

    // Geological features
    if (this.geologicalFeatures.length > 0) {
      parts.push(this.geologicalFeatures.join(', '));
    }

    // Elevation and slope
    if (this.slope > 15) {
      parts.push(`${Math.round(this.slope)}° slope`);
    }

    // Water
    if (this.waterDepth > 0) {
      parts.push(`${this.waterDepth}ft water`);
    }

    // Vegetation
    if (this.vegetationType !== VegetationType.NONE) {
      parts.push(this.vegetationType.replace('_', ' '));
    }

    // Structure
    if (this.hasStructure && this.structureType) {
      parts.push(this.structureType);
    }

    return parts.join(', ') || 'Open ground';
  }
}