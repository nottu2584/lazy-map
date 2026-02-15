import { Injectable, Optional, Inject } from '@nestjs/common';
import {
  Seed,
  NoiseGenerator,
  TacticalMapContext,
  HydrologyType,
  HydrologyConfig,
  HydrologyConstants,
  TopographyLayerData,
  type ILogger
} from '@lazy-map/domain';

/**
 * Calculates water depths for streams and pools
 * Depth based on stream order, topography, and hydrology context
 */
@Injectable()
export class WaterDepthCalculationService {
  constructor(
    @Optional() @Inject('ILogger')
    private readonly logger?: ILogger
  ) {}

  /**
   * Calculate water depths for streams and pools
   */
  calculateWaterDepths(
    flowAccumulation: number[][],
    topography: TopographyLayerData,
    streamData: { isStream: boolean[][]; streamOrder: number[][] },
    context: TacticalMapContext,
    seed: Seed,
    width: number,
    height: number,
    config?: HydrologyConfig
  ): number[][] {
    const depths: number[][] = [];
    const poolNoise = NoiseGenerator.create(seed.getValue() * 7);

    // Get pool threshold from config (with default)
    const poolThreshold = config?.getPoolThreshold() ?? HydrologyConstants.DEFAULT_POOL_THRESHOLD;

    for (let y = 0; y < height; y++) {
      depths[y] = [];
      for (let x = 0; x < width; x++) {
        let depth = 0;

        if (streamData.isStream[y][x]) {
          // Stream depth based on order
          const order = streamData.streamOrder[y][x];
          depth = this.getStreamDepth(order, context);

          // Add variation
          depth *= (0.8 + poolNoise.generateAt(x * 0.3, y * 0.3) * 0.4);

          // Deeper in valleys
          if (topography.tiles[y][x].isValley) {
            depth *= 1.5;
          }
        }

        // Check for pools in depressions - use config-driven threshold
        // Support both valley detection (discrete features) and gradient-based detection (low elevation)
        const isLowElevation = topography.tiles[y][x].elevation <=
          topography.minElevation + (topography.maxElevation - topography.minElevation) * 0.3;
        const isPoolSite = (topography.tiles[y][x].isValley || isLowElevation) &&
                          topography.tiles[y][x].slope < 5 &&
                          context.hydrology !== HydrologyType.ARID;

        if (isPoolSite) {
          const poolChance = poolNoise.generateAt(x * 0.2, y * 0.2);
          // Use config-driven threshold (lower threshold = more pools)
          if (poolChance > poolThreshold) {
            depth = Math.max(depth, 1 + poolChance * 2); // 1-3 feet
          }
        }

        depths[y][x] = depth;
      }
    }

    return depths;
  }

  /**
   * Get appropriate stream depth based on order
   */
  private getStreamDepth(order: number, context: TacticalMapContext): number {
    const baseDepth = order * 0.5; // 0.5 feet per order

    // Modify by hydrology type
    switch (context.hydrology) {
      case HydrologyType.RIVER:
        return baseDepth * 2;
      case HydrologyType.STREAM:
        return baseDepth * 1.5;
      case HydrologyType.SEASONAL:
        return baseDepth * 0.5;
      default:
        return baseDepth;
    }
  }
}
