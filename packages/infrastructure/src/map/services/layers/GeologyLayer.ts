import { Injectable, Inject, Optional } from '@nestjs/common';
import {
  TacticalMapContext,
  Seed,
  MapGenerationErrors,
  type ILogger,
  IGeologyLayerService,
  GeologyLayerData
} from '@lazy-map/domain';
import {
  FormationSelectionService,
  BedrockPatternService,
  WeatheringService,
  SoilCalculationService,
  GeologyTileGenerationService
} from './geology';

/**
 * Generates the geological foundation layer for tactical maps
 * This is the FIRST layer — all other terrain emerges from geology
 *
 * Orchestrates geology generation by delegating to specialized services
 */
@Injectable()
export class GeologyLayer implements IGeologyLayerService {
  constructor(
    @Inject(FormationSelectionService)
    private readonly formationSelectionService: FormationSelectionService,

    @Inject(BedrockPatternService)
    private readonly bedrockPatternService: BedrockPatternService,

    @Inject(WeatheringService)
    private readonly weatheringService: WeatheringService,

    @Inject(SoilCalculationService)
    private readonly soilCalculationService: SoilCalculationService,

    @Inject(GeologyTileGenerationService)
    private readonly tileGenerationService: GeologyTileGenerationService,

    @Optional() @Inject('ILogger')
    private readonly logger?: ILogger
  ) {}

  async generate(
    width: number,
    height: number,
    context: TacticalMapContext,
    seed: Seed
  ): Promise<GeologyLayerData> {
    if (width < 10 || width > 200 || height < 10 || height > 200) {
      throw MapGenerationErrors.invalidDimensions(width, height);
    }

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
      const formations = this.formationSelectionService.selectFormations(context, seed);
      this.logger?.debug('Selected formations', {
        metadata: {
          primaryType: formations.primary.rockType,
          secondaryType: formations.secondary?.rockType
        }
      });

      // 2. Generate bedrock pattern
      const bedrockPattern = this.bedrockPatternService.generatePattern(
        width, height, formations.primary, formations.secondary, seed
      );
      this.logger?.debug('Generated bedrock pattern');

      // 3. Apply weathering to create surface features
      const weatheredSurface = this.weatheringService.applyWeathering(
        width, height, bedrockPattern, seed
      );
      this.logger?.debug('Applied weathering effects');

      // 4. Calculate soil depths based on weathering
      const soilDepths = this.soilCalculationService.calculateDepths(
        width, height, weatheredSurface, seed
      );
      this.logger?.debug('Calculated soil depths');

      // 5. Identify transition zones where formations meet
      const transitionZones = this.tileGenerationService.findTransitionZones(
        width, height, bedrockPattern
      );
      this.logger?.debug('Identified transition zones', {
        metadata: { count: transitionZones.length }
      });

      // 6. Generate tile data
      const tiles = this.tileGenerationService.createTiles(
        width, height, bedrockPattern, weatheredSurface, soilDepths
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
      this.logger?.error('Failed to generate geology layer', {
        metadata: { error: (error as Error).message }
      });
      throw MapGenerationErrors.layerGenerationFailed('geology', error as Error);
    }
  }
}
