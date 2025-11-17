import {
  GeologicalFormation,
  TacticalMapContext,
  BiomeType,
  Seed,
  NoiseGenerator,
  Position,
  type ILogger,
  MapGenerationErrors,
  // Import from domain layer service interface
  IGeologyLayerService,
  GeologyLayerData,
  GeologyTileData,
  TerrainFeature
} from '@lazy-map/domain';
import {
  LIMESTONE_KARST,
  DOLOMITE_TOWERS,
  GRANITE_DOME,
  WEATHERED_GRANODIORITE,
  BASALT_COLUMNS,
  VOLCANIC_TUFF,
  SANDSTONE_FINS,
  CROSS_BEDDED_SANDSTONE,
  FOLIATED_SCHIST,
  SLATE_BEDS,
  GYPSUM_BADLANDS
} from '@lazy-map/domain';

/**
 * Generates the geological foundation layer for tactical maps
 * This is the FIRST layer - all other terrain emerges from geology
 */
export class GeologyLayer implements IGeologyLayerService {
  private width: number = 0;
  private height: number = 0;
  private logger?: ILogger;

  constructor(logger?: ILogger) {
    this.logger = logger;
  }

  /**
   * Generate geological foundation layer
   */
  async generate(
    width: number,
    height: number,
    context: TacticalMapContext,
    seed: Seed
  ): Promise<GeologyLayerData> {
    // Validate dimensions
    if (width < 10 || width > 200 || height < 10 || height > 200) {
      throw MapGenerationErrors.invalidDimensions(width, height);
    }

    this.width = width;
    this.height = height;

    this.logger?.info('Starting geology layer generation', {
      metadata: {
        width,
        height,
        biome: context.biome,
        seed: seed.getValue()
      }
    });

    try {
      // 1. Select formations based on context
      const formations = this.selectFormations(context, seed);
      this.logger?.debug('Selected formations', {
        metadata: {
          primaryType: formations.primary.rockType,
          secondaryType: formations.secondary?.rockType
        }
      });

      // 2. Generate bedrock pattern
      const bedrockPattern = this.generateBedrockPattern(
        formations.primary,
        formations.secondary,
        seed
      );
      this.logger?.debug('Generated bedrock pattern');

      // 3. Apply weathering to create surface features
      const weatheredSurface = this.applyWeathering(bedrockPattern, seed);
      this.logger?.debug('Applied weathering effects');

      // 4. Calculate soil depths based on weathering
      const soilDepths = this.calculateSoilDepths(weatheredSurface, seed);
      this.logger?.debug('Calculated soil depths');

      // 5. Identify transition zones where formations meet
      const transitionZones = this.findTransitionZones(bedrockPattern);
      this.logger?.debug('Identified transition zones', {
        metadata: {
          count: transitionZones.length
        }
      });

      // 6. Generate tile data
      const tiles = this.createTileData(
        bedrockPattern,
        weatheredSurface,
        soilDepths
      );

      this.logger?.info('Geology layer generation complete', {
        metadata: {
          transitionZones: transitionZones.length,
          primaryFormationType: formations.primary.rockType
        }
      });

      return {
        tiles,
        primaryFormation: formations.primary,
        secondaryFormation: formations.secondary,
        transitionZones
      };
    } catch (error) {
      this.logger?.error('Failed to generate geology layer', { metadata: { error: (error as Error).message } });
      throw MapGenerationErrors.layerGenerationFailed('geology', error as Error);
    }
  }

  /**
   * Select geological formations based on biome context
   */
  private selectFormations(
    context: TacticalMapContext,
    seed: Seed
  ): { primary: GeologicalFormation; secondary?: GeologicalFormation } {
    const candidates = this.getFormationsForBiome(context.biome);

    // Use seed to select deterministically
    const random = this.createSeededRandom(seed.getValue());
    const primaryIndex = Math.floor(random() * candidates.length);
    const primary = candidates[primaryIndex];

    // 30% chance of secondary formation for variety
    let secondary: GeologicalFormation | undefined;
    if (random() < 0.3 && candidates.length > 1) {
      const secondaryIndex = (primaryIndex + 1) % candidates.length;
      secondary = candidates[secondaryIndex];
    }

    return { primary, secondary };
  }

  /**
   * Get appropriate geological formations for a biome
   */
  private getFormationsForBiome(biome: BiomeType): GeologicalFormation[] {
    switch (biome) {
      case BiomeType.MOUNTAIN:
        return [
          LIMESTONE_KARST,     // Creates towers and caves
          DOLOMITE_TOWERS,     // Creates resistant pinnacles
          GRANITE_DOME,        // Creates exfoliation domes
          BASALT_COLUMNS,      // Creates columnar jointing
          FOLIATED_SCHIST,     // Creates folded terrain
          SLATE_BEDS          // Creates platy cliffs
        ];

      case BiomeType.DESERT:
        return [
          SANDSTONE_FINS,      // Creates narrow walls
          CROSS_BEDDED_SANDSTONE, // Creates hoodoos
          GYPSUM_BADLANDS,     // Creates rapid erosion
          VOLCANIC_TUFF       // Creates soft pinnacles
        ];

      case BiomeType.FOREST:
        return [
          GRANITE_DOME,        // Creates boulder fields
          WEATHERED_GRANODIORITE, // Creates corestones
          FOLIATED_SCHIST,     // Creates ravines
          LIMESTONE_KARST     // Creates sinkholes
        ];

      case BiomeType.PLAINS:
        return [
          LIMESTONE_KARST,     // Creates subtle karst
          CROSS_BEDDED_SANDSTONE, // Creates low mesas
          SLATE_BEDS          // Creates flat terrain
        ];

      case BiomeType.COASTAL:
        return [
          SANDSTONE_FINS,      // Creates sea stacks
          BASALT_COLUMNS,      // Creates columnar cliffs
          LIMESTONE_KARST     // Creates sea caves
        ];

      case BiomeType.SWAMP:
        return [
          LIMESTONE_KARST,     // Creates springs
          GYPSUM_BADLANDS     // Creates dissolution features
        ];

      case BiomeType.UNDERGROUND:
        return [
          LIMESTONE_KARST,     // Creates cave systems
          DOLOMITE_TOWERS,     // Creates chambers
          GYPSUM_BADLANDS     // Creates passages
        ];

      default:
        return [GRANITE_DOME]; // Fallback
    }
  }

  /**
   * Generate bedrock pattern with possible secondary formation
   */
  private generateBedrockPattern(
    primary: GeologicalFormation,
    secondary: GeologicalFormation | undefined,
    seed: Seed
  ): GeologicalFormation[][] {
    const pattern: GeologicalFormation[][] = [];

    // Create noise for formation boundaries
    const formationNoise = NoiseGenerator.create(seed.getValue() * 2);

    for (let y = 0; y < this.height; y++) {
      pattern[y] = [];
      for (let x = 0; x < this.width; x++) {
        if (secondary) {
          // Use noise to create realistic formation boundaries
          const noiseValue = formationNoise.generateAt(x * 0.05, y * 0.05);

          // Add some structure based on bedding orientation
          let threshold = 0;
          if (primary.structure.bedding === 'vertical') {
            threshold += Math.sin(x * 0.1) * 0.3;
          } else if (primary.structure.bedding === 'folded') {
            threshold += Math.sin(x * 0.1) * Math.cos(y * 0.1) * 0.3;
          }

          pattern[y][x] = noiseValue > threshold ? primary : secondary;
        } else {
          pattern[y][x] = primary;
        }
      }
    }

    return pattern;
  }

  /**
   * Apply weathering processes to create surface features
   */
  private applyWeathering(
    bedrock: GeologicalFormation[][],
    seed: Seed
  ): TerrainFeature[][][] {
    const weathered: TerrainFeature[][][] = [];
    const weatheringNoise = NoiseGenerator.create(seed.getValue() * 3);

    for (let y = 0; y < this.height; y++) {
      weathered[y] = [];
      for (let x = 0; x < this.width; x++) {
        const formation = bedrock[y][x];
        const features: TerrainFeature[] = [];

        // Get base weathering intensity
        const weatheringIntensity = weatheringNoise.generateAt(x * 0.1, y * 0.1) * 2 - 1; // Convert to -1 to 1 range

        // Get possible features for this formation
        const possibleFeatures = formation.weathering.products;

        // Select features based on weathering intensity and pattern
        if (weatheringIntensity > 0.7) {
          // High weathering - major features
          if (possibleFeatures.includes(TerrainFeature.TOWER)) {
            features.push(TerrainFeature.TOWER);
          } else if (possibleFeatures.includes(TerrainFeature.DOME)) {
            features.push(TerrainFeature.DOME);
          } else if (possibleFeatures.includes(TerrainFeature.COLUMN)) {
            features.push(TerrainFeature.COLUMN);
          } else if (possibleFeatures.includes(TerrainFeature.FIN)) {
            features.push(TerrainFeature.FIN);
          }
        } else if (weatheringIntensity > 0.4) {
          // Moderate weathering - intermediate features
          if (possibleFeatures.includes(TerrainFeature.CORESTONE)) {
            features.push(TerrainFeature.CORESTONE);
          } else if (possibleFeatures.includes(TerrainFeature.HOODOO)) {
            features.push(TerrainFeature.HOODOO);
          } else if (possibleFeatures.includes(TerrainFeature.LEDGE)) {
            features.push(TerrainFeature.LEDGE);
          }
        } else if (weatheringIntensity < -0.5) {
          // Negative features (depressions)
          if (possibleFeatures.includes(TerrainFeature.SINKHOLE)) {
            features.push(TerrainFeature.SINKHOLE);
          } else if (possibleFeatures.includes(TerrainFeature.CAVE)) {
            features.push(TerrainFeature.CAVE);
          } else if (possibleFeatures.includes(TerrainFeature.RAVINE)) {
            features.push(TerrainFeature.RAVINE);
          }
        }

        // Add general weathering products
        if (weatheringIntensity > 0.2 && possibleFeatures.includes(TerrainFeature.TALUS)) {
          features.push(TerrainFeature.TALUS);
        }

        weathered[y][x] = features;
      }
    }

    return weathered;
  }

  /**
   * Calculate soil depths based on weathering and rock properties
   */
  private calculateSoilDepths(
    weatheredSurface: TerrainFeature[][][],
    seed: Seed
  ): number[][] {
    const depths: number[][] = [];
    const soilNoise = NoiseGenerator.create(seed.getValue() * 4);

    for (let y = 0; y < this.height; y++) {
      depths[y] = [];
      for (let x = 0; x < this.width; x++) {
        const features = weatheredSurface[y][x];

        // Base soil depth 1-3 feet
        let depth = 1 + soilNoise.generateAt(x * 0.2, y * 0.2) * 2;

        // Modify based on features
        if (features.includes(TerrainFeature.GRUS)) {
          depth += 3; // Decomposed granite creates deep soil
        }
        if (features.includes(TerrainFeature.TALUS)) {
          depth += 2; // Rock debris accumulation
        }
        if (features.includes(TerrainFeature.DOME) ||
            features.includes(TerrainFeature.TOWER)) {
          depth = 0.5; // Bare rock
        }
        if (features.includes(TerrainFeature.SINKHOLE)) {
          depth += 5; // Accumulated sediment
        }

        depths[y][x] = Math.max(0, depth);
      }
    }

    return depths;
  }

  /**
   * Find transition zones where formations meet
   */
  private findTransitionZones(
    bedrock: GeologicalFormation[][]
  ): Position[] {
    const transitions: Position[] = [];

    for (let y = 1; y < this.height - 1; y++) {
      for (let x = 1; x < this.width - 1; x++) {
        const current = bedrock[y][x];

        // Check neighbors for different formations
        const neighbors = [
          bedrock[y-1][x],
          bedrock[y+1][x],
          bedrock[y][x-1],
          bedrock[y][x+1]
        ];

        const isDifferent = neighbors.some(n => n !== current);
        if (isDifferent) {
          transitions.push(new Position(x, y));
        }
      }
    }

    return transitions;
  }

  /**
   * Create final tile data combining all geological properties
   */
  private createTileData(
    bedrock: GeologicalFormation[][],
    weatheredSurface: TerrainFeature[][][],
    soilDepths: number[][]
  ): GeologyTileData[][] {
    const tiles: GeologyTileData[][] = [];

    for (let y = 0; y < this.height; y++) {
      tiles[y] = [];
      for (let x = 0; x < this.width; x++) {
        const formation = bedrock[y][x];
        const features = weatheredSurface[y][x];
        const soilDepth = soilDepths[y][x];

        // Calculate fracture intensity based on joint spacing
        const fractureIntensity = 1 / (formation.structure.jointSpacing + 1);

        tiles[y][x] = {
          formation,
          soilDepth,
          permeability: formation.properties.permeability,
          features,
          fractureIntensity
        };
      }
    }

    return tiles;
  }

  /**
   * Create a seeded random number generator
   */
  private createSeededRandom(seed: number): () => number {
    let s = seed;
    return () => {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      return s / 0x7fffffff;
    };
  }
}