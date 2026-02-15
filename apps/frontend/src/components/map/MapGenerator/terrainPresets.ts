import type { MapPreset } from '@/types';

/**
 * General terrain style presets
 * These set terrain characteristics (ruggedness, water, vegetation) but don't lock climate/biome
 * Users can combine any preset with any biome for modular map generation
 */
export const MAP_PRESETS: MapPreset[] = [
  {
    name: 'Gentle',
    description: 'Rolling hills and easy terrain - perfect for farmland or pastoral settings',
    settings: {
      terrainRuggedness: 0.5,
      waterAbundance: 1.0,
      vegetationMultiplier: 1.2,
    },
  },
  {
    name: 'Balanced',
    description: 'Varied terrain with tactical features - good mix of gentle and challenging areas',
    settings: {
      terrainRuggedness: 1.0,
      waterAbundance: 1.0,
      vegetationMultiplier: 1.0,
    },
  },
  {
    name: 'Challenging',
    description: 'Dramatic cliffs and steep slopes - ideal for vertical encounters',
    settings: {
      terrainRuggedness: 1.8,
      waterAbundance: 0.8,
      vegetationMultiplier: 0.8,
    },
  },
];
