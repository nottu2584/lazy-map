import { ValidationError } from '../errors/DomainError';

/**
 * Coordinates value object representing a position on the map
 * Encapsulates coordinate validation and operations
 */
export class Coordinates {
  private constructor(
    private readonly _x: number,
    private readonly _y: number
  ) {}

  static create(x: number, y: number): Coordinates {
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      throw new ValidationError(
        'INVALID_COORDINATES',
        'Coordinates must be finite numbers',
        'Please provide valid numeric coordinates',
        { metadata: { x, y } }
      );
    }

    return new Coordinates(x, y);
  }

  get x(): number {
    return this._x;
  }

  get y(): number {
    return this._y;
  }

  /**
   * Calculate distance to another coordinate
   */
  distanceTo(other: Coordinates): number {
    const dx = this._x - other._x;
    const dy = this._y - other._y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Check if coordinates are within bounds
   */
  isWithinBounds(minX: number, maxX: number, minY: number, maxY: number): boolean {
    return this._x >= minX && this._x <= maxX && this._y >= minY && this._y <= maxY;
  }

  /**
   * Generate noise value for this coordinate
   */
  generateNoise(seed: number): number {
    const n = Math.sin(this._x * 12.9898 + this._y * 78.233 + seed) * 43758.5453;
    return n - Math.floor(n);
  }

  equals(other: Coordinates): boolean {
    return this._x === other._x && this._y === other._y;
  }

  toString(): string {
    return `(${this._x}, ${this._y})`;
  }
}