import { Position } from '../../../../../common/value-objects/Position';
import { FlowDirection } from '../../../value-objects/FlowDirection';
import { RiverSegmentType } from '../enums/RiverSegmentType';
import { ValidationError } from '../../../../../common/errors/types/ValidationError';

/**
 * Represents a point along a river's path
 * This is a value object that encapsulates the properties of a single point on a river
 */
export class RiverPoint {
  constructor(
    public readonly position: Position,
    public readonly width: number,
    public readonly depth: number,
    public readonly flowDirection: FlowDirection,
    public readonly segmentType: RiverSegmentType = RiverSegmentType.STRAIGHT,
  ) {
    this.validateWidth(width);
    this.validateDepth(depth);
  }

  /**
   * Validate that width is a positive number
   */
  private validateWidth(width: number): void {
    if (!Number.isFinite(width) || width <= 0) {
      throw new ValidationError(
        'RIVER_POINT_INVALID_WIDTH',
        'River width must be a positive number',
        'River width must be greater than zero',
        {
          component: 'RiverPoint',
          metadata: { providedWidth: width }
        }
      );
    }
  }

  /**
   * Validate that depth is a non-negative number
   */
  private validateDepth(depth: number): void {
    if (!Number.isFinite(depth) || depth < 0) {
      throw new ValidationError(
        'RIVER_POINT_INVALID_DEPTH',
        'River depth must be a non-negative number',
        'River depth cannot be negative',
        {
          component: 'RiverPoint',
          metadata: { providedDepth: depth }
        }
      );
    }
  }

  /**
   * Check if this point represents a navigable section
   */
  get isNavigable(): boolean {
    return this.segmentType !== RiverSegmentType.RAPIDS &&
           this.depth >= 2 && // At least 2 units deep for navigation
           this.width >= 10;  // At least 10 units wide for boats
  }

  /**
   * Check if this point is crossable on foot
   */
  get isCrossable(): boolean {
    return this.width < 25 && this.depth < 3;
  }

  /**
   * Create a string representation
   */
  toString(): string {
    return `RiverPoint(${this.position}, width: ${this.width}, depth: ${this.depth}, type: ${this.segmentType})`;
  }

  /**
   * Check equality with another river point
   */
  equals(other: RiverPoint): boolean {
    return this.position.equals(other.position) &&
           this.width === other.width &&
           this.depth === other.depth &&
           this.segmentType === other.segmentType;
  }
}