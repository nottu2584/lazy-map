import {
  TacticalMapContext,
  Seed,
  NoiseGenerator,
  TerrainFeature,
  AspectDirection,
  ElevationZone,
  HydrologyType,
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

      // 2. Apply differential erosion based on scientific model
      const erodedElevations = this.applyDifferentialErosion(baseElevations, geology, context, seed, config);
      this.logger?.debug('Applied differential erosion');

      // 3. Apply geology-specific features (karst, granite needles, badlands, etc.)
      // Gated by ruggedness - only for dramatic terrain
      const params = this.calculateElevationParameters(context, config);
      const ruggedness = config?.terrainRuggedness ?? 1.0;
      if (ruggedness >= 1.5) {
        this.applyGeologicalFeatures(erodedElevations, geology, seed, params.max);
        this.logger?.debug('Applied geological features');
      }

      // 4. Smooth elevations variably based on erosion susceptibility and topographic position
      const smoothedElevations = this.smoothElevationsVariable(erodedElevations, geology, context, config);
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

  // ============================================================================
  // TODO (#116): Extract to ElevationGenerationService
  // Methods: generateBaseElevations, calculateThreeLayerScales,
  //          generateMacroGradient, generateTacticalUndulations,
  //          generateGeologicalTexture, calculateTextureIntensity,
  //          calculateElevationParameters, modifyElevationByFeatures
  // ============================================================================

  /**
   * Generate base elevations using three-layer system
   * Represents tactical section of larger terrain, not complete miniature landscape
   *
   * Layer 1 (Macro): Large-scale gradient - "what part of mountain/hill are we on?"
   * Layer 2 (Tactical): Medium-scale undulations - tactically significant features
   * Layer 3 (Texture): Small-scale detail - geological character
   */
  private generateBaseElevations(
    geology: GeologyLayerData,
    context: TacticalMapContext,
    seed: Seed,
    config?: TopographyConfig
  ): number[][] {
    const elevations: number[][] = [];

    // Create separate noise generators for each layer
    const macroNoise = NoiseGenerator.create(seed.getValue());
    const tacticalNoise = NoiseGenerator.create(seed.getValue() * 3);
    const textureNoise = NoiseGenerator.create(seed.getValue() * 7);

    // Calculate scale-adaptive elevation parameters
    const params = this.calculateElevationParameters(context, config);

    // Calculate scales for three layers
    const scales = this.calculateThreeLayerScales(context, config);

    this.logger?.debug('Generating three-layer topography', {
      metadata: {
        macroScale: scales.macro.toFixed(5),
        tacticalScale: scales.tactical.toFixed(3),
        textureScale: scales.texture.toFixed(3),
        macroSpan: `~${Math.round(1 / scales.macro)} tiles`,
        tacticalSpan: `~${Math.round(1 / scales.tactical)} tiles`
      }
    });

    const ruggedness = config?.terrainRuggedness ?? 1.0;

    // LAYER 1: Generate macro gradient (represents section of larger terrain)
    const macroValues = this.generateMacroGradient(macroNoise, scales.macro, params, ruggedness);

    // LAYER 2: Generate tactical undulations (knolls, depressions, ridges)
    const tacticalValues = this.generateTacticalUndulations(tacticalNoise, scales.tactical, params, ruggedness);

    // LAYER 3: Generate geological texture (rock-type detail)
    const textureValues = this.generateGeologicalTexture(textureNoise, scales.texture);

    // Combine all three layers with geology-aware weighting
    for (let y = 0; y < this.height; y++) {
      elevations[y] = [];
      for (let x = 0; x < this.width; x++) {
        const geoTile = geology.tiles[y][x];

        // Layer contributions (weighted by elevation parameters)
        const macroContribution = macroValues[y][x];
        const tacticalContribution = tacticalValues[y][x];

        // Texture intensity based on rock type and ruggedness
        // Texture contribution scales with ruggedness:
        // Low ruggedness (0.5): 2% contribution (heavily smoothed texture)
        // Medium ruggedness (1.0): 5% contribution (moderate texture)
        // High ruggedness (2.0): 10% contribution (sharp texture)
        const textureScale = 0.02 + (ruggedness - 0.5) * 0.053; // 0.02 to 0.10
        const textureIntensity = this.calculateTextureIntensity(geoTile.formation.rockType, config);
        const textureContribution = textureValues[y][x] * textureIntensity * params.max * textureScale;

        // Combine layers (features will be applied later in applyGeologicalFeatures step)
        const elevation = macroContribution + tacticalContribution + textureContribution;

        // Ensure minimum elevation
        elevations[y][x] = Math.max(params.min, elevation);
      }
    }

    return elevations;
  }

  /**
   * Calculate scales for three-layer system - ruggedness adaptive
   * Low ruggedness = large features (old eroded terrain)
   * High ruggedness = small features (young sharp terrain)
   */
  private calculateThreeLayerScales(
    context: TacticalMapContext,
    config?: TopographyConfig
  ): { macro: number; tactical: number; texture: number } {
    const ruggedness = config?.terrainRuggedness ?? 1.0;

    // Macro scale: always very low frequency (beyond map bounds)
    // Target: gradient spans 500-1000 tiles (map shows a section)
    const macro = 0.001;

    // Tactical scale: varies significantly with ruggedness
    // Low ruggedness (0.5): Large smooth features (span 60-80 tiles)
    // Medium ruggedness (1.0): Moderate features (span 35-45 tiles)
    // High ruggedness (2.0): Small sharp features (span 20-25 tiles)
    const tacticalBase = 0.015; // Base scale for ruggedness 1.0
    const tactical = tacticalBase * (0.7 + 0.6 * ruggedness); // 0.0105 to 0.024

    // Texture scale: varies with ruggedness
    // Low ruggedness: Large smooth texture (old erosion)
    // High ruggedness: Fine sharp texture (young terrain)
    const textureBase = 0.02;
    const texture = textureBase * (0.5 + 0.75 * ruggedness); // 0.01 to 0.03

    return { macro, tactical, texture };
  }

  /**
   * Generate macro gradient layer - ruggedness adaptive
   * Low ruggedness: Dominant smooth gradient (old eroded terrain)
   * High ruggedness: Less dominant, allows tactical features to dominate
   */
  private generateMacroGradient(
    noise: NoiseGenerator,
    scale: number,
    params: ElevationParameters,
    ruggedness: number
  ): number[][] {
    const values: number[][] = [];
    let min = Infinity;
    let max = -Infinity;

    // Generate noise values - always smooth (2 octaves)
    for (let y = 0; y < this.height; y++) {
      values[y] = [];
      for (let x = 0; x < this.width; x++) {
        const noise_val = noise.generateOctaves(x * scale, y * scale, 2, 0.6);
        values[y][x] = noise_val;
        min = Math.min(min, noise_val);
        max = Math.max(max, noise_val);
      }
    }

    // Normalize and apply elevation range
    // Contribution scales inversely with ruggedness:
    // Low ruggedness (0.5): 70% contribution (smooth rolling hills)
    // Medium ruggedness (1.0): 50% contribution (balanced)
    // High ruggedness (2.0): 30% contribution (tactical features dominate)
    const macroContribution = 0.7 - (ruggedness - 0.5) * 0.2; // 0.7 to 0.3
    const macroRange = (params.max - params.min) * macroContribution;

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const normalized = (values[y][x] - min) / (max - min);
        values[y][x] = params.min + normalized * macroRange;
      }
    }

    return values;
  }

  /**
   * Generate tactical undulations layer - ruggedness adaptive
   * Low ruggedness: Minimal undulations (smooth eroded terrain)
   * High ruggedness: Dominant sharp features (young terrain)
   */
  private generateTacticalUndulations(
    noise: NoiseGenerator,
    scale: number,
    params: ElevationParameters,
    ruggedness: number
  ): number[][] {
    const values: number[][] = [];
    let min = Infinity;
    let max = -Infinity;

    // Octave count varies with ruggedness:
    // Low ruggedness (0.5): 1 octave (very smooth)
    // Medium ruggedness (1.0): 2 octaves (moderate detail)
    // High ruggedness (2.0): 3-4 octaves (sharp features)
    const octaves = Math.round(1 + ruggedness * 1.5); // 1 to 4 octaves
    const persistence = 0.5;

    // Generate noise values
    for (let y = 0; y < this.height; y++) {
      values[y] = [];
      for (let x = 0; x < this.width; x++) {
        const noise_val = noise.generateOctaves(x * scale, y * scale, octaves, persistence);
        values[y][x] = noise_val;
        min = Math.min(min, noise_val);
        max = Math.max(max, noise_val);
      }
    }

    // Normalize and apply elevation range
    // Contribution scales with ruggedness:
    // Low ruggedness (0.5): 15% contribution (minimal undulations)
    // Medium ruggedness (1.0): 35% contribution (balanced)
    // High ruggedness (2.0): 55% contribution (dominant features)
    const tacticalContribution = 0.15 + (ruggedness - 0.5) * 0.267; // 0.15 to 0.55
    const tacticalRange = (params.max - params.min) * tacticalContribution;

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const normalized = (values[y][x] - min) / (max - min);
        // Center around 0 for undulations
        values[y][x] = (normalized - 0.5) * tacticalRange;
      }
    }

    return values;
  }

  /**
   * Generate geological texture layer
   * Creates rock-type specific detail (boulders, ledges, pinnacles)
   */
  private generateGeologicalTexture(
    noise: NoiseGenerator,
    scale: number
  ): number[][] {
    const values: number[][] = [];

    // Generate high-frequency detail
    for (let y = 0; y < this.height; y++) {
      values[y] = [];
      for (let x = 0; x < this.width; x++) {
        // Use 2 octaves for fine detail
        const texture = noise.generateOctaves(x * scale, y * scale, 2, 0.5);
        // Center around 0, will be scaled by intensity later
        values[y][x] = (texture - 0.5);
      }
    }

    return values;
  }

  /**
   * Calculate texture intensity based on rock type
   * Karst and volcanic = high texture, sedimentary plains = low texture
   */
  private calculateTextureIntensity(rockType: RockType, config?: TopographyConfig): number {
    // Base intensity by rock type
    const baseIntensities: Record<RockType, number> = {
      [RockType.CARBONATE]: 0.8,      // Karst: pinnacles, sinkholes (high texture)
      [RockType.VOLCANIC]: 0.7,       // Basalt: columns, domes (high texture)
      [RockType.METAMORPHIC]: 0.5,    // Schist/gneiss: moderate texture
      [RockType.GRANITIC]: 0.6,       // Granite: boulders, domes (moderate-high)
      [RockType.CLASTIC]: 0.3,        // Sandstone: moderate texture
      [RockType.EVAPORITE]: 0.2       // Salt flats: minimal texture
    };

    const baseIntensity = baseIntensities[rockType] ?? 0.4;

    // Scale by terrainRuggedness config
    const ruggednessMult = config?.terrainRuggedness ?? 1.0;

    return baseIntensity * ruggednessMult;
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

    // Apply ruggedness scaling to elevation range
    // Low ruggedness (0.5): 0.7x range (gentle hills need less relief)
    // Medium ruggedness (1.0): 1.0x range (baseline)
    // High ruggedness (2.0): 1.5x range (dramatic terrain needs more relief)
    const ruggedness = config?.terrainRuggedness ?? 1.0;
    const ruggednessFactor = 0.4 + ruggedness * 0.6; // 0.7 to 1.6

    const multiplier = baseZoneMultiplier * varianceAdjustment * ruggednessFactor;
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

  // ============================================================================
  // TODO (#116): Extract to ErosionModelService
  // Methods: applyDifferentialErosion, calculateClimateWetness,
  //          calculateErosionSusceptibility, calculateSlopesArray, calculateSlopeAtPoint
  // ============================================================================

  /**
   * Apply differential erosion based on scientific model
   * Erosion = f(rock hardness, slope, fractures, climate, terrain age)
   */
  private applyDifferentialErosion(
    elevations: number[][],
    geology: GeologyLayerData,
    context: TacticalMapContext,
    seed: Seed,
    config?: TopographyConfig
  ): number[][] {
    const eroded: number[][] = [];
    const erosionNoise = NoiseGenerator.create(seed.getValue() * 5);
    const ruggedness = config?.terrainRuggedness ?? 1.0;
    const climateWetness = this.calculateClimateWetness(context.hydrology);

    // First pass: calculate slopes (needed for erosion calculation)
    const slopes = this.calculateSlopesArray(elevations);

    for (let y = 0; y < this.height; y++) {
      eroded[y] = [];
      for (let x = 0; x < this.width; x++) {
        const geoTile = geology.tiles[y][x];
        const slope = slopes[y][x];

        // Calculate erosion susceptibility
        const susceptibility = this.calculateErosionSusceptibility(
          geoTile,
          slope,
          climateWetness,
          ruggedness
        );

        // Apply spatial variation with noise
        const noiseVariation = 0.7 + erosionNoise.generateAt(x * 0.1, y * 0.1) * 0.6; // 0.7 to 1.3

        // Erosion amount scales with max elevation (proportional to relief)
        const maxElev = Math.max(...elevations.flat());
        const erosionAmount = susceptibility * noiseVariation * (maxElev / 50) * 8; // Scale to ~8ft at 50ft relief

        eroded[y][x] = Math.max(0, elevations[y][x] - erosionAmount);
      }
    }

    return eroded;
  }

  /**
   * Calculate climate wetness factor from hydrology type
   * Wet climates cause more chemical weathering and erosion
   */
  private calculateClimateWetness(hydrologyType: HydrologyType): number {
    const wetnessMap: Record<HydrologyType, number> = {
      [HydrologyType.ARID]: 0.3,
      [HydrologyType.SEASONAL]: 0.6,
      [HydrologyType.STREAM]: 0.7,
      [HydrologyType.RIVER]: 0.8,
      [HydrologyType.LAKE]: 0.75,
      [HydrologyType.COASTAL]: 0.9,
      [HydrologyType.WETLAND]: 1.0
    };
    return wetnessMap[hydrologyType] ?? 0.6;
  }

  /**
   * Calculate erosion susceptibility per tile
   * Returns 0-1 value representing how much this tile erodes
   */
  private calculateErosionSusceptibility(
    geoTile: any,
    slope: number,
    climateWetness: number,
    ruggedness: number
  ): number {
    // Rock resistance (0 = soft, 1 = hard)
    const resistance = geoTile.formation.properties.getErosionResistance();
    const rockFactor = 1 - resistance; // Invert: soft rocks erode more

    // Slope factor (steeper slopes erode more, but plateau at extreme angles)
    const slopeFactor = Math.min(1.5, 1 + slope / 60); // 1.0 to 1.5

    // Fracture factor (more fractures = more erosion)
    const fractureFactor = 1 + geoTile.fractureIntensity * 0.5; // 1.0 to 1.5

    // Ruggedness factor (low ruggedness = old terrain = more time to erode)
    // Inverted relationship: low ruggedness = high erosion
    const terrainAgeFactor = 2.0 - ruggedness; // 0.5 to 1.5 (inverted)

    // Combine all factors
    const susceptibility =
      0.3 * rockFactor +          // 30% weight
      0.2 * (slopeFactor - 1) +   // 20% weight
      0.2 * (fractureFactor - 1) + // 20% weight
      0.15 * (climateWetness - 0.5) + // 15% weight
      0.15 * (terrainAgeFactor - 1);  // 15% weight

    // Normalize to 0-1 range
    return Math.max(0, Math.min(1, susceptibility));
  }

  /**
   * Calculate slopes for elevation array (helper for erosion)
   */
  private calculateSlopesArray(elevations: number[][]): number[][] {
    const slopes: number[][] = [];
    for (let y = 0; y < this.height; y++) {
      slopes[y] = [];
      for (let x = 0; x < this.width; x++) {
        slopes[y][x] = this.calculateSlopeAtPoint(elevations, x, y);
      }
    }
    return slopes;
  }

  /**
   * Calculate slope at a specific point
   */
  private calculateSlopeAtPoint(elevations: number[][], x: number, y: number): number {
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
    return Math.atan(Math.sqrt(dx * dx + dy * dy)) * 180 / Math.PI;
  }

  // ============================================================================
  // TODO (#116): Extract to GeologicalFeaturesService
  // Methods: applyGeologicalFeatures, applyDissolutionFeatures,
  //          applyFractureFeatures, applyWashFeatures, applyLayeredFeatures
  // ============================================================================

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
  // ============================================================================
  // TODO (#116): Extract to TerrainSmoothingService
  // Methods: smoothElevationsVariable, identifyTopographicPosition, applySmoothingPass
  // ============================================================================

  /**
   * Variable smoothing based on erosion susceptibility and topographic position
   * High erosion areas (old gentle hills) → more smoothing
   * Low erosion areas (young cliffs) → minimal smoothing
   * Valleys receive extra smoothing (simulates sediment accumulation)
   * Ridges preserve sharpness (sediment sheds off)
   */
  private smoothElevationsVariable(
    elevations: number[][],
    geology: GeologyLayerData,
    context: TacticalMapContext,
    config?: TopographyConfig
  ): number[][] {
    const ruggedness = config?.terrainRuggedness ?? 1.0;
    const climateWetness = this.calculateClimateWetness(context.hydrology);

    // Calculate slopes for each tile
    const slopes = this.calculateSlopesArray(elevations);

    // Calculate erosion susceptibility map
    const erosionMap: number[][] = [];
    for (let y = 0; y < this.height; y++) {
      erosionMap[y] = [];
      for (let x = 0; x < this.width; x++) {
        const geoTile = geology.tiles[y][x];
        erosionMap[y][x] = this.calculateErosionSusceptibility(
          geoTile,
          slopes[y][x],
          climateWetness,
          ruggedness
        );
      }
    }

    // Identify valleys and ridges for topographic position bonus
    const topoPosition = this.identifyTopographicPosition(elevations);

    // Calculate smoothing passes per tile - more dramatic variation
    // Low ruggedness (0.5): 4-5 passes (aggressive smoothing → gentle slopes)
    // Medium ruggedness (1.0): 2-3 passes (moderate smoothing)
    // High ruggedness (2.0): 0 passes (no smoothing → preserve sharp features)
    const maxPasses = Math.max(0, Math.round(6 - ruggedness * 3)); // 4.5→5 at rug=0.5, 3 at rug=1.0, 0 at rug=2.0
    const smoothingPasses: number[][] = [];

    for (let y = 0; y < this.height; y++) {
      smoothingPasses[y] = [];
      for (let x = 0; x < this.width; x++) {
        // Base passes from erosion susceptibility
        let passes = Math.floor(erosionMap[y][x] * maxPasses);

        // Topographic position adjustment
        if (topoPosition[y][x] === 'valley') {
          passes += 1; // Extra smoothing (simulates sediment accumulation)
        } else if (topoPosition[y][x] === 'ridge') {
          passes = Math.max(0, passes - 1); // Less smoothing (material sheds off)
        }

        smoothingPasses[y][x] = Math.max(0, passes);
      }
    }

    // Apply variable smoothing
    let result = elevations;
    for (let pass = 0; pass < maxPasses + 1; pass++) {
      result = this.applySmoothingPass(result, smoothingPasses, pass);
    }

    return result;
  }

  /**
   * Identify topographic position (valley, ridge, or neutral)
   */
  private identifyTopographicPosition(elevations: number[][]): string[][] {
    const position: string[][] = [];

    for (let y = 0; y < this.height; y++) {
      position[y] = [];
      for (let x = 0; x < this.width; x++) {
        const elev = elevations[y][x];
        let lowerCount = 0;
        let higherCount = 0;
        let totalNeighbors = 0;

        // Check 3x3 neighborhood
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height) {
              totalNeighbors++;
              if (elevations[ny][nx] < elev) lowerCount++;
              if (elevations[ny][nx] > elev) higherCount++;
            }
          }
        }

        // Valley: Most neighbors are higher
        if (higherCount >= totalNeighbors * 0.6) {
          position[y][x] = 'valley';
        }
        // Ridge: Most neighbors are lower
        else if (lowerCount >= totalNeighbors * 0.6) {
          position[y][x] = 'ridge';
        }
        else {
          position[y][x] = 'neutral';
        }
      }
    }

    return position;
  }

  /**
   * Apply one smoothing pass, but only to tiles that need it
   */
  private applySmoothingPass(
    elevations: number[][],
    passesNeeded: number[][],
    currentPass: number
  ): number[][] {
    const smoothed: number[][] = [];

    for (let y = 0; y < this.height; y++) {
      smoothed[y] = [];
      for (let x = 0; x < this.width; x++) {
        // Only smooth if this tile needs this many passes
        if (passesNeeded[y][x] >= currentPass) {
          let sum = elevations[y][x] * 4; // Weight center
          let count = 4;

          // Average with neighbors
          const neighbors = [
            { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
            { dx: 0, dy: -1 }, { dx: 0, dy: 1 }
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
        } else {
          // Don't smooth - preserve sharp feature
          smoothed[y][x] = elevations[y][x];
        }
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