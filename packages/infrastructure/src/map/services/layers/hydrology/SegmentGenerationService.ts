import { Injectable, Optional, Inject } from '@nestjs/common';
import { HydrologyTileData, StreamSegment, type ILogger } from '@lazy-map/domain';

/**
 * Generates stream segment polylines for visualization
 * Converts boolean stream grid into drawable paths
 */
@Injectable()
export class SegmentGenerationService {
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
   * Extract continuous stream segments for visualization
   */
  extractStreamSegments(tiles: HydrologyTileData[][], width: number, height: number): StreamSegment[] {
    const segments: StreamSegment[] = [];
    const visited: boolean[][] = [];

    // Initialize visited array
    for (let y = 0; y < height; y++) {
      visited[y] = Array.from({ length: width }, () => false);
    }

    // Find all stream starting points
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (tiles[y][x].isStream && !visited[y][x]) {
          const segment = this.traceStreamSegment(x, y, tiles, visited, width, height);
          if (segment.points.length > 2) {
            segments.push(segment);
          }
        }
      }
    }

    return segments;
  }

  /**
   * Trace a continuous stream segment by following flow direction
   */
  private traceStreamSegment(
    startX: number,
    startY: number,
    tiles: HydrologyTileData[][],
    visited: boolean[][],
    width: number,
    height: number
  ): StreamSegment {
    const points: { x: number; y: number }[] = [];
    let x = startX;
    let y = startY;
    let maxOrder = 0;

    while (x >= 0 && x < width && y >= 0 && y < height) {
      if (visited[y][x] || !tiles[y][x].isStream) break;

      visited[y][x] = true;
      points.push({ x, y });
      maxOrder = Math.max(maxOrder, tiles[y][x].streamOrder);

      // Follow flow direction
      const dir = tiles[y][x].flowDirection;
      if (dir === -1) break;

      x += this.FLOW_DIRS[dir].dx;
      y += this.FLOW_DIRS[dir].dy;
    }

    return {
      points,
      order: maxOrder,
      width: Math.ceil(maxOrder / 2) // Width in tiles
    };
  }
}
