import {
  IGeologyLayerService,
  ITopographyLayerService,
  IHydrologyLayerService,
  IVegetationLayerService,
  IStructuresLayerService,
  IFeaturesLayerService,
  GeologyLayerData,
  TopographyLayerData,
  HydrologyLayerData,
  VegetationLayerData,
  StructuresLayerData,
  FeaturesLayerData,
  TacticalMapContext,
  Seed,
  type ILogger,
  MapGenerationErrors
} from '@lazy-map/domain';

/**
 * Result of tactical map generation with all layers
 */
export interface TacticalMapGenerationResult {
  width: number;
  height: number;
  seed: Seed;
  context: TacticalMapContext;
  layers: {
    geology: GeologyLayerData;
    topography: TopographyLayerData;
    hydrology: HydrologyLayerData;
    vegetation: VegetationLayerData;
    structures: StructuresLayerData;
    features: FeaturesLayerData;
  };
  generationTime: number; // milliseconds
}

/**
 * Use case for generating a complete tactical map with all layers
 * Orchestrates the layer generation services in the correct order
 *
 * This follows Clean Architecture by:
 * - Using interfaces (ports) for all services
 * - Orchestrating domain services
 * - Not depending on infrastructure details
 */
export class GenerateTacticalMapUseCase {
  constructor(
    private readonly geologyLayerService: IGeologyLayerService,
    private readonly topographyLayerService: ITopographyLayerService,
    private readonly hydrologyLayerService: IHydrologyLayerService,
    private readonly vegetationLayerService: IVegetationLayerService,
    private readonly structuresLayerService: IStructuresLayerService,
    private readonly featuresLayerService: IFeaturesLayerService,
    private readonly logger?: ILogger
  ) {}

  /**
   * Execute the tactical map generation
   * Generates all layers in sequence, with each depending on previous layers
   */
  async execute(
    width: number,
    height: number,
    context: TacticalMapContext,
    seed: Seed
  ): Promise<TacticalMapGenerationResult> {
    const startTime = Date.now();

    // Validate parameters
    if (width < 10 || width > 200 || height < 10 || height > 200) {
      throw MapGenerationErrors.invalidDimensions(width, height);
    }

    this.logger?.info('Starting tactical map generation', {
      metadata: {
        width,
        height,
        biome: context.biome,
        development: context.development,
        seed: seed.getValue()
      }
    });

    try {
      // Layer 0: Geological Foundation
      this.logger?.debug('Generating geology layer');
      const geology = await this.geologyLayerService.generate(
        width,
        height,
        context,
        seed
      );
      this.logger?.debug('Geology layer complete', {
        metadata: {
          primaryFormation: geology.primaryFormation.rockType,
          transitionZones: geology.transitionZones.length
        }
      });

      // Layer 1: Topographic Expression
      this.logger?.debug('Generating topography layer');
      const topography = await this.topographyLayerService.generate(
        geology,
        context,
        seed
      );
      this.logger?.debug('Topography layer complete', {
        metadata: {
          minElevation: topography.minElevation,
          maxElevation: topography.maxElevation,
          averageSlope: topography.averageSlope
        }
      });

      // Layer 2: Hydrological Flow
      this.logger?.debug('Generating hydrology layer');
      const hydrology = await this.hydrologyLayerService.generate(
        topography,
        geology,
        context,
        seed
      );
      this.logger?.debug('Hydrology layer complete', {
        metadata: {
          streams: hydrology.streams.length,
          springs: hydrology.springs.length,
          waterCoverage: hydrology.totalWaterCoverage
        }
      });

      // Layer 3: Vegetation Patterns
      this.logger?.debug('Generating vegetation layer');
      const vegetation = await this.vegetationLayerService.generate(
        hydrology,
        topography,
        geology,
        context,
        seed
      );
      this.logger?.debug('Vegetation layer complete', {
        metadata: {
          forestPatches: vegetation.forestPatches.length,
          clearings: vegetation.clearings.length,
          treeCount: vegetation.totalTreeCount,
          canopyCoverage: vegetation.averageCanopyCoverage
        }
      });

      // Layer 4: Artificial Structures
      this.logger?.debug('Generating structures layer');
      const structures = await this.structuresLayerService.generate(
        vegetation,
        hydrology,
        topography,
        context,
        seed
      );
      this.logger?.debug('Structures layer complete', {
        metadata: {
          buildings: structures.buildings.length,
          roadSegments: structures.roads.segments.length,
          bridges: structures.bridges.length,
          totalStructures: structures.totalStructureCount
        }
      });

      // Layer 5: Features & Hazards
      this.logger?.debug('Generating features layer');
      const features = await this.featuresLayerService.generate(
        {
          geology,
          topography,
          hydrology,
          vegetation,
          structures
        },
        context,
        seed
      );
      this.logger?.debug('Features layer complete', {
        metadata: {
          hazards: features.hazards.length,
          resources: features.resources.length,
          landmarks: features.landmarks.length,
          tacticalFeatures: features.tacticalFeatures.length,
          totalFeatures: features.totalFeatureCount
        }
      });

      const generationTime = Date.now() - startTime;

      this.logger?.info('Tactical map generation complete', {
        metadata: {
          generationTime,
          width,
          height,
          seed: seed.getValue()
        }
      });

      return {
        width,
        height,
        seed,
        context,
        layers: {
          geology,
          topography,
          hydrology,
          vegetation,
          structures,
          features
        },
        generationTime
      };
    } catch (error) {
      this.logger?.error('Failed to generate tactical map', {
        metadata: {
          error: (error as Error).message,
          width,
          height,
          seed: seed.getValue()
        }
      });
      throw error;
    }
  }

  /**
   * Generate a tactical map with default context
   * Convenience method for quick generation
   */
  async executeWithDefaults(
    width: number,
    height: number,
    seed?: Seed
  ): Promise<TacticalMapGenerationResult> {
    const defaultSeed = seed || Seed.createDefault();
    const defaultContext = TacticalMapContext.fromSeed(defaultSeed);

    return this.execute(width, height, defaultContext, defaultSeed);
  }
}