import { Range } from './Range';

/**
 * Noise Generation value object
 * Encapsulates noise generation with proper mathematical constraints
 */
export class NoiseGenerator {
  private constructor(private readonly seed: number) {}

  static create(seed: number): NoiseGenerator {
    return new NoiseGenerator(seed);
  }

  /**
   * Generate 2D noise value for given coordinates
   */
  generateAt(x: number, y: number): number {
    const n = Math.sin(x * 12.9898 + y * 78.233 + this.seed) * 43758.5453;
    return n - Math.floor(n);
  }

  /**
   * Generate noise in a specific range
   */
  generateInRange(x: number, y: number, range: Range): number {
    const noise = this.generateAt(x, y);
    return range.lerp(noise);
  }

  /**
   * Generate octave noise (multiple frequencies)
   */
  generateOctaves(x: number, y: number, octaves: number, persistence: number = 0.5): number {
    let value = 0;
    let amplitude = 1;
    let frequency = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      value += this.generateAt(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= 2;
    }

    return value / maxValue;
  }
}