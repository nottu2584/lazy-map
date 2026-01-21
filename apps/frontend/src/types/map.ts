export interface MapSettings {
  name: string;
  width: number;
  height: number;
  cellSize: number;
  seed?: string;
  generateForests: boolean;
  generateRivers: boolean;
  generateRoads: boolean;
  generateBuildings: boolean;
  terrainDistribution: {
    grassland: number;
    forest: number;
    mountain: number;
    water: number;
  };
  forestSettings: {
    forestDensity: number;
    treeDensity: number;
    treeClumping: number;
  };
}

export interface GeneratedMap {
  id: string;
  name: string;
  width: number;
  height: number;
  cellSize: number;
  seed?: string | number;
  metadata?: Record<string, any>;
  tiles: Array<{
    x: number;
    y: number;
    terrain: string;
    elevation: number;
    features: string[];
  }>;
}

export interface SeedValidationResult {
  valid: boolean;
  error?: string;
  warnings?: string[];
  normalizedSeed?: number;
}
