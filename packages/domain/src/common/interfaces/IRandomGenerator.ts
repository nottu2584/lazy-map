/**
 * Random number generator interface for reproducible generation
 */
export interface IRandomGenerator {
  next(): number;
  nextInt(min: number, max: number): number;
  nextFloat(min: number, max: number): number;
  choice<T>(items: T[]): T;
  shuffle<T>(array: T[]): T[];
  seed(value: number): void;
}