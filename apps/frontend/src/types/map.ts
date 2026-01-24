export interface MapSettings {
  // Basic settings (always required)
  name: string;
  width: number;
  height: number;
  cellSize: number;
  seed?: string;

  // Advanced settings (optional, collapsed by default)
  advancedSettings?: AdvancedMapSettings;
}

export interface AdvancedMapSettings {
  // Vegetation density control (0.0-2.0)
  // 0.0 = no vegetation, 1.0 = normal forest (default), 2.0 = dense jungle
  vegetationMultiplier?: number;

  // Terrain ruggedness control (0.5-2.0)
  // 0.5 = smooth rolling hills, 1.0 = normal terrain (default), 2.0 = highly rugged broken terrain
  terrainRuggedness?: number;

  // Water abundance control (0.5-2.0)
  // 0.5 = dry/sparse water, 1.0 = moderate water (default), 2.0 = abundant water features
  waterAbundance?: number;
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
