import { Injectable, Optional, Inject } from '@nestjs/common';
import {
  BiomeType,
  GeologyLayerData,
  HydrologyLayerData,
  MoistureLevel,
  TacticalMapContext,
  TopographyLayerData,
  type ILogger
} from '@lazy-map/domain';

/**
 * Calculates base vegetation growth potential for each tile
 * Based on biome type, moisture, slope, soil depth, and elevation
 */
@Injectable()
export class PotentialCalculationService {
  constructor(
    @Optional() @Inject('ILogger') private readonly logger?: ILogger
  ) {}

  /**
   * Calculate vegetation growth potential for all tiles
   * Returns normalized values between 0 and 1
   */
  calculateVegetationPotential(
    hydrology: HydrologyLayerData,
    topography: TopographyLayerData,
    geology: GeologyLayerData,
    context: TacticalMapContext,
    width: number,
    height: number
  ): number[][] {
    const potential: number[][] = [];

    for (let y = 0; y < height; y++) {
      potential[y] = [];
      for (let x = 0; x < width; x++) {
        const moisture = hydrology.tiles[y][x].moisture;
        const slope = topography.tiles[y][x].slope;
        const elevation = topography.tiles[y][x].elevation;
        const soilDepth = geology.tiles[y][x].soilDepth;

        // Base potential from biome
        let value = this.getBiomePotential(context.biome);

        // Moisture is critical
        value *= this.getMoistureFactor(moisture);

        // Slope affects growth
        if (slope > 60) value *= 0.1; // Very steep
        else if (slope > 40) value *= 0.3;
        else if (slope > 20) value *= 0.7;

        // Soil depth matters
        if (soilDepth < 0.5) value *= 0.2; // Bare rock
        else if (soilDepth < 2) value *= 0.6;

        // Elevation zones
        if (context.elevation === 'alpine' && elevation > 60) {
          value *= 0.3; // Tree line effects
        }

        potential[y][x] = Math.max(0, Math.min(1, value));
      }
    }

    return potential;
  }

  /**
   * Get base vegetation potential for biome
   */
  private getBiomePotential(biome: BiomeType): number {
    switch (biome) {
      case BiomeType.FOREST:
        return 1.0;
      case BiomeType.PLAINS:
        return 0.4;
      case BiomeType.DESERT:
        return 0.1;
      case BiomeType.SWAMP:
        return 0.8;
      case BiomeType.MOUNTAIN:
        return 0.5;
      case BiomeType.COASTAL:
        return 0.6;
      default:
        return 0.5;
    }
  }

  /**
   * Get moisture growth factor
   */
  private getMoistureFactor(moisture: MoistureLevel): number {
    switch (moisture) {
      case MoistureLevel.SATURATED:
        return 0.7; // Too wet for most trees
      case MoistureLevel.WET:
        return 1.0;
      case MoistureLevel.MOIST:
        return 0.9;
      case MoistureLevel.MODERATE:
        return 0.7;
      case MoistureLevel.DRY:
        return 0.3;
      case MoistureLevel.ARID:
        return 0.1;
      default:
        return 0.5;
    }
  }
}
