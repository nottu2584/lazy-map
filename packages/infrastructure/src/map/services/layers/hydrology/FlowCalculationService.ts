import { Injectable, Optional, Inject } from '@nestjs/common';
import { TopographyLayerData, type ILogger } from '@lazy-map/domain';

/**
 * Calculates water flow directions and accumulation using D8 algorithm
 * Implements steepest-descent flow routing for realistic drainage patterns
 */
@Injectable()
export class FlowCalculationService {
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
   * Calculate flow direction for each tile using D8 algorithm
   * Each tile flows to its steepest downslope neighbor
   */
  calculateFlowDirections(
    topography: TopographyLayerData,
    width: number,
    height: number
  ): number[][] {
    const directions: number[][] = [];

    for (let y = 0; y < height; y++) {
      directions[y] = [];
      for (let x = 0; x < width; x++) {
        const currentElev = topography.tiles[y][x].elevation;
        let maxDrop = 0;
        let flowDir = -1; // -1 means sink/flat

        // Check all 8 directions
        for (let dir = 0; dir < 8; dir++) {
          const nx = x + this.FLOW_DIRS[dir].dx;
          const ny = y + this.FLOW_DIRS[dir].dy;

          // Skip out of bounds
          if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;

          const neighborElev = topography.tiles[ny][nx].elevation;
          const drop = currentElev - neighborElev;

          // Diagonal cells have longer distance (sqrt(2))
          const distance = (dir % 2 === 0) ? 1 : 1.414;
          const slope = drop / distance;

          if (slope > maxDrop) {
            maxDrop = slope;
            flowDir = dir;
          }
        }

        directions[y][x] = flowDir;
      }
    }

    return directions;
  }

  /**
   * Calculate flow accumulation using recursive algorithm
   * Returns number of upstream cells that drain through each tile
   */
  calculateFlowAccumulation(
    flowDirections: number[][],
    width: number,
    height: number
  ): number[][] {
    const accumulation: number[][] = [];
    const visited: boolean[][] = [];

    // Initialize arrays
    for (let y = 0; y < height; y++) {
      accumulation[y] = new Array(width).fill(1); // Each cell contributes 1
      visited[y] = new Array(width).fill(false);
    }

    // Calculate accumulation for each cell
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (!visited[y][x]) {
          this.traceFlow(x, y, flowDirections, accumulation, visited, width, height);
        }
      }
    }

    return accumulation;
  }

  /**
   * Recursively trace flow and accumulate values
   */
  private traceFlow(
    x: number,
    y: number,
    flowDirections: number[][],
    accumulation: number[][],
    visited: boolean[][],
    width: number,
    height: number
  ): number {
    // Mark as visited
    visited[y][x] = true;

    // Find all cells that flow into this one
    let totalFlow = 1; // Start with self-contribution

    for (let ny = 0; ny < height; ny++) {
      for (let nx = 0; nx < width; nx++) {
        if (nx === x && ny === y) continue;

        const dir = flowDirections[ny][nx];
        if (dir === -1) continue;

        // Check if this cell flows into current cell
        const targetX = nx + this.FLOW_DIRS[dir].dx;
        const targetY = ny + this.FLOW_DIRS[dir].dy;

        if (targetX === x && targetY === y) {
          // This cell flows into us
          if (!visited[ny][nx]) {
            totalFlow += this.traceFlow(nx, ny, flowDirections, accumulation, visited, width, height);
          } else {
            totalFlow += accumulation[ny][nx];
          }
        }
      }
    }

    accumulation[y][x] = totalFlow;
    return totalFlow;
  }

  /**
   * Get flow direction vectors (for external use)
   */
  getFlowDirections() {
    return this.FLOW_DIRS;
  }
}
