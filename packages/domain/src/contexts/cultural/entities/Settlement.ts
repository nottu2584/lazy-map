import { MapFeature, FeatureId, FeatureCategory } from '../../../common/entities/MapFeature';
import { SpatialBounds } from '../../../common/value-objects/SpatialBounds';

/**
 * Settlement-specific feature type
 */
export const SETTLEMENT_FEATURE_TYPE = 'settlement';

/**
 * Settlement types
 */
export enum SettlementType {
  VILLAGE = 'village',
  TOWN = 'town',
  CITY = 'city',
  METROPOLIS = 'metropolis',
  OUTPOST = 'outpost',
  CAMP = 'camp',
  RUINS = 'ruins',
}

/**
 * Settlement economy types
 */
export enum SettlementEconomy {
  AGRICULTURAL = 'agricultural',
  TRADING = 'trading',
  MINING = 'mining',
  FISHING = 'fishing',
  INDUSTRIAL = 'industrial',
  MILITARY = 'military',
  CULTURAL = 'cultural',
  MIXED = 'mixed',
}

/**
 * Settlement entity representing a human habitation area
 */
export class Settlement extends MapFeature {
  private _buildings: Set<string> = new Set(); // building IDs
  private _connectedRoads: Set<string> = new Set(); // road IDs

  constructor(
    id: FeatureId,
    name: string,
    area: SpatialBounds,
    public readonly settlementType: SettlementType,
    public readonly population: number,
    public readonly economy: SettlementEconomy,
    public readonly hasWalls: boolean = false,
    public readonly importanceRating: number = 0.5,
    public readonly wealthLevel: number = 0.5,
    public readonly territoryId: string | null = null,
    priority: number = 3
  ) {
    super(id, name, FeatureCategory.CULTURAL, area, priority);
    this.validatePopulation(population);
    this.validateImportance(importanceRating);
    this.validateWealth(wealthLevel);
  }

  getType(): string {
    return SETTLEMENT_FEATURE_TYPE;
  }

  canMixWith(other: MapFeature): boolean {
    // Settlements can mix with natural features like rivers
    if (other.category === FeatureCategory.NATURAL) {
      const otherType = other.getType();
      return otherType === 'river' || otherType === 'lake';
    }
    
    // Settlements can mix with relief features like hills
    if (other.category === FeatureCategory.RELIEF) {
      const otherType = other.getType();
      return otherType === 'hill' || otherType === 'valley' || otherType === 'plateau';
    }
    
    // Settlements contain buildings and roads but don't really "mix" with them
    // They define the area where buildings and roads exist
    
    // Settlements can mix with territories
    if (other.category === FeatureCategory.CULTURAL) {
      return other.getType() === 'territory';
    }
    
    return false;
  }

  /**
   * Add a building to the settlement
   */
  addBuilding(buildingId: string): void {
    this._buildings.add(buildingId);
  }

  /**
   * Remove a building from the settlement
   */
  removeBuilding(buildingId: string): void {
    this._buildings.delete(buildingId);
  }

  /**
   * Get all buildings in the settlement
   */
  getBuildings(): string[] {
    return Array.from(this._buildings);
  }

  /**
   * Add a connected road to the settlement
   */
  addConnectedRoad(roadId: string): void {
    this._connectedRoads.add(roadId);
  }

  /**
   * Remove a connected road from the settlement
   */
  removeConnectedRoad(roadId: string): void {
    this._connectedRoads.delete(roadId);
  }

  /**
   * Get all roads connected to the settlement
   */
  getConnectedRoads(): string[] {
    return Array.from(this._connectedRoads);
  }

  /**
   * Get the settlement size classification
   */
  getSettlementSize(): 'tiny' | 'small' | 'medium' | 'large' | 'huge' {
    if (this.population < 100) {
      return 'tiny';
    } else if (this.population < 1000) {
      return 'small';
    } else if (this.population < 10000) {
      return 'medium';
    } else if (this.population < 50000) {
      return 'large';
    } else {
      return 'huge';
    }
  }

  /**
   * Calculate the settlement's defensive value
   */
  calculateDefensiveValue(): number {
    // Base value depends on settlement type
    let baseValue: number;
    switch (this.settlementType) {
      case SettlementType.VILLAGE:
        baseValue = 0.2;
        break;
      case SettlementType.TOWN:
        baseValue = 0.4;
        break;
      case SettlementType.CITY:
        baseValue = 0.6;
        break;
      case SettlementType.METROPOLIS:
        baseValue = 0.8;
        break;
      case SettlementType.OUTPOST:
        baseValue = 0.5;
        break;
      case SettlementType.CAMP:
        baseValue = 0.3;
        break;
      case SettlementType.RUINS:
        baseValue = 0.1;
        break;
      default:
        baseValue = 0.3;
    }
    
    // Walls provide significant defensive bonus
    const wallBonus = this.hasWalls ? 0.5 : 0;
    
    // Wealth affects ability to maintain defenses
    const wealthFactor = this.wealthLevel * 0.3;
    
    // Calculate defensive value (0-1 scale)
    return Math.min(1.0, baseValue + wallBonus + wealthFactor);
  }

  /**
   * Calculate the commerce level of the settlement
   */
  calculateCommerceLevel(): number {
    // Population affects market size
    const populationFactor = Math.min(1.0, Math.log10(this.population) / 5);
    
    // Economy type affects commerce level
    let economyFactor: number;
    switch (this.economy) {
      case SettlementEconomy.TRADING:
        economyFactor = 1.0;
        break;
      case SettlementEconomy.INDUSTRIAL:
        economyFactor = 0.8;
        break;
      case SettlementEconomy.CULTURAL:
        economyFactor = 0.7;
        break;
      case SettlementEconomy.MIXED:
        economyFactor = 0.8;
        break;
      case SettlementEconomy.AGRICULTURAL:
        economyFactor = 0.6;
        break;
      case SettlementEconomy.MINING:
        economyFactor = 0.7;
        break;
      case SettlementEconomy.FISHING:
        economyFactor = 0.6;
        break;
      case SettlementEconomy.MILITARY:
        economyFactor = 0.5;
        break;
      default:
        economyFactor = 0.6;
    }
    
    // Road connections increase commerce
    const roadConnections = this._connectedRoads.size;
    const roadFactor = Math.min(1.0, roadConnections * 0.1);
    
    // Wealth level affects commerce
    const wealthFactor = this.wealthLevel;
    
    // Importance rating affects trade routes
    const importanceFactor = this.importanceRating;
    
    // Calculate commerce level (0-1 scale)
    return Math.min(
      1.0,
      (populationFactor * 0.3 + economyFactor * 0.3 + 
       roadFactor * 0.1 + wealthFactor * 0.2 + importanceFactor * 0.1)
    );
  }

  /**
   * Get the population density of the settlement
   */
  getPopulationDensity(): number {
    return this.population / this.area.dimensions.area;
  }

  private validatePopulation(population: number): void {
    if (population < 0) {
      throw new Error('Population cannot be negative');
    }
  }

  private validateImportance(importance: number): void {
    if (importance < 0 || importance > 1) {
      throw new Error('Importance rating must be between 0 and 1');
    }
  }

  private validateWealth(wealth: number): void {
    if (wealth < 0 || wealth > 1) {
      throw new Error('Wealth level must be between 0 and 1');
    }
  }
}