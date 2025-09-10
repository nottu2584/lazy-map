import { FeatureId } from '../entities/MapFeature';
import { MapId } from '../../map/entities/MapGrid';
import { SeededRandom } from './SeededRandom';

/**
 * Generates deterministic IDs based on a seed
 * Ensures that the same seed will always produce the same IDs
 */
export class DeterministicIdGenerator {
  private random: SeededRandom;
  private idCounters: Map<string, number> = new Map();

  constructor(baseSeed: number) {
    this.random = new SeededRandom(baseSeed);
  }

  /**
   * Generate a deterministic Feature ID
   */
  generateFeatureId(type: string = 'feature'): FeatureId {
    const counter = this.getAndIncrementCounter(type);
    const randomPart = this.random.nextInt(1000, 9999);
    
    return new FeatureId(`${type}-${counter}-${randomPart}`);
  }

  /**
   * Generate a deterministic Map ID
   */
  generateMapId(): MapId {
    const counter = this.getAndIncrementCounter('map');
    const randomPart = this.random.nextInt(100000, 999999);
    
    return new MapId(`map-${counter}-${randomPart}`);
  }

  /**
   * Generate a deterministic string ID for any entity
   */
  generateStringId(prefix: string = 'entity'): string {
    const counter = this.getAndIncrementCounter(prefix);
    const randomPart = this.random.nextInt(10000, 99999);
    
    return `${prefix}-${counter}-${randomPart}`;
  }

  /**
   * Create a sub-generator for a specific context
   * This allows different systems to generate IDs without interference
   */
  createSubGenerator(context: string): DeterministicIdGenerator {
    const subSeed = this.random.deriveSeed(context);
    return new DeterministicIdGenerator(subSeed);
  }

  /**
   * Get current state for debugging/logging
   */
  getState(): { seed: number; counters: Record<string, number> } {
    return {
      seed: this.random.getSeed(),
      counters: Object.fromEntries(this.idCounters)
    };
  }

  private getAndIncrementCounter(type: string): number {
    const current = this.idCounters.get(type) || 0;
    this.idCounters.set(type, current + 1);
    return current;
  }

  /**
   * Static utility to create generator from string
   */
  static fromString(input: string): DeterministicIdGenerator {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return new DeterministicIdGenerator(Math.abs(hash));
  }

  /**
   * Static utility to create generator with timestamp seed (for "random" but reproducible maps)
   */
  static fromTimestamp(timestamp?: number): DeterministicIdGenerator {
    const time = timestamp || Date.now();
    return new DeterministicIdGenerator(time);
  }
}