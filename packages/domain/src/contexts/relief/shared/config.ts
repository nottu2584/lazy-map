import { TerrainType, TerrainConfig } from './types';

// Terrain configuration
export const TERRAIN_CONFIG: Record<TerrainType, TerrainConfig> = {
  [TerrainType.GRASS]: {
    color: '#4CAF50',
    movementCost: 1,
    isBlocked: false,
    description: 'Open grassland',
  },
  [TerrainType.FOREST]: {
    color: '#2E7D32',
    movementCost: 2,
    isBlocked: false,
    description: 'Dense forest',
  },
  [TerrainType.MOUNTAIN]: {
    color: '#795548',
    movementCost: 3,
    isBlocked: false,
    description: 'Rocky mountain',
  },
  [TerrainType.WATER]: {
    color: '#2196F3',
    movementCost: 999,
    isBlocked: true,
    description: 'Deep water',
  },
  [TerrainType.DESERT]: {
    color: '#FFC107',
    movementCost: 2,
    isBlocked: false,
    description: 'Sandy desert',
  },
  [TerrainType.SNOW]: {
    color: '#E1F5FE',
    movementCost: 2,
    isBlocked: false,
    description: 'Snow-covered ground',
  },
  [TerrainType.SWAMP]: {
    color: '#4E342E',
    movementCost: 3,
    isBlocked: false,
    description: 'Muddy swampland',
  },
  [TerrainType.ROCK]: {
    color: '#616161',
    movementCost: 2,
    isBlocked: false,
    description: 'Rocky terrain',
  },
  [TerrainType.CAVE]: {
    color: '#212121',
    movementCost: 1,
    isBlocked: false,
    description: 'Cave entrance',
  },
  [TerrainType.ROAD]: {
    color: '#424242',
    movementCost: 0.5,
    isBlocked: false,
    description: 'Paved road',
  },
  [TerrainType.BUILDING]: {
    color: '#8D6E63',
    movementCost: 999,
    isBlocked: true,
    description: 'Building structure',
  },
  [TerrainType.WALL]: {
    color: '#37474F',
    movementCost: 999,
    isBlocked: true,
    description: 'Wall or barrier',
  },
};

// Inclination presets
export const INCLINATION_PRESETS = {
  flat: { top: 0, right: 0, bottom: 0, left: 0 },
  rampNorth: { top: 1, right: 0, bottom: 0, left: 0 },
  rampEast: { top: 0, right: 1, bottom: 0, left: 0 },
  rampSouth: { top: 0, right: 0, bottom: 1, left: 0 },
  rampWest: { top: 0, right: 0, bottom: 0, left: 1 },
  cornerNE: { top: 1, right: 1, bottom: 0, left: 0 },
  cornerSE: { top: 0, right: 1, bottom: 1, left: 0 },
  cornerSW: { top: 0, right: 0, bottom: 1, left: 1 },
  cornerNW: { top: 1, right: 0, bottom: 0, left: 1 },
  valleyNS: { top: 1, right: 0, bottom: 1, left: 0 },
  valleyEW: { top: 0, right: 1, bottom: 0, left: 1 },
  peakCenter: { top: 0, right: 0, bottom: 0, left: 0, center: 1 },
} as const;
