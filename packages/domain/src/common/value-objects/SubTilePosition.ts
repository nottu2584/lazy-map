import { Position } from './Position';

/**
 * Represents a position within a tile with sub-tile precision
 */
export class SubTilePosition extends Position {
  constructor(
    public readonly tileX: number,
    public readonly tileY: number,
    public readonly offsetX: number,
    public readonly offsetY: number
  ) {
    super(tileX + offsetX, tileY + offsetY);
    this.validateTilePosition();
  }

  private validateTilePosition(): void {
    if (!Number.isInteger(this.tileX) || !Number.isInteger(this.tileY)) {
      throw new Error('Tile coordinates must be integers');
    }
    if (this.offsetX < 0 || this.offsetX > 1) {
      throw new Error('offsetX must be between 0 and 1');
    }
    if (this.offsetY < 0 || this.offsetY > 1) {
      throw new Error('offsetY must be between 0 and 1');
    }
  }

  getTilePosition(): Position {
    return new Position(this.tileX, this.tileY);
  }

  getOffset(): Position {
    return new Position(this.offsetX, this.offsetY);
  }

  toPosition(): Position {
    return new Position(this.x, this.y);
  }

  toString(): string {
    return `SubTilePosition(tile: ${this.tileX}, ${this.tileY}, offset: ${this.offsetX}, ${this.offsetY})`;
  }
}