import { FeatureCategory, MapFeature } from '../../../common/entities/MapFeature';
import { FeatureId } from '../../../common/value-objects';
import { SpatialBounds } from '../../../common/value-objects/SpatialBounds';
import { Position } from '../../../common/value-objects/Position';
import { FlowDirection } from '../value-objects/FlowDirection';
import { WaterQuality } from '../value-objects/WaterQuality';

/**
 * Spring-specific feature type
 */
export const SPRING_FEATURE_TYPE = 'spring';

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
 * Spring entity representing water source features
 * Follows Clean Architecture principles - pure domain entity
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
    public readonly seasonalPattern?: 'always' | 'wet_season' | 'dry_season', // Deterministic instead of random
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
      this.waterQuality.isPotable &&
      this.springType !== SpringType.THERMAL &&
      this.temperature < 85
    );
  }

  /**
   * Get seasonal activity pattern
   * FIXED: Removed Math.random() for deterministic behavior
   */
  get seasonalActivity(): 'always' | 'wet_season' | 'dry_season' | 'never' {
    if (!this.isActive) return 'never';
    if (this.springType === SpringType.SEASONAL) {
      // Use deterministic seasonal pattern passed in constructor
      return this.seasonalPattern || 'wet_season';
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