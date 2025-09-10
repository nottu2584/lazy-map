import { MapGrid, MapId } from '@lazy-map/domain';

/**
 * Command for generating a new map
 */
export interface GenerateMapCommand {
  name: string;
  width: number;
  height: number;
  cellSize?: number;
  seed?: number;
  author?: string;
  description?: string;
  tags?: string[];
  userId?: string;
  
  // Terrain settings
  terrainDistribution?: Record<string, number>;
  elevationVariance?: number;
  elevationMultiplier?: number;
  addHeightNoise?: boolean;
  heightVariance?: number;
  inclinationChance?: number;
  
  // Feature settings
  generateRivers?: boolean;
  generateRoads?: boolean;
  generateBuildings?: boolean;
  generateForests?: boolean;
  biomeType?: 'temperate' | 'tropical' | 'arctic' | 'desert' | 'mixed';
  
  // Forest-specific settings
  forestSettings?: {
    forestDensity?: number;
    treeDensity?: number;
    treeClumping?: number;
    allowTreeOverlap?: boolean;
    enableInosculation?: boolean;
    preferredSpecies?: string[];
    underbrushDensity?: number;
  };
}

/**
 * Result of map generation
 */
export interface MapGenerationResult {
  success: boolean;
  map?: MapGrid;
  error?: string;
  warnings?: string[];
  generationTime?: number;
  featuresGenerated?: number;
}

/**
 * Validation result for map settings
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Primary port for map generation operations
 * This is what external systems (controllers, CLI, etc.) will call
 */
export interface IMapGenerationPort {
  /**
   * Generates a new map based on the provided command
   */
  generateMap(command: GenerateMapCommand): Promise<MapGenerationResult>;

  /**
   * Validates map generation settings before generation
   */
  validateSettings(command: GenerateMapCommand): Promise<ValidationResult>;

  /**
   * Gets default settings for map generation
   */
  getDefaultSettings(): GenerateMapCommand;

  /**
   * Gets available biome types
   */
  getAvailableBiomes(): string[];

  /**
   * Gets available tree species for a biome
   */
  getTreeSpeciesForBiome(biome: string): string[];
}