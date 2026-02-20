import { Injectable, Inject, Optional } from '@nestjs/common';
import {
  GeologicalFormation,
  Seed,
  NoiseGenerator,
  TerrainFeature,
  type ILogger
} from '@lazy-map/domain';

@Injectable()
export class WeatheringService {
  constructor(
    @Optional() @Inject('ILogger')
    private readonly logger?: ILogger
  ) {}

  applyWeathering(
    width: number,
    height: number,
    bedrock: GeologicalFormation[][],
    seed: Seed
  ): TerrainFeature[][][] {
    const weathered: TerrainFeature[][][] = [];
    const weatheringNoise = NoiseGenerator.create(seed.getValue() * 3);

    for (let y = 0; y < height; y++) {
      weathered[y] = [];
      for (let x = 0; x < width; x++) {
        const formation = bedrock[y][x];
        const features: TerrainFeature[] = [];

        // Convert noise to -1..1 range for weathering intensity
        const weatheringIntensity = weatheringNoise.generateAt(x * 0.1, y * 0.1) * 2 - 1;
        const possibleFeatures = formation.weathering.products;

        if (weatheringIntensity > 0.7) {
          // High weathering — major features
          if (possibleFeatures.includes(TerrainFeature.TOWER)) {
            features.push(TerrainFeature.TOWER);
          } else if (possibleFeatures.includes(TerrainFeature.DOME)) {
            features.push(TerrainFeature.DOME);
          } else if (possibleFeatures.includes(TerrainFeature.COLUMN)) {
            features.push(TerrainFeature.COLUMN);
          } else if (possibleFeatures.includes(TerrainFeature.FIN)) {
            features.push(TerrainFeature.FIN);
          }
        } else if (weatheringIntensity > 0.4) {
          // Moderate weathering — intermediate features
          if (possibleFeatures.includes(TerrainFeature.CORESTONE)) {
            features.push(TerrainFeature.CORESTONE);
          } else if (possibleFeatures.includes(TerrainFeature.HOODOO)) {
            features.push(TerrainFeature.HOODOO);
          } else if (possibleFeatures.includes(TerrainFeature.LEDGE)) {
            features.push(TerrainFeature.LEDGE);
          }
        } else if (weatheringIntensity < -0.5) {
          // Negative features (depressions)
          if (possibleFeatures.includes(TerrainFeature.SINKHOLE)) {
            features.push(TerrainFeature.SINKHOLE);
          } else if (possibleFeatures.includes(TerrainFeature.CAVE)) {
            features.push(TerrainFeature.CAVE);
          } else if (possibleFeatures.includes(TerrainFeature.RAVINE)) {
            features.push(TerrainFeature.RAVINE);
          }
        }

        // General weathering product: talus
        if (weatheringIntensity > 0.2 && possibleFeatures.includes(TerrainFeature.TALUS)) {
          features.push(TerrainFeature.TALUS);
        }

        weathered[y][x] = features;
      }
    }

    this.logger?.debug('Applied weathering effects', {
      metadata: { width, height }
    });

    return weathered;
  }
}
