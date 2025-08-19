import { MapFeature, FeatureId, FeatureCategory } from '../../../common/entities/MapFeature';
import { FeatureArea } from '../../../common/value-objects/FeatureArea';
import { Position } from '../../../common/value-objects/Position';

/**
 * Bridge-specific feature type
 */
export const BRIDGE_FEATURE_TYPE = 'bridge';

/**
 * Bridge material types
 */
export enum BridgeMaterial {
  WOOD = 'wood',
  STONE = 'stone',
  METAL = 'metal',
  ROPE = 'rope',
  COMPOSITE = 'composite',
}

/**
 * Bridge structure types
 */
export enum BridgeStructure {
  BEAM = 'beam',
  ARCH = 'arch',
  SUSPENSION = 'suspension',
  DRAWBRIDGE = 'drawbridge',
  PONTOON = 'pontoon',
  COVERED = 'covered',
}

/**
 * Bridge entity representing a structure spanning physical obstacles
 */
export class Bridge extends MapFeature {
  constructor(
    id: FeatureId,
    name: string,
    area: FeatureArea,
    public readonly material: BridgeMaterial,
    public readonly structure: BridgeStructure,
    public readonly length: number,
    public readonly width: number,
    public readonly maxWeight: number,
    public readonly elevation: number = 0,
    public readonly condition: number = 1.0,
    public readonly controlledAccess: boolean = false,
    priority: number = 4
  ) {
    super(id, name, FeatureCategory.ARTIFICIAL, area, priority);
    this.validateDimensions(length, width);
    this.validateWeight(maxWeight);
    this.validateCondition(condition);
  }

  getType(): string {
    return BRIDGE_FEATURE_TYPE;
  }

  canMixWith(other: MapFeature): boolean {
    // Bridges typically span over natural features
    if (other.category === FeatureCategory.NATURAL) {
      const otherType = other.getType();
      return otherType === 'river' || 
             otherType === 'stream' || 
             otherType === 'canyon';
    }
    
    // Bridges can mix with cultural features
    if (other.category === FeatureCategory.CULTURAL) {
      return true;
    }
    
    // Bridges typically connect to roads
    if (other.category === FeatureCategory.ARTIFICIAL) {
      const otherType = other.getType();
      return otherType === 'road';
    }
    
    // Bridges can sometimes span relief features like valleys
    if (other.category === FeatureCategory.RELIEF) {
      const otherType = other.getType();
      return otherType === 'valley';
    }
    
    return false;
  }

  /**
   * Get the start position of the bridge
   */
  getStartPosition(): Position {
    return this.area.position;
  }

  /**
   * Get the end position of the bridge
   */
  getEndPosition(): Position {
    // Assuming the bridge is oriented either horizontally or vertically
    if (this.area.dimensions.width > this.area.dimensions.height) {
      // Horizontal bridge
      return new Position(
        this.area.position.x + this.area.dimensions.width,
        this.area.position.y
      );
    } else {
      // Vertical bridge
      return new Position(
        this.area.position.x,
        this.area.position.y + this.area.dimensions.height
      );
    }
  }

  /**
   * Check if the bridge can support a given weight
   */
  canSupportWeight(weight: number): boolean {
    return weight <= this.maxWeight * this.condition;
  }

  /**
   * Calculate the risk of collapse based on condition and load
   */
  calculateCollapseRisk(currentLoad: number): number {
    const loadFactor = currentLoad / this.maxWeight;
    
    // Poor condition increases collapse risk
    const conditionFactor = 1 - this.condition;
    
    // Material factors - some materials degrade faster
    let materialFactor: number;
    switch (this.material) {
      case BridgeMaterial.WOOD:
        materialFactor = 0.8;
        break;
      case BridgeMaterial.STONE:
        materialFactor = 0.3;
        break;
      case BridgeMaterial.METAL:
        materialFactor = 0.4;
        break;
      case BridgeMaterial.ROPE:
        materialFactor = 0.9;
        break;
      default:
        materialFactor = 0.5;
    }
    
    // Calculate risk (0-1 scale)
    let risk = loadFactor * conditionFactor * materialFactor;
    
    // Cap the risk at 1.0
    return Math.min(risk, 1.0);
  }

  /**
   * Check if bridge is a choke point for movement
   */
  isChokePoint(): boolean {
    return this.width < 5.0 || this.controlledAccess;
  }

  /**
   * Get bridge clearance height (for water passage underneath)
   */
  getClearanceHeight(): number {
    // Different structure types have different typical clearances
    switch (this.structure) {
      case BridgeStructure.ARCH:
        return this.elevation + 4.0;
      case BridgeStructure.SUSPENSION:
        return this.elevation + 10.0;
      case BridgeStructure.BEAM:
        return this.elevation + 2.0;
      case BridgeStructure.DRAWBRIDGE:
        return this.elevation + 15.0; // When open
      case BridgeStructure.PONTOON:
        return 0; // No clearance under a pontoon bridge
      default:
        return this.elevation + 3.0;
    }
  }

  private validateDimensions(length: number, width: number): void {
    if (length <= 0) {
      throw new Error('Bridge length must be positive');
    }
    if (width <= 0) {
      throw new Error('Bridge width must be positive');
    }
  }

  private validateWeight(weight: number): void {
    if (weight <= 0) {
      throw new Error('Bridge maximum weight must be positive');
    }
  }

  private validateCondition(condition: number): void {
    if (condition < 0 || condition > 1) {
      throw new Error('Bridge condition must be between 0 and 1');
    }
  }
}