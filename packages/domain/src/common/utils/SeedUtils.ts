/**
 * Validation result for seed operations
 */
export interface SeedValidationResult {
  isValid: boolean;
  normalizedSeed?: number;
  error?: string;
  warnings?: string[];
}

/**
 * Utilities for seed generation, validation, and management
 */
export class SeedUtils {
  // Valid seed range (32-bit signed integer range)
  static readonly MIN_SEED = 1;
  static readonly MAX_SEED = 2147483647;

  /**
   * Validate a seed value and normalize it if needed
   */
  static validateSeed(seed?: number | string): SeedValidationResult {
    const warnings: string[] = [];

    // Handle undefined/null seeds
    if (seed === undefined || seed === null) {
      return {
        isValid: true,
        normalizedSeed: this.generateDefaultSeed(),
        warnings: ['No seed provided, generated random seed']
      };
    }

    // Handle string seeds
    if (typeof seed === 'string') {
      if (seed.trim() === '') {
        return {
          isValid: true,
          normalizedSeed: this.generateDefaultSeed(),
          warnings: ['Empty seed string provided, generated random seed']
        };
      }

      // Try to parse as number first
      const parsed = parseInt(seed, 10);
      if (!isNaN(parsed)) {
        return this.validateSeed(parsed);
      }

      // Convert string to deterministic number
      const hashSeed = this.hashStringToSeed(seed);
      return {
        isValid: true,
        normalizedSeed: hashSeed,
        warnings: [`String seed "${seed}" converted to numeric seed ${hashSeed}`]
      };
    }

    // Handle numeric seeds
    if (typeof seed === 'number') {
      // Check for NaN and Infinity
      if (!isFinite(seed)) {
        return {
          isValid: false,
          error: 'Seed must be a finite number'
        };
      }

      // Normalize to integer
      const normalized = Math.floor(Math.abs(seed));

      // Check range
      if (normalized < this.MIN_SEED) {
        return {
          isValid: true,
          normalizedSeed: this.MIN_SEED,
          warnings: [`Seed ${seed} was too small, normalized to ${this.MIN_SEED}`]
        };
      }

      if (normalized > this.MAX_SEED) {
        const wrappedSeed = (normalized % this.MAX_SEED) + 1;
        warnings.push(`Seed ${seed} was too large, wrapped to ${wrappedSeed}`);
        return {
          isValid: true,
          normalizedSeed: wrappedSeed,
          warnings
        };
      }

      // Seed is valid
      return {
        isValid: true,
        normalizedSeed: normalized === 0 ? 1 : normalized
      };
    }

    return {
      isValid: false,
      error: `Invalid seed type: ${typeof seed}. Expected number or string.`
    };
  }

  /**
   * Generate a deterministic seed from a string
   */
  static generateFromString(input: string): number {
    return this.hashStringToSeed(input);
  }

  /**
   * Generate a seed from map name (useful for named maps)
   */
  static generateFromMapName(mapName: string, version: number = 1): number {
    const input = `${mapName.toLowerCase().trim()}-v${version}`;
    return this.hashStringToSeed(input);
  }

  /**
   * Generate a timestamp-based seed (for "random" but reproducible maps)
   */
  static generateTimestampSeed(timestamp?: number): number {
    const time = timestamp || Date.now();
    // Use a deterministic transformation of the timestamp
    return Math.abs(Math.floor(time / 1000)) % this.MAX_SEED + 1;
  }

  /**
   * Generate a truly random seed within valid range
   */
  static generateRandomSeed(): number {
    return Math.floor(Math.random() * (this.MAX_SEED - this.MIN_SEED + 1)) + this.MIN_SEED;
  }

  /**
   * Generate default seed (currently random, but could be made configurable)
   */
  static generateDefaultSeed(): number {
    return this.generateRandomSeed();
  }

  /**
   * Check if two seeds will produce identical results
   */
  static seedsAreEquivalent(seed1: number, seed2: number): boolean {
    const normalized1 = this.validateSeed(seed1).normalizedSeed || 1;
    const normalized2 = this.validateSeed(seed2).normalizedSeed || 1;
    return normalized1 === normalized2;
  }

  /**
   * Generate a human-readable seed description
   */
  static describeSeed(seed: number): string {
    const validation = this.validateSeed(seed);
    if (!validation.isValid) {
      return `Invalid seed: ${validation.error}`;
    }

    const normalized = validation.normalizedSeed!;
    const warnings = validation.warnings || [];
    
    let description = `Seed: ${normalized}`;
    if (warnings.length > 0) {
      description += ` (${warnings.join(', ')})`;
    }

    return description;
  }

  /**
   * Convert string to deterministic numeric seed using hash function
   */
  private static hashStringToSeed(str: string): number {
    let hash = 0;
    const normalizedStr = str.toLowerCase().trim();
    
    if (normalizedStr.length === 0) {
      return this.generateDefaultSeed();
    }

    for (let i = 0; i < normalizedStr.length; i++) {
      const char = normalizedStr.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    // Ensure positive and within range
    const positive = Math.abs(hash);
    return (positive % this.MAX_SEED) + 1;
  }

  /**
   * Create seed documentation for debugging
   */
  static createSeedReport(masterSeed: number, subSeeds: Record<string, number> = {}): string {
    const lines = [
      '=== Seed Report ===',
      `Master Seed: ${masterSeed}`,
      `Validation: ${this.describeSeed(masterSeed)}`
    ];

    if (Object.keys(subSeeds).length > 0) {
      lines.push('', 'Sub-Seeds:');
      Object.entries(subSeeds).forEach(([context, seed]) => {
        lines.push(`  ${context}: ${seed}`);
      });
    }

    lines.push('==================');
    return lines.join('\n');
  }
}