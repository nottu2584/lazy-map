import { IRandomGenerator } from '../interfaces/IRandomGenerator';
import { SeededRandom } from './SeededRandom';

/**
 * Coordinated random generator that manages sub-generators for different contexts
 * Ensures deterministic generation across all map generation phases
 */
export class CoordinatedRandomGenerator implements IRandomGenerator {
  private masterRandom: SeededRandom;
  private subGenerators: Map<string, SeededRandom> = new Map();
  private derivedSeeds: Map<string, number> = new Map();

  constructor(masterSeed: number) {
    this.masterRandom = new SeededRandom(masterSeed);
  }

  // IRandomGenerator implementation (delegates to master)
  next(): number {
    return this.masterRandom.next();
  }

  nextInt(min: number, max: number): number {
    return this.masterRandom.nextInt(min, max);
  }

  nextFloat(min: number, max: number): number {
    return this.masterRandom.nextFloat(min, max);
  }

  choice<T>(items: T[]): T {
    return this.masterRandom.choice(items);
  }

  shuffle<T>(array: T[]): T[] {
    return this.masterRandom.shuffle(array);
  }

  seed(value: number): void {
    // Create new master random with the seed
    this.masterRandom = new SeededRandom(value);
    // Clear all sub-generators as they need to be regenerated
    this.subGenerators.clear();
    this.derivedSeeds.clear();
  }

  /**
   * Create or get a sub-generator for a specific context
   * Each context gets its own deterministic sequence
   */
  getSubGenerator(context: string): IRandomGenerator {
    if (!this.subGenerators.has(context)) {
      const subSeed = this.getOrCreateSubSeed(context);
      const subRandom = new SeededRandom(subSeed);
      this.subGenerators.set(context, subRandom);
      
      // Wrap in IRandomGenerator interface
      return {
        next: () => subRandom.next(),
        nextInt: (min: number, max: number) => subRandom.nextInt(min, max),
        nextFloat: (min: number, max: number) => subRandom.nextFloat(min, max),
        choice: <T>(items: T[]) => subRandom.choice(items),
        shuffle: <T>(array: T[]) => subRandom.shuffle(array),
        seed: (value: number) => {
          const newSubRandom = new SeededRandom(value);
          this.subGenerators.set(context, newSubRandom);
        }
      };
    }

    const subRandom = this.subGenerators.get(context)!;
    return {
      next: () => subRandom.next(),
      nextInt: (min: number, max: number) => subRandom.nextInt(min, max),
      nextFloat: (min: number, max: number) => subRandom.nextFloat(min, max),
      choice: <T>(items: T[]) => subRandom.choice(items),
      shuffle: <T>(array: T[]) => subRandom.shuffle(array),
      seed: (value: number) => {
        const newSubRandom = new SeededRandom(value);
        this.subGenerators.set(context, newSubRandom);
      }
    };
  }

  /**
   * Get the seed used for a specific context
   */
  getSubSeed(context: string): number {
    return this.getOrCreateSubSeed(context);
  }

  /**
   * Get master seed
   */
  getMasterSeed(): number {
    return this.masterRandom.getSeed();
  }

  /**
   * Get state for debugging/logging
   */
  getState(): {
    masterSeed: number;
    contexts: string[];
    subSeeds: Record<string, number>;
  } {
    return {
      masterSeed: this.masterRandom.getSeed(),
      contexts: Array.from(this.subGenerators.keys()),
      subSeeds: Object.fromEntries(this.derivedSeeds)
    };
  }

  /**
   * Reset all sub-generators (useful for testing)
   */
  reset(): void {
    this.subGenerators.clear();
    this.derivedSeeds.clear();
  }

  private getOrCreateSubSeed(context: string): number {
    if (!this.derivedSeeds.has(context)) {
      const subSeed = this.masterRandom.deriveSeed(context);
      this.derivedSeeds.set(context, subSeed);
    }
    return this.derivedSeeds.get(context)!;
  }

  /**
   * Predefined contexts for common map generation phases
   */
  static readonly CONTEXTS = {
    TERRAIN: 'terrain',
    ELEVATION: 'elevation',
    FORESTS: 'forests',
    RIVERS: 'rivers',
    ROADS: 'roads',
    BUILDINGS: 'buildings',
    FEATURES: 'features',
    IDS: 'ids'
  } as const;
}