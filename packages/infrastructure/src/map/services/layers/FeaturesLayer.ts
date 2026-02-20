import { Injectable, Inject, Optional } from '@nestjs/common';
import {
  TacticalMapContext,
  Seed,
  MapGenerationErrors,
  type ILogger,
  IFeaturesLayerService,
  FeaturesLayerData,
  GeologyLayerData,
  TopographyLayerData,
  HydrologyLayerData,
  VegetationLayerData,
  StructuresLayerData
} from '@lazy-map/domain';
import {
  HazardPlacementService,
  ResourcePlacementService,
  LandmarkPlacementService,
  FeatureTileGenerationService
} from './features';

/**
 * Generates interesting features, hazards, resources, and landmarks
 * Final layer — adds gameplay detail on top of all other terrain layers
 *
 * Orchestrates feature generation by delegating to specialized services
 */
@Injectable()
export class FeaturesLayer implements IFeaturesLayerService {
  constructor(
    @Inject(HazardPlacementService)
    private readonly hazardPlacementService: HazardPlacementService,

    @Inject(ResourcePlacementService)
    private readonly resourcePlacementService: ResourcePlacementService,

    @Inject(LandmarkPlacementService)
    private readonly landmarkPlacementService: LandmarkPlacementService,

    @Inject(FeatureTileGenerationService)
    private readonly tileGenerationService: FeatureTileGenerationService,

    @Optional() @Inject('ILogger')
    private readonly logger?: ILogger
  ) {}

  async generate(
    layers: {
      geology: GeologyLayerData;
      topography: TopographyLayerData;
      hydrology: HydrologyLayerData;
      vegetation: VegetationLayerData;
      structures: StructuresLayerData;
    },
    _context: TacticalMapContext,
    seed: Seed
  ): Promise<FeaturesLayerData> {
    if (!layers.geology || !layers.geology.tiles) {
      throw MapGenerationErrors.invalidLayerDependency('features', 'geology');
    }

    const width = layers.geology.tiles[0].length;
    const height = layers.geology.tiles.length;

    this.logger?.info('Starting features layer generation', {
      metadata: { width, height, seed: seed.getValue() }
    });

    try {
      // 1. Place hazards based on terrain conditions
      const hazards = this.hazardPlacementService.placeHazards(width, height, layers, seed);
      this.logger?.debug('Placed hazards', { metadata: { count: hazards.length } });

      // 2. Place resources in appropriate locations
      const resources = this.resourcePlacementService.placeResources(width, height, layers, seed);
      this.logger?.debug('Placed resources', { metadata: { count: resources.length } });

      // 3. Place landmarks at interesting locations
      const landmarks = this.landmarkPlacementService.placeLandmarks(width, height, layers, seed);
      this.logger?.debug('Placed landmarks', { metadata: { count: landmarks.length } });

      // 4. Create tile data
      const tiles = this.tileGenerationService.createTiles(
        width, height, hazards, resources, landmarks
      );

      const totalFeatureCount = hazards.length + resources.length + landmarks.length;

      this.logger?.info('Features layer generation complete', {
        metadata: {
          hazards: hazards.length,
          resources: resources.length,
          landmarks: landmarks.length,
          totalFeatures: totalFeatureCount
        }
      });

      return { tiles, hazards, resources, landmarks, totalFeatureCount };
    } catch (error) {
      this.logger?.error('Failed to generate features layer', {
        metadata: { error: (error as Error).message }
      });
      throw MapGenerationErrors.layerGenerationFailed('features', error as Error);
    }
  }
}
