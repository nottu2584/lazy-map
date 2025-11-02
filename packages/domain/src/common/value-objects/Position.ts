/**
 * Represents a position in 2D space with validation
 */
export class Position {
  constructor(
    public readonly x: number,
    public readonly y: number
  ) {
    this.validateCoordinates();
  }

  private validateCoordinates(): void {
    if (!Number.isFinite(this.x) || !Number.isFinite(this.y)) {
      throw new Error('Position coordinates must be finite numbers');
    }
  }

  distanceTo(other: Position): number {
    const dx = this.x - other.x;
    const dy = this.y - other.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  equals(other: Position): boolean {
    return this.x === other.x && this.y === other.y;
  }

  toString(): string {
    return `Position(${this.x}, ${this.y})`;
  }
}