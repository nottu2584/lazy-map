import { Position } from './Position';
import { Dimensions } from './Dimensions';

/**
 * Represents a rectangular area where features can be placed
 */
export class FeatureArea {
  constructor(
    public readonly position: Position,
    public readonly dimensions: Dimensions
  ) {}

  get x(): number { return this.position.x; }
  get y(): number { return this.position.y; }
  get width(): number { return this.dimensions.width; }
  get height(): number { return this.dimensions.height; }

  get left(): number { return this.x; }
  get right(): number { return this.x + this.width; }
  get top(): number { return this.y; }
  get bottom(): number { return this.y + this.height; }

  contains(position: Position): boolean {
    return position.x >= this.left && 
           position.x < this.right && 
           position.y >= this.top && 
           position.y < this.bottom;
  }

  overlaps(other: FeatureArea): boolean {
    return !(this.right <= other.left || 
             other.right <= this.left || 
             this.bottom <= other.top || 
             other.bottom <= this.top);
  }

  intersection(other: FeatureArea): FeatureArea | null {
    const left = Math.max(this.left, other.left);
    const right = Math.min(this.right, other.right);
    const top = Math.max(this.top, other.top);
    const bottom = Math.min(this.bottom, other.bottom);

    if (left >= right || top >= bottom) {
      return null;
    }

    return new FeatureArea(
      new Position(left, top),
      new Dimensions(right - left, bottom - top)
    );
  }

  isValid(): boolean {
    return this.dimensions.width > 0 && this.dimensions.height > 0;
  }

  equals(other: FeatureArea): boolean {
    return this.position.equals(other.position) && 
           this.dimensions.equals(other.dimensions);
  }

  toString(): string {
    return `FeatureArea(pos: ${this.position}, dim: ${this.dimensions})`;
  }
}