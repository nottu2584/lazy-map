import { Injectable, Optional, Inject } from '@nestjs/common';
import {
  NoiseGenerator,
  Seed,
  TacticalMapContext,
  VegetationConfig,
  type ILogger
} from '@lazy-map/domain';

/**
 * Generates forest patch patterns using cellular automata
 * Creates natural-looking forest distributions based on vegetation potential
 */
@Injectable()
export class ForestGenerationService {
  constructor(
    @Optional() @Inject('ILogger') private readonly logger?: ILogger
  ) {}

  /**
   * Generate forest patches using cellular automata
   */
  generateForestPatches(
    potential: number[][],
    context: TacticalMapContext,
    seed: Seed,
    config: VegetationConfig,
    width: number,
    height: number
  ): boolean[][] {
    const forest: boolean[][] = [];
    const forestNoise = NoiseGenerator.create(seed.getValue() * 8);

    // Calculate threshold based on desired forest coverage
    const targetCoverage = config.getForestCoverage();

    // Initialize with noise-based seeding
    for (let y = 0; y < height; y++) {
      forest[y] = [];
      for (let x = 0; x < width; x++) {
        const noise = forestNoise.generateAt(x * 0.1, y * 0.1);
        // Adjust threshold to achieve target coverage
        // Lower threshold = more forest
        const baseThreshold = 1.0 - targetCoverage;
        const potentialAdjustment = potential[y][x] * 0.3;
        const threshold = baseThreshold - potentialAdjustment;
        forest[y][x] = noise > threshold && potential[y][x] > 0.3;
      }
    }

    // Apply cellular automata for natural clustering
    for (let i = 0; i < 3; i++) {
      forest.forEach((row, y) => {
        row.forEach((_, x) => {
          const neighbors = this.countForestNeighbors(forest, x, y, width, height);
          if (neighbors >= 5) {
            forest[y][x] = true;
          } else if (neighbors <= 2) {
            forest[y][x] = false;
          }
        });
      });
    }

    return forest;
  }

  /**
   * Count neighboring forest tiles
   */
  private countForestNeighbors(forest: boolean[][], x: number, y: number, width: number, height: number): number {
    let count = 0;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          if (forest[ny][nx]) count++;
        }
      }
    }
    return count;
  }
}
