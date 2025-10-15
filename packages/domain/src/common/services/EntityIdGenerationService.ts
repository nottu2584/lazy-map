import { Seed } from '../value-objects/Seed';

/**
 * Entity ID value object - represents a unique identifier in the domain
 */
export class EntityId {
  private constructor(private readonly _value: string) {}

  static create(value: string): EntityId {
    if (!value || value.trim().length === 0) {
      throw new Error('Entity ID cannot be empty');
    }
    return new EntityId(value.trim());
  }

  get value(): string {
    return this._value;
  }

  equals(other: EntityId): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}

/**
 * Domain Service for generating deterministic entity identifiers
 * Replaces generic DeterministicIdGenerator util
 */
export class EntityIdGenerationService {
  private counters: Map<string, number> = new Map();
  private generator: (prefix: string, counter: number) => number;

  constructor(private readonly seed: Seed) {
    // Create deterministic number generator based on seed
    let currentValue = seed.getValue();
    this.generator = (prefix: string, counter: number) => {
      // Combine prefix hash, counter, and seed for deterministic randomness
      let hash = 0;
      for (let i = 0; i < prefix.length; i++) {
        const char = prefix.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
      }
      
      const combined = currentValue + hash + counter * 1000;
      currentValue = (combined * 9301 + 49297) % 233280;
      return Math.floor((currentValue / 233280) * 90000) + 10000; // 5-digit numbers
    };
  }

  /**
   * Generate a deterministic ID for a map feature
   */
  generateFeatureId(featureType: string): EntityId {
    const counter = this.getAndIncrementCounter(`feature_${featureType}`);
    const randomPart = this.generator(featureType, counter);
    
    return EntityId.create(`${featureType}-${counter}-${randomPart}`);
  }

  /**
   * Generate a deterministic ID for a map
   */
  generateMapId(): EntityId {
    const counter = this.getAndIncrementCounter('map');
    const randomPart = this.generator('map', counter);
    
    return EntityId.create(`map-${counter}-${randomPart}`);
  }

  /**
   * Generate a deterministic ID for any entity type
   */
  generateEntityId(entityType: string): EntityId {
    const counter = this.getAndIncrementCounter(entityType);
    const randomPart = this.generator(entityType, counter);
    
    return EntityId.create(`${entityType}-${counter}-${randomPart}`);
  }

  /**
   * Generate a batch of IDs for the same entity type
   */
  generateEntityIdBatch(entityType: string, count: number): EntityId[] {
    const ids: EntityId[] = [];
    for (let i = 0; i < count; i++) {
      ids.push(this.generateEntityId(entityType));
    }
    return ids;
  }

  /**
   * Reset all counters (useful for testing)
   */
  reset(): void {
    this.counters.clear();
  }

  /**
   * Get current counter value for an entity type
   */
  getCounterValue(entityType: string): number {
    return this.counters.get(entityType) || 0;
  }

  private getAndIncrementCounter(key: string): number {
    const current = this.counters.get(key) || 0;
    this.counters.set(key, current + 1);
    return current + 1;
  }
}