import { Seed } from '../../common/value-objects/Seed';

/**
 * Biome types for tactical map generation
 */
export enum BiomeType {
  FOREST = 'forest',
  MOUNTAIN = 'mountain',
  PLAINS = 'plains',
  SWAMP = 'swamp',
  DESERT = 'desert',
  COASTAL = 'coastal',
  UNDERGROUND = 'underground'
}

/**
 * Elevation zones for tactical context
 */
export enum ElevationZone {
  LOWLAND = 'lowland',     // 0-500ft above sea level
  FOOTHILLS = 'foothills', // 500-2000ft
  HIGHLAND = 'highland',   // 2000-5000ft
  ALPINE = 'alpine'        // 5000ft+
}

/**
 * Water presence types
 */
export enum HydrologyType {
  ARID = 'arid',           // No water features
  SEASONAL = 'seasonal',   // Seasonal streams
  STREAM = 'stream',       // Permanent stream
  RIVER = 'river',         // Major river
  LAKE = 'lake',           // Lake or pond
  COASTAL = 'coastal',     // Ocean/sea shore
  WETLAND = 'wetland'      // Marsh/swamp
}

/**
 * Development level of the area
 */
export enum DevelopmentLevel {
  WILDERNESS = 'wilderness',  // Untouched nature
  FRONTIER = 'frontier',      // Minimal human presence
  RURAL = 'rural',           // Farms, villages
  SETTLED = 'settled',       // Towns, roads
  URBAN = 'urban',           // City outskirts
  RUINS = 'ruins'            // Abandoned structures
}

/**
 * Season affects vegetation and water
 */
export enum Season {
  SPRING = 'spring',
  SUMMER = 'summer',
  AUTUMN = 'autumn',
  WINTER = 'winter'
}

/**
 * Optional features that must appear on the map
 */
export interface RequiredFeatures {
  hasRoad?: boolean;
  hasBridge?: boolean;
  hasRuins?: boolean;
  hasCave?: boolean;
  hasWater?: boolean;
  hasCliff?: boolean;
}

/**
 * Context for tactical map generation
 * Determines the overall characteristics of the generated battlemap
 */
export class TacticalMapContext {
  constructor(
    public readonly biome: BiomeType,
    public readonly elevation: ElevationZone,
    public readonly hydrology: HydrologyType,
    public readonly development: DevelopmentLevel,
    public readonly season: Season,
    public readonly requiredFeatures?: RequiredFeatures
  ) {
    this.validateContext();
  }

  /**
   * Generate a context deterministically from a seed
   */
  static fromSeed(seed: Seed): TacticalMapContext {
    // Use seed to deterministically generate context
    const value = seed.getValue();

    // Simple deterministic selection based on seed value
    const biomes = Object.values(BiomeType);
    const elevations = Object.values(ElevationZone);
    const hydrologies = Object.values(HydrologyType);
    const developments = Object.values(DevelopmentLevel);
    const seasons = Object.values(Season);

    // Use different parts of the seed for different attributes
    const biomeIndex = Math.abs(value % biomes.length);
    const elevationIndex = Math.abs(Math.floor(value / 100) % elevations.length);
    const hydrologyIndex = Math.abs(Math.floor(value / 10000) % hydrologies.length);
    const developmentIndex = Math.abs(Math.floor(value / 1000000) % developments.length);
    const seasonIndex = Math.abs(Math.floor(value / 100000000) % seasons.length);

    return new TacticalMapContext(
      biomes[biomeIndex],
      elevations[elevationIndex],
      hydrologies[hydrologyIndex],
      developments[developmentIndex],
      seasons[seasonIndex]
    );
  }

  /**
   * Create a specific context with required features
   */
  static create(
    biome: BiomeType,
    elevation: ElevationZone,
    hydrology: HydrologyType,
    development: DevelopmentLevel,
    season: Season,
    requiredFeatures?: RequiredFeatures
  ): TacticalMapContext {
    return new TacticalMapContext(
      biome,
      elevation,
      hydrology,
      development,
      season,
      requiredFeatures
    );
  }

  /**
   * Validate that context combinations make sense
   */
  private validateContext(): void {
    // Underground biome shouldn't be alpine elevation
    if (this.biome === BiomeType.UNDERGROUND && this.elevation === ElevationZone.ALPINE) {
      throw new Error('Underground biome cannot be at alpine elevation');
    }

    // Desert shouldn't have permanent water features
    if (this.biome === BiomeType.DESERT &&
        (this.hydrology === HydrologyType.RIVER ||
         this.hydrology === HydrologyType.LAKE ||
         this.hydrology === HydrologyType.WETLAND)) {
      throw new Error('Desert biome incompatible with permanent water features');
    }

    // Coastal biome should have coastal hydrology
    if (this.biome === BiomeType.COASTAL && this.hydrology !== HydrologyType.COASTAL) {
      throw new Error('Coastal biome must have coastal hydrology');
    }

    // Swamp biome should have wetland hydrology
    if (this.biome === BiomeType.SWAMP && this.hydrology !== HydrologyType.WETLAND) {
      throw new Error('Swamp biome must have wetland hydrology');
    }
  }

  /**
   * Get a description of this context
   */
  getDescription(): string {
    const features = this.requiredFeatures;
    let desc = `${this.season} ${this.elevation} ${this.biome}`;

    if (this.hydrology !== HydrologyType.ARID) {
      desc += ` with ${this.hydrology}`;
    }

    if (this.development !== DevelopmentLevel.WILDERNESS) {
      desc += ` (${this.development})`;
    }

    if (features) {
      const featureList = [];
      if (features.hasRoad) featureList.push('road');
      if (features.hasBridge) featureList.push('bridge');
      if (features.hasRuins) featureList.push('ruins');
      if (features.hasCave) featureList.push('cave');
      if (features.hasCliff) featureList.push('cliff');
      if (featureList.length > 0) {
        desc += ` featuring ${featureList.join(', ')}`;
      }
    }

    return desc;
  }

  /**
   * Check if this context should have certain features
   */
  shouldHaveCliffs(): boolean {
    return this.biome === BiomeType.MOUNTAIN ||
           this.elevation === ElevationZone.HIGHLAND ||
           this.elevation === ElevationZone.ALPINE;
  }

  shouldHaveDenseVegetation(): boolean {
    return (this.biome === BiomeType.FOREST || this.biome === BiomeType.SWAMP) &&
           this.season !== Season.WINTER;
  }

  shouldHaveSnow(): boolean {
    return this.season === Season.WINTER &&
           (this.elevation === ElevationZone.ALPINE ||
            (this.elevation === ElevationZone.HIGHLAND && this.biome === BiomeType.MOUNTAIN));
  }

  /**
   * Get the typical visibility range for this context (in tiles)
   */
  getVisibilityRange(): number {
    if (this.biome === BiomeType.UNDERGROUND) return 10; // Darkness
    if (this.biome === BiomeType.FOREST && this.shouldHaveDenseVegetation()) return 15;
    if (this.biome === BiomeType.SWAMP) return 20;
    if (this.biome === BiomeType.DESERT || this.biome === BiomeType.PLAINS) return 50;
    return 30; // Default
  }
}