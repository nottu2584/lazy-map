import { FeatureCategory, FeatureId, MapFeature } from '../../../common/entities/MapFeature';
import { FeatureArea } from '../../../common/value-objects/FeatureArea';

/**
 * Valley-specific feature type
 */
export const VALLEY_FEATURE_TYPE = 'valley';

/**
 * Valley formation types
 */
export enum ValleyFormation {
  V_SHAPED = 'v_shaped',
  U_SHAPED = 'u_shaped',
  CANYON = 'canyon',
  GORGE = 'gorge',
  RIVER_VALLEY = 'river_valley',
}

/**
 * Valley entity representing a low area between hills or mountains
 */
export class Valley extends MapFeature {
  constructor(
    id: FeatureId,
    name: string,
    area: FeatureArea,
    public readonly formation: ValleyFormation,
    public readonly hasRiver: boolean,
    public readonly depth: number,
    public readonly fertilitySoilLevel: number = 0.7,
    public readonly floodRisk: number = 0.3,
    priority: number = 2,
  ) {
    super(id, name, FeatureCategory.RELIEF, area, priority);
    this.validateDepth(depth);
    this.validateSoilFertility(fertilitySoilLevel);
    this.validateFloodRisk(floodRisk);
  }

  getType(): string {
    return VALLEY_FEATURE_TYPE;
  }

  canMixWith(other: MapFeature): boolean {
    // Valleys can mix with natural features
    if (other.category === FeatureCategory.NATURAL) {
      const otherType = other.getType();
      // Valleys often have rivers or forests
      return otherType === 'river' || otherType === 'forest' || otherType === 'lake';
    }

    // Valleys can mix with cultural features
    if (other.category === FeatureCategory.CULTURAL) {
      return true;
    }

    // Valleys can sometimes mix with artificial features
    if (other.category === FeatureCategory.ARTIFICIAL) {
      const otherType = other.getType();
      return otherType === 'road' || otherType === 'settlement' || otherType === 'farm';
    }

    // Valleys cannot mix with other relief features
    return false;
  }

  /**
   * Determines if the valley is suitable for farming
   */
  isSuitableForFarming(): boolean {
    return this.fertilitySoilLevel > 0.5 && this.floodRisk < 0.5;
  }

  /**
   * Gets the valley width at a specific position
   */
  getWidthAtPosition(position: number): number {
    const length = Math.max(this.area.dimensions.width, this.area.dimensions.height);
    const normalizedPosition = Math.min(Math.max(position / length, 0), 1);

    // Width varies based on formation type
    switch (this.formation) {
      case ValleyFormation.V_SHAPED:
        // V-shaped valleys are wider at the top
        return this.area.dimensions.width * normalizedPosition;
      case ValleyFormation.U_SHAPED:
        // U-shaped valleys have relatively consistent width
        return this.area.dimensions.width * 0.8;
      case ValleyFormation.CANYON:
        // Canyons are narrow throughout
        return this.area.dimensions.width * 0.3;
      case ValleyFormation.GORGE:
        // Gorges are very narrow
        return this.area.dimensions.width * 0.2;
      case ValleyFormation.RIVER_VALLEY:
        // River valleys have variable width, typically wider at downstream points
        return this.area.dimensions.width * (0.5 + normalizedPosition * 0.4);
      default:
        return this.area.dimensions.width * 0.5;
    }
  }

  /**
   * Gets the valley floor elevation (relative to the surrounding terrain)
   */
  getFloorElevation(): number {
    // The depth is negative to represent lower elevation
    return -this.depth;
  }

  private validateDepth(depth: number): void {
    if (depth <= 0) {
      throw new Error('Valley depth must be positive');
    }
  }

  private validateSoilFertility(fertility: number): void {
    if (fertility < 0 || fertility > 1) {
      throw new Error('Soil fertility level must be between 0 and 1');
    }
  }

  private validateFloodRisk(risk: number): void {
    if (risk < 0 || risk > 1) {
      throw new Error('Flood risk must be between 0 and 1');
    }
  }
}
