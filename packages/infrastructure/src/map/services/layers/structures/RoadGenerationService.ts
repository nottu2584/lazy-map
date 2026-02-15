import { Injectable, Optional, Inject } from '@nestjs/common';
import {
  Seed,
  Building,
  TacticalMapContext,
  DevelopmentLevel,
  VegetationLayerData,
  HydrologyLayerData,
  TopographyLayerData,
  RoadNetwork,
  RoadSegment,
  MaterialType,
  type ILogger
} from '@lazy-map/domain';

/**
 * Generates road networks connecting buildings
 * Uses simple pathfinding with obstacle avoidance
 */
@Injectable()
export class RoadGenerationService {
  constructor(
    @Optional() @Inject('ILogger')
    private readonly logger?: ILogger
  ) {}

  /**
   * Generate road network using pathfinding
   * Connects buildings with minimum spanning tree approach
   */
  generateRoadNetwork(
    buildings: Building[],
    vegetation: VegetationLayerData,
    hydrology: HydrologyLayerData,
    topography: TopographyLayerData,
    context: TacticalMapContext,
    seed: Seed,
    width: number,
    height: number
  ): RoadNetwork {
    const segments: RoadSegment[] = [];
    const intersections: { x: number; y: number }[] = [];

    // No roads in wilderness
    if (context.development === DevelopmentLevel.WILDERNESS) {
      return { segments, intersections, totalLength: 0 };
    }

    // Connect buildings with roads
    if (buildings.length >= 2) {
      // Simple approach: connect nearest neighbors
      const connected = new Set<number>();
      connected.add(0);

      while (connected.size < buildings.length) {
        let minDist = Infinity;
        let bestFrom = -1;
        let bestTo = -1;

        // Find nearest unconnected building
        for (const fromIdx of connected) {
          for (let toIdx = 0; toIdx < buildings.length; toIdx++) {
            if (connected.has(toIdx)) continue;

            const from = buildings[fromIdx];
            const to = buildings[toIdx];
            const fromPos = from.getPosition();
            const toPos = to.getPosition();
            const dist = Math.sqrt(
              Math.pow(toPos.x - fromPos.x, 2) +
              Math.pow(toPos.y - fromPos.y, 2)
            );

            if (dist < minDist) {
              minDist = dist;
              bestFrom = fromIdx;
              bestTo = toIdx;
            }
          }
        }

        if (bestTo !== -1) {
          // Create road segment
          const from = buildings[bestFrom];
          const to = buildings[bestTo];
          const fromPos = from.getPosition();
          const toPos = to.getPosition();
          const path = this.findRoadPath(
            { x: Math.floor(fromPos.x / 5), y: Math.floor(fromPos.y / 5) },
            { x: Math.floor(toPos.x / 5), y: Math.floor(toPos.y / 5) },
            vegetation,
            hydrology,
            topography,
            width,
            height
          );

          if (path.length > 0) {
            segments.push({
              points: path,
              material: MaterialType.DIRT,
              width: 1
            });
          }

          connected.add(bestTo);
        } else {
          break;
        }
      }
    }

    // Calculate total length
    let totalLength = 0;
    for (const segment of segments) {
      totalLength += segment.points.length;
    }

    // Find intersections
    const roadTiles = new Map<string, number>();
    for (const segment of segments) {
      for (const point of segment.points) {
        const key = `${point.x},${point.y}`;
        const count = (roadTiles.get(key) || 0) + 1;
        roadTiles.set(key, count);
        if (count > 1) {
          intersections.push(point);
        }
      }
    }

    return { segments, intersections, totalLength };
  }

  /**
   * Find path for road using simple pathfinding
   * Creates straight line with obstacle avoidance
   */
  private findRoadPath(
    from: { x: number; y: number },
    to: { x: number; y: number },
    vegetation: VegetationLayerData,
    hydrology: HydrologyLayerData,
    topography: TopographyLayerData,
    width: number,
    height: number
  ): { x: number; y: number }[] {
    // Simple straight line with obstacle avoidance
    const path: { x: number; y: number }[] = [];

    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const steps = Math.max(Math.abs(dx), Math.abs(dy));

    if (steps === 0) return path;

    const xStep = dx / steps;
    const yStep = dy / steps;

    for (let i = 0; i <= steps; i++) {
      const x = Math.round(from.x + xStep * i);
      const y = Math.round(from.y + yStep * i);

      // Check if position is valid for road
      if (x >= 0 && x < width && y >= 0 && y < height) {
        // Avoid water (will need bridges)
        if (hydrology.tiles[y][x].waterDepth === 0) {
          path.push({ x, y });
        }
      }
    }

    return path;
  }

  /**
   * Calculate how many directions this road tile connects
   */
  calculateRoadConnectivity(
    point: { x: number; y: number },
    roadNetwork: RoadNetwork
  ): number {
    let connectivity = 0;
    const directions = [
      { dx: 0, dy: -1 }, // N
      { dx: 1, dy: 0 },  // E
      { dx: 0, dy: 1 },  // S
      { dx: -1, dy: 0 }  // W
    ];

    for (const dir of directions) {
      const nx = point.x + dir.dx;
      const ny = point.y + dir.dy;

      // Check if neighbor is also a road
      for (const segment of roadNetwork.segments) {
        if (segment.points.some(p => p.x === nx && p.y === ny)) {
          connectivity++;
          break;
        }
      }
    }

    return connectivity;
  }
}
