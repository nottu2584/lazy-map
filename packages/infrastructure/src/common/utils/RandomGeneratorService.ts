import { IRandomGeneratorPort, ISeededRandomGenerator } from '@lazy-map/application';

/**
 * Simple Linear Congruential Generator for seeded random numbers
 * Based on the algorithm used by Java's Random class
 */
class SeededRandom implements ISeededRandomGenerator {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
    return this.seed / 0x7fffffff;
  }

  nextFloat(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.nextFloat(min, max));
  }


  choice<T>(array: T[]): T {
    if (array.length === 0) {
      throw new Error('Cannot choose from empty array');
    }
    const index = this.nextInt(0, array.length);
    return array[index];
  }

  shuffle<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i + 1);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  weightedChoice<T>(items: T[], weights: number[]): T {
    if (items.length !== weights.length) {
      throw new Error('Items and weights arrays must have the same length');
    }

    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    if (totalWeight <= 0) {
      throw new Error('Total weight must be positive');
    }

    let random = this.nextFloat(0, totalWeight);
    
    for (let i = 0; i < items.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return items[i];
      }
    }
    
    // Fallback (shouldn't happen with proper weights)
    return items[items.length - 1];
  }

  // Interface-required methods
  nextBoolean(): boolean {
    return this.next() < 0.5;
  }

  nextBooleanWithProbability(probability: number): boolean {
    return this.next() < probability;
  }

  choices<T>(items: T[], count: number, withReplacement: boolean = true): T[] {
    const result: T[] = [];
    if (withReplacement) {
      for (let i = 0; i < count; i++) {
        result.push(this.choice(items));
      }
    } else {
      const available = [...items];
      for (let i = 0; i < Math.min(count, available.length); i++) {
        const index = this.nextInt(0, available.length);
        result.push(available.splice(index, 1)[0]);
      }
    }
    return result;
  }

  nextGaussian(mean: number = 0, standardDeviation: number = 1): number {
    // Box-Muller transform to generate normally distributed random numbers
    const u1 = this.next();
    const u2 = this.next();
    
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return mean + standardDeviation * z0;
  }

  nextExponential(lambda: number = 1): number {
    return -Math.log(1 - this.next()) / lambda;
  }

  getSeed(): number {
    return this.seed;
  }
}

/**
 * Non-seeded random generator using Math.random()
 */
class DefaultRandom implements ISeededRandomGenerator {
  next(): number {
    return Math.random();
  }

  nextFloat(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.nextFloat(min, max));
  }


  choice<T>(array: T[]): T {
    if (array.length === 0) {
      throw new Error('Cannot choose from empty array');
    }
    const index = this.nextInt(0, array.length);
    return array[index];
  }

  shuffle<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i + 1);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  weightedChoice<T>(items: T[], weights: number[]): T {
    if (items.length !== weights.length) {
      throw new Error('Items and weights arrays must have the same length');
    }

    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    if (totalWeight <= 0) {
      throw new Error('Total weight must be positive');
    }

    let random = this.nextFloat(0, totalWeight);
    
    for (let i = 0; i < items.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return items[i];
      }
    }
    
    // Fallback
    return items[items.length - 1];
  }

  // Interface-required methods
  nextBoolean(): boolean {
    return this.next() < 0.5;
  }

  nextBooleanWithProbability(probability: number): boolean {
    return this.next() < probability;
  }

  choices<T>(items: T[], count: number, withReplacement: boolean = true): T[] {
    const result: T[] = [];
    if (withReplacement) {
      for (let i = 0; i < count; i++) {
        result.push(this.choice(items));
      }
    } else {
      const available = [...items];
      for (let i = 0; i < Math.min(count, available.length); i++) {
        const index = this.nextInt(0, available.length);
        result.push(available.splice(index, 1)[0]);
      }
    }
    return result;
  }

  nextGaussian(mean: number = 0, standardDeviation: number = 1): number {
    const u1 = this.next();
    const u2 = this.next();

    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return mean + standardDeviation * z0;
  }

  nextExponential(lambda: number = 1): number {
    return -Math.log(1 - this.next()) / lambda;
  }

  getSeed(): number | undefined {
    return undefined; // DefaultRandom has no seed
  }
}

/**
 * Random generator service implementation
 * Provides both seeded and unseeded random number generation
 */
export class RandomGeneratorService implements IRandomGeneratorPort {
  createRandom(): ISeededRandomGenerator {
    return new DefaultRandom();
  }

  createSeeded(seed?: number): ISeededRandomGenerator {
    return new SeededRandom(seed || Date.now());
  }

  // Convenience methods for quick access
  static createSeeded(seed: number): SeededRandom {
    return new SeededRandom(seed);
  }

  static createDefault(): DefaultRandom {
    return new DefaultRandom();
  }

  // Utility methods for common random generation patterns
  static generateSeed(): number {
    return Math.floor(Math.random() * 1000000);
  }

  static generateUUID(): string {
    // Simple UUID v4 generation
    const chars = '0123456789abcdef';
    let uuid = '';
    
    for (let i = 0; i < 36; i++) {
      if (i === 8 || i === 13 || i === 18 || i === 23) {
        uuid += '-';
      } else if (i === 14) {
        uuid += '4'; // Version 4
      } else if (i === 19) {
        uuid += chars[Math.floor(Math.random() * 4) + 8]; // 8, 9, A, or B
      } else {
        uuid += chars[Math.floor(Math.random() * 16)];
      }
    }
    
    return uuid;
  }

  static generateMapSeed(name: string, timestamp?: number): number {
    // Generate a deterministic seed based on map name and timestamp
    let hash = 0;
    const str = name + (timestamp || Date.now()).toString();
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash);
  }
}