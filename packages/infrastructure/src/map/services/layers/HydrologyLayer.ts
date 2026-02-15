import { Injectable, Inject, Optional } from '@nestjs/common';
import {
  TacticalMapContext,
  Seed,
  MapGenerationErrors,
  type ILogger,
  // Import from domain layer service interfaces
  IHydrologyLayerService,
  HydrologyLayerData,
  HydrologyTileData,
  GeologyLayerData,
  TopographyLayerData,
  HydrologyConfig
} from '@lazy-map/domain';

import { FlowCalculationService } from './hydrology/FlowCalculationService';
import { SpringGenerationService } from './hydrology/SpringGenerationService';
import { StreamCalculationService } from './hydrology/StreamCalculationService';
import { WaterDepthCalculationService } from './hydrology/WaterDepthCalculationService';
import { MoistureCalculationService } from './hydrology/MoistureCalculationService';
import { SegmentGenerationService } from './hydrology/SegmentGenerationService';

/**
 * Hydrology Layer - Orchestrates water flow generation
 * Delegates to specialized services for each generation phase
 *
 * Refactored from 706-line monolith into lightweight orchestrator pattern
 * Services handle: flow calculation, spring generation, stream calculation,
 * water depth calculation, moisture calculation, and segment generation
 */
@Injectable()
export class HydrologyLayer implements IHydrologyLayerService {
  constructor(
    @Inject(FlowCalculationService)
    private readonly flowService: FlowCalculationService,

    @Inject(SpringGenerationService)
    private readonly springService: SpringGenerationService,

    @Inject(StreamCalculationService)
    private readonly streamService: StreamCalculationService,

    @Inject(WaterDepthCalculationService)
    private readonly depthService: WaterDepthCalculationService,

    @Inject(MoistureCalculationService)
    private readonly moistureService: MoistureCalculationService,

    @Inject(SegmentGenerationService)
    private readonly segmentService: SegmentGenerationService,

    @Optional() @Inject('ILogger')
    private readonly logger?: ILogger
  ) {}

  /**
   * Generate hydrological layer from topography and geology
   * Orchestrates the 6-phase hydrology generation pipeline
   */
  async generate(
    topography: TopographyLayerData,
    geology: GeologyLayerData,
    context: TacticalMapContext,
    seed: Seed,
    config?: HydrologyConfig
  ): Promise<HydrologyLayerData> {
    if (!topography || !topography.tiles) {
      throw MapGenerationErrors.invalidLayerDependency('hydrology', 'topography');
    }
    if (!geology || !geology.tiles) {
      throw MapGenerationErrors.invalidLayerDependency('hydrology', 'geology');
    }

    const width = topography.tiles[0].length;
    const height = topography.tiles.length;

    this.logger?.info('Starting hydrology layer generation', {
      metadata: {
        width,
        height,
        hydrologyType: context.hydrology,
        seed: seed.getValue()
      }
    });

    try {
      // 1. Calculate flow directions using D8 algorithm
      const flowDirections = this.flowService.calculateFlowDirections(topography, width, height);
      this.logger?.debug('Calculated flow directions');

      // 2. Calculate flow accumulation
      const flowAccumulation = this.flowService.calculateFlowAccumulation(flowDirections, width, height);
      this.logger?.debug('Calculated flow accumulation');

      // 3. Place springs at geological boundaries
      const springs = this.springService.placeSprings(geology, topography, seed, config);
      this.logger?.debug('Placed springs', { metadata: { count: springs.length } });

      // 4. Identify streams based on flow accumulation threshold
      const streamData = this.streamService.identifyStreams(
        flowAccumulation,
        flowDirections,
        context,
        width,
        height,
        config
      );
      this.logger?.debug('Identified streams');

      // 5. Calculate water depth and pools
      const waterDepths = this.depthService.calculateWaterDepths(
        flowAccumulation,
        topography,
        streamData,
        context,
        seed,
        width,
        height,
        config
      );
      this.logger?.debug('Calculated water depths');

      // 6. Calculate moisture levels
      const moistureLevels = this.moistureService.calculateMoisture(
        waterDepths,
        flowAccumulation,
        geology,
        context,
        width,
        height
      );
      this.logger?.debug('Calculated moisture levels');

      // 7. Create tile data
      const tiles = this.createTileData(
        flowDirections,
        flowAccumulation,
        waterDepths,
        moistureLevels,
        springs,
        streamData,
        width,
        height
      );

      // 8. Extract stream segments for visualization
      const streams = this.segmentService.extractStreamSegments(tiles, width, height);
      this.logger?.debug('Extracted stream segments', { metadata: { count: streams.length } });

      // 9. Calculate statistics
      const waterCoverage = this.calculateWaterCoverage(tiles, width, height);

      this.logger?.info('Hydrology layer generation complete', {
        metadata: {
          springs: springs.length,
          streams: streams.length,
          waterCoverage: waterCoverage.toFixed(2)
        }
      });

      return {
        tiles,
        streams,
        springs,
        totalWaterCoverage: waterCoverage
      };
    } catch (error) {
      this.logger?.error('Failed to generate hydrology layer', { metadata: { error: (error as Error).message } });
      throw MapGenerationErrors.layerGenerationFailed('hydrology', error as Error);
    }
  }


  /**
   * Create tile data combining all hydrological properties
   */
  private createTileData(
    flowDirections: number[][],
    flowAccumulation: number[][],
    waterDepths: number[][],
    moistureLevels: any[][],
    springs: { x: number; y: number }[],
    streamData: { isStream: boolean[][]; streamOrder: number[][] },
    width: number,
    height: number
  ): HydrologyTileData[][] {
    const tiles: HydrologyTileData[][] = [];

    // Create spring lookup
    const springSet = new Set(springs.map(s => `${s.x},${s.y}`));

    for (let y = 0; y < height; y++) {
      tiles[y] = [];
      for (let x = 0; x < width; x++) {
        tiles[y][x] = {
          flowAccumulation: flowAccumulation[y][x],
          flowDirection: flowDirections[y][x],
          waterDepth: waterDepths[y][x],
          moisture: moistureLevels[y][x],
          isSpring: springSet.has(`${x},${y}`),
          isStream: streamData.isStream[y][x],
          isPool: waterDepths[y][x] > 0 && !streamData.isStream[y][x],
          streamOrder: streamData.streamOrder[y][x]
        };
      }
    }

    return tiles;
  }

  /**
   * Calculate percentage of map covered by water
   */
  private calculateWaterCoverage(tiles: HydrologyTileData[][], width: number, height: number): number {
    let waterCount = 0;
    let totalCount = 0;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (tiles[y][x].waterDepth > 0) {
          waterCount++;
        }
        totalCount++;
      }
    }

    return (waterCount / totalCount) * 100;
  }
}