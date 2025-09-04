/**
 * Water level classification for different water features
 */
export enum WaterLevelType {
  DRY = 'dry', // Seasonal/temporary water feature that's currently dry
  SHALLOW = 'shallow', // Wade-able water (< 3 feet)
  MODERATE = 'moderate', // Swimming depth (3-10 feet)
  DEEP = 'deep', // Deep water (10-50 feet)
  VERY_DEEP = 'very_deep', // Very deep water (> 50 feet)
}

/**
 * Represents water level with depth and seasonal variation
 */
export class WaterLevel {
  constructor(
    public readonly depth: number, // Depth in feet/meters
    public readonly type: WaterLevelType,
    public readonly seasonal: boolean = false, // Whether this level varies seasonally
    public readonly minDepth: number = depth, // Minimum depth (dry season)
    public readonly maxDepth: number = depth, // Maximum depth (wet season)
  ) {
    this.validateDepth(depth);
    this.validateSeasonalRange(minDepth, maxDepth);
  }

  /**
   * Create water level from depth measurement
   */
  static fromDepth(depth: number, seasonal: boolean = false, variation: number = 0): WaterLevel {
    const type = WaterLevel.getTypeFromDepth(depth);
    const minDepth = seasonal ? Math.max(0, depth - variation) : depth;
    const maxDepth = seasonal ? depth + variation : depth;

    return new WaterLevel(depth, type, seasonal, minDepth, maxDepth);
  }

  /**
   * Create seasonal water level with variation
   */
  static seasonal(averageDepth: number, minDepth: number, maxDepth: number): WaterLevel {
    const type = WaterLevel.getTypeFromDepth(averageDepth);
    return new WaterLevel(averageDepth, type, true, minDepth, maxDepth);
  }

  /**
   * Create dry water level (seasonal water feature that's currently dry)
   */
  static dry(maxDepth: number = 2): WaterLevel {
    return new WaterLevel(0, WaterLevelType.DRY, true, 0, maxDepth);
  }

  /**
   * Determine water level type from depth
   */
  private static getTypeFromDepth(depth: number): WaterLevelType {
    if (depth <= 0) return WaterLevelType.DRY;
    if (depth <= 3) return WaterLevelType.SHALLOW;
    if (depth <= 10) return WaterLevelType.MODERATE;
    if (depth <= 50) return WaterLevelType.DEEP;
    return WaterLevelType.VERY_DEEP;
  }

  /**
   * Check if water is navigable by boats
   */
  get isNavigable(): boolean {
    return this.depth >= 3 && this.type !== WaterLevelType.DRY;
  }

  /**
   * Check if water is wadeable
   */
  get isWadeable(): boolean {
    return this.depth > 0 && this.depth <= 3;
  }

  /**
   * Check if water supports swimming
   */
  get isSwimmable(): boolean {
    return this.depth >= 3;
  }

  /**
   * Get seasonal depth for a specific season
   */
  getSeasonalDepth(season: 'spring' | 'summer' | 'autumn' | 'winter'): number {
    if (!this.seasonal) return this.depth;

    // Spring: melting/rain = higher
    // Summer: evaporation = lower
    // Autumn: moderate
    // Winter: frozen surface but maintained depth
    const seasonMultipliers = {
      spring: 0.9, // Higher water from melting/rain
      summer: 0.3, // Lower from evaporation
      autumn: 0.6, // Moderate
      winter: 0.8, // Maintained but potentially frozen
    };

    const multiplier = seasonMultipliers[season];
    const range = this.maxDepth - this.minDepth;
    return this.minDepth + range * multiplier;
  }

  /**
   * Get water level type for seasonal depth
   */
  getSeasonalType(season: 'spring' | 'summer' | 'autumn' | 'winter'): WaterLevelType {
    const seasonalDepth = this.getSeasonalDepth(season);
    return WaterLevel.getTypeFromDepth(seasonalDepth);
  }

  /**
   * Check if water feature might freeze in winter
   */
  get canFreeze(): boolean {
    return this.depth <= 20; // Shallow to moderate depth water can freeze
  }

  /**
   * Calculate water volume for a given area (cubic units)
   */
  calculateVolume(surfaceArea: number): number {
    return surfaceArea * this.depth;
  }

  /**
   * Combine with another water level (for confluences/connections)
   */
  combineWith(other: WaterLevel): WaterLevel {
    // Average the depths, take the deeper type
    const combinedDepth = (this.depth + other.depth) / 2;
    const combinedSeasonal = this.seasonal || other.seasonal;
    const combinedMinDepth = Math.min(this.minDepth, other.minDepth);
    const combinedMaxDepth = Math.max(this.maxDepth, other.maxDepth);

    const newType = WaterLevel.getTypeFromDepth(Math.max(this.depth, other.depth));

    return new WaterLevel(
      combinedDepth,
      newType,
      combinedSeasonal,
      combinedMinDepth,
      combinedMaxDepth,
    );
  }

  private validateDepth(depth: number): void {
    if (!Number.isFinite(depth) || depth < 0) {
      throw new Error('Water depth must be a non-negative finite number');
    }
  }

  private validateSeasonalRange(minDepth: number, maxDepth: number): void {
    if (!Number.isFinite(minDepth) || !Number.isFinite(maxDepth)) {
      throw new Error('Seasonal depth range must be finite numbers');
    }
    if (minDepth < 0) {
      throw new Error('Minimum depth cannot be negative');
    }
    if (maxDepth < minDepth) {
      throw new Error('Maximum depth must be greater than or equal to minimum depth');
    }
  }

  equals(other: WaterLevel): boolean {
    return (
      Math.abs(this.depth - other.depth) < 0.1 &&
      this.type === other.type &&
      this.seasonal === other.seasonal &&
      Math.abs(this.minDepth - other.minDepth) < 0.1 &&
      Math.abs(this.maxDepth - other.maxDepth) < 0.1
    );
  }

  toString(): string {
    if (this.seasonal) {
      return `WaterLevel(${this.type}, ${this.depth}ft, seasonal: ${this.minDepth}-${this.maxDepth}ft)`;
    }
    return `WaterLevel(${this.type}, ${this.depth}ft)`;
  }
}
