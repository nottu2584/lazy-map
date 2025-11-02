import { FeatureCategory, MapFeature } from '../../../common/entities/MapFeature';
import { FeatureId } from '../../../common/value-objects';
import { SpatialBounds } from '../../../common/value-objects/SpatialBounds';
import { Position } from '../../../common/value-objects/Position';
import { WaterLevel } from '../value-objects/WaterLevel';
import { WaterQuality } from '../value-objects/WaterQuality';

/**
 * Wetland-specific feature type
 */
export const WETLAND_FEATURE_TYPE = 'wetland';

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
 * Wetland entity representing marshes, swamps, and other wetland features
 * Follows Clean Architecture principles - pure domain entity
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

  /**
   * Calculate potential nesting areas for waterfowl
   * Returns deterministic positions based on wetland properties
   */
  getNestingAreaCount(): number {
    if (!this.vegetationDensity || this.vegetationDensity < 0.5 || !this.supportsMigratory) {
      return 0;
    }

    // Deterministic calculation based on area and vegetation
    const baseCount = Math.floor(this.area.dimensions.area / 50); // One spot per ~50 sq units
    const vegetationMultiplier = this.vegetationDensity;

    return Math.floor(baseCount * vegetationMultiplier);
  }

  /**
   * Get nesting area positions in a deterministic grid pattern
   * @param seed Optional seed for consistent positioning
   */
  getNestingAreaPositions(seed: number = 0): Position[] {
    const count = this.getNestingAreaCount();
    if (count === 0) return [];

    const positions: Position[] = [];
    const center = new Position(
      this.area.x + this.area.width / 2,
      this.area.y + this.area.height / 2,
    );

    // Create positions in a deterministic circular pattern
    const radius = Math.sqrt(this.area.dimensions.area / Math.PI) * 0.7;

    for (let i = 0; i < count; i++) {
      // Use seed to offset the angle for variety while remaining deterministic
      const angle = ((i + seed) / count) * 2 * Math.PI;
      const x = center.x + Math.cos(angle) * radius;
      const y = center.y + Math.sin(angle) * radius;

      const position = new Position(x, y);
      if (this.area.contains(position)) {
        positions.push(position);
      }
    }

    return positions;
  }

  private validateVegetationDensity(density: number): void {
    if (!Number.isFinite(density) || density < 0 || density > 1) {
      throw new Error('Vegetation density must be between 0 and 1');
    }
  }
}
