import { MapFeature, FeatureCategory } from '../../../common/entities/MapFeature';
import { FeatureId } from '../../../common/entities/../value-objects';
import { SpatialBounds } from '../../../common/value-objects/SpatialBounds';
import { Position } from '../../../common/value-objects/Position';

/**
 * Building-specific feature type
 */
export const BUILDING_FEATURE_TYPE = 'building';

/**
 * Building types
 */
export enum BuildingType {
  RESIDENTIAL = 'residential',
  COMMERCIAL = 'commercial',
  MILITARY = 'military',
  RELIGIOUS = 'religious',
  GOVERNMENTAL = 'governmental',
  INDUSTRIAL = 'industrial',
  AGRICULTURAL = 'agricultural',
  RUINS = 'ruins',
}

/**
 * Building material types
 */
export enum BuildingMaterial {
  WOOD = 'wood',
  STONE = 'stone',
  BRICK = 'brick',
  METAL = 'metal',
  THATCH = 'thatch',
  MIXED = 'mixed',
}

/**
 * Building size classifications
 */
export enum BuildingSize {
  TINY = 'tiny',
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large',
  HUGE = 'huge',
}

/**
 * Building entity representing a man-made structure
 */
export class Building extends MapFeature {
  private _entrances: Position[] = [];
  private _stories: number;

  constructor(
    id: FeatureId,
    name: string,
    area: SpatialBounds,
    public readonly buildingType: BuildingType,
    public readonly material: BuildingMaterial,
    public readonly size: BuildingSize,
    stories: number = 1,
    public readonly hasInterior: boolean = true,
    public readonly condition: number = 1.0,
    priority: number = 4
  ) {
    super(id, name, FeatureCategory.ARTIFICIAL, area, priority);
    this._stories = this.validateStories(stories);
    this.validateCondition(condition);
  }

  getType(): string {
    return BUILDING_FEATURE_TYPE;
  }


  /**
   * Add an entrance to the building
   */
  addEntrance(position: Position): void {
    if (!this.isPositionOnPerimeter(position)) {
      throw new Error('Entrance must be on the building perimeter');
    }
    this._entrances.push(position);
  }

  /**
   * Get all entrances
   */
  getEntrances(): Position[] {
    return [...this._entrances];
  }

  /**
   * Get number of stories
   */
  get stories(): number {
    return this._stories;
  }

  /**
   * Set number of stories
   */
  set stories(value: number) {
    this._stories = this.validateStories(value);
  }

  /**
   * Get the total floor area of the building
   */
  getTotalFloorArea(): number {
    return this.area.dimensions.area * this._stories;
  }

  /**
   * Determine if the building can be fortified
   */
  canBeFortified(): boolean {
    return this.material === BuildingMaterial.STONE || 
           this.material === BuildingMaterial.BRICK ||
           this.buildingType === BuildingType.MILITARY;
  }

  /**
   * Calculate defensive value of the building
   */
  getDefensiveValue(): number {
    let baseValue: number;
    
    switch (this.material) {
      case BuildingMaterial.STONE:
        baseValue = 0.8;
        break;
      case BuildingMaterial.BRICK:
        baseValue = 0.7;
        break;
      case BuildingMaterial.METAL:
        baseValue = 0.9;
        break;
      case BuildingMaterial.WOOD:
        baseValue = 0.5;
        break;
      case BuildingMaterial.THATCH:
        baseValue = 0.2;
        break;
      default:
        baseValue = 0.6;
    }
    
    // Adjust for condition and building type
    const conditionFactor = this.condition;
    const typeFactor = this.buildingType === BuildingType.MILITARY ? 1.5 : 1.0;
    
    return baseValue * conditionFactor * typeFactor;
  }

  /**
   * Check if a position is on the building's perimeter
   */
  private isPositionOnPerimeter(position: Position): boolean {
    const minX = this.area.position.x;
    const maxX = this.area.position.x + this.area.dimensions.width;
    const minY = this.area.position.y;
    const maxY = this.area.position.y + this.area.dimensions.height;
    
    // Check if the position is on any of the four edges
    return (
      (position.x === minX && position.y >= minY && position.y <= maxY) ||
      (position.x === maxX && position.y >= minY && position.y <= maxY) ||
      (position.y === minY && position.x >= minX && position.x <= maxX) ||
      (position.y === maxY && position.x >= minX && position.x <= maxX)
    );
  }

  private validateStories(stories: number): number {
    if (stories < 1) {
      throw new Error('Building must have at least one story');
    }
    
    // Validate maximum stories based on building size
    const maxStories = {
      [BuildingSize.TINY]: 1,
      [BuildingSize.SMALL]: 2,
      [BuildingSize.MEDIUM]: 4,
      [BuildingSize.LARGE]: 8,
      [BuildingSize.HUGE]: 20
    };
    
    if (stories > maxStories[this.size]) {
      throw new Error(`A ${this.size} building cannot have more than ${maxStories[this.size]} stories`);
    }
    
    return stories;
  }

  private validateCondition(condition: number): void {
    if (condition < 0 || condition > 1) {
      throw new Error('Building condition must be between 0 and 1');
    }
  }
}
