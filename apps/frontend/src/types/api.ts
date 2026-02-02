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
  cellSize?: number;

  // Advanced settings
  terrainRuggedness?: number; // 0.5-2.0: Controls terrain detail and roughness
  waterAbundance?: number; // 0.5-2.0: Controls frequency of water features
  vegetationMultiplier?: number; // 0.0-2.0: Controls forest coverage and density
}

/**
 * Response from tactical map generation endpoint
 */
export interface TacticalMapResponse {
  map: {
    width: number;
    height: number;
    tiles: Array<{
      position: {
        x: number;
        y: number;
      };
      terrain: {
        type: string;
        movementCost: number;
        isPassable: boolean;
      };
      elevation: number;
      layers: {
        geology?: any;
        topography?: any;
        hydrology?: any;
        vegetation?: any;
        structures?: any;
        features?: any;
      };
    }>;
    context?: {
      biome: string;
      elevation: string;
      development: string;
      description?: string;
    };
  };
  width: number;
  height: number;
  context?: string;
  totalTime: number;
}
