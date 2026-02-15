import { Injectable, Inject, Optional } from '@nestjs/common';
import {
  TacticalMapContext,
  Seed,
  MapGenerationErrors,
  type ILogger,
  ITopographyLayerService,
  TopographyLayerData,
  GeologyLayerData,
  TopographyConfig
} from '@lazy-map/domain';
import {
  ElevationGenerationService,
  ErosionModelService,
  GeologicalFeaturesService,
  TerrainSmoothingService,
  TopographyCalculationService
} from './topography';

/**
 * Generates topographic expression from geological foundation
 * Features emerge from differential erosion based on rock properties
 *
 * Scale-adaptive: Adjusts elevation ranges based on map size
 * Geology-adaptive: Generates features based on rock type behavior
 *
 * This class orchestrates topography generation by delegating to specialized services
 */
@Injectable()
export class TopographyLayer implements ITopographyLayerService {
  constructor(
    @Inject(ElevationGenerationService)
    private readonly elevationService: ElevationGenerationService,

    @Inject(ErosionModelService)
    private readonly erosionService: ErosionModelService,

    @Inject(GeologicalFeaturesService)
    private readonly featuresService: GeologicalFeaturesService,

    @Inject(TerrainSmoothingService)
    private readonly smoothingService: TerrainSmoothingService,

    @Inject(TopographyCalculationService)
    private readonly calculationService: TopographyCalculationService,

    @Optional() @Inject('ILogger')
    private readonly logger?: ILogger
  ) {}

  /**
   * Generate topographic layer from geology
   * Orchestrates the generation pipeline by delegating to specialized services
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

    const width = geology.tiles[0].length;
    const height = geology.tiles.length;

    this.logger?.info('Starting topography layer generation', {
      metadata: {
        width,
        height,
        elevationZone: context.elevation,
        seed: seed.getValue()
      }
    });

    try {
      // 1. Generate base elevation from geological features
      const baseElevations = this.elevationService.generateBaseElevations(geology, context, seed, config);
      this.logger?.debug('Generated base elevations');

      // 2. Apply differential erosion based on scientific model
      const erodedElevations = this.erosionService.applyDifferentialErosion(baseElevations, geology, context, seed, config);
      this.logger?.debug('Applied differential erosion');

      // 3. Apply geology-specific features (karst, granite needles, badlands, etc.)
      // Gated by ruggedness - only for dramatic terrain
      const ruggedness = config?.terrainRuggedness ?? 1.0;
      if (ruggedness >= 1.5) {
        const params = this.elevationService.calculateElevationParameters(width, height, context, config);
        this.featuresService.applyGeologicalFeatures(erodedElevations, geology, seed, params.max);
        this.logger?.debug('Applied geological features');
      }

      // 4. Smooth elevations variably based on erosion susceptibility and topographic position
      const smoothedElevations = this.smoothingService.smoothElevationsVariable(erodedElevations, geology, context, config);
      this.logger?.debug('Smoothed elevations');

      // 5. Calculate slopes and aspects
      const topography = this.calculationService.calculateTopography(smoothedElevations);
      this.logger?.debug('Calculated slopes and aspects');

      // 6. Identify ridges and valleys
      this.calculationService.identifyTerrainFeatures(topography);
      this.logger?.debug('Identified terrain features');

      // 7. Calculate statistics
      const stats = this.calculationService.calculateStatistics(topography);

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

}