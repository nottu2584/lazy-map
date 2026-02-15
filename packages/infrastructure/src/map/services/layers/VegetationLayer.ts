import { Injectable, Inject, Optional } from '@nestjs/common';
import {
  TacticalMapContext,
  Seed,
  VegetationConfig,
  type ILogger,
  // Import from domain layer service interfaces
  IVegetationLayerService,
  VegetationLayerData,
  GeologyLayerData,
  TopographyLayerData,
  HydrologyLayerData
} from '@lazy-map/domain';

import { PotentialCalculationService } from './vegetation/PotentialCalculationService';
import { ForestGenerationService } from './vegetation/ForestGenerationService';
import { PlantGenerationService } from './vegetation/PlantGenerationService';
import { ClearingCalculationService } from './vegetation/ClearingCalculationService';
import { TacticalCalculationService } from './vegetation/TacticalCalculationService';
import { VegetationTileGenerationService } from './vegetation/VegetationTileGenerationService';

/**
 * Vegetation Layer - Orchestrates vegetation generation
 * Delegates to specialized services for each generation phase
 *
 * Refactored from 921-line monolith into lightweight orchestrator pattern
 * Services handle: potential calculation, forest generation, plant generation,
 * clearing calculation, tactical calculation, and tile generation
 */
@Injectable()
export class VegetationLayer implements IVegetationLayerService {
  constructor(
    @Inject(PotentialCalculationService)
    private readonly potentialService: PotentialCalculationService,

    @Inject(ForestGenerationService)
    private readonly forestService: ForestGenerationService,

    @Inject(PlantGenerationService)
    private readonly plantService: PlantGenerationService,

    @Inject(ClearingCalculationService)
    private readonly clearingService: ClearingCalculationService,

    @Inject(TacticalCalculationService)
    private readonly tacticalService: TacticalCalculationService,

    @Inject(VegetationTileGenerationService)
    private readonly tileService: VegetationTileGenerationService,

    @Optional() @Inject('ILogger')
    private readonly logger?: ILogger
  ) {}

  /**
   * Generate vegetation layer from environmental conditions
   * Orchestrates the 6-phase vegetation generation pipeline
   */
  async generate(
    hydrology: HydrologyLayerData,
    topography: TopographyLayerData,
    geology: GeologyLayerData,
    context: TacticalMapContext,
    seed: Seed,
    config?: VegetationConfig
  ): Promise<VegetationLayerData> {
    const width = hydrology.tiles[0].length;
    const height = hydrology.tiles.length;

    // Use default config if not provided
    const vegetationConfig = config ?? VegetationConfig.default();

    this.logger?.debug('Starting vegetation generation', {
      component: 'VegetationLayer',
      operation: 'generate',
      metadata: { width, height, biome: context.biome }
    });

    // 1. Determine base vegetation potential
    const vegetationPotential = this.potentialService.calculateVegetationPotential(
      hydrology,
      topography,
      geology,
      context,
      width,
      height
    );

    // 2. Generate forest patches using cellular automata
    const forestDistribution = this.forestService.generateForestPatches(
      vegetationPotential,
      context,
      seed,
      vegetationConfig,
      width,
      height
    );

    // 3. Place individual plants based on local conditions
    const plantDistribution = this.plantService.distributeVegetation(
      forestDistribution,
      vegetationPotential,
      hydrology,
      topography,
      context,
      seed,
      vegetationConfig,
      width,
      height
    );

    // 4. Identify clearings and meadows
    const clearings = this.clearingService.identifyClearings(
      plantDistribution,
      width,
      height
    );

    // 5. Calculate tactical properties
    const tacticalProperties = this.tacticalService.calculateTacticalProperties(
      plantDistribution,
      hydrology,
      width,
      height
    );

    // 6. Create tile data
    const tiles = this.tileService.createTileData(
      plantDistribution,
      tacticalProperties,
      hydrology,
      width,
      height
    );

    // 7. Extract forest patches for visualization
    const forestPatches = this.tileService.extractForestPatches(tiles, width, height);

    // 8. Calculate statistics
    const stats = this.tileService.calculateStatistics(tiles, width, height);

    this.logger?.debug('Vegetation generation complete', {
      component: 'VegetationLayer',
      operation: 'generate',
      metadata: {
        treeCount: stats.treeCount,
        avgCanopy: stats.avgCanopy,
        forestPatchCount: forestPatches.length
      }
    });

    return {
      tiles,
      forestPatches,
      clearings,
      totalTreeCount: stats.treeCount,
      averageCanopyCoverage: stats.avgCanopy
    };
  }
}
