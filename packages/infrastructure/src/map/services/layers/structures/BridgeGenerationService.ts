import { Injectable, Optional, Inject } from '@nestjs/common';
import {
  Seed,
  NoiseGenerator,
  MaterialType,
  RoadNetwork,
  HydrologyLayerData,
  TopographyLayerData,
  type ILogger
} from '@lazy-map/domain';

/**
 * Bridge location information
 */
export interface BridgeLocation {
  position: { x: number; y: number };
  material: MaterialType;
  length: number;
  direction: 'horizontal' | 'vertical';
}

/**
 * Generates bridge locations where roads cross water
 * Determines bridge material and orientation
 */
@Injectable()
export class BridgeGenerationService {
  constructor(
    @Optional() @Inject('ILogger')
    private readonly logger?: ILogger
  ) {}

  /**
   * Place bridges where roads cross water
   */
  placeBridges(
    roadNetwork: RoadNetwork,
    hydrology: HydrologyLayerData,
    topography: TopographyLayerData,
    seed: Seed
  ): BridgeLocation[] {
    const bridges: BridgeLocation[] = [];
    const bridgeNoise = NoiseGenerator.create(seed.getValue() * 11);

    // Check each road segment for water crossings
    for (const segment of roadNetwork.segments) {
      for (let i = 1; i < segment.points.length; i++) {
        const prev = segment.points[i - 1];
        const curr = segment.points[i];

        // Check if we're entering water
        if (hydrology.tiles[prev.y][prev.x].waterDepth === 0 &&
            hydrology.tiles[curr.y][curr.x].waterDepth > 0) {
          // Find extent of water crossing
          let endIdx = i;
          while (endIdx < segment.points.length &&
                 hydrology.tiles[segment.points[endIdx].y][segment.points[endIdx].x].waterDepth > 0) {
            endIdx++;
          }

          if (endIdx < segment.points.length) {
            // Create bridge
            const bridgeStart = prev;
            const bridgeEnd = segment.points[endIdx];
            const orientation = Math.abs(bridgeEnd.x - bridgeStart.x) >
                              Math.abs(bridgeEnd.y - bridgeStart.y) ?
                              'horizontal' : 'vertical';
            const length = Math.max(
              Math.abs(bridgeEnd.x - bridgeStart.x),
              Math.abs(bridgeEnd.y - bridgeStart.y)
            );

            bridges.push({
              position: bridgeStart,
              direction: orientation,
              length,
              material: bridgeNoise.generateAt(bridgeStart.x * 0.1, bridgeStart.y * 0.1) > 0.5 ?
                       MaterialType.STONE : MaterialType.WOOD
            });

            // Skip past this bridge
            i = endIdx;
          }
        }
      }
    }

    return bridges;
  }
}
