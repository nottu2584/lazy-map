import { MapFeature, FeatureId, FeatureCategory } from '../../../common/entities/MapFeature';
import { FeatureArea } from '../../../common/value-objects/FeatureArea';

/**
 * Plateau-specific feature type
 */
export const PLATEAU_FEATURE_TYPE = 'plateau';

/**
 * Plateau surface types
 */
export enum PlateauSurface {
  GRASSY = 'grassy',
  ROCKY = 'rocky',
  FORESTED = 'forested',
  DESERT = 'desert',
  ICY = 'icy',
}

/**
 * Plateau edge types
 */
export enum PlateauEdge {
  GENTLE = 'gentle',
  STEEP = 'steep',
  CLIFF = 'cliff',
  ERODED = 'eroded',
  TERRACED = 'terraced',
}

/**
 * Plateau entity representing a large flat elevated area
 */
export class Plateau extends MapFeature {
  constructor(
    id: FeatureId,
    name: string,
    area: FeatureArea,
    public readonly surface: PlateauSurface,
    public readonly edgeType: PlateauEdge,
    public readonly elevation: number,
    public readonly hasWaterSource: boolean = false,
    public readonly erosionLevel: number = 0.2,
    priority: number = 3
  ) {
    super(id, name, FeatureCategory.RELIEF, area, priority);
    this.validateElevation(elevation);
    this.validateErosion(erosionLevel);
  }

  getType(): string {
    return PLATEAU_FEATURE_TYPE;
  }

  canMixWith(other: MapFeature): boolean {
    // Plateaus can mix with natural features based on their surface type
    if (other.category === FeatureCategory.NATURAL) {
      const otherType = other.getType();
      
      // Forests can be on forested plateaus
      if (otherType === 'forest' && this.surface === PlateauSurface.FORESTED) {
        return true;
      }
      
      // Lakes or ponds can exist on most plateau types if they have water sources
      if ((otherType === 'lake' || otherType === 'pond') && this.hasWaterSource) {
        return true;
      }
      
      return false;
    }
    
    // Plateaus can mix with cultural features
    if (other.category === FeatureCategory.CULTURAL) {
      return true;
    }
    
    // Plateaus typically don't mix with other relief features
    return false;
  }

  /**
   * Determines if the plateau is accessible from a specific direction
   */
  isAccessibleFrom(direction: 'north' | 'south' | 'east' | 'west'): boolean {
    // Gentle and eroded edges are more accessible
    if (this.edgeType === PlateauEdge.GENTLE || this.edgeType === PlateauEdge.ERODED) {
      return true;
    }
    
    // Terraced edges are somewhat accessible
    if (this.edgeType === PlateauEdge.TERRACED) {
      return true;
    }
    
    // Steep edges are difficult to access but not impossible
    if (this.edgeType === PlateauEdge.STEEP) {
      return this.elevation < 150;
    }
    
    // Cliff edges are inaccessible
    if (this.edgeType === PlateauEdge.CLIFF) {
      return false;
    }
    
    return false;
  }

  /**
   * Determines if the plateau provides tactical advantage
   */
  providesTacticalAdvantage(): boolean {
    return this.elevation > 100 && 
           (this.edgeType === PlateauEdge.CLIFF || this.edgeType === PlateauEdge.STEEP);
  }

  /**
   * Calculates how difficult it is to traverse the plateau's edge
   * Returns a value between 0 (easy) and 1 (nearly impossible)
   */
  getEdgeDifficulty(): number {
    switch (this.edgeType) {
      case PlateauEdge.GENTLE:
        return 0.2;
      case PlateauEdge.ERODED:
        return 0.4;
      case PlateauEdge.TERRACED:
        return 0.6;
      case PlateauEdge.STEEP:
        return 0.8;
      case PlateauEdge.CLIFF:
        return 1.0;
      default:
        return 0.5;
    }
  }

  private validateElevation(elevation: number): void {
    if (elevation <= 0) {
      throw new Error('Plateau elevation must be positive');
    }
  }

  private validateErosion(erosion: number): void {
    if (erosion < 0 || erosion > 1) {
      throw new Error('Erosion level must be between 0 and 1');
    }
  }
}