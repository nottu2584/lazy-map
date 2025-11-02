import { FeatureCategory, MapFeature } from '../../../common/entities/MapFeature';
import { FeatureId } from '../../../common/value-objects';
import { SpatialBounds } from '../../../common/value-objects/SpatialBounds';
import { WaterLevel } from '../value-objects/WaterLevel';
import { WaterQuality } from '../value-objects/WaterQuality';

/**
 * Pond-specific feature type
 */
export const POND_FEATURE_TYPE = 'pond';

/**
 * Pond entity representing small standing water features
 * Follows Clean Architecture principles - pure domain entity
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
