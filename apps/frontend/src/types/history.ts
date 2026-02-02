/**
 * Seed history type definitions
 * Types for managing seed generation history
 */

/**
 * Historical record of a seed used for map generation
 */
export interface SeedHistoryEntry {
  id: string;
  seed: string | number;
  normalizedSeed?: number;
  mapName: string;
  timestamp: string;
  generationSuccess: boolean;
  metadata?: {
    dimensions: { width: number; height: number };
    algorithmVersion?: string;
    cellSize?: number;
  };
}
