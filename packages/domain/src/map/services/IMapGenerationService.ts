import { GridMap } from '../entities';
import { Dimensions } from '../../common/value-objects/Dimensions';

/**
 * Settings for map generation
 */
export interface MapGenerationSettings {
  dimensions: Dimensions;
  cellSize: number;
  seed?: number;
  terrainDistribution: Record<string, number>;
  elevationVariance: number;
  elevationMultiplier: number;
  addHeightNoise: boolean;
  heightVariance: number;
  inclinationChance: number;
  generateRivers: boolean;
  generateRoads: boolean;
  generateBuildings: boolean;
  biomeType?: 'temperate' | 'tropical' | 'arctic' | 'desert' | 'mixed';
}

/**
 * Result of map generation operation
 */
export interface MapGenerationResult {
  map: GridMap;
  generationTime: number;
  featuresGenerated: number;
  warnings: string[];
}

/**
 * Domain service interface for map generation
 */
export interface IMapGenerationService {
  /**
   * Generates a complete map with all features
   */
  generateMap(settings: MapGenerationSettings): Promise<MapGenerationResult>;

  /**
   * Validates map generation settings
   */
  validateSettings(settings: MapGenerationSettings): Promise<string[]>;

  /**
   * Gets supported biome types
   */
  getSupportedBiomes(): string[];
}