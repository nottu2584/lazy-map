import { Injectable, Inject, Optional } from '@nestjs/common';
import {
  AspectDirection,
  type ILogger,
  TopographyTileData
} from '@lazy-map/domain';

/**
 * Calculates final slopes, aspects, and terrain features
 */
@Injectable()
export class TopographyCalculationService {
  constructor(
    @Optional() @Inject('ILogger') private readonly logger?: ILogger
  ) {}

  /**
   * Calculate slope and aspect for each tile
   */
  calculateTopography(elevations: number[][]): TopographyTileData[][] {
    const width = elevations[0].length;
    const height = elevations.length;
    const topography: TopographyTileData[][] = [];

    for (let y = 0; y < height; y++) {
      topography[y] = [];
      for (let x = 0; x < width; x++) {
        const current = elevations[y][x];

        // Get neighbor elevations
        const north = y > 0 ? elevations[y-1][x] : current;
        const south = y < height-1 ? elevations[y+1][x] : current;
        const east = x < width-1 ? elevations[y][x+1] : current;
        const west = x > 0 ? elevations[y][x-1] : current;

        // Calculate gradients (rise over run, where run is 5 feet per tile)
        const dx = (east - west) / 10; // Divide by 2 tiles * 5 feet
        const dy = (south - north) / 10;

        // Calculate slope in degrees
        const slope = Math.atan(Math.sqrt(dx * dx + dy * dy)) * 180 / Math.PI;

        // Calculate aspect (direction of slope)
        const aspect = this.calculateAspect(dx, dy);

        // Calculate relative elevation
        const neighbors = [north, south, east, west];
        const avgNeighbor = neighbors.reduce((a, b) => a + b, 0) / neighbors.length;
        const relativeElevation = current - avgNeighbor;

        topography[y][x] = {
          elevation: current,
          slope: Math.min(90, slope), // Cap at 90 degrees
          aspect,
          relativeElevation: Math.max(-1, Math.min(1, relativeElevation / 10)),
          isRidge: false,
          isValley: false,
          isDrainage: false
        };
      }
    }

    return topography;
  }

  /**
   * Calculate aspect direction from gradients
   */
  private calculateAspect(dx: number, dy: number): AspectDirection {
    if (dx === 0 && dy === 0) return AspectDirection.FLAT;

    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    const normalized = (angle + 360) % 360;

    if (normalized < 22.5 || normalized >= 337.5) return AspectDirection.EAST;
    if (normalized < 67.5) return AspectDirection.SOUTHEAST;
    if (normalized < 112.5) return AspectDirection.SOUTH;
    if (normalized < 157.5) return AspectDirection.SOUTHWEST;
    if (normalized < 202.5) return AspectDirection.WEST;
    if (normalized < 247.5) return AspectDirection.NORTHWEST;
    if (normalized < 292.5) return AspectDirection.NORTH;
    return AspectDirection.NORTHEAST;
  }

  /**
   * Identify ridges, valleys, and drainage patterns
   */
  identifyTerrainFeatures(topography: TopographyTileData[][]): void {
    const width = topography[0].length;
    const height = topography.length;

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const tile = topography[y][x];
        const elevation = tile.elevation;

        // Count how many neighbors are lower
        let lowerCount = 0;
        let higherCount = 0;

        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const neighbor = topography[y + dy][x + dx].elevation;
            if (neighbor < elevation) lowerCount++;
            if (neighbor > elevation) higherCount++;
          }
        }

        // Ridge if most neighbors are lower
        if (lowerCount >= 6) {
          tile.isRidge = true;
        }
        // Valley if most neighbors are higher
        else if (higherCount >= 6) {
          tile.isValley = true;
          tile.isDrainage = true; // Valleys are natural drainage
        }

        // Mark steep slopes as potential drainage
        if (tile.slope > 30 && tile.relativeElevation < -0.3) {
          tile.isDrainage = true;
        }
      }
    }
  }

  /**
   * Calculate layer statistics
   */
  calculateStatistics(topography: TopographyTileData[][]): {
    min: number;
    max: number;
    avgSlope: number;
  } {
    const width = topography[0].length;
    const height = topography.length;
    let min = Infinity;
    let max = -Infinity;
    let totalSlope = 0;
    let count = 0;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const tile = topography[y][x];
        min = Math.min(min, tile.elevation);
        max = Math.max(max, tile.elevation);
        totalSlope += tile.slope;
        count++;
      }
    }

    return {
      min,
      max,
      avgSlope: totalSlope / count
    };
  }
}
