/**
 * Unique identifier for features across all contexts
 * Value object that ensures feature IDs are valid and comparable
 */
export class FeatureId {
  constructor(public readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('FeatureId cannot be empty');
    }
  }

  /**
   * Generate a new deterministic feature ID based on a seed value
   * @param seedValue - A string or number to use as the seed for ID generation
   */
  static generate(seedValue: string | number): FeatureId {
    // Use a deterministic approach based on the seed
    const hash = seedValue.toString().split('').reduce((acc, char) => {
      return ((acc << 5) - acc) + char.charCodeAt(0);
    }, 0);
    const id = Math.abs(hash).toString(36).substring(0, 9).padEnd(9, '0');
    return new FeatureId(`feat_${id}`);
  }

  /**
   * Create a feature ID from a string value
   */
  static from(value: string): FeatureId {
    return new FeatureId(value);
  }

  /**
   * Check if two feature IDs are equal
   */
  equals(other: FeatureId): boolean {
    return this.value === other.value;
  }

  /**
   * Get string representation of the feature ID
   */
  toString(): string {
    return this.value;
  }
}