import type { MapPreset } from '@/types';

export const MAP_PRESETS: MapPreset[] = [
  {
    name: 'Gentle',
    description: 'Smooth rolling hills, abundant water, dense forests',
    settings: {
      terrainRuggedness: 0.6,
      waterAbundance: 1.4,
      vegetationMultiplier: 1.6,
    },
  },
  {
    name: 'Normal',
    description: 'Balanced terrain with realistic variation',
    settings: {
      terrainRuggedness: 1.0,
      waterAbundance: 1.0,
      vegetationMultiplier: 1.0,
    },
  },
  {
    name: 'Challenging',
    description: 'Rugged broken terrain, sparse water and vegetation',
    settings: {
      terrainRuggedness: 1.8,
      waterAbundance: 1.3,
      vegetationMultiplier: 0.6,
    },
  },
];
