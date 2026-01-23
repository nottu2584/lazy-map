export interface MapSettings {
  // Basic settings (always required)
  name: string;
  width: number;
  height: number;
  cellSize: number;
  seed?: string;

  // Advanced settings (optional, collapsed by default)
  advancedSettings?: AdvancedMapSettings;
}

export interface AdvancedMapSettings {
  elevation?: {
    variance?: number;          // 0-1: Amount of elevation variance (terrain ruggedness)
    multiplier?: number;         // 0+: Elevation multiplier factor
    addNoise?: boolean;         // Whether to add noise to height values
    heightVariance?: number;    // 0-1: Height variance amount
    inclinationChance?: number; // 0-1: Chance of inclination between tiles
  };

  vegetation?: {
    forestDensity?: number;      // 0-1: Percentage of forest coverage
    treeDensity?: number;        // 0-1: Density of trees within forests
    treeClumping?: number;       // 0-1: Tendency for trees to group together
    underbrushDensity?: number;  // 0-1: Density of underbrush
    allowTreeOverlap?: boolean;  // Whether trees can overlap
    enableInosculation?: boolean; // Enable tree grafting/inosculation
    preferredSpecies?: string[]; // Preferred tree species
  };

  terrainDistribution?: {
    grassland?: number; // 0-1: Grassland terrain percentage
    forest?: number;    // 0-1: Forest terrain percentage
    mountain?: number;  // 0-1: Mountain terrain percentage
    water?: number;     // 0-1: Water terrain percentage
    desert?: number;    // 0-1: Desert terrain percentage
    swamp?: number;     // 0-1: Swamp terrain percentage
  };

  features?: {
    generateForests?: boolean;   // Generate forest features
    generateRivers?: boolean;    // Generate river features
    generateRoads?: boolean;     // Generate road networks
    generateBuildings?: boolean; // Generate structures
  };

  biomeOverride?: string; // Optional biome type override
}

export interface GeneratedMap {
  id: string;
  name: string;
  width: number;
  height: number;
  cellSize: number;
  seed?: string | number;
  metadata?: Record<string, any>;
  tiles: Array<{
    x: number;
    y: number;
    terrain: string;
    elevation: number;
    features: string[];
  }>;
}

export interface SeedValidationResult {
  valid: boolean;
  error?: string;
  warnings?: string[];
  normalizedSeed?: number;
}
