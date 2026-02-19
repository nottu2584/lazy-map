import { Injectable, Optional, Inject } from '@nestjs/common';
import {
  Plant,
  TreePlant,
  ForestryConstants,
  type ILogger
} from '@lazy-map/domain';

/**
 * Calculates natural clearings and meadows within forested areas
 * Identifies open spaces surrounded by trees and calculates basal area
 */
@Injectable()
export class ClearingCalculationService {
  constructor(
    @Optional() @Inject('ILogger') private readonly logger?: ILogger
  ) {}

  /**
   * Identify natural clearings
   */
  identifyClearings(plants: Plant[][][], width: number, height: number): { x: number; y: number; radius: number }[] {
    const clearings: { x: number; y: number; radius: number }[] = [];
    const visited: boolean[][] = [];

    for (let y = 0; y < height; y++) {
      visited[y] = Array.from({ length: width }, () => false);
    }

    for (let y = 2; y < height - 2; y++) {
      for (let x = 2; x < width - 2; x++) {
        if (visited[y][x]) continue;

        // Check if this could be center of clearing
        if (this.isClearingCenter(plants, x, y, width, height)) {
          const radius = this.measureClearingRadius(plants, x, y, width, height);
          if (radius >= 2) {
            clearings.push({ x, y, radius });
            // Mark area as visited
            for (let dy = -radius; dy <= radius; dy++) {
              for (let dx = -radius; dx <= radius; dx++) {
                const nx = x + dx;
                const ny = y + dy;
                if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                  visited[ny][nx] = true;
                }
              }
            }
          }
        }
      }
    }

    return clearings;
  }

  /**
   * Check if position could be clearing center
   */
  isClearingCenter(plants: Plant[][][], x: number, y: number, width: number, height: number): boolean {
    // No trees in center
    const hasTree = plants[y][x].some(p => p instanceof TreePlant);
    if (hasTree) return false;

    // Check surrounding has some trees
    let treeCount = 0;
    for (let dy = -3; dy <= 3; dy++) {
      for (let dx = -3; dx <= 3; dx++) {
        if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          if (plants[ny][nx].some(p => p instanceof TreePlant)) {
            treeCount++;
          }
        }
      }
    }

    return treeCount >= 5;
  }

  /**
   * Measure clearing radius
   */
  measureClearingRadius(plants: Plant[][][], cx: number, cy: number, width: number, height: number): number {
    let radius = 1;

    while (radius < 5) {
      for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
        const x = Math.round(cx + Math.cos(angle) * radius);
        const y = Math.round(cy + Math.sin(angle) * radius);

        if (x < 0 || x >= width || y < 0 || y >= height) {
          return radius - 1;
        }

        if (plants[y][x].some(p => p instanceof TreePlant)) {
          return radius - 1;
        }
      }
      radius++;
    }

    return radius;
  }

  /**
   * Calculate basal area in a neighborhood using forestry survey method
   * @param x Center tile x coordinate
   * @param y Center tile y coordinate
   * @param plants Plant distribution
   * @returns Basal area in ft²/acre
   */
  calculateBasalArea(x: number, y: number, plants: Plant[][][], width: number, height: number): number {
    const surveyRadius = ForestryConstants.SURVEY_RADIUS_TILES;
    let totalBasalArea = 0;

    // Survey all tiles in radius
    for (let dy = -surveyRadius; dy <= surveyRadius; dy++) {
      for (let dx = -surveyRadius; dx <= surveyRadius; dx++) {
        const nx = x + dx;
        const ny = y + dy;

        // Check bounds
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;

        // Calculate basal area for all trees in this tile
        const tilePlants = plants[ny][nx];
        for (const plant of tilePlants) {
          if (plant instanceof TreePlant) {
            // Basal area = π × (diameter/2)²
            const radius = plant.trunkDiameter / 2;
            const basalArea = Math.PI * radius * radius;
            totalBasalArea += basalArea;
          }
        }
      }
    }

    // Convert to basal area per acre
    // Survey area in square feet = π × radius²
    const surveyRadiusFt = surveyRadius * 5; // tiles to feet
    const surveyAreaFt2 = Math.PI * surveyRadiusFt * surveyRadiusFt;
    const basalAreaPerAcre = (totalBasalArea / surveyAreaFt2) * 43560;

    return basalAreaPerAcre;
  }
}
