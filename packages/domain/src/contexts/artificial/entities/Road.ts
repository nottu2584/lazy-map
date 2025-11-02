import { MapFeature, FeatureCategory } from '../../../common/entities/MapFeature';
import { FeatureId } from '../../../common/entities/../value-objects';
import { SpatialBounds } from '../../../common/value-objects/SpatialBounds';
import { Position } from '../../../common/value-objects/Position';

/**
 * Road-specific feature type
 */
export const ROAD_FEATURE_TYPE = 'road';

/**
 * Road surface types
 */
export enum RoadSurface {
  DIRT = 'dirt',
  GRAVEL = 'gravel',
  COBBLESTONE = 'cobblestone',
  PAVED = 'paved',
  WOODEN = 'wooden',
}

/**
 * Road quality levels
 */
export enum RoadQuality {
  POOR = 'poor',
  AVERAGE = 'average',
  GOOD = 'good',
  EXCELLENT = 'excellent',
}

/**
 * Road width classifications
 */
export enum RoadWidth {
  PATH = 'path',
  TRAIL = 'trail',
  SINGLE_LANE = 'single_lane',
  DOUBLE_LANE = 'double_lane',
  HIGHWAY = 'highway',
}

/**
 * Road entity representing a path for travel
 */
export class Road extends MapFeature {
  private _waypoints: Position[] = [];

  constructor(
    id: FeatureId,
    name: string,
    area: SpatialBounds,
    public readonly surface: RoadSurface,
    public readonly quality: RoadQuality,
    public readonly width: RoadWidth,
    public readonly elevation: number = 0,
    public readonly hasBridge: boolean = false,
    public readonly maintenanceLevel: number = 0.7,
    priority: number = 3
  ) {
    super(id, name, FeatureCategory.ARTIFICIAL, area, priority);
    this.validateMaintenanceLevel(maintenanceLevel);
  }

  getType(): string {
    return ROAD_FEATURE_TYPE;
  }


  /**
   * Add a waypoint to the road
   */
  addWaypoint(position: Position): void {
    this._waypoints.push(position);
  }

  /**
   * Get all waypoints
   */
  getWaypoints(): Position[] {
    return [...this._waypoints];
  }

  /**
   * Calculate travel speed modifier for this road
   * Returns a value where 1.0 is normal speed, higher is faster
   */
  getTravelSpeedModifier(): number {
    // Base modifier from road width
    let widthModifier: number;
    switch (this.width) {
      case RoadWidth.PATH:
        widthModifier = 1.1;
        break;
      case RoadWidth.TRAIL:
        widthModifier = 1.2;
        break;
      case RoadWidth.SINGLE_LANE:
        widthModifier = 1.5;
        break;
      case RoadWidth.DOUBLE_LANE:
        widthModifier = 1.8;
        break;
      case RoadWidth.HIGHWAY:
        widthModifier = 2.0;
        break;
      default:
        widthModifier = 1.0;
    }
    
    // Adjust for surface type
    let surfaceModifier: number;
    switch (this.surface) {
      case RoadSurface.DIRT:
        surfaceModifier = 0.8;
        break;
      case RoadSurface.GRAVEL:
        surfaceModifier = 0.9;
        break;
      case RoadSurface.COBBLESTONE:
        surfaceModifier = 1.0;
        break;
      case RoadSurface.PAVED:
        surfaceModifier = 1.2;
        break;
      case RoadSurface.WOODEN:
        surfaceModifier = 0.9;
        break;
      default:
        surfaceModifier = 1.0;
    }
    
    // Adjust for quality and maintenance
    const qualityModifier = {
      [RoadQuality.POOR]: 0.7,
      [RoadQuality.AVERAGE]: 0.9,
      [RoadQuality.GOOD]: 1.1,
      [RoadQuality.EXCELLENT]: 1.3
    }[this.quality];
    
    return widthModifier * surfaceModifier * qualityModifier * this.maintenanceLevel;
  }

  /**
   * Check if the road is traversable in bad weather
   */
  isTraversableInBadWeather(): boolean {
    // Dirt and gravel roads become difficult in bad weather
    if ((this.surface === RoadSurface.DIRT || this.surface === RoadSurface.GRAVEL) 
        && this.maintenanceLevel < 0.8) {
      return false;
    }
    
    // Poor quality roads may become impassable
    if (this.quality === RoadQuality.POOR && this.maintenanceLevel < 0.6) {
      return false;
    }
    
    return true;
  }

  /**
   * Gets the weight capacity of the road
   */
  getWeightCapacity(): number {
    const surfaceCapacity = {
      [RoadSurface.DIRT]: 1000,
      [RoadSurface.GRAVEL]: 3000,
      [RoadSurface.COBBLESTONE]: 5000,
      [RoadSurface.PAVED]: 10000,
      [RoadSurface.WOODEN]: 2000
    };
    
    const widthMultiplier = {
      [RoadWidth.PATH]: 0.3,
      [RoadWidth.TRAIL]: 0.5,
      [RoadWidth.SINGLE_LANE]: 1.0,
      [RoadWidth.DOUBLE_LANE]: 2.0,
      [RoadWidth.HIGHWAY]: 3.0
    };
    
    const baseCapacity = surfaceCapacity[this.surface] || 2000;
    const multiplier = widthMultiplier[this.width] * this.maintenanceLevel;
    
    return baseCapacity * multiplier;
  }

  private validateMaintenanceLevel(level: number): void {
    if (level < 0 || level > 1) {
      throw new Error('Maintenance level must be between 0 and 1');
    }
  }
}
