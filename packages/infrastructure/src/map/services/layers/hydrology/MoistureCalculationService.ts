import { Injectable, Optional, Inject } from '@nestjs/common';
import {
  TacticalMapContext,
  MoistureLevel,
  HydrologyType,
  PermeabilityLevel,
  GeologyLayerData,
  type ILogger
} from '@lazy-map/domain';

/**
 * Calculates moisture levels based on water proximity and geology
 * 6-level classification: arid → dry → moderate → moist → wet → saturated
 */
@Injectable()
export class MoistureCalculationService {
  constructor(
    @Optional() @Inject('ILogger')
    private readonly logger?: ILogger
  ) {}

  /**
   * Calculate moisture levels based on water proximity and geology
   */
  calculateMoisture(
    waterDepths: number[][],
    flowAccumulation: number[][],
    geology: GeologyLayerData,
    context: TacticalMapContext,
    width: number,
    height: number
  ): MoistureLevel[][] {
    const moisture: MoistureLevel[][] = [];

    for (let y = 0; y < height; y++) {
      moisture[y] = [];
      for (let x = 0; x < width; x++) {
        // Base moisture from context
        let level = this.getBaseMoisture(context);

        // Standing water = saturated
        if (waterDepths[y][x] > 0) {
          level = MoistureLevel.SATURATED;
        }
        // High flow accumulation = wet
        else if (flowAccumulation[y][x] > 20) {
          level = MoistureLevel.WET;
        }
        // Moderate flow = moist
        else if (flowAccumulation[y][x] > 10) {
          level = MoistureLevel.MOIST;
        }

        // Modify by permeability
        const permeability = geology.tiles[y][x].permeability;
        if (permeability === PermeabilityLevel.IMPERMEABLE && level !== MoistureLevel.SATURATED) {
          // Water doesn't penetrate, stays on surface
          level = this.increaseMoisture(level);
        } else if (permeability === PermeabilityLevel.HIGH) {
          // Water drains quickly
          level = this.decreaseMoisture(level);
        }

        moisture[y][x] = level;
      }
    }

    return moisture;
  }

  /**
   * Get base moisture level from context
   */
  private getBaseMoisture(context: TacticalMapContext): MoistureLevel {
    switch (context.hydrology) {
      case HydrologyType.ARID:
        return MoistureLevel.ARID;
      case HydrologyType.WETLAND:
        return MoistureLevel.WET;
      default:
        return MoistureLevel.MODERATE;
    }
  }

  /**
   * Increase moisture by one level
   */
  private increaseMoisture(level: MoistureLevel): MoistureLevel {
    const levels = [
      MoistureLevel.ARID,
      MoistureLevel.DRY,
      MoistureLevel.MODERATE,
      MoistureLevel.MOIST,
      MoistureLevel.WET,
      MoistureLevel.SATURATED
    ];
    const index = levels.indexOf(level);
    return levels[Math.min(levels.length - 1, index + 1)];
  }

  /**
   * Decrease moisture by one level
   */
  private decreaseMoisture(level: MoistureLevel): MoistureLevel {
    const levels = [
      MoistureLevel.ARID,
      MoistureLevel.DRY,
      MoistureLevel.MODERATE,
      MoistureLevel.MOIST,
      MoistureLevel.WET,
      MoistureLevel.SATURATED
    ];
    const index = levels.indexOf(level);
    return levels[Math.max(0, index - 1)];
  }
}
