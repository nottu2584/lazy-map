import { Injectable, Inject, Optional } from '@nestjs/common';
import {
  TacticalMapContext,
  Seed,
  NoiseGenerator,
  HydrologyType,
  type ILogger,
  GeologyLayerData,
  TopographyConfig
} from '@lazy-map/domain';

/**
 * Applies scientific erosion modeling based on rock properties and climate
 */
@Injectable()
export class ErosionModelService {
  constructor(
    @Optional() @Inject('ILogger') private readonly logger?: ILogger
  ) {}

  /**
   * Apply differential erosion based on scientific model
   * Erosion = f(rock hardness, slope, fractures, climate, terrain age)
   */
  applyDifferentialErosion(
    elevations: number[][],
    geology: GeologyLayerData,
    context: TacticalMapContext,
    seed: Seed,
    config?: TopographyConfig
  ): number[][] {
    const width = elevations[0].length;
    const height = elevations.length;
    const eroded: number[][] = [];
    const erosionNoise = NoiseGenerator.create(seed.getValue() * 5);
    const ruggedness = config?.terrainRuggedness ?? 1.0;
    const climateWetness = this.calculateClimateWetness(context.hydrology);

    // First pass: calculate slopes (needed for erosion calculation)
    const slopes = this.calculateSlopesArray(elevations);

    for (let y = 0; y < height; y++) {
      eroded[y] = [];
      for (let x = 0; x < width; x++) {
        const geoTile = geology.tiles[y][x];
        const slope = slopes[y][x];

        // Calculate erosion susceptibility
        const susceptibility = this.calculateErosionSusceptibility(
          geoTile,
          slope,
          climateWetness,
          ruggedness
        );

        // Apply spatial variation with noise
        const noiseVariation = 0.7 + erosionNoise.generateAt(x * 0.1, y * 0.1) * 0.6; // 0.7 to 1.3

        // Erosion amount scales with max elevation (proportional to relief)
        const maxElev = Math.max(...elevations.flat());
        const erosionAmount = susceptibility * noiseVariation * (maxElev / 50) * 8; // Scale to ~8ft at 50ft relief

        eroded[y][x] = Math.max(0, elevations[y][x] - erosionAmount);
      }
    }

    return eroded;
  }

  /**
   * Calculate climate wetness factor from hydrology type
   * Wet climates cause more chemical weathering and erosion
   */
  private calculateClimateWetness(hydrologyType: HydrologyType): number {
    const wetnessMap: Record<HydrologyType, number> = {
      [HydrologyType.ARID]: 0.3,
      [HydrologyType.SEASONAL]: 0.6,
      [HydrologyType.STREAM]: 0.7,
      [HydrologyType.RIVER]: 0.8,
      [HydrologyType.LAKE]: 0.75,
      [HydrologyType.COASTAL]: 0.9,
      [HydrologyType.WETLAND]: 1.0
    };
    return wetnessMap[hydrologyType] ?? 0.6;
  }

  /**
   * Calculate erosion susceptibility per tile
   * Returns 0-1 value representing how much this tile erodes
   */
  private calculateErosionSusceptibility(
    geoTile: any,
    slope: number,
    climateWetness: number,
    ruggedness: number
  ): number {
    // Rock resistance (0 = soft, 1 = hard)
    const resistance = geoTile.formation.properties.getErosionResistance();
    const rockFactor = 1 - resistance; // Invert: soft rocks erode more

    // Slope factor (steeper slopes erode more, but plateau at extreme angles)
    const slopeFactor = Math.min(1.5, 1 + slope / 60); // 1.0 to 1.5

    // Fracture factor (more fractures = more erosion)
    const fractureFactor = 1 + geoTile.fractureIntensity * 0.5; // 1.0 to 1.5

    // Ruggedness factor (low ruggedness = old terrain = more time to erode)
    // Inverted relationship: low ruggedness = high erosion
    const terrainAgeFactor = 2.0 - ruggedness; // 0.5 to 1.5 (inverted)

    // Combine all factors
    const susceptibility =
      0.3 * rockFactor +          // 30% weight
      0.2 * (slopeFactor - 1) +   // 20% weight
      0.2 * (fractureFactor - 1) + // 20% weight
      0.15 * (climateWetness - 0.5) + // 15% weight
      0.15 * (terrainAgeFactor - 1);  // 15% weight

    // Normalize to 0-1 range
    return Math.max(0, Math.min(1, susceptibility));
  }

  /**
   * Calculate slopes for elevation array (helper for erosion and smoothing)
   */
  calculateSlopesArray(elevations: number[][]): number[][] {
    const width = elevations[0].length;
    const height = elevations.length;
    const slopes: number[][] = [];
    for (let y = 0; y < height; y++) {
      slopes[y] = [];
      for (let x = 0; x < width; x++) {
        slopes[y][x] = this.calculateSlopeAtPoint(elevations, x, y);
      }
    }
    return slopes;
  }

  /**
   * Calculate slope at a specific point
   */
  calculateSlopeAtPoint(elevations: number[][], x: number, y: number): number {
    const width = elevations[0].length;
    const height = elevations.length;
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
    return Math.atan(Math.sqrt(dx * dx + dy * dy)) * 180 / Math.PI;
  }
}
