import { generateId } from '../../../shared';
import { Position } from '../../../common/value-objects';
import { MapTile, TerrainType, TERRAIN_CONFIG } from './index';

// Tile creation utilities
export function createEmptyTile(x: number, y: number): MapTile {
  return {
    id: generateId(),
    position: new Position(x, y),
    terrainType: TerrainType.GRASS,
    heightMultiplier: 1, // Default to 1x tile height
    inclination: {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    },
    isBlocked: false,
    movementCost: 1,
    visibility: true,
  };
}

// Terrain utilities
export function getTerrainColor(terrainType: TerrainType): string {
  return TERRAIN_CONFIG[terrainType]?.color || '#FFFFFF';
}

export function getMovementCost(terrainType: TerrainType): number {
  return TERRAIN_CONFIG[terrainType]?.movementCost || 1;
}

export function isTerrainBlocked(terrainType: TerrainType): boolean {
  return TERRAIN_CONFIG[terrainType]?.isBlocked || false;
}

export function getTerrainDescription(terrainType: TerrainType): string {
  return TERRAIN_CONFIG[terrainType]?.description || 'Unknown terrain';
}
