import {
  TacticalMapContext,
  Seed,
  NoiseGenerator,
  TerrainFeature,
  AspectDirection,
  ElevationZone,
  MapGenerationErrors,
  type ILogger,
  // Import from domain layer service interfaces
  ITopographyLayerService,
  TopographyLayerData,
  TopographyTileData,
  GeologyLayerData
} from '@lazy-map/domain';

/**
 * Generates topographic expression from geological foundation
 * Features emerge from differential erosion based on rock properties
 */
export class TopographyLayer implements ITopographyLayerService {
  private width: number = 0;
  private height: number = 0;
  private logger?: ILogger;

  constructor(logger?: ILogger) {
    this.logger = logger;
  }

  /**
   * Generate topographic layer from geology
   */
  async generate(
    geology: GeologyLayerData,
    context: TacticalMapContext,
    seed: Seed
  ): Promise<TopographyLayerData> {
    if (!geology || !geology.tiles) {
      throw MapGenerationErrors.invalidLayerDependency('topography', 'geology');
    }

    this.width = geology.tiles[0].length;
    this.height = geology.tiles.length;

    this.logger?.info('Starting topography layer generation', {
      metadata: {
        width: this.width,
        height: this.height,
        elevationZone: context.elevation,
        seed: seed.getValue()
      }
    });

    try {
      // 1. Generate base elevation from geological features
      const baseElevations = this.generateBaseElevations(geology, context, seed);
      this.logger?.debug('Generated base elevations');

      // 2. Apply differential erosion based on rock resistance
      const erodedElevations = this.applyDifferentialErosion(baseElevations, geology, seed);
      this.logger?.debug('Applied differential erosion');

      // 3. Smooth elevations for realism
      const smoothedElevations = this.smoothElevations(erodedElevations);
      this.logger?.debug('Smoothed elevations');

      // 4. Calculate slopes and aspects
      const topography = this.calculateTopography(smoothedElevations);
      this.logger?.debug('Calculated slopes and aspects');

      // 5. Identify ridges and valleys
      this.identifyTerrainFeatures(topography);
      this.logger?.debug('Identified terrain features');

      // 6. Calculate statistics
      const stats = this.calculateStatistics(topography);

      this.logger?.info('Topography layer generation complete', {
        metadata: {
          minElevation: stats.min,
          maxElevation: stats.max,
          averageSlope: stats.avgSlope
        }
      });

      return {
        tiles: topography,
        minElevation: stats.min,
        maxElevation: stats.max,
        averageSlope: stats.avgSlope
      };
    } catch (error) {
      this.logger?.error('Failed to generate topography layer', { metadata: { error: (error as Error).message } });
      throw MapGenerationErrors.layerGenerationFailed('topography', error as Error);
    }
  }

  /**
   * Generate base elevations from geological features
   */
  private generateBaseElevations(
    geology: GeologyLayerData,
    context: TacticalMapContext,
    seed: Seed
  ): number[][] {
    const elevations: number[][] = [];
    const elevationNoise = NoiseGenerator.create(seed.getValue());

    // Base elevation range for context (in feet)
    const baseRange = this.getElevationRange(context.elevation);

    for (let y = 0; y < this.height; y++) {
      elevations[y] = [];
      for (let x = 0; x < this.width; x++) {
        const geoTile = geology.tiles[y][x];

        // Start with noise-based terrain
        let elevation = baseRange.min +
          elevationNoise.generateOctaves(x * 0.02, y * 0.02, 4, 0.6) *
          (baseRange.max - baseRange.min);

        // Modify based on geological features
        elevation = this.modifyElevationByFeatures(elevation, geoTile.features, x, y, elevationNoise);

        elevations[y][x] = elevation;
      }
    }

    return elevations;
  }

  /**
   * Get appropriate elevation range for context
   */
  private getElevationRange(zone: ElevationZone): { min: number; max: number } {
    switch (zone) {
      case ElevationZone.LOWLAND:
        return { min: 0, max: 30 }; // 0-30 feet variation
      case ElevationZone.FOOTHILLS:
        return { min: 10, max: 60 }; // 10-60 feet
      case ElevationZone.HIGHLAND:
        return { min: 20, max: 80 }; // 20-80 feet
      case ElevationZone.ALPINE:
        return { min: 30, max: 100 }; // 30-100 feet
      default:
        return { min: 0, max: 40 };
    }
  }

  /**
   * Modify elevation based on geological features
   */
  private modifyElevationByFeatures(
    baseElevation: number,
    features: TerrainFeature[],
    x: number,
    y: number,
    noise: NoiseGenerator
  ): number {
    let elevation = baseElevation;

    for (let i = 0; i < features.length; i++) {
      const feature = features[i];
      // Use deterministic noise for variation
      const variation = noise.generateAt(x * 0.13 + i, y * 0.13 + i);

      switch (feature) {
        // Positive relief features
        case TerrainFeature.TOWER:
          elevation += 15 + variation * 25; // 15-40 feet
          break;
        case TerrainFeature.DOME:
          elevation += 10 + variation * 20; // 10-30 feet
          break;
        case TerrainFeature.COLUMN:
          elevation += 10 + variation * 15; // 10-25 feet
          break;
        case TerrainFeature.FIN:
          elevation += 8 + variation * 12; // 8-20 feet
          break;
        case TerrainFeature.TOR:
          elevation += 5 + variation * 10; // 5-15 feet
          break;
        case TerrainFeature.HOODOO:
          elevation += 5 + variation * 15; // 5-20 feet
          break;

        // Negative relief features
        case TerrainFeature.SINKHOLE:
          elevation -= 10 + variation * 20; // -10 to -30 feet
          break;
        case TerrainFeature.CAVE:
          elevation -= 5 + variation * 10; // -5 to -15 feet
          break;
        case TerrainFeature.RAVINE:
          elevation -= 8 + variation * 12; // -8 to -20 feet
          break;
        case TerrainFeature.SLOT_CANYON:
          elevation -= 15 + variation * 15; // -15 to -30 feet
          break;

        // Minor features
        case TerrainFeature.LEDGE:
          elevation += 3 + variation * 5; // 3-8 feet
          break;
        case TerrainFeature.TALUS:
          elevation -= 2 + variation * 3; // -2 to -5 feet (debris slope)
          break;
      }
    }

    return Math.max(0, elevation); // Don't go below 0
  }

  /**
   * Apply differential erosion based on rock resistance
   */
  private applyDifferentialErosion(
    elevations: number[][],
    geology: GeologyLayerData,
    seed: Seed
  ): number[][] {
    const eroded: number[][] = [];
    const erosionNoise = NoiseGenerator.create(seed.getValue() * 5);

    for (let y = 0; y < this.height; y++) {
      eroded[y] = [];
      for (let x = 0; x < this.width; x++) {
        const geoTile = geology.tiles[y][x];
        const resistance = geoTile.formation.properties.getErosionResistance();

        // More resistant rocks erode less
        const erosionFactor = 1 - resistance * 0.5; // 0.5 to 1.0
        const erosionAmount = erosionNoise.generateAt(x * 0.1, y * 0.1) * 10 * erosionFactor;

        eroded[y][x] = Math.max(0, elevations[y][x] - erosionAmount);

        // Fractures increase erosion
        if (geoTile.fractureIntensity > 0.5) {
          eroded[y][x] *= (1 - geoTile.fractureIntensity * 0.2);
        }
      }
    }

    return eroded;
  }

  /**
   * Smooth elevations using averaging filter
   */
  private smoothElevations(elevations: number[][]): number[][] {
    const smoothed: number[][] = [];

    for (let y = 0; y < this.height; y++) {
      smoothed[y] = [];
      for (let x = 0; x < this.width; x++) {
        let sum = elevations[y][x] * 4; // Weight center more
        let count = 4;

        // Average with neighbors
        const neighbors = [
          { dx: -1, dy: 0 },
          { dx: 1, dy: 0 },
          { dx: 0, dy: -1 },
          { dx: 0, dy: 1 }
        ];

        for (const n of neighbors) {
          const nx = x + n.dx;
          const ny = y + n.dy;
          if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height) {
            sum += elevations[ny][nx];
            count++;
          }
        }

        smoothed[y][x] = sum / count;
      }
    }

    return smoothed;
  }

  /**
   * Calculate slope and aspect for each tile
   */
  private calculateTopography(elevations: number[][]): TopographyTileData[][] {
    const topography: TopographyTileData[][] = [];

    for (let y = 0; y < this.height; y++) {
      topography[y] = [];
      for (let x = 0; x < this.width; x++) {
        const current = elevations[y][x];

        // Get neighbor elevations
        const north = y > 0 ? elevations[y-1][x] : current;
        const south = y < this.height-1 ? elevations[y+1][x] : current;
        const east = x < this.width-1 ? elevations[y][x+1] : current;
        const west = x > 0 ? elevations[y][x-1] : current;

        // Calculate gradients (rise over run, where run is 5 feet per tile)
        const dx = (east - west) / 10; // Divide by 2 tiles * 5 feet
        const dy = (south - north) / 10;

        // Calculate slope in degrees
        const slope = Math.atan(Math.sqrt(dx * dx + dy * dy)) * 180 / Math.PI;

        // Calculate aspect (direction of slope)
        const aspect = this.calculateAspect(dx, dy);

        // Calculate relative elevation
        const neighbors = [north, south, east, west];
        const avgNeighbor = neighbors.reduce((a, b) => a + b, 0) / neighbors.length;
        const relativeElevation = current - avgNeighbor;

        topography[y][x] = {
          elevation: current,
          slope: Math.min(90, slope), // Cap at 90 degrees
          aspect,
          relativeElevation: Math.max(-1, Math.min(1, relativeElevation / 10)),
          isRidge: false,
          isValley: false,
          isDrainage: false
        };
      }
    }

    return topography;
  }

  /**
   * Calculate aspect direction from gradients
   */
  private calculateAspect(dx: number, dy: number): AspectDirection {
    if (dx === 0 && dy === 0) return AspectDirection.FLAT;

    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    const normalized = (angle + 360) % 360;

    if (normalized < 22.5 || normalized >= 337.5) return AspectDirection.EAST;
    if (normalized < 67.5) return AspectDirection.SOUTHEAST;
    if (normalized < 112.5) return AspectDirection.SOUTH;
    if (normalized < 157.5) return AspectDirection.SOUTHWEST;
    if (normalized < 202.5) return AspectDirection.WEST;
    if (normalized < 247.5) return AspectDirection.NORTHWEST;
    if (normalized < 292.5) return AspectDirection.NORTH;
    return AspectDirection.NORTHEAST;
  }

  /**
   * Identify ridges, valleys, and drainage patterns
   */
  private identifyTerrainFeatures(topography: TopographyTileData[][]): void {
    for (let y = 1; y < this.height - 1; y++) {
      for (let x = 1; x < this.width - 1; x++) {
        const tile = topography[y][x];
        const elevation = tile.elevation;

        // Count how many neighbors are lower
        let lowerCount = 0;
        let higherCount = 0;

        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const neighbor = topography[y + dy][x + dx].elevation;
            if (neighbor < elevation) lowerCount++;
            if (neighbor > elevation) higherCount++;
          }
        }

        // Ridge if most neighbors are lower
        if (lowerCount >= 6) {
          tile.isRidge = true;
        }
        // Valley if most neighbors are higher
        else if (higherCount >= 6) {
          tile.isValley = true;
          tile.isDrainage = true; // Valleys are natural drainage
        }

        // Mark steep slopes as potential drainage
        if (tile.slope > 30 && tile.relativeElevation < -0.3) {
          tile.isDrainage = true;
        }
      }
    }
  }

  /**
   * Calculate layer statistics
   */
  private calculateStatistics(topography: TopographyTileData[][]): {
    min: number;
    max: number;
    avgSlope: number;
  } {
    let min = Infinity;
    let max = -Infinity;
    let totalSlope = 0;
    let count = 0;

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const tile = topography[y][x];
        min = Math.min(min, tile.elevation);
        max = Math.max(max, tile.elevation);
        totalSlope += tile.slope;
        count++;
      }
    }

    return {
      min,
      max,
      avgSlope: totalSlope / count
    };
  }
}