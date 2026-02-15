import {
  ElevationZone,
  GeologyLayerData,
  NoiseGenerator,
  RockType,
  Seed,
  TacticalMapContext,
  TerrainFeature,
  TopographyConfig,
  TopographyConstants,
  type ILogger
} from '@lazy-map/domain';
import { Inject, Injectable, Optional } from '@nestjs/common';

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
 * Generates base elevations using three-layer Perlin noise system
 * Represents tactical section of larger terrain, not complete miniature landscape
 */
@Injectable()
export class ElevationGenerationService {
  constructor(
    @Optional() @Inject('ILogger') private readonly logger?: ILogger
  ) {}

  /**
   * Generate base elevations using three-layer system
   * Represents tactical section of larger terrain, not complete miniature landscape
   *
   * Layer 1 (Macro): Large-scale gradient - "what part of mountain/hill are we on?"
   * Layer 2 (Tactical): Medium-scale undulations - tactically significant features
   * Layer 3 (Texture): Small-scale detail - geological character
   */
  generateBaseElevations(
    geology: GeologyLayerData,
    context: TacticalMapContext,
    seed: Seed,
    config?: TopographyConfig
  ): number[][] {
    const width = geology.tiles[0].length;
    const height = geology.tiles.length;
    const elevations: number[][] = [];

    // Create separate noise generators for each layer
    const macroNoise = NoiseGenerator.create(seed.getValue());
    const tacticalNoise = NoiseGenerator.create(seed.getValue() * 3);
    const textureNoise = NoiseGenerator.create(seed.getValue() * 7);

    // Calculate scale-adaptive elevation parameters
    const params = this.calculateElevationParameters(width, height, context, config);

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
    const macroValues = this.generateMacroGradient(width, height, macroNoise, scales.macro, params, ruggedness);

    // LAYER 2: Generate tactical undulations (knolls, depressions, ridges)
    const tacticalValues = this.generateTacticalUndulations(width, height, tacticalNoise, scales.tactical, params, ruggedness);

    // LAYER 3: Generate geological texture (rock-type detail)
    const textureValues = this.generateGeologicalTexture(width, height, textureNoise, scales.texture);

    // Combine all three layers with geology-aware weighting
    for (let y = 0; y < height; y++) {
      elevations[y] = [];
      for (let x = 0; x < width; x++) {
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
    width: number,
    height: number,
    noise: NoiseGenerator,
    scale: number,
    params: ElevationParameters,
    ruggedness: number
  ): number[][] {
    const values: number[][] = [];
    let min = Infinity;
    let max = -Infinity;

    // Generate noise values - always smooth (2 octaves)
    for (let y = 0; y < height; y++) {
      values[y] = [];
      for (let x = 0; x < width; x++) {
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

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
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
    width: number,
    height: number,
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
    for (let y = 0; y < height; y++) {
      values[y] = [];
      for (let x = 0; x < width; x++) {
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

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
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
    width: number,
    height: number,
    noise: NoiseGenerator,
    scale: number
  ): number[][] {
    const values: number[][] = [];

    // Generate high-frequency detail
    for (let y = 0; y < height; y++) {
      values[y] = [];
      for (let x = 0; x < width; x++) {
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
  calculateElevationParameters(
    width: number,
    height: number,
    context: TacticalMapContext,
    config?: TopographyConfig
  ): ElevationParameters {
    // Calculate physical dimensions (tiles × 5ft per tile)
    const widthFeet = width * 5;
    const heightFeet = height * 5;
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
  modifyElevationByFeatures(
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
}
