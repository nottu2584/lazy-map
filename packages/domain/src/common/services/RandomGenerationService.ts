import { IRandomGenerator } from '../interfaces/IRandomGenerator';
import { Seed } from '../value-objects/Seed';

/**
 * Random Generation Service - Domain Service for managing randomization
 * Replaces generic utils with domain-focused service
 */
export class RandomGenerationService {
  private generators: Map<string, IRandomGenerator> = new Map();

  constructor(private readonly masterSeed: Seed) {}

  /**
   * Get or create a context-specific random generator
   * Each context (terrain, rivers, features, etc.) gets its own deterministic sequence
   */
  getGeneratorForContext(context: string): IRandomGenerator {
    if (!this.generators.has(context)) {
      // Create deterministic sub-seed for this context
      const contextSeed = this.deriveContextSeed(context);
      const generator = this.createGenerator(contextSeed);
      this.generators.set(context, generator);
    }

    return this.generators.get(context)!;
  }

  /**
   * Generate random terrain distribution
   */
  generateTerrainDistribution(): { water: number; land: number; mountain: number } {
    const terrainGen = this.getGeneratorForContext('terrain');
    
    // Ensure distribution adds up to 1.0
    const water = terrainGen.nextFloat(0.2, 0.4);
    const remaining = 1.0 - water;
    const mountain = terrainGen.nextFloat(0.1, remaining * 0.3);
    const land = remaining - mountain;

    return { water, land, mountain };
  }

  /**
   * Generate random feature placement
   */
  generateFeaturePlacement(featureType: string, density: number): { x: number; y: number }[] {
    const featureGen = this.getGeneratorForContext(`features_${featureType}`);
    const positions: { x: number; y: number }[] = [];
    
    const featureCount = Math.floor(featureGen.nextFloat(density * 0.8, density * 1.2));
    
    for (let i = 0; i < featureCount; i++) {
      positions.push({
        x: featureGen.nextFloat(0, 100),
        y: featureGen.nextFloat(0, 100)
      });
    }

    return positions;
  }

  /**
   * Reset all generators (useful for testing)
   */
  reset(): void {
    this.generators.clear();
  }

  private deriveContextSeed(context: string): Seed {
    // Create deterministic seed based on master seed + context
    const seedValue = this.masterSeed.getValue();
    let hash = 0;
    for (let i = 0; i < context.length; i++) {
      const char = context.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Seed.fromNumber(seedValue + hash);
  }

  private createGenerator(seed: Seed): IRandomGenerator {
    // This would use your existing SeededRandom implementation
    // For now, returning a simple implementation
    let currentValue = seed.getValue();
    
    const next = (): number => {
      currentValue = (currentValue * 9301 + 49297) % 233280;
      return currentValue / 233280;
    };

    return {
      next,
      nextInt: (min: number, max: number) => Math.floor(next() * (max - min + 1)) + min,
      nextFloat: (min: number, max: number) => min + next() * (max - min),
      choice: <T>(items: T[]) => items[Math.floor(next() * items.length)],
      shuffle: <T>(array: T[]) => {
        const result = [...array];
        for (let i = result.length - 1; i > 0; i--) {
          const j = Math.floor(next() * (i + 1));
          [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
      },
      seed: (value: number) => {
        currentValue = value;
      }
    };
  }
}