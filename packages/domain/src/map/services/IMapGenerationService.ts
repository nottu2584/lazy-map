import { Dimensions } from '../../common/value-objects/Dimensions';
import { HydrographicGenerationSettings } from '../../contexts/natural/services/IHydrographicGenerationService';
import { MapGrid } from '../entities';

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

  // Hydrographic generation settings
  hydrographicSettings?: HydrographicGenerationSettings;
  integrateWaterFeatures?: boolean;
}

/**
 * Result of map generation operation
 */
export interface MapGenerationResult {
  map: MapGrid;
  generationTime: number;
  featuresGenerated: number;
  warnings: string[];

  // Hydrographic generation results
  waterFeatures?: {
    riversGenerated: number;
    lakesGenerated: number;
    springsGenerated: number;
    pondsGenerated: number;
    wetlandsGenerated: number;
    totalWaterCoverage: number;
    interconnectionScore: number;
    biodiversityScore: number;
  };
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