import { Injectable, Inject, Optional } from '@nestjs/common';
import {
  TacticalMapContext,
  Seed,
  Bridge,
  type ILogger,
  // Import from domain layer service interfaces
  IStructuresLayerService,
  StructuresLayerData,
  VegetationLayerData,
  HydrologyLayerData,
  TopographyLayerData
} from '@lazy-map/domain';

import { SiteCalculationService } from './structures/SiteCalculationService';
import { BuildingPlacementService } from './structures/BuildingPlacementService';
import { RoadGenerationService } from './structures/RoadGenerationService';
import { BridgeGenerationService } from './structures/BridgeGenerationService';
import { DecorationGenerationService } from './structures/DecorationGenerationService';
import { StructureTileGenerationService } from './structures/StructureTileGenerationService';

/**
 * Structures Layer - Orchestrates artificial structure generation
 * Delegates to specialized services for each generation phase
 *
 * Refactored from 900-line monolith into lightweight orchestrator pattern
 * Services handle: site calculation, building placement, road generation,
 * bridge generation, decoration placement, and tile generation
 */
@Injectable()
export class StructuresLayer implements IStructuresLayerService {
  constructor(
    @Inject(SiteCalculationService)
    private readonly siteService: SiteCalculationService,

    @Inject(BuildingPlacementService)
    private readonly buildingService: BuildingPlacementService,

    @Inject(RoadGenerationService)
    private readonly roadService: RoadGenerationService,

    @Inject(BridgeGenerationService)
    private readonly bridgeService: BridgeGenerationService,

    @Inject(DecorationGenerationService)
    private readonly decorationService: DecorationGenerationService,

    @Inject(StructureTileGenerationService)
    private readonly tileService: StructureTileGenerationService,

    @Optional() @Inject('ILogger')
    private readonly logger?: ILogger
  ) {}

  /**
   * Generate structures layer from environmental conditions
   * Orchestrates the 6-phase structure generation pipeline
   */
  async generate(
    vegetation: VegetationLayerData,
    hydrology: HydrologyLayerData,
    topography: TopographyLayerData,
    context: TacticalMapContext,
    seed: Seed
  ): Promise<StructuresLayerData> {
    const width = vegetation.tiles[0].length;
    const height = vegetation.tiles.length;

    this.logger?.info('Starting structures layer generation', {
      metadata: {
        width,
        height,
        development: context.development,
        seed: seed.getValue()
      }
    });

    // 1. Identify suitable building sites
    const buildingSites = this.siteService.identifyBuildingSites(
      vegetation,
      hydrology,
      topography,
      context,
      width,
      height
    );
    this.logger?.debug('Identified building sites', { metadata: { count: buildingSites.length } });

    // 2. Place buildings based on development level
    const buildings = await this.buildingService.placeBuildings(
      buildingSites,
      context.development,
      context,
      seed
    );
    this.logger?.debug('Placed buildings', { metadata: { count: buildings.length } });

    // 3. Generate road network connecting buildings
    const roadNetwork = this.roadService.generateRoadNetwork(
      buildings,
      vegetation,
      hydrology,
      topography,
      context,
      seed,
      width,
      height
    );
    this.logger?.debug('Generated road network', { metadata: { segments: roadNetwork.segments.length } });

    // 4. Bridge generation - not yet implemented as entities
    // See: docs/features/planned/bridge-generation-system.md
    // For now, bridges exist only in tile data
    const bridges: Bridge[] = [];
    const bridgeLocations = this.bridgeService.placeBridges(
      roadNetwork,
      hydrology,
      topography,
      seed
    );
    this.logger?.debug('Placed bridges', { metadata: { count: bridgeLocations.length } });

    // 5. Add decorative structures
    const decorativeStructures = this.decorationService.placeDecorativeStructures(
      buildings,
      roadNetwork,
      vegetation,
      context,
      seed,
      width,
      height
    );
    this.logger?.debug('Placed decorative structures', { metadata: { count: decorativeStructures.length } });

    // 6. Create tile data
    const tiles = this.tileService.createTileData(
      buildings,
      roadNetwork,
      bridgeLocations,
      decorativeStructures,
      context,
      width,
      height
    );

    // 7. Calculate statistics
    const totalStructureCount = buildings.length + bridgeLocations.length + decorativeStructures.length;

    this.logger?.info('Structures layer generation complete', {
      metadata: {
        buildings: buildings.length,
        roads: roadNetwork.segments.length,
        bridges: bridgeLocations.length,
        decorations: decorativeStructures.length,
        totalStructures: totalStructureCount
      }
    });

    return {
      tiles,
      buildings,
      roads: roadNetwork,
      bridges,
      totalStructureCount
    };
  }

}