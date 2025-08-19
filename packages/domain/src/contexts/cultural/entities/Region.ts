import { MapFeature, FeatureId, FeatureCategory } from '../../../common/entities/MapFeature';
import { FeatureArea } from '../../../common/value-objects/FeatureArea';

/**
 * Region-specific feature type
 */
export const REGION_FEATURE_TYPE = 'region';

/**
 * Region types
 */
export enum RegionType {
  GEOGRAPHIC = 'geographic',
  CULTURAL = 'cultural',
  POLITICAL = 'political',
  ECONOMIC = 'economic',
  CLIMATE = 'climate',
  HISTORICAL = 'historical',
}

/**
 * Region entity representing a named area with specific characteristics
 */
export class Region extends MapFeature {
  private _subregions: Set<string> = new Set(); // subregion IDs
  private _tags: Set<string> = new Set(); // descriptive tags

  constructor(
    id: FeatureId,
    name: string,
    area: FeatureArea,
    public readonly regionType: RegionType,
    public readonly description: string,
    public readonly significance: number = 0.5,
    public readonly populationDensity: number = 0.5,
    public readonly dangerLevel: number = 0.2,
    priority: number = 1
  ) {
    super(id, name, FeatureCategory.CULTURAL, area, priority);
    this.validateSignificance(significance);
    this.validatePopulationDensity(populationDensity);
    this.validateDangerLevel(dangerLevel);
  }

  getType(): string {
    return REGION_FEATURE_TYPE;
  }

  canMixWith(other: MapFeature): boolean {
    // Regions can overlap with all other feature types
    // They're abstract cultural divisions that don't physically interfere
    return true;
  }

  /**
   * Add a subregion to this region
   */
  addSubregion(regionId: string): void {
    this._subregions.add(regionId);
  }

  /**
   * Remove a subregion from this region
   */
  removeSubregion(regionId: string): void {
    this._subregions.delete(regionId);
  }

  /**
   * Get all subregions
   */
  getSubregions(): string[] {
    return Array.from(this._subregions);
  }

  /**
   * Add a descriptive tag
   */
  addTag(tag: string): void {
    this._tags.add(tag.toLowerCase());
  }

  /**
   * Remove a descriptive tag
   */
  removeTag(tag: string): void {
    this._tags.delete(tag.toLowerCase());
  }

  /**
   * Check if the region has a specific tag
   */
  hasTag(tag: string): boolean {
    return this._tags.has(tag.toLowerCase());
  }

  /**
   * Get all descriptive tags
   */
  getTags(): string[] {
    return Array.from(this._tags);
  }

  /**
   * Calculate the region's travel difficulty based on danger level and terrain
   */
  calculateTravelDifficulty(): number {
    // Base difficulty from danger level
    const dangerFactor = this.dangerLevel * 0.7;
    
    // Region type affects difficulty
    let typeFactor: number;
    switch (this.regionType) {
      case RegionType.GEOGRAPHIC:
        typeFactor = 0.6;
        break;
      case RegionType.CULTURAL:
        typeFactor = 0.2;
        break;
      case RegionType.POLITICAL:
        typeFactor = 0.3;
        break;
      case RegionType.ECONOMIC:
        typeFactor = 0.1;
        break;
      case RegionType.CLIMATE:
        typeFactor = 0.7;
        break;
      case RegionType.HISTORICAL:
        typeFactor = 0.2;
        break;
      default:
        typeFactor = 0.3;
    }
    
    // Population density affects infrastructure and safety
    const populationFactor = 1 - (this.populationDensity * 0.8);
    
    // Calculate travel difficulty (0-1 scale)
    return Math.min(1.0, dangerFactor + typeFactor * populationFactor);
  }

  /**
   * Determine if the region has cultural significance
   */
  hasCulturalSignificance(): boolean {
    return this.significance > 0.7 || 
           this.regionType === RegionType.CULTURAL || 
           this.regionType === RegionType.HISTORICAL;
  }

  /**
   * Determine if the region is densely populated
   */
  isDenselyPopulated(): boolean {
    return this.populationDensity > 0.7;
  }

  /**
   * Get the dominant characteristic of the region
   */
  getDominantCharacteristic(): string {
    // Return the most significant tag or a description based on properties
    if (this._tags.size > 0) {
      // This is simplified; in a real implementation, tags might have weights
      return Array.from(this._tags)[0];
    }
    
    // Fall back to region type
    switch (this.regionType) {
      case RegionType.GEOGRAPHIC:
        return 'topographical';
      case RegionType.CULTURAL:
        return 'cultural heritage';
      case RegionType.POLITICAL:
        return 'political jurisdiction';
      case RegionType.ECONOMIC:
        return 'economic activity';
      case RegionType.CLIMATE:
        return 'climate zone';
      case RegionType.HISTORICAL:
        return 'historical significance';
      default:
        return 'regional identity';
    }
  }

  private validateSignificance(significance: number): void {
    if (significance < 0 || significance > 1) {
      throw new Error('Region significance must be between 0 and 1');
    }
  }

  private validatePopulationDensity(density: number): void {
    if (density < 0 || density > 1) {
      throw new Error('Population density must be between 0 and 1');
    }
  }

  private validateDangerLevel(danger: number): void {
    if (danger < 0 || danger > 1) {
      throw new Error('Danger level must be between 0 and 1');
    }
  }
}