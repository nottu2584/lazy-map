import { MapFeature, FeatureCategory } from '../../../common/entities/MapFeature';
import { FeatureId } from '../../../common/entities/../value-objects';
import { SpatialBounds } from '../../../common/value-objects/SpatialBounds';
import { Position } from '../../../common/value-objects/Position';

/**
 * Territory-specific feature type
 */
export const TERRITORY_FEATURE_TYPE = 'territory';

/**
 * Territory types
 */
export enum TerritoryType {
  KINGDOM = 'kingdom',
  EMPIRE = 'empire',
  DUCHY = 'duchy',
  COUNTY = 'county',
  CITY_STATE = 'city_state',
  TRIBAL = 'tribal',
  COLONY = 'colony',
  DISPUTED = 'disputed',
}

/**
 * Territory government types
 */
export enum GovernmentType {
  MONARCHY = 'monarchy',
  REPUBLIC = 'republic',
  DEMOCRACY = 'democracy',
  THEOCRACY = 'theocracy',
  OLIGARCHY = 'oligarchy',
  DICTATORSHIP = 'dictatorship',
  TRIBAL_COUNCIL = 'tribal_council',
  ANARCHY = 'anarchy',
}

/**
 * Territory entity representing a controlled region with borders
 */
export class Territory extends MapFeature {
  private _borderPoints: Position[] = [];
  private _settlements: Set<string> = new Set(); // settlement IDs
  private _neighbors: Set<string> = new Set(); // neighboring territory IDs
  
  constructor(
    id: FeatureId,
    name: string,
    area: SpatialBounds,
    public readonly territoryType: TerritoryType,
    public readonly government: GovernmentType,
    public readonly population: number,
    public readonly capital: string | null = null,
    public readonly stabilityFactor: number = 0.8,
    public readonly resourceRichness: number = 0.5,
    public readonly color: string = '#777777',
    priority: number = 1
  ) {
    super(id, name, FeatureCategory.CULTURAL, area, priority);
    this.validatePopulation(population);
    this.validateStability(stabilityFactor);
    this.validateResourceRichness(resourceRichness);
  }

  getType(): string {
    return TERRITORY_FEATURE_TYPE;
  }

  canMixWith(other: MapFeature): boolean {
    // Territories can overlap with all other feature types
    // as they are abstract boundaries rather than physical features
    return true;
  }

  /**
   * Add a border point to define the territory's boundaries
   */
  addBorderPoint(position: Position): void {
    this._borderPoints.push(position);
  }

  /**
   * Get all border points
   */
  getBorderPoints(): Position[] {
    return [...this._borderPoints];
  }

  /**
   * Add a settlement to the territory
   */
  addSettlement(settlementId: string): void {
    this._settlements.add(settlementId);
  }

  /**
   * Remove a settlement from the territory
   */
  removeSettlement(settlementId: string): void {
    this._settlements.delete(settlementId);
  }

  /**
   * Get all settlements in the territory
   */
  getSettlements(): string[] {
    return Array.from(this._settlements);
  }

  /**
   * Add a neighboring territory
   */
  addNeighbor(territoryId: string): void {
    this._neighbors.add(territoryId);
  }

  /**
   * Remove a neighboring territory
   */
  removeNeighbor(territoryId: string): void {
    this._neighbors.delete(territoryId);
  }

  /**
   * Get all neighboring territories
   */
  getNeighbors(): string[] {
    return Array.from(this._neighbors);
  }

  /**
   * Calculate the territory's military strength based on population and stability
   */
  calculateMilitaryStrength(): number {
    const populationFactor = Math.log10(Math.max(1000, this.population)) / 6;
    
    // Government type affects military organization
    let governmentFactor: number;
    switch (this.government) {
      case GovernmentType.MONARCHY:
        governmentFactor = 0.8;
        break;
      case GovernmentType.REPUBLIC:
        governmentFactor = 0.7;
        break;
      case GovernmentType.DEMOCRACY:
        governmentFactor = 0.6;
        break;
      case GovernmentType.THEOCRACY:
        governmentFactor = 0.7;
        break;
      case GovernmentType.OLIGARCHY:
        governmentFactor = 0.8;
        break;
      case GovernmentType.DICTATORSHIP:
        governmentFactor = 0.9;
        break;
      case GovernmentType.TRIBAL_COUNCIL:
        governmentFactor = 0.6;
        break;
      default:
        governmentFactor = 0.5;
    }
    
    // Territory type affects military capacity
    let territoryFactor: number;
    switch (this.territoryType) {
      case TerritoryType.EMPIRE:
        territoryFactor = 1.2;
        break;
      case TerritoryType.KINGDOM:
        territoryFactor = 1.0;
        break;
      case TerritoryType.DUCHY:
        territoryFactor = 0.8;
        break;
      case TerritoryType.COUNTY:
        territoryFactor = 0.6;
        break;
      case TerritoryType.CITY_STATE:
        territoryFactor = 0.7;
        break;
      case TerritoryType.TRIBAL:
        territoryFactor = 0.5;
        break;
      default:
        territoryFactor = 0.7;
    }
    
    // Calculate military strength
    return populationFactor * governmentFactor * territoryFactor * 
           this.stabilityFactor * (0.7 + (0.6 * this.resourceRichness));
  }

  /**
   * Calculate the prosperity level of the territory
   */
  calculateProsperity(): number {
    // Stability strongly affects prosperity
    const stabilityEffect = this.stabilityFactor * 1.5;
    
    // Resources and population contribute to prosperity
    const resourceEffect = this.resourceRichness;
    const populationEffect = Math.min(1.0, this.population / 1000000) * 0.8;
    
    // Government affects economic policies
    let governmentEffect: number;
    switch (this.government) {
      case GovernmentType.REPUBLIC:
        governmentEffect = 0.9;
        break;
      case GovernmentType.DEMOCRACY:
        governmentEffect = 0.85;
        break;
      case GovernmentType.MONARCHY:
        governmentEffect = 0.7;
        break;
      case GovernmentType.OLIGARCHY:
        governmentEffect = 0.75;
        break;
      case GovernmentType.THEOCRACY:
        governmentEffect = 0.6;
        break;
      case GovernmentType.DICTATORSHIP:
        governmentEffect = 0.5;
        break;
      case GovernmentType.TRIBAL_COUNCIL:
        governmentEffect = 0.55;
        break;
      case GovernmentType.ANARCHY:
        governmentEffect = 0.3;
        break;
      default:
        governmentEffect = 0.6;
    }
    
    // Calculate prosperity (0-1 scale)
    return Math.min(
      1.0,
      (stabilityEffect * 0.4 + resourceEffect * 0.3 + 
       populationEffect * 0.15 + governmentEffect * 0.15)
    );
  }

  /**
   * Check if a position is within the territory's claimed borders
   */
  isWithinBorders(position: Position): boolean {
    // Simple implementation using area
    return this.area.contains(position);
    
    // A more sophisticated implementation would use the border points to
    // define an irregular polygon and check if the position is inside it
  }

  private validatePopulation(population: number): void {
    if (population < 0) {
      throw new Error('Population cannot be negative');
    }
  }

  private validateStability(stability: number): void {
    if (stability < 0 || stability > 1) {
      throw new Error('Stability factor must be between 0 and 1');
    }
  }

  private validateResourceRichness(resourceRichness: number): void {
    if (resourceRichness < 0 || resourceRichness > 1) {
      throw new Error('Resource richness must be between 0 and 1');
    }
  }
}