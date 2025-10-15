import { SeedErrors } from '../errors/SeedErrors';

/**
 * Seed value object that encapsulates seed validation and behavior
 * Represents a valid seed in the domain
 */
export class Seed {
  public static readonly MIN_VALUE = 1;
  public static readonly MAX_VALUE = 2147483647;
  
  private constructor(private readonly value: number) {}

  /**
   * Create a seed from a number with validation
   */
  static fromNumber(value: number): Seed {
    if (!Number.isInteger(value)) {
      throw SeedErrors.invalidType(typeof value, {
        component: 'Seed',
        operation: 'fromNumber'
      });
    }

    if (value < this.MIN_VALUE || value > this.MAX_VALUE) {
      throw SeedErrors.outOfRange(value, this.MIN_VALUE, this.MAX_VALUE, {
        component: 'Seed',
        operation: 'fromNumber'
      });
    }

    return new Seed(value);
  }

  /**
   * Create a seed from a string using deterministic hashing
   */
  static fromString(input: string): Seed {
    if (!input || input.trim().length === 0) {
      throw SeedErrors.emptyStringInput({
        component: 'Seed',
        operation: 'fromString'
      });
    }

    const hash = this.hashString(input.trim());
    return new Seed(hash);
  }

  /**
   * Create a deterministic default seed
   */
  static createDefault(): Seed {
    return new Seed(42); // Deterministic default
  }

  /**
   * Get the numeric value of the seed
   */
  getValue(): number {
    return this.value;
  }

  /**
   * Check if two seeds are equal
   */
  equals(other: Seed): boolean {
    return this.value === other.value;
  }

  /**
   * Convert to string representation
   */
  toString(): string {
    return this.value.toString();
  }

  /**
   * Hash a string to a number using a deterministic algorithm
   */
  private static hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash) % this.MAX_VALUE + 1; // Ensure positive and in range
  }
}