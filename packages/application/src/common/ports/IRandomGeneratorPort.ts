/**
 * Output port for random number generation
 * This allows us to inject different random implementations for testing vs production
 */
export interface IRandomGeneratorPort {
  /**
   * Creates a seeded random generator for reproducible results
   */
  createSeeded(seed?: number): ISeededRandomGenerator;

  /**
   * Creates a truly random generator
   */
  createRandom(): ISeededRandomGenerator;
}

/**
 * Seeded random number generator interface
 */
export interface ISeededRandomGenerator {
  /**
   * Returns a random number between 0 and 1
   */
  next(): number;

  /**
   * Returns a random integer between min (inclusive) and max (exclusive)
   */
  nextInt(min: number, max: number): number;

  /**
   * Returns a random float between min (inclusive) and max (exclusive)
   */
  nextFloat(min: number, max: number): number;

  /**
   * Returns a random boolean value
   */
  nextBoolean(): boolean;

  /**
   * Returns a random boolean with specified probability of being true
   */
  nextBooleanWithProbability(probability: number): boolean;

  /**
   * Returns a random element from an array
   */
  choice<T>(items: T[]): T;

  /**
   * Returns multiple random elements from an array (with or without replacement)
   */
  choices<T>(items: T[], count: number, withReplacement?: boolean): T[];

  /**
   * Shuffles an array in place
   */
  shuffle<T>(items: T[]): T[];

  /**
   * Returns a random number following a normal (Gaussian) distribution
   */
  nextGaussian(mean?: number, standardDeviation?: number): number;

  /**
   * Returns a random number following an exponential distribution
   */
  nextExponential(lambda?: number): number;

  /**
   * Gets the current seed value (if applicable)
   */
  getSeed(): number | undefined;
}