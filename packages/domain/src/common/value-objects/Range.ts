/**
 * Mathematical Range value object
 * Encapsulates mathematical operations with proper domain constraints
 */
export class Range {
  private constructor(
    private readonly _min: number,
    private readonly _max: number
  ) {}

  static create(min: number, max: number): Range {
    if (min > max) {
      throw new Error(`Range minimum (${min}) cannot be greater than maximum (${max})`);
    }
    return new Range(min, max);
  }

  get min(): number {
    return this._min;
  }

  get max(): number {
    return this._max;
  }

  get span(): number {
    return this._max - this._min;
  }

  /**
   * Clamp a value to this range
   */
  clamp(value: number): number {
    return Math.min(Math.max(value, this._min), this._max);
  }

  /**
   * Linear interpolation within this range
   */
  lerp(t: number): number {
    return this._min + (this._max - this._min) * t;
  }

  /**
   * Normalize a value from this range to 0-1
   */
  normalize(value: number): number {
    if (this.span === 0) return 0;
    return (this.clamp(value) - this._min) / this.span;
  }

  /**
   * Check if value is within this range
   */
  contains(value: number): boolean {
    return value >= this._min && value <= this._max;
  }

  /**
   * Check if this range overlaps with another
   */
  overlaps(other: Range): boolean {
    return this._min <= other._max && this._max >= other._min;
  }

  /**
   * Get the intersection of this range with another
   */
  intersect(other: Range): Range | null {
    const min = Math.max(this._min, other._min);
    const max = Math.min(this._max, other._max);
    
    if (min <= max) {
      return Range.create(min, max);
    }
    
    return null;
  }

  equals(other: Range): boolean {
    return this._min === other._min && this._max === other._max;
  }

  toString(): string {
    return `[${this._min}, ${this._max}]`;
  }
}