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
  GeologyLayerData,
  RockType,
  TopographyConfig,
  TopographyConstants
} from '@lazy-map/domain';

/**
 * Physical dimensions and scale information
 */
interface PhysicalDimensions {
  widthFeet: number;
  heightFeet: number;
  scale: 'tactical' | 'operational' | 'strategic';
}

/**
 * Elevation generation parameters
 */
interface ElevationParameters {
  min: number;
  max: number;
  physicalSize: PhysicalDimensions;
}

/**
 * Generates topographic expression from geological foundation
 * Features emerge from differential erosion based on rock properties
 *
 * Scale-adaptive: Adjusts elevation ranges based on map size
 * Geology-adaptive: Generates features based on rock type behavior
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
    seed: Seed,
    config?: TopographyConfig
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
      const baseElevations = this.generateBaseElevations(geology, context, seed, config);
      this.logger?.debug('Generated base elevations');

      // 2. Apply differential erosion based on rock resistance
      const erodedElevations = this.applyDifferentialErosion(baseElevations, geology, seed);
      this.logger?.debug('Applied differential erosion');

      // 3. Apply geology-specific features (karst, granite needles, badlands, etc.)
      const params = this.calculateElevationParameters(context, config);
      this.applyGeologicalFeatures(erodedElevations, geology, seed, params.max);
      this.logger?.debug('Applied geological features');

      // 4. Smooth elevations for realism
      const smoothedElevations = this.smoothElevations(erodedElevations);
      this.logger?.debug('Smoothed elevations');

      // 5. Calculate slopes and aspects
      const topography = this.calculateTopography(smoothedElevations);
      this.logger?.debug('Calculated slopes and aspects');

      // 6. Identify ridges and valleys
      this.identifyTerrainFeatures(topography);
      this.logger?.debug('Identified terrain features');

      // 7. Calculate statistics
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
   * Uses scale-adaptive elevation range
   */
  private generateBaseElevations(
    geology: GeologyLayerData,
    context: TacticalMapContext,
    seed: Seed,
    config?: TopographyConfig
  ): number[][] {
    const elevations: number[][] = [];
    const elevationNoise = NoiseGenerator.create(seed.getValue());

    // Calculate scale-adaptive elevation parameters
    const params = this.calculateElevationParameters(context, config);

    // Get noise generation parameters from config (with defaults)
    const octaves = config?.getNoiseOctaves() ?? TopographyConstants.DEFAULT_OCTAVES;
    const persistence = config?.getNoisePersistence() ?? TopographyConstants.DEFAULT_PERSISTENCE;
    const scale = config?.getNoiseScale() ?? TopographyConstants.NOISE_SCALE;

    // First pass: generate noise values and find actual range
    const noiseValues: number[][] = [];
    let minNoise = Infinity;
    let maxNoise = -Infinity;

    for (let y = 0; y < this.height; y++) {
      noiseValues[y] = [];
      for (let x = 0; x < this.width; x++) {
        const noise = elevationNoise.generateOctaves(x * scale, y * scale, octaves, persistence);
        noiseValues[y][x] = noise;
        minNoise = Math.min(minNoise, noise);
        maxNoise = Math.max(maxNoise, noise);
      }
    }

    // Second pass: normalize noise to 0-1 and apply elevation range
    for (let y = 0; y < this.height; y++) {
      elevations[y] = [];
      for (let x = 0; x < this.width; x++) {
        const geoTile = geology.tiles[y][x];

        // Normalize noise to 0-1 range
        const normalizedNoise = (noiseValues[y][x] - minNoise) / (maxNoise - minNoise);

        // Apply elevation range
        let elevation = params.min + normalizedNoise * (params.max - params.min);

        // Modify based on geological features (with scaling)
        elevation = this.modifyElevationByFeatures(elevation, geoTile.features, x, y, elevationNoise, params.max);

        elevations[y][x] = elevation;
      }
    }

    return elevations;
  }

  /**
   * Calculate scale-adaptive elevation parameters
   * Adjusts elevation range based on map physical size
   */
  private calculateElevationParameters(
    context: TacticalMapContext,
    config?: TopographyConfig
  ): ElevationParameters {
    // Calculate physical dimensions (tiles × 5ft per tile)
    const widthFeet = this.width * 5;
    const heightFeet = this.height * 5;
    const minDimension = Math.min(widthFeet, heightFeet);

    // Determine scale category
    let scale: 'tactical' | 'operational' | 'strategic';
    if (minDimension < 300) {
      scale = 'tactical'; // < 300ft = showing terrain sections
    } else if (minDimension < 1000) {
      scale = 'operational'; // 300-1000ft = showing multiple features
    } else {
      scale = 'strategic'; // > 1000ft = showing complete landscape
    }

    // Base elevation range: default 40% of smallest dimension (adjustable via config)
    // Smaller maps show sections with proportional relief
    const reliefMultiplier = config?.getReliefMultiplier() ?? TopographyConstants.DEFAULT_RELIEF;
    const baseRange = minDimension * reliefMultiplier;

    // Adjust by elevation zone
    const baseZoneMultipliers: Record<ElevationZone, number> = {
      [ElevationZone.LOWLAND]: 0.3,   // Gentle terrain
      [ElevationZone.FOOTHILLS]: 0.6, // Moderate relief
      [ElevationZone.HIGHLAND]: 0.8,  // Significant relief
      [ElevationZone.ALPINE]: 1.0     // Maximum relief
    };

    // Apply variance adjustment from config
    const baseZoneMultiplier = baseZoneMultipliers[context.elevation] || 0.5;
    const varianceAdjustment = config?.getZoneMultiplierAdjustment() ?? TopographyConstants.DEFAULT_VARIANCE;
    const multiplier = baseZoneMultiplier * varianceAdjustment;
    const maxElevation = baseRange * multiplier;

    this.logger?.debug('Calculated elevation parameters', {
      metadata: {
        scale,
        physicalSize: `${widthFeet}ft × ${heightFeet}ft`,
        elevationRange: `0-${Math.round(maxElevation)}ft`
      }
    });

    return {
      min: 0,
      max: maxElevation,
      physicalSize: { widthFeet, heightFeet, scale }
    };
  }

  /**
   * Modify elevation based on geological features
   * Features are scaled proportionally to map relief
   */
  private modifyElevationByFeatures(
    baseElevation: number,
    features: TerrainFeature[],
    x: number,
    y: number,
    noise: NoiseGenerator,
    maxElevation: number
  ): number {
    let elevation = baseElevation;

    // Scale factor: normalize features to expected 50ft relief
    // For tactical maps with 50ft relief, scale = 1.0
    // For smaller relief, features scale down proportionally
    const featureScale = maxElevation / 50;

    for (let i = 0; i < features.length; i++) {
      const feature = features[i];
      // Use deterministic noise for variation
      const variation = noise.generateAt(x * 0.13 + i, y * 0.13 + i);

      switch (feature) {
        // Positive relief features (scaled)
        case TerrainFeature.TOWER:
          elevation += (15 + variation * 25) * featureScale; // 15-40 feet * scale
          break;
        case TerrainFeature.DOME:
          elevation += (10 + variation * 20) * featureScale; // 10-30 feet * scale
          break;
        case TerrainFeature.COLUMN:
          elevation += (10 + variation * 15) * featureScale; // 10-25 feet * scale
          break;
        case TerrainFeature.FIN:
          elevation += (8 + variation * 12) * featureScale; // 8-20 feet * scale
          break;
        case TerrainFeature.TOR:
          elevation += (5 + variation * 10) * featureScale; // 5-15 feet * scale
          break;
        case TerrainFeature.HOODOO:
          elevation += (5 + variation * 15) * featureScale; // 5-20 feet * scale
          break;

        // Negative relief features (scaled)
        case TerrainFeature.SINKHOLE:
          elevation -= (10 + variation * 20) * featureScale; // -10 to -30 feet * scale
          break;
        case TerrainFeature.CAVE:
          elevation -= (5 + variation * 10) * featureScale; // -5 to -15 feet * scale
          break;
        case TerrainFeature.RAVINE:
          elevation -= (8 + variation * 12) * featureScale; // -8 to -20 feet * scale
          break;
        case TerrainFeature.SLOT_CANYON:
          elevation -= (15 + variation * 15) * featureScale; // -15 to -30 feet * scale
          break;

        // Minor features (scaled)
        case TerrainFeature.LEDGE:
          elevation += (3 + variation * 5) * featureScale; // 3-8 feet * scale
          break;
        case TerrainFeature.TALUS:
          elevation -= (2 + variation * 3) * featureScale; // -2 to -5 feet * scale
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
   * Apply geology-specific erosional features
   * Adapts behavior based on rock type properties
   */
  private applyGeologicalFeatures(
    elevations: number[][],
    geology: GeologyLayerData,
    seed: Seed,
    maxElevation: number
  ): void {
    const featureNoise = NoiseGenerator.create(seed.getValue() * 11);

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const geoTile = geology.tiles[y][x];
        const rockType = geoTile.formation.rockType;

        // Apply erosion features based on rock behavior
        if (rockType === RockType.CARBONATE) {
          // Chemical dissolution → irregular, angular features (limestone karst)
          this.applyDissolutionFeatures(x, y, elevations, geoTile.fractureIntensity, maxElevation, featureNoise);
        } else if (rockType === RockType.GRANITIC) {
          // Mechanical fracture → needles or domes (granite)
          this.applyFractureFeatures(x, y, elevations, geoTile.fractureIntensity, maxElevation, featureNoise);
        } else if (rockType === RockType.CLASTIC) {
          // Rapid erosion → smooth or badlands (sandstone/shale)
          const resistance = geoTile.formation.properties.getErosionResistance();
          this.applyWashFeatures(x, y, elevations, resistance, maxElevation, featureNoise);
        } else if (rockType === RockType.METAMORPHIC) {
          // Exfoliation → serrated ridges (slate/schist)
          this.applyLayeredFeatures(x, y, elevations, maxElevation, featureNoise);
        }
      }
    }
  }

  /**
   * Apply dissolution features (limestone karst)
   * Creates lapiaces (grooves) and dolinas (sinkholes)
   * Features scaled proportionally to map relief
   */
  private applyDissolutionFeatures(
    x: number,
    y: number,
    elevations: number[][],
    fractureIntensity: number,
    maxElevation: number,
    noise: NoiseGenerator
  ): void {
    const dissolveStrength = noise.generateAt(x * 0.12, y * 0.12);
    const featureScale = maxElevation / 50; // Scale to map relief

    // High fracture + dissolution = fissures and grooves
    if (fractureIntensity > 0.6 && dissolveStrength > 0.65) {
      const depth = (8 + dissolveStrength * 15) * featureScale; // 8-23ft * scale
      elevations[y][x] = Math.max(0, elevations[y][x] - depth);
    }

    // Circular depressions (dolinas/sinkholes)
    if (fractureIntensity > 0.7 && dissolveStrength > 0.80) {
      const dolinaDepth = (10 + dissolveStrength * 20) * featureScale; // 10-30ft * scale
      // Apply radial depression
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height) {
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 3) {
              const falloff = (3 - dist) / 3;
              elevations[ny][nx] = Math.max(0, elevations[ny][nx] - dolinaDepth * falloff);
            }
          }
        }
      }
    }
  }

  /**
   * Apply fracture features (granite)
   * Creates agujas (needles) at peaks, domos (domes) at base
   * Features scaled proportionally to map relief
   */
  private applyFractureFeatures(
    x: number,
    y: number,
    elevations: number[][],
    fractureIntensity: number,
    maxElevation: number,
    noise: NoiseGenerator
  ): void {
    const fractureStrength = noise.generateAt(x * 0.15, y * 0.15);
    const currentElevation = elevations[y][x];
    const heightRatio = currentElevation / maxElevation;
    const featureScale = maxElevation / 50; // Scale to map relief

    // High altitude + high fracture = sharp needles
    if (heightRatio > 0.7 && fractureIntensity > 0.6 && fractureStrength > 0.75) {
      const needleHeight = (10 + fractureStrength * 20) * featureScale; // 10-30ft * scale
      elevations[y][x] += needleHeight;
    }
    // Low altitude + low fracture = rounded domes
    else if (heightRatio < 0.4 && fractureIntensity < 0.4) {
      // Smooth by averaging with wider neighborhood
      let sum = elevations[y][x];
      let count = 1;
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height) {
            sum += elevations[ny][nx];
            count++;
          }
        }
      }
      elevations[y][x] = sum / count;
    }
  }

  /**
   * Apply wash features (soft sedimentary rocks)
   * Creates smooth hills or badlands (cárcavas)
   * Features scaled proportionally to map relief
   */
  private applyWashFeatures(
    x: number,
    y: number,
    elevations: number[][],
    erosionResistance: number,
    maxElevation: number,
    noise: NoiseGenerator
  ): void {
    const washStrength = noise.generateAt(x * 0.08, y * 0.08);
    const featureScale = maxElevation / 50; // Scale to map relief

    // Very low resistance = badlands with gullies
    if (erosionResistance < 0.3 && washStrength > 0.70) {
      const gullySteepness = 1.0 - erosionResistance;
      const gullyDepth = (5 + washStrength * 10 * gullySteepness) * featureScale; // 5-15ft * scale
      elevations[y][x] = Math.max(0, elevations[y][x] - gullyDepth);
    }
    // Normal wash erosion creates smooth terrain (handled by smoothing)
  }

  /**
   * Apply layered features (slate/metamorphic)
   * Creates serrated, saw-tooth ridges
   * Features scaled proportionally to map relief
   */
  private applyLayeredFeatures(
    x: number,
    y: number,
    elevations: number[][],
    maxElevation: number,
    noise: NoiseGenerator
  ): void {
    const layering = noise.generateAt(x * 0.20, y * 0.20);
    const featureScale = maxElevation / 50; // Scale to map relief

    // Create alternating peaks and troughs
    if (layering > 0.65) {
      const toothHeight = (3 + layering * 5) * featureScale; // 3-8ft * scale
      const isUpper = ((x + y) % 3) === 0;
      elevations[y][x] += isUpper ? toothHeight : -toothHeight * 0.5;
    }
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