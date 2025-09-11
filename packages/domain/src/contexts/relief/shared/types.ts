import { Position } from '../../../common/value-objects';
import { TerrainType } from '../value-objects';
import { MapTile } from '../../../map/entities';

// Re-export TerrainType for convenience
export { TerrainType };

// Re-export MapTile for convenience
export { MapTile };

// Tile inclination represents height at each edge
export interface TileInclination {
  top: number; // Height multiplier for north edge
  right: number; // Height multiplier for east edge
  bottom: number; // Height multiplier for south edge
  left: number; // Height multiplier for west edge
}

// Terrain configuration interface
export interface TerrainConfig {
  color: string;
  movementCost: number;
  isBlocked: boolean;
  description: string;
}
