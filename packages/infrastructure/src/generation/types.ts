import { Dimensions, BaseMetadata } from '@lazy-map/domain';
import { TerrainType, MapTile } from '@lazy-map/domain';
import { MapFeature, FeatureGenerationSettings } from '@lazy-map/domain';

// Map generation settings
export interface MapGenerationSettings {
  dimensions: Dimensions;
  cellSize: number;
  seed?: number;
  terrainDistribution: Partial<Record<TerrainType, number>>;
  elevationVariance: number;
  elevationMultiplier: number; // Base multiplier for all elevation heights (tile size multiplier)
  addHeightNoise: boolean; // Whether to add random variations to height
  heightVariance: number; // Controls the variation in height multipliers (only when addHeightNoise is true)
  inclinationChance: number; // Probability of tiles having inclination (0-1)
  generateRivers: boolean;
  generateRoads: boolean;
  generateBuildings: boolean;
  biomeType?: 'temperate' | 'tropical' | 'arctic' | 'desert' | 'mixed';

  // Feature generation settings
  featureSettings: FeatureGenerationSettings;
}

// Grid map interface
export interface GridMap {
  id: string;
  name: string;
  dimensions: Dimensions;
  cellSize: number;
  tiles: MapTile[][];
  features: MapFeature[]; // Geographic and structural features
  metadata: BaseMetadata;
}
