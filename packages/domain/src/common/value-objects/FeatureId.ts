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
   * Generate a new random feature ID
   */
  static generate(): FeatureId {
    return new FeatureId(`feat_${Math.random().toString(36).substr(2, 9)}`);
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