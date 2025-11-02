import { Seed } from './Seed';

/**
 * Layered seed system for deterministic map generation
 * Each layer gets its own derived seed to ensure reproducibility
 * while preventing correlation between layers
 */
export class LayeredSeed {
  private readonly baseSeed: Seed;
  private readonly layerSeeds: Map<string, Seed>;

  /**
   * Create a layered seed from a base seed
   */
  constructor(baseSeed: Seed) {
    this.baseSeed = baseSeed;
    this.layerSeeds = new Map();
    this.generateLayerSeeds();
  }

  /**
   * Generate deterministic seeds for each layer
   * Uses prime number multiplication to ensure different but deterministic seeds
   */
  private generateLayerSeeds(): void {
    const baseValue = this.baseSeed.getValue();

    // Prime numbers for each layer to ensure good distribution
    const layerPrimes: Record<string, number> = {
      geology: 31,      // Foundation layer
      topography: 37,   // Elevation layer
      hydrology: 41,    // Water flow layer
      vegetation: 43,   // Plant life layer
      structures: 47,   // Buildings/roads layer
      features: 53,     // Hazards/resources layer

      // Sub-layer seeds for finer control
      'geology.formations': 59,
      'geology.weathering': 61,
      'topography.erosion': 67,
      'hydrology.springs': 71,
      'hydrology.streams': 73,
      'vegetation.trees': 79,
      'vegetation.undergrowth': 83,
      'structures.buildings': 89,
      'structures.roads': 97,
      'features.hazards': 101,
      'features.resources': 103
    };

    // Generate seeds for each layer
    for (const [layer, prime] of Object.entries(layerPrimes)) {
      // Combine base seed with prime and apply mixing function
      const layerValue = this.mixSeed(baseValue, prime);
      this.layerSeeds.set(layer, Seed.fromNumber(layerValue));
    }
  }

  /**
   * Mix seed value with a prime for good distribution
   * Uses a combination of multiplication and XOR for mixing
   */
  private mixSeed(seed: number, prime: number): number {
    // Ensure positive integer
    let mixed = Math.abs(seed) | 0;

    // Apply prime multiplication with overflow handling
    mixed = (mixed * prime) & 0x7FFFFFFF;

    // XOR with shifted value for additional mixing
    mixed ^= (mixed >>> 16);
    mixed = (mixed * 0x85ebca6b) & 0x7FFFFFFF;
    mixed ^= (mixed >>> 13);
    mixed = (mixed * 0xc2b2ae35) & 0x7FFFFFFF;
    mixed ^= (mixed >>> 16);

    return mixed;
  }

  /**
   * Get the base seed
   */
  getBaseSeed(): Seed {
    return this.baseSeed;
  }

  /**
   * Get seed for a specific layer
   */
  getLayerSeed(layer: LayerType): Seed {
    const seed = this.layerSeeds.get(layer);
    if (!seed) {
      throw new Error(`Unknown layer: ${layer}`);
    }
    return seed;
  }

  /**
   * Get seed for a sub-layer (e.g., 'geology.formations')
   */
  getSubLayerSeed(layer: LayerType, subLayer: string): Seed {
    const key = `${layer}.${subLayer}`;
    const seed = this.layerSeeds.get(key);
    if (!seed) {
      // Generate on-demand if not pre-defined
      const parentSeed = this.getLayerSeed(layer);
      const subSeed = this.mixSeed(parentSeed.getValue(), this.hashString(subLayer));
      return Seed.fromNumber(subSeed);
    }
    return seed;
  }

  /**
   * Get seed for a specific tile position
   * Useful for position-dependent randomness
   */
  getTileSeed(layer: LayerType, x: number, y: number): Seed {
    const layerSeed = this.getLayerSeed(layer);
    // Combine layer seed with position using Cantor pairing
    const positionValue = this.cantorPair(x, y);
    const tileSeed = this.mixSeed(layerSeed.getValue(), positionValue);
    return Seed.fromNumber(tileSeed);
  }

  /**
   * Get seed for a specific region
   * Useful for generating coherent regions
   */
  getRegionSeed(layer: LayerType, regionX: number, regionY: number, regionSize: number = 16): Seed {
    const layerSeed = this.getLayerSeed(layer);
    // Quantize to region coordinates
    const rx = Math.floor(regionX / regionSize);
    const ry = Math.floor(regionY / regionSize);
    const regionValue = this.cantorPair(rx, ry) * regionSize;
    const regionSeed = this.mixSeed(layerSeed.getValue(), regionValue);
    return Seed.fromNumber(regionSeed);
  }

  /**
   * Cantor pairing function for combining two integers
   */
  private cantorPair(x: number, y: number): number {
    x = Math.abs(x) | 0;
    y = Math.abs(y) | 0;
    return ((x + y) * (x + y + 1)) / 2 + y;
  }

  /**
   * Simple string hash function
   */
  private hashString(str: string): number {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash) + str.charCodeAt(i);
      hash = hash & 0x7FFFFFFF; // Keep positive
    }
    return hash;
  }

  /**
   * Create a layered seed from a string
   */
  static fromString(seedString: string): LayeredSeed {
    return new LayeredSeed(Seed.fromString(seedString));
  }

  /**
   * Create a layered seed from a number
   */
  static fromNumber(seedNumber: number): LayeredSeed {
    return new LayeredSeed(Seed.fromNumber(seedNumber));
  }

  /**
   * Create a default layered seed
   */
  static createDefault(): LayeredSeed {
    return new LayeredSeed(Seed.createDefault());
  }
}

/**
 * Available layer types
 */
export enum LayerType {
  GEOLOGY = 'geology',
  TOPOGRAPHY = 'topography',
  HYDROLOGY = 'hydrology',
  VEGETATION = 'vegetation',
  STRUCTURES = 'structures',
  FEATURES = 'features'
}

/**
 * Sub-layer types for finer control
 */
export enum SubLayerType {
  // Geology sub-layers
  FORMATIONS = 'formations',
  WEATHERING = 'weathering',
  SOIL = 'soil',

  // Topography sub-layers
  EROSION = 'erosion',
  SLOPES = 'slopes',

  // Hydrology sub-layers
  SPRINGS = 'springs',
  STREAMS = 'streams',
  POOLS = 'pools',

  // Vegetation sub-layers
  TREES = 'trees',
  SHRUBS = 'shrubs',
  UNDERGROWTH = 'undergrowth',

  // Structures sub-layers
  BUILDINGS = 'buildings',
  ROADS = 'roads',
  BRIDGES = 'bridges',

  // Features sub-layers
  HAZARDS = 'hazards',
  RESOURCES = 'resources',
  LANDMARKS = 'landmarks'
}