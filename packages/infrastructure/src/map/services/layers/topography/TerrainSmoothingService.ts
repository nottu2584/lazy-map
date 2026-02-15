import { Injectable, Inject, Optional } from '@nestjs/common';
import {
  TacticalMapContext,
  type ILogger,
  GeologyLayerData,
  TopographyConfig
} from '@lazy-map/domain';
import { ErosionModelService } from './ErosionModelService';

/**
 * Applies variable smoothing based on erosion susceptibility
 */
@Injectable()
export class TerrainSmoothingService {
  constructor(
    @Inject(ErosionModelService)
    private readonly erosionService: ErosionModelService,
    @Optional() @Inject('ILogger')
    private readonly logger?: ILogger
  ) {}

  /**
   * Variable smoothing based on erosion susceptibility and topographic position
   * High erosion areas (old gentle hills) → more smoothing
   * Low erosion areas (young cliffs) → minimal smoothing
   * Valleys receive extra smoothing (simulates sediment accumulation)
   * Ridges preserve sharpness (sediment sheds off)
   */
  smoothElevationsVariable(
    elevations: number[][],
    geology: GeologyLayerData,
    context: TacticalMapContext,
    config?: TopographyConfig
  ): number[][] {
    const width = elevations[0].length;
    const height = elevations.length;
    const ruggedness = config?.terrainRuggedness ?? 1.0;
    const climateWetness = this.calculateClimateWetness(context.hydrology);

    // Calculate slopes for each tile using ErosionModelService
    const slopes = this.erosionService.calculateSlopesArray(elevations);

    // Calculate erosion susceptibility map
    const erosionMap: number[][] = [];
    for (let y = 0; y < height; y++) {
      erosionMap[y] = [];
      for (let x = 0; x < width; x++) {
        const geoTile = geology.tiles[y][x];
        erosionMap[y][x] = this.calculateErosionSusceptibility(
          geoTile,
          slopes[y][x],
          climateWetness,
          ruggedness
        );
      }
    }

    // Identify valleys and ridges for topographic position bonus
    const topoPosition = this.identifyTopographicPosition(elevations);

    // Calculate smoothing passes per tile - more dramatic variation
    // Low ruggedness (0.5): 4-5 passes (aggressive smoothing → gentle slopes)
    // Medium ruggedness (1.0): 2-3 passes (moderate smoothing)
    // High ruggedness (2.0): 0 passes (no smoothing → preserve sharp features)
    const maxPasses = Math.max(0, Math.round(6 - ruggedness * 3)); // 4.5→5 at rug=0.5, 3 at rug=1.0, 0 at rug=2.0
    const smoothingPasses: number[][] = [];

    for (let y = 0; y < height; y++) {
      smoothingPasses[y] = [];
      for (let x = 0; x < width; x++) {
        // Base passes from erosion susceptibility
        let passes = Math.floor(erosionMap[y][x] * maxPasses);

        // Topographic position adjustment
        if (topoPosition[y][x] === 'valley') {
          passes += 1; // Extra smoothing (simulates sediment accumulation)
        } else if (topoPosition[y][x] === 'ridge') {
          passes = Math.max(0, passes - 1); // Less smoothing (material sheds off)
        }

        smoothingPasses[y][x] = Math.max(0, passes);
      }
    }

    // Apply variable smoothing
    let result = elevations;
    for (let pass = 0; pass < maxPasses + 1; pass++) {
      result = this.applySmoothingPass(result, smoothingPasses, pass);
    }

    return result;
  }

  /**
   * Calculate climate wetness factor from hydrology type
   * (Duplicated from ErosionModelService for internal use)
   */
  private calculateClimateWetness(hydrologyType: any): number {
    const wetnessMap: Record<string, number> = {
      ARID: 0.3,
      SEASONAL: 0.6,
      STREAM: 0.7,
      RIVER: 0.8,
      LAKE: 0.75,
      COASTAL: 0.9,
      WETLAND: 1.0
    };
    return wetnessMap[hydrologyType] ?? 0.6;
  }

  /**
   * Calculate erosion susceptibility per tile
   * (Duplicated from ErosionModelService for internal use)
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
   * Identify topographic position (valley, ridge, or neutral)
   */
  private identifyTopographicPosition(elevations: number[][]): string[][] {
    const width = elevations[0].length;
    const height = elevations.length;
    const position: string[][] = [];

    for (let y = 0; y < height; y++) {
      position[y] = [];
      for (let x = 0; x < width; x++) {
        const elev = elevations[y][x];
        let lowerCount = 0;
        let higherCount = 0;
        let totalNeighbors = 0;

        // Check 3x3 neighborhood
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              totalNeighbors++;
              if (elevations[ny][nx] < elev) lowerCount++;
              if (elevations[ny][nx] > elev) higherCount++;
            }
          }
        }

        // Valley: Most neighbors are higher
        if (higherCount >= totalNeighbors * 0.6) {
          position[y][x] = 'valley';
        }
        // Ridge: Most neighbors are lower
        else if (lowerCount >= totalNeighbors * 0.6) {
          position[y][x] = 'ridge';
        }
        else {
          position[y][x] = 'neutral';
        }
      }
    }

    return position;
  }

  /**
   * Apply one smoothing pass, but only to tiles that need it
   */
  private applySmoothingPass(
    elevations: number[][],
    passesNeeded: number[][],
    currentPass: number
  ): number[][] {
    const width = elevations[0].length;
    const height = elevations.length;
    const smoothed: number[][] = [];

    for (let y = 0; y < height; y++) {
      smoothed[y] = [];
      for (let x = 0; x < width; x++) {
        // Only smooth if this tile needs this many passes
        if (passesNeeded[y][x] >= currentPass) {
          let sum = elevations[y][x] * 4; // Weight center
          let count = 4;

          // Average with neighbors
          const neighbors = [
            { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
            { dx: 0, dy: -1 }, { dx: 0, dy: 1 }
          ];

          for (const n of neighbors) {
            const nx = x + n.dx;
            const ny = y + n.dy;
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              sum += elevations[ny][nx];
              count++;
            }
          }

          smoothed[y][x] = sum / count;
        } else {
          // Don't smooth - preserve sharp feature
          smoothed[y][x] = elevations[y][x];
        }
      }
    }

    return smoothed;
  }
}
