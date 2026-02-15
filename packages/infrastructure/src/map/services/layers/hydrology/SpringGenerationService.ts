import { Injectable, Optional, Inject } from '@nestjs/common';
import {
  Seed,
  NoiseGenerator,
  HydrologyConfig,
  HydrologyConstants,
  GeologyLayerData,
  TopographyLayerData,
  type ILogger
} from '@lazy-map/domain';

/**
 * Generates spring locations at geological boundaries
 * Springs occur where permeable rock meets impermeable barriers
 */
@Injectable()
export class SpringGenerationService {
  constructor(
    @Optional() @Inject('ILogger')
    private readonly logger?: ILogger
  ) {}

  /**
   * Place springs at geological boundaries and appropriate locations
   * Springs more likely on slopes where water pressure builds
   */
  placeSprings(
    geology: GeologyLayerData,
    topography: TopographyLayerData,
    seed: Seed,
    config?: HydrologyConfig
  ): { x: number; y: number }[] {
    const springs: { x: number; y: number }[] = [];
    const springNoise = NoiseGenerator.create(seed.getValue() * 6);

    // Get spring parameters from config (with defaults)
    const springThreshold = config?.getSpringThreshold() ?? HydrologyConstants.DEFAULT_SPRING_THRESHOLD;
    const slopeBonus = config?.getSlopeSpringBonus() ?? HydrologyConstants.DEFAULT_SLOPE_BONUS;

    // Check transition zones for spring placement
    for (const pos of geology.transitionZones) {
      const x = pos.x;
      const y = pos.y;

      const geoTile = geology.tiles[y][x];
      const topoTile = topography.tiles[y][x];

      // Springs occur where permeable meets impermeable rock
      if (geoTile.formation.canHaveSprings()) {
        // Higher chance on slopes - use config-driven bonus
        const slopeBonusValue = topoTile.slope > 15 ? slopeBonus : 0;

        // Use noise for random placement
        const chance = springNoise.generateAt(x * 0.5, y * 0.5) + slopeBonusValue;

        // Use config-driven threshold
        if (chance > springThreshold) {
          springs.push({ x, y });
        }
      }
    }

    return springs;
  }
}
