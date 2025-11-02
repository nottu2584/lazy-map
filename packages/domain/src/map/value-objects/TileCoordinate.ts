/**
 * Value object representing a tile coordinate in the map grid
 * Immutable and validated coordinate pair
 * Following Clean Architecture: Pure domain value object
 */
export class TileCoordinate {
  private constructor(
    public readonly x: number,
    public readonly y: number
  ) {
    this.validate();
  }

  /**
   * Create a TileCoordinate with validation
   */
  static create(x: number, y: number): TileCoordinate {
    return new TileCoordinate(x, y);
  }

  /**
   * Create from a Position (for compatibility)
   */
  static fromPosition(position: { x: number; y: number }): TileCoordinate {
    return new TileCoordinate(
      Math.floor(position.x),
      Math.floor(position.y)
    );
  }

  /**
   * Parse from string format "x,y"
   */
  static fromString(str: string): TileCoordinate {
    const parts = str.split(',');
    if (parts.length !== 2) {
      throw new Error(`Invalid coordinate string: ${str}`);
    }

    const x = parseInt(parts[0], 10);
    const y = parseInt(parts[1], 10);

    if (isNaN(x) || isNaN(y)) {
      throw new Error(`Invalid coordinate values in: ${str}`);
    }

    return new TileCoordinate(x, y);
  }

  /**
   * Validate coordinate values
   */
  private validate(): void {
    if (!Number.isInteger(this.x) || !Number.isInteger(this.y)) {
      throw new Error('Tile coordinates must be integers');
    }

    if (this.x < 0 || this.y < 0) {
      throw new Error('Tile coordinates cannot be negative');
    }

    if (this.x > 9999 || this.y > 9999) {
      throw new Error('Tile coordinates exceed maximum map size');
    }
  }

  /**
   * Get neighboring coordinates
   */
  getNeighbors(includeDiagonals: boolean = false): TileCoordinate[] {
    const neighbors: TileCoordinate[] = [
      TileCoordinate.create(this.x, this.y - 1), // North
      TileCoordinate.create(this.x + 1, this.y), // East
      TileCoordinate.create(this.x, this.y + 1), // South
      TileCoordinate.create(this.x - 1, this.y), // West
    ];

    if (includeDiagonals) {
      neighbors.push(
        TileCoordinate.create(this.x + 1, this.y - 1), // Northeast
        TileCoordinate.create(this.x + 1, this.y + 1), // Southeast
        TileCoordinate.create(this.x - 1, this.y + 1), // Southwest
        TileCoordinate.create(this.x - 1, this.y - 1), // Northwest
      );
    }

    // Filter out invalid coordinates (negative or out of bounds)
    return neighbors.filter(coord => {
      try {
        coord.validate();
        return true;
      } catch {
        return false;
      }
    });
  }

  /**
   * Calculate Manhattan distance to another coordinate
   */
  distanceTo(other: TileCoordinate): number {
    return Math.abs(this.x - other.x) + Math.abs(this.y - other.y);
  }

  /**
   * Calculate Euclidean distance to another coordinate
   */
  euclideanDistanceTo(other: TileCoordinate): number {
    const dx = this.x - other.x;
    const dy = this.y - other.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Check if coordinates are within a bounding box
   */
  isWithinBounds(minX: number, minY: number, maxX: number, maxY: number): boolean {
    return this.x >= minX && this.x <= maxX &&
           this.y >= minY && this.y <= maxY;
  }

  /**
   * Check equality with another coordinate
   */
  equals(other: TileCoordinate): boolean {
    return this.x === other.x && this.y === other.y;
  }

  /**
   * Create a unique string key for this coordinate
   */
  toKey(): string {
    return `${this.x},${this.y}`;
  }

  /**
   * String representation
   */
  toString(): string {
    return `TileCoordinate(${this.x}, ${this.y})`;
  }

  /**
   * Create a hash code for this coordinate
   * Useful for Set and Map operations
   */
  hashCode(): number {
    // Simple hash that ensures unique values for reasonable map sizes
    return this.x * 10000 + this.y;
  }
}