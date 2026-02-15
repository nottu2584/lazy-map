import { Injectable, Optional, Inject } from '@nestjs/common';
import {
  VegetationLayerData,
  HydrologyLayerData,
  TopographyLayerData,
  TacticalMapContext,
  VegetationType,
  type ILogger
} from '@lazy-map/domain';

/**
 * Calculates suitable building sites based on terrain conditions
 * Evaluates site quality considering vegetation, hydrology, and topography
 */
@Injectable()
export class SiteCalculationService {
  constructor(
    @Optional() @Inject('ILogger')
    private readonly logger?: ILogger
  ) {}

  /**
   * Identify suitable sites for building placement
   * Returns sites sorted by quality (best first)
   */
  identifyBuildingSites(
    vegetation: VegetationLayerData,
    hydrology: HydrologyLayerData,
    topography: TopographyLayerData,
    context: TacticalMapContext,
    width: number,
    height: number
  ): { x: number; y: number; quality: number }[] {
    const sites: { x: number; y: number; quality: number }[] = [];

    for (let y = 2; y < height - 2; y++) {
      for (let x = 2; x < width - 2; x++) {
        // Check basic suitability
        if (hydrology.tiles[y][x].waterDepth > 0) continue;
        if (topography.tiles[y][x].slope > 35) continue;
        if (vegetation.tiles[y][x].vegetationType === VegetationType.DENSE_TREES) continue;

        // Calculate site quality
        let quality = 1.0;

        // Prefer clearings
        if (vegetation.tiles[y][x].vegetationType === VegetationType.NONE ||
            vegetation.tiles[y][x].vegetationType === VegetationType.GRASS) {
          quality += 0.3;
        }

        // Prefer flat areas
        if (topography.tiles[y][x].slope < 5) {
          quality += 0.2;
        }

        // Near water is good
        let nearWater = false;
        for (let dy = -3; dy <= 3; dy++) {
          for (let dx = -3; dx <= 3; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              if (hydrology.tiles[ny][nx].waterDepth > 0) {
                nearWater = true;
                break;
              }
            }
          }
        }
        if (nearWater) quality += 0.2;

        // Check if area is clear enough for building
        if (this.checkBuildingFootprint(x, y, 2, 2, vegetation, hydrology, topography, width, height)) {
          sites.push({ x, y, quality });
        }
      }
    }

    // Sort by quality
    sites.sort((a, b) => b.quality - a.quality);
    return sites;
  }

  /**
   * Check if area is suitable for building footprint
   */
  checkBuildingFootprint(
    x: number,
    y: number,
    buildingWidth: number,
    buildingHeight: number,
    vegetation: VegetationLayerData,
    hydrology: HydrologyLayerData,
    topography: TopographyLayerData,
    mapWidth: number,
    mapHeight: number
  ): boolean {
    for (let dy = 0; dy < buildingHeight; dy++) {
      for (let dx = 0; dx < buildingWidth; dx++) {
        const nx = x + dx;
        const ny = y + dy;

        if (nx >= mapWidth || ny >= mapHeight) return false;
        if (hydrology.tiles[ny][nx].waterDepth > 0) return false;
        if (topography.tiles[ny][nx].slope > 45) return false;
        if (vegetation.tiles[ny][nx].vegetationType === VegetationType.DENSE_TREES) return false;
      }
    }
    return true;
  }
}
