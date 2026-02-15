import { Injectable, Optional, Inject } from '@nestjs/common';
import {
  TacticalMapContext,
  HydrologyType,
  HydrologyConfig,
  type ILogger
} from '@lazy-map/domain';

/**
 * Calculates stream channels and Strahler stream order
 * Identifies which tiles are streams based on flow accumulation threshold
 */
@Injectable()
export class StreamCalculationService {
  // D8 flow directions (clockwise from north)
  private readonly FLOW_DIRS = [
    { dx: 0, dy: -1 }, // N
    { dx: 1, dy: -1 }, // NE
    { dx: 1, dy: 0 },  // E
    { dx: 1, dy: 1 },  // SE
    { dx: 0, dy: 1 },  // S
    { dx: -1, dy: 1 }, // SW
    { dx: -1, dy: 0 }, // W
    { dx: -1, dy: -1 } // NW
  ];

  constructor(
    @Optional() @Inject('ILogger')
    private readonly logger?: ILogger
  ) {}

  /**
   * Identify stream channels based on flow accumulation
   * Returns stream grid and Strahler stream order
   */
  identifyStreams(
    flowAccumulation: number[][],
    flowDirections: number[][],
    context: TacticalMapContext,
    width: number,
    height: number,
    config?: HydrologyConfig
  ): { isStream: boolean[][]; streamOrder: number[][] } {
    const isStream: boolean[][] = [];
    const streamOrder: number[][] = [];

    // Threshold for stream formation based on context and config
    const threshold = this.getStreamThreshold(context, config);

    // Initialize arrays
    for (let y = 0; y < height; y++) {
      isStream[y] = new Array(width).fill(false);
      streamOrder[y] = new Array(width).fill(0);
    }

    // Mark streams based on accumulation threshold
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (flowAccumulation[y][x] >= threshold) {
          isStream[y][x] = true;
        }
      }
    }

    // Calculate Strahler stream order
    this.calculateStreamOrder(isStream, flowDirections, streamOrder, width, height);

    return { isStream, streamOrder };
  }

  /**
   * Get appropriate stream formation threshold
   * Applies config multiplier to base thresholds (inverse relationship)
   */
  private getStreamThreshold(context: TacticalMapContext, config?: HydrologyConfig): number {
    // Base thresholds per hydrology type
    let baseThreshold: number;
    switch (context.hydrology) {
      case HydrologyType.ARID:
        baseThreshold = 25; // High threshold but reduced for 50x50 maps
        break;
      case HydrologyType.SEASONAL:
        baseThreshold = 15;
        break;
      case HydrologyType.STREAM:
        baseThreshold = 8;  // Reduced for better stream generation
        break;
      case HydrologyType.RIVER:
        baseThreshold = 5;
        break;
      case HydrologyType.WETLAND:
        baseThreshold = 3;
        break;
      default:
        baseThreshold = 10;
    }

    // Apply config multiplier (default 1.0× if no config)
    const multiplier = config?.getStreamThresholdMultiplier() ?? 1.0;
    return baseThreshold * multiplier;
  }

  /**
   * Calculate Strahler stream order for hierarchical classification
   */
  private calculateStreamOrder(
    isStream: boolean[][],
    flowDirections: number[][],
    streamOrder: number[][],
    width: number,
    height: number
  ): void {
    // Start with order 1 for all headwater streams
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (isStream[y][x]) {
          streamOrder[y][x] = 1;
        }
      }
    }

    // Iteratively update orders
    let changed = true;
    while (changed) {
      changed = false;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          if (!isStream[y][x]) continue;

          // Find tributaries
          const tributaries: number[] = [];
          for (let dir = 0; dir < 8; dir++) {
            const nx = x - this.FLOW_DIRS[dir].dx;
            const ny = y - this.FLOW_DIRS[dir].dy;

            if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;

            if (flowDirections[ny][nx] === dir && isStream[ny][nx]) {
              tributaries.push(streamOrder[ny][nx]);
            }
          }

          if (tributaries.length > 0) {
            const maxOrder = Math.max(...tributaries);
            const sameOrderCount = tributaries.filter(o => o === maxOrder).length;
            const newOrder = sameOrderCount >= 2 ? maxOrder + 1 : maxOrder;

            if (newOrder > streamOrder[y][x]) {
              streamOrder[y][x] = newOrder;
              changed = true;
            }
          }
        }
      }
    }
  }
}
