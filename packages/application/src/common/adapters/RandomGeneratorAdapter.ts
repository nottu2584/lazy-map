import { IRandomGenerator } from '@lazy-map/domain';
import { ISeededRandomGenerator } from '../ports/IRandomGeneratorPort';

/**
 * Adapter to bridge the gap between application layer ISeededRandomGenerator 
 * and domain layer IRandomGenerator interfaces
 */
export class RandomGeneratorAdapter implements IRandomGenerator {
  constructor(private readonly seededGenerator: ISeededRandomGenerator) {}

  next(): number {
    return this.seededGenerator.next();
  }

  nextInt(min: number, max: number): number {
    return this.seededGenerator.nextInt(min, max);
  }

  nextFloat(min: number, max: number): number {
    return this.seededGenerator.nextFloat(min, max);
  }

  choice<T>(items: T[]): T {
    return this.seededGenerator.choice(items);
  }

  shuffle<T>(array: T[]): T[] {
    return this.seededGenerator.shuffle(array);
  }

  // The domain layer expects this method but the seeded generator doesn't have it
  // This is a no-op since the seed was already set during creation
  seed(_value: number): void {
    // No-op: the seed is set when creating the seeded generator
    // If we need to re-seed, we would need to create a new seeded generator
  }
}