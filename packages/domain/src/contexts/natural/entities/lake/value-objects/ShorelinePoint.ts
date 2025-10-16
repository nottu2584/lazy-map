import { Position } from '../../../../../common/value-objects/Position';
import { ShorelineType } from '../enums/ShorelineType';

/**
 * Represents a point along a lake's shoreline
 * Includes information about shore type, depth, and accessibility
 */
export class ShorelinePoint {
  constructor(
    public readonly position: Position,
    public readonly shoreType: ShorelineType,
    public readonly depth: number, // Depth at this point from shore
    public readonly accessibility: number = 0.5 // 0-1, how easy to access (0=cliff, 1=gentle slope)
  ) {
    this.validateDepth(depth);
    this.validateAccessibility(accessibility);
  }

  /**
   * Check if this shoreline point is accessible for activities
   */
  get isAccessible(): boolean {
    return this.accessibility >= 0.3;
  }

  /**
   * Check if this point is suitable for launching boats
   */
  get isSuitableForBoating(): boolean {
    return this.depth >= 3 && this.accessibility >= 0.5;
  }

  /**
   * Check if this point is suitable for swimming
   */
  get isSuitableForSwimming(): boolean {
    return (
      this.isAccessible &&
      this.depth >= 3 &&
      this.depth <= 8 &&
      (this.shoreType === ShorelineType.SANDY || this.shoreType === ShorelineType.GRASSY)
    );
  }

  /**
   * Check if this point is suitable for camping
   */
  get isSuitableForCamping(): boolean {
    return (
      this.isAccessible &&
      this.shoreType === ShorelineType.GRASSY &&
      this.accessibility >= 0.7
    );
  }

  private validateDepth(depth: number): void {
    if (!Number.isFinite(depth) || depth < 0) {
      throw new Error('Shoreline depth must be a non-negative number');
    }
  }

  private validateAccessibility(accessibility: number): void {
    if (!Number.isFinite(accessibility) || accessibility < 0 || accessibility > 1) {
      throw new Error('Accessibility must be between 0 and 1');
    }
  }

  toString(): string {
    return `ShorelinePoint(${this.position}, ${this.shoreType}, depth: ${this.depth})`;
  }
}