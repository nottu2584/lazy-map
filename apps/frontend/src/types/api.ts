/**
 * API request and response type definitions
 * Contracts between frontend and backend services
 */

/**
 * Request payload for generating a tactical map
 */
export interface GenerateMapRequest {
  name?: string;
  width?: number;
  height?: number;
  dimensions?: {
    width: number;
    height: number;
  };
  seed?: string | number;

  // Context parameters (override seed-derived defaults)
  biome?: string;
  elevation?: string;
  hydrology?: string;
  development?: string;
  season?: string;
  requiredFeatures?: {
    hasRoad?: boolean;
    hasBridge?: boolean;
    hasRuins?: boolean;
    hasCave?: boolean;
    hasWater?: boolean;
    hasCliff?: boolean;
  };

  // Advanced settings
  terrainRuggedness?: number; // 0.5-2.0: Controls terrain detail and roughness
  waterAbundance?: number; // 0.5-2.0: Controls frequency of water features
  vegetationMultiplier?: number; // 0.0-2.0: Controls forest coverage and density
}

/**
 * Response from tactical map generation endpoint.
 *
 * The backend returns layer data at the map level (2D tile arrays per layer),
 * NOT nested inside each individual tile.
 */
export interface TacticalMapResponse {
  map: {
    width: number;
    height: number;
    seed: number;
    context: {
      biome: string;
      elevation: string;
      hydrology: string;
      development: string;
      season: string;
      requiredFeatures?: Record<string, boolean>;
    };
    layers: {
      geology: import('./layers').GeologyLayerDataDTO;
      topography: import('./layers').TopographyLayerDataDTO;
      hydrology: import('./layers').HydrologyLayerDataDTO;
      vegetation: import('./layers').VegetationLayerDataDTO;
      structures: import('./layers').StructuresLayerDataDTO;
      features: import('./layers').FeaturesLayerDataDTO;
    };
    generationTime: number;
  };
  width: number;
  height: number;
  context?: string;
  totalTime: number;
}
