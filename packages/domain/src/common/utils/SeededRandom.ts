/**
 * Deterministic seeded random number generator
 * Uses Linear Congruential Generator algorithm for reproducible results
 */
export class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    // Ensure seed is a positive 32-bit integer
    this.seed = Math.abs(Math.floor(seed)) % 2147483647;
    if (this.seed === 0) this.seed = 1;
  }

  /**
   * Get the next random number between 0 and 1
   */
  next(): number {
    this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
    return this.seed / 0x7fffffff;
  }

  /**
   * Get a random integer between min (inclusive) and max (exclusive)
   */
  nextInt(min: number = 0, max: number = 100): number {
    return Math.floor(min + this.next() * (max - min));
  }

  /**
   * Get a random float between min and max
   */
  nextFloat(min: number = 0, max: number = 1): number {
    return min + this.next() * (max - min);
  }

  /**
   * Get a random boolean with specified probability of being true
   */
  nextBoolean(probability: number = 0.5): boolean {
    return this.next() < probability;
  }

  /**
   * Choose a random element from an array
   */
  choice<T>(items: T[]): T {
    if (items.length === 0) {
      throw new Error('Cannot choose from empty array');
    }
    const index = this.nextInt(0, items.length);
    return items[index];
  }

  /**
   * Shuffle an array and return a new shuffled array
   */
  shuffle<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i + 1);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Get current seed value
   */
  getSeed(): number {
    return this.seed;
  }

  /**
   * Create a derived seed for sub-generators
   */
  deriveSeed(context: string): number {
    let hash = 0;
    const str = context + this.seed.toString();
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash) % 2147483647 + 1;
  }
}