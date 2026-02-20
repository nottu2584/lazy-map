import { Injectable, Inject, Optional } from '@nestjs/common';
import {
  GeologicalFormation,
  Seed,
  NoiseGenerator,
  type ILogger
} from '@lazy-map/domain';

@Injectable()
export class BedrockPatternService {
  constructor(
    @Optional() @Inject('ILogger')
    private readonly logger?: ILogger
  ) {}

  generatePattern(
    width: number,
    height: number,
    primary: GeologicalFormation,
    secondary: GeologicalFormation | undefined,
    seed: Seed
  ): GeologicalFormation[][] {
    const pattern: GeologicalFormation[][] = [];
    const formationNoise = NoiseGenerator.create(seed.getValue() * 2);

    for (let y = 0; y < height; y++) {
      pattern[y] = [];
      for (let x = 0; x < width; x++) {
        if (secondary) {
          const noiseValue = formationNoise.generateAt(x * 0.05, y * 0.05);

          let threshold = 0;
          if (primary.structure.bedding === 'vertical') {
            threshold += Math.sin(x * 0.1) * 0.3;
          } else if (primary.structure.bedding === 'folded') {
            threshold += Math.sin(x * 0.1) * Math.cos(y * 0.1) * 0.3;
          }

          pattern[y][x] = noiseValue > threshold ? primary : secondary;
        } else {
          pattern[y][x] = primary;
        }
      }
    }

    this.logger?.debug('Generated bedrock pattern', {
      metadata: { width, height, hasSecondary: !!secondary }
    });

    return pattern;
  }
}
