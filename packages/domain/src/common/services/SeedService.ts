import { SeedErrors } from '../errors/SeedErrors';
import { Seed } from '../value-objects/Seed';

/**
 * Domain service for seed-related operations
 * Orchestrates seed creation and validation across different input types
 */
export class SeedService {
  /**
   * Generate a seed from various input types
   */
  generateSeed(input?: number | string): Seed {
    if (input === undefined || input === null) {
      return Seed.createDefault();
    }

    if (typeof input === 'number') {
      return Seed.fromNumber(input);
    }

    if (typeof input === 'string') {
      return Seed.fromString(input);
    }

    throw SeedErrors.invalidType(typeof input, {
      component: 'SeedService',
      operation: 'generateSeed'
    });
  }

  /**
   * Validate seed input and provide recommendations
   */
  validateSeedInput(input: unknown): {
    isValid: boolean;
    seed?: Seed;
    warnings: string[];
    errors: string[];
  } {
    const warnings: string[] = [];
    const errors: string[] = [];

    try {
      const seed = this.generateSeed(input as number | string);
      return {
        isValid: true,
        seed,
        warnings,
        errors
      };
    } catch (error) {
      return {
        isValid: false,
        warnings,
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }
}