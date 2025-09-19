import { FeatureCategory, FeatureId, MapFeature } from '../../../common/entities/MapFeature';
import { SpatialBounds } from '../../../common/value-objects/SpatialBounds';
import { Position } from '../../../common/value-objects/Position';
import { FlowDirection } from '../value-objects/FlowDirection';
import { WaterLevel } from '../value-objects/WaterLevel';
import { WaterQuality } from '../value-objects/WaterQuality';

/**
 * Spring-specific feature type
 */
export const SPRING_FEATURE_TYPE = 'spring';

/**
 * Pond-specific feature type
 */
export const POND_FEATURE_TYPE = 'pond';

/**
 * Wetland-specific feature type
 */
export const WETLAND_FEATURE_TYPE = 'wetland';

/**
 * Spring types based on water source
 */
export enum SpringType {
  ARTESIAN = 'artesian', // Pressurized groundwater
  GRAVITY = 'gravity', // Gravity-fed from higher elevation
  THERMAL = 'thermal', // Hot spring from geothermal activity
  MINERAL = 'mineral', // High mineral content
  SEASONAL = 'seasonal', // Only flows during certain seasons
}

/**
 * Wetland types
 */
export enum WetlandType {
  MARSH = 'marsh', // Herbaceous wetland
  SWAMP = 'swamp', // Woody wetland
  BOG = 'bog', // Acidic, low-nutrient
  FEN = 'fen', // Alkaline, nutrient-rich
  PRAIRIE_POTHOLE = 'prairie_pothole', // Shallow depression wetland
  VERNAL_POOL = 'vernal_pool', // Temporary seasonal wetland
}

/**
 * Spring entity representing water source features
 */
export class Spring extends MapFeature {
  constructor(
    id: FeatureId,
    name: string,
    area: SpatialBounds,
    public readonly springType: SpringType,
    public readonly waterQuality: WaterQuality,
    public readonly flowRate: number, // Gallons per minute
    public readonly temperature: number, // Degrees (relevant for thermal springs)
    public readonly outflowDirection: FlowDirection,
    public readonly isActive: boolean = true,
    priority: number = 4,
  ) {
    super(id, name, FeatureCategory.NATURAL, area, priority);
    this.validateFlowRate(flowRate);
    this.validateTemperature(temperature);
  }

  getType(): string {
    return SPRING_FEATURE_TYPE;
  }

  canMixWith(other: MapFeature): boolean {
    // Springs can mix with most natural features
    if (other.category === FeatureCategory.NATURAL) {
      return true;
    }

    if (other.category === FeatureCategory.RELIEF) {
      return true; // Springs emerge from hillsides, rock formations
    }

    if (other.category === FeatureCategory.CULTURAL) {
      return true; // Springs near settlements are valuable
    }

    return false;
  }

  get isHotSpring(): boolean {
    return this.springType === SpringType.THERMAL && this.temperature > 100;
  }

  get isMineralSpring(): boolean {
    return this.springType === SpringType.MINERAL;
  }

  get isPotable(): boolean {
    return (
      this.waterQuality.isPotable && this.springType !== SpringType.THERMAL && this.temperature < 85
    );
  }

  get seasonalActivity(): 'always' | 'wet_season' | 'dry_season' | 'never' {
    if (!this.isActive) return 'never';
    if (this.springType === SpringType.SEASONAL) {
      return Math.random() > 0.5 ? 'wet_season' : 'dry_season';
    }
    return 'always';
  }

  // Calculate output volume per day
  get dailyOutput(): number {
    return this.flowRate * 60 * 24; // GPM to gallons per day
  }

  // Check if spring can supply water to a settlement
  canSupplySettlement(populationSize: number): boolean {
    const dailyWaterNeed = populationSize * 50; // 50 gallons per person per day
    return this.dailyOutput >= dailyWaterNeed && this.isPotable;
  }

  private validateFlowRate(rate: number): void {
    if (!Number.isFinite(rate) || rate < 0) {
      throw new Error('Flow rate must be a non-negative number');
    }
  }

  private validateTemperature(temp: number): void {
    if (!Number.isFinite(temp)) {
      throw new Error('Temperature must be a finite number');
    }
  }
}

/**
 * Pond entity representing small standing water features
 */
export class Pond extends MapFeature {
  private _depth: number;

  constructor(
    id: FeatureId,
    name: string,
    area: SpatialBounds,
    public readonly waterLevel: WaterLevel,
    public readonly waterQuality: WaterQuality,
    depth: number,
    public readonly seasonal: boolean = false,
    public readonly hasOutflow: boolean = false,
    priority: number = 2,
  ) {
    super(id, name, FeatureCategory.NATURAL, area, priority);
    this.validateDepth(depth);
    this._depth = depth;
  }

  getType(): string {
    return POND_FEATURE_TYPE;
  }

  canMixWith(other: MapFeature): boolean {
    // Ponds can mix with most natural features
    if (other.category === FeatureCategory.NATURAL) {
      const otherType = other.getType();
      return otherType !== 'pond' && otherType !== 'lake'; // Don't mix with other water bodies
    }

    if (other.category === FeatureCategory.RELIEF) {
      return true; // Ponds in valleys, depressions
    }

    if (other.category === FeatureCategory.CULTURAL) {
      return true; // Farm ponds, ornamental ponds
    }

    return false;
  }

  get depth(): number {
    return this._depth;
  }

  set depth(newDepth: number) {
    this.validateDepth(newDepth);
    this._depth = newDepth;
  }

  get volume(): number {
    return this.area.dimensions.area * this._depth;
  }

  get isNavigable(): boolean {
    return this._depth >= 3 && this.area.dimensions.area >= 100;
  }

  get supportsFish(): boolean {
    return (
      this._depth >= 4 &&
      this.waterQuality.supportsFish &&
      (!this.seasonal || this.waterLevel.seasonal)
    );
  }

  get canFreeze(): boolean {
    return this._depth <= 10 && this.waterQuality.mightFreeze;
  }

  // Check if pond might dry up in summer
  get mightDryUp(): boolean {
    return this.seasonal && this._depth <= 2;
  }

  private validateDepth(depth: number): void {
    if (!Number.isFinite(depth) || depth < 0) {
      throw new Error('Pond depth must be a non-negative number');
    }
  }
}

/**
 * Wetland entity representing marshes, swamps, and other wetland features
 */
export class Wetland extends MapFeature {
  constructor(
    id: FeatureId,
    name: string,
    area: SpatialBounds,
    public readonly wetlandType: WetlandType,
    public readonly waterLevel: WaterLevel,
    public readonly waterQuality: WaterQuality,
    public readonly vegetationDensity: number = 0.7, // 0-1 scale
    public readonly seasonal: boolean = false,
    priority: number = 1,
  ) {
    super(id, name, FeatureCategory.NATURAL, area, priority);
    this.validateVegetationDensity(vegetationDensity);
  }

  getType(): string {
    return WETLAND_FEATURE_TYPE;
  }

  canMixWith(other: MapFeature): boolean {
    // Wetlands can mix with many features as they're transitional zones
    if (other.category === FeatureCategory.NATURAL) {
      const otherType = other.getType();
      return otherType === 'forest' || otherType === 'grassland'; // Transition zones
    }

    if (other.category === FeatureCategory.RELIEF) {
      return true; // Wetlands in low-lying areas
    }

    return false;
  }

  get isTraversable(): boolean {
    // Some wetlands can be crossed, others are impassable
    switch (this.wetlandType) {
      case WetlandType.MARSH:
        return this.vegetationDensity < 0.8 && this.waterLevel.depth < 2;
      case WetlandType.SWAMP:
        return false; // Generally impassable
      case WetlandType.BOG:
        return this.waterLevel.depth < 1;
      case WetlandType.FEN:
        return this.waterLevel.depth < 1.5;
      case WetlandType.PRAIRIE_POTHOLE:
        return true; // Usually shallow
      case WetlandType.VERNAL_POOL:
        return !this.isActive; // Only when dry
      default:
        return false;
    }
  }

  get biodiversityScore(): number {
    // Wetlands are biodiversity hotspots
    let score = 7; // Base high score

    if (this.wetlandType === WetlandType.FEN || this.wetlandType === WetlandType.MARSH) {
      score += 2; // Nutrient-rich wetlands have higher diversity
    }

    if (this.seasonal) {
      score += 1; // Seasonal variation increases diversity
    }

    if (this.waterQuality.environmentalHealth > 7) {
      score += 1; // Clean water supports more species
    }

    return Math.min(10, score);
  }

  get isActive(): boolean {
    if (!this.seasonal) return true;

    // Seasonal wetlands are active based on water level
    return this.waterLevel.depth > 0;
  }

  get supportsMigratory(): boolean {
    // Check if wetland supports migratory waterfowl
    return (
      this.wetlandType === WetlandType.MARSH ||
      this.wetlandType === WetlandType.PRAIRIE_POTHOLE ||
      (this.wetlandType === WetlandType.VERNAL_POOL && this.isActive)
    );
  }

  // Get suitable nesting areas for waterfowl
  getNestingAreas(): Position[] {
    const nestingSpots: Position[] = [];

    if (this.vegetationDensity >= 0.5 && this.supportsMigratory) {
      const center = new Position(
        this.area.x + this.area.width / 2,
        this.area.y + this.area.height / 2,
      );

      // Add spots around the perimeter where vegetation meets water
      const spotCount = Math.floor(this.area.dimensions.area / 50); // One spot per ~50 sq units
      for (let i = 0; i < spotCount; i++) {
        const angle = (i / spotCount) * 2 * Math.PI;
        const radius = Math.sqrt(this.area.dimensions.area / Math.PI) * 0.7;
        const x = center.x + Math.cos(angle) * radius;
        const y = center.y + Math.sin(angle) * radius;

        if (this.area.contains(new Position(x, y))) {
          nestingSpots.push(new Position(x, y));
        }
      }
    }

    return nestingSpots;
  }

  private validateVegetationDensity(density: number): void {
    if (!Number.isFinite(density) || density < 0 || density > 1) {
      throw new Error('Vegetation density must be between 0 and 1');
    }
  }
}
