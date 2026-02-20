import { Injectable, Inject, Optional } from '@nestjs/common';
import {
  Seed,
  NoiseGenerator,
  TerrainFeature,
  type ILogger
} from '@lazy-map/domain';

@Injectable()
export class SoilCalculationService {
  constructor(
    @Optional() @Inject('ILogger')
    private readonly logger?: ILogger
  ) {}

  calculateDepths(
    width: number,
    height: number,
    weatheredSurface: TerrainFeature[][][],
    seed: Seed
  ): number[][] {
    const depths: number[][] = [];
    const soilNoise = NoiseGenerator.create(seed.getValue() * 4);

    for (let y = 0; y < height; y++) {
      depths[y] = [];
      for (let x = 0; x < width; x++) {
        const features = weatheredSurface[y][x];

        // Base soil depth 1–3 feet with noise variation
        let depth = 1 + soilNoise.generateAt(x * 0.2, y * 0.2) * 2;

        if (features.includes(TerrainFeature.GRUS)) {
          depth += 3; // Decomposed granite creates deep soil
        }
        if (features.includes(TerrainFeature.TALUS)) {
          depth += 2; // Rock debris accumulation
        }
        if (
          features.includes(TerrainFeature.DOME) ||
          features.includes(TerrainFeature.TOWER)
        ) {
          depth = 0.5; // Bare rock
        }
        if (features.includes(TerrainFeature.SINKHOLE)) {
          depth += 5; // Accumulated sediment
        }

        depths[y][x] = Math.max(0, depth);
      }
    }

    this.logger?.debug('Calculated soil depths', {
      metadata: { width, height }
    });

    return depths;
  }
}
