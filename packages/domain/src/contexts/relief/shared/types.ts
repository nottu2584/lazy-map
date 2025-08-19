import { Position } from '../../../common/value-objects';

// Terrain types
export enum TerrainType {
  GRASS = 'grass',
  FOREST = 'forest',
  MOUNTAIN = 'mountain',
  WATER = 'water',
  DESERT = 'desert',
  SNOW = 'snow',
  SWAMP = 'swamp',
  ROCK = 'rock',
  CAVE = 'cave',
  ROAD = 'road',
  BUILDING = 'building',
  WALL = 'wall',
}

// Tile inclination represents height at each edge
export interface TileInclination {
  top: number; // Height multiplier for north edge
  right: number; // Height multiplier for east edge
  bottom: number; // Height multiplier for south edge
  left: number; // Height multiplier for west edge
}

// Core tile interface
export interface MapTile {
  id: string;
  position: Position;
  terrainType: TerrainType;
  heightMultiplier: number; // Height as a multiple of tileSize
  inclination: TileInclination; // Specific heights for edges
  isBlocked: boolean;
  movementCost: number;
  visibility: boolean;
  customProperties?: Record<string, any>;

  // Feature mixing support (populated by features package)
  mixedFeatures?: string[]; // IDs of features that affect this tile
  primaryFeature?: string; // ID of the dominant feature (for primary terrain/height)
}

// Terrain configuration interface
export interface TerrainConfig {
  color: string;
  movementCost: number;
  isBlocked: boolean;
  description: string;
}
