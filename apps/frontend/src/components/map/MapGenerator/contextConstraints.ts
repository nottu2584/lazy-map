/**
 * Valid combination constraints for map context parameters.
 * Mirrors the validation rules in TacticalMapContext (domain layer).
 */

export const BIOME_OPTIONS = [
  { value: 'forest', label: 'Forest' },
  { value: 'mountain', label: 'Mountain' },
  { value: 'plains', label: 'Plains' },
  { value: 'swamp', label: 'Swamp' },
  { value: 'desert', label: 'Desert' },
  { value: 'coastal', label: 'Coastal' },
  { value: 'underground', label: 'Underground' },
] as const;

export const ELEVATION_OPTIONS = [
  { value: 'lowland', label: 'Lowland' },
  { value: 'foothills', label: 'Foothills' },
  { value: 'highland', label: 'Highland' },
  { value: 'alpine', label: 'Alpine' },
] as const;

export const HYDROLOGY_OPTIONS = [
  { value: 'arid', label: 'Arid' },
  { value: 'seasonal', label: 'Seasonal' },
  { value: 'stream', label: 'Stream' },
  { value: 'river', label: 'River' },
  { value: 'lake', label: 'Lake' },
  { value: 'coastal', label: 'Coastal' },
  { value: 'wetland', label: 'Wetland' },
] as const;

export const DEVELOPMENT_OPTIONS = [
  { value: 'wilderness', label: 'Wilderness' },
  { value: 'frontier', label: 'Frontier' },
  { value: 'rural', label: 'Rural' },
  { value: 'settled', label: 'Settled' },
  { value: 'urban', label: 'Urban' },
  { value: 'ruins', label: 'Ruins' },
] as const;

export const SEASON_OPTIONS = [
  { value: 'spring', label: 'Spring' },
  { value: 'summer', label: 'Summer' },
  { value: 'autumn', label: 'Autumn' },
  { value: 'winter', label: 'Winter' },
] as const;

/**
 * Per-biome constraints on which hydrology and elevation values are valid.
 * If a biome is not listed, all options are allowed.
 */
const BIOME_CONSTRAINTS: Record<
  string,
  { blockedHydrology?: string[]; blockedElevation?: string[] }
> = {
  swamp: {
    blockedHydrology: ['arid', 'seasonal', 'stream', 'river', 'lake', 'coastal'],
    blockedElevation: ['foothills', 'highland', 'alpine'],
  },
  desert: {
    blockedHydrology: ['river', 'lake', 'wetland', 'coastal'],
  },
  coastal: {
    blockedHydrology: ['arid', 'seasonal', 'stream', 'river', 'lake', 'wetland'],
    blockedElevation: ['highland', 'alpine'],
  },
  underground: {
    blockedHydrology: ['coastal'],
    blockedElevation: ['alpine'],
  },
  forest: {
    blockedHydrology: ['coastal'],
  },
  mountain: {
    blockedHydrology: ['coastal', 'wetland'],
  },
  plains: {
    blockedHydrology: ['coastal'],
    blockedElevation: ['highland', 'alpine'],
  },
};

export function getBlockedHydrology(biome?: string): Set<string> {
  if (!biome) return new Set();
  return new Set(BIOME_CONSTRAINTS[biome]?.blockedHydrology ?? []);
}

export function getBlockedElevation(biome?: string): Set<string> {
  if (!biome) return new Set();
  return new Set(BIOME_CONSTRAINTS[biome]?.blockedElevation ?? []);
}
