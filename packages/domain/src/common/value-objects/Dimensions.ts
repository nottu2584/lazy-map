/**
 * Represents dimensions with validation
 */
export class Dimensions {
  constructor(
    public readonly width: number,
    public readonly height: number
  ) {
    this.validateDimensions();
  }

  private validateDimensions(): void {
    if (this.width <= 0 || this.height <= 0) {
      throw new Error('Dimensions must be positive numbers');
    }
    if (!Number.isInteger(this.width) || !Number.isInteger(this.height)) {
      throw new Error('Dimensions must be integers');
    }
  }

  get area(): number {
    return this.width * this.height;
  }

  contains(position: { x: number; y: number }): boolean {
    return position.x >= 0 && 
           position.x < this.width && 
           position.y >= 0 && 
           position.y < this.height;
  }

  equals(other: Dimensions): boolean {
    return this.width === other.width && this.height === other.height;
  }

  toString(): string {
    return `Dimensions(${this.width}x${this.height})`;
  }
}