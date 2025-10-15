import { Position } from '../../../common/value-objects';
import { MapTile } from '../../../map/entities';
import { Terrain } from '../value-objects';
import { TERRAIN_CONFIG, TerrainType } from './index';

// Tile creation utilities
export function createEmptyTile(x: number, y: number): MapTile {
  const position = new Position(x, y);
  return new MapTile(position, Terrain.grass(), 1.0);
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
