import { Injectable, Optional, Inject } from '@nestjs/common';
import {
  Plant,
  TreePlant,
  ShrubPlant,
  HerbaceousPlant,
  PlantSize,
  VegetationType,
  VegetationConfig,
  HydrologyLayerData,
  type ILogger
} from '@lazy-map/domain';
import { ClearingAnalysisService } from './ClearingAnalysisService';

/**
 * Calculates tactical properties of vegetation
 * Includes canopy height, density, and vegetation type classification
 */
@Injectable()
export class TacticalPropertiesService {
  constructor(
    private readonly clearingAnalysisService: ClearingAnalysisService,
    @Optional() @Inject('ILogger') private readonly logger?: ILogger
  ) {}

  /**
   * Calculate tactical properties for vegetation
   */
  calculateTacticalProperties(
    plants: Plant[][][],
    hydrology: HydrologyLayerData,
    width: number,
    height: number
  ): { canopyHeight: number[][]; canopyDensity: number[][]; vegetationType: VegetationType[][] } {
    const canopyHeight: number[][] = [];
    const canopyDensity: number[][] = [];
    const vegetationType: VegetationType[][] = [];

    for (let y = 0; y < height; y++) {
      canopyHeight[y] = [];
      canopyDensity[y] = [];
      vegetationType[y] = [];

      for (let x = 0; x < width; x++) {
        const tilePlants = plants[y][x];

        // Calculate canopy height (tallest plant)
        let maxHeight = 0;
        let treeCount = 0;
        let shrubCount = 0;

        for (const plant of tilePlants) {
          const height = this.getPlantHeight(plant);
          maxHeight = Math.max(maxHeight, height);

          if (plant instanceof TreePlant) treeCount++;
          else if (plant instanceof ShrubPlant) shrubCount++;
        }

        canopyHeight[y][x] = maxHeight;

        // Calculate density using basal area survey
        const basalArea = this.clearingAnalysisService.calculateBasalArea(x, y, plants, width, height);
        const densityClass = VegetationConfig.classifyDensity(basalArea);

        // Convert basal area classification to canopy density (0-1)
        if (densityClass === 'dense') {
          canopyDensity[y][x] = 0.8;
        } else if (densityClass === 'moderate') {
          canopyDensity[y][x] = 0.5;
        } else if (densityClass === 'sparse') {
          canopyDensity[y][x] = 0.2;
        } else if (shrubCount > 0) {
          canopyDensity[y][x] = 0.3;
        } else {
          canopyDensity[y][x] = tilePlants.length > 0 ? 0.1 : 0;
        }

        // Determine vegetation type using basal area classification
        if (densityClass === 'dense') {
          vegetationType[y][x] = VegetationType.DENSE_TREES;
        } else if (densityClass === 'moderate' || densityClass === 'sparse') {
          vegetationType[y][x] = VegetationType.SPARSE_TREES;
        } else if (shrubCount > 0) {
          // Check for wetland vegetation based on moisture
          if (hydrology.tiles[y][x].moisture === 'saturated' ||
              hydrology.tiles[y][x].moisture === 'wet') {
            vegetationType[y][x] = VegetationType.UNDERGROWTH;
          } else {
            vegetationType[y][x] = VegetationType.SHRUBS;
          }
        } else if (tilePlants.length > 0) {
          vegetationType[y][x] = VegetationType.GRASS;
        } else {
          vegetationType[y][x] = VegetationType.NONE;
        }
      }
    }

    return { canopyHeight, canopyDensity, vegetationType };
  }

  /**
   * Get plant height in feet
   */
  getPlantHeight(plant: Plant): number {
    const baseHeight = plant instanceof TreePlant ? 20 :
                      plant instanceof ShrubPlant ? 5 :
                      plant instanceof HerbaceousPlant ? 2 : 0.5;

    const sizeMultiplier = {
      [PlantSize.TINY]: 0.3,
      [PlantSize.SMALL]: 0.5,
      [PlantSize.MEDIUM]: 1.0,
      [PlantSize.LARGE]: 1.5,
      [PlantSize.HUGE]: 2.0,
      [PlantSize.MASSIVE]: 3.0
    };

    return baseHeight * sizeMultiplier[plant.size];
  }
}
