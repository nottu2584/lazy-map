import { Position } from '../../../common/value-objects/Position';
import { ValidationError, ErrorContext } from '../../../common/errors/DomainError';

/**
 * Represents the ground footprint of a building
 * Immutable value object that defines the area a building occupies
 */
export class BuildingFootprint {
  private constructor(
    private readonly outline: Position[],
    private readonly area: number,
    private readonly perimeter: number,
    private readonly width: number,
    private readonly height: number
  ) {
    Object.freeze(this);
    Object.freeze(this.outline);
  }

  /**
   * Create a rectangular footprint
   */
  static fromRectangle(origin: Position, width: number, height: number): BuildingFootprint {
    // Validation: minimum 5ft x 5ft (1 tile)
    if (width < 5 || height < 5) {
      throw new ValidationError(
        'BUILDING_FOOTPRINT_TOO_SMALL',
        `Building dimensions ${width}x${height} are too small. Minimum size is 5ft x 5ft (one tile)`,
        'Building must be at least 5ft x 5ft (one tile)',
        { component: 'BuildingFootprint', operation: 'fromRectangle' } as ErrorContext,
        ['Use minimum dimensions of 5ft x 5ft', 'One tile = 5ft x 5ft']
      );
    }

    if (width > 200 || height > 200) {
      throw new ValidationError(
        'BUILDING_FOOTPRINT_TOO_LARGE',
        `Building dimensions ${width}x${height} exceed maximum. Maximum is 200ft in any dimension`,
        'Building cannot exceed 200ft in any dimension',
        { component: 'BuildingFootprint', operation: 'fromRectangle' } as ErrorContext,
        ['Maximum dimension is 200ft (40 tiles)', 'Consider breaking into multiple buildings']
      );
    }

    const outline: Position[] = [
      origin,
      new Position(origin.x + width, origin.y),
      new Position(origin.x + width, origin.y + height),
      new Position(origin.x, origin.y + height)
    ];

    const area = width * height;
    const perimeter = 2 * (width + height);

    return new BuildingFootprint(outline, area, perimeter, width, height);
  }

  /**
   * Create an irregular polygon footprint
   */
  static fromPolygon(points: Position[]): BuildingFootprint {
    if (points.length < 3) {
      throw new ValidationError(
        'BUILDING_FOOTPRINT_INVALID_POLYGON',
        `Polygon has ${points.length} points but requires at least 3`,
        'Polygon must have at least 3 points',
        { component: 'BuildingFootprint', operation: 'fromPolygon' } as ErrorContext,
        ['Provide at least 3 points to define a polygon']
      );
    }

    // Calculate area using shoelace formula
    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      area += points[i].x * points[j].y;
      area -= points[j].x * points[i].y;
    }
    area = Math.abs(area) / 2;

    // Calculate perimeter
    let perimeter = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      const dx = points[j].x - points[i].x;
      const dy = points[j].y - points[i].y;
      perimeter += Math.sqrt(dx * dx + dy * dy);
    }

    // Calculate bounding box for width/height
    const xs = points.map(p => p.x);
    const ys = points.map(p => p.y);
    const width = Math.max(...xs) - Math.min(...xs);
    const height = Math.max(...ys) - Math.min(...ys);

    return new BuildingFootprint([...points], area, perimeter, width, height);
  }

  /**
   * Check if this footprint overlaps with another
   */
  overlaps(other: BuildingFootprint): boolean {
    // Simple AABB check for rectangles (can be enhanced for polygons)
    const thisMin = this.getMinPosition();
    const thisMax = this.getMaxPosition();
    const otherMin = other.getMinPosition();
    const otherMax = other.getMaxPosition();

    return !(
      thisMax.x < otherMin.x ||
      thisMin.x > otherMax.x ||
      thisMax.y < otherMin.y ||
      thisMin.y > otherMax.y
    );
  }

  /**
   * Find shared wall with another building
   */
  findSharedWall(other: BuildingFootprint): { start: Position; end: Position } | null {
    // Check if buildings are adjacent
    const gap = this.distanceTo(other);
    if (gap > 1) return null; // Must be touching or very close

    // Check each edge of this building
    for (let i = 0; i < this.outline.length; i++) {
      const start = this.outline[i];
      const end = this.outline[(i + 1) % this.outline.length];

      // Check if this edge is close to any edge of the other building
      for (let j = 0; j < other.outline.length; j++) {
        const otherStart = other.outline[j];
        const otherEnd = other.outline[(j + 1) % other.outline.length];

        // Check if edges are parallel and close
        if (this.edgesParallelAndClose(start, end, otherStart, otherEnd)) {
          return { start, end };
        }
      }
    }

    return null;
  }

  /**
   * Get minimum distance to another footprint
   */
  distanceTo(other: BuildingFootprint): number {
    let minDistance = Infinity;

    for (const point of this.outline) {
      for (const otherPoint of other.outline) {
        const dx = point.x - otherPoint.x;
        const dy = point.y - otherPoint.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        minDistance = Math.min(minDistance, distance);
      }
    }

    return minDistance;
  }

  // Getters
  getArea(): number { return this.area; }
  getPerimeter(): number { return this.perimeter; }
  getWidth(): number { return this.width; }
  getHeight(): number { return this.height; }
  getOutline(): ReadonlyArray<Position> { return this.outline; }

  getCenter(): Position {
    const sumX = this.outline.reduce((sum, p) => sum + p.x, 0);
    const sumY = this.outline.reduce((sum, p) => sum + p.y, 0);
    return new Position(
      sumX / this.outline.length,
      sumY / this.outline.length
    );
  }

  private getMinPosition(): Position {
    const xs = this.outline.map(p => p.x);
    const ys = this.outline.map(p => p.y);
    return new Position(Math.min(...xs), Math.min(...ys));
  }

  private getMaxPosition(): Position {
    const xs = this.outline.map(p => p.x);
    const ys = this.outline.map(p => p.y);
    return new Position(Math.max(...xs), Math.max(...ys));
  }

  private edgesParallelAndClose(
    start1: Position, end1: Position,
    start2: Position, end2: Position
  ): boolean {
    // Calculate edge vectors
    const v1x = end1.x - start1.x;
    const v1y = end1.y - start1.y;
    const v2x = end2.x - start2.x;
    const v2y = end2.y - start2.y;

    // Check if parallel (cross product near zero)
    const cross = Math.abs(v1x * v2y - v1y * v2x);
    const tolerance = 0.1;

    if (cross > tolerance) return false;

    // Check if close (within 1 foot)
    const dist = this.pointToLineDistance(start1, start2, end2);
    return dist <= 1;
  }

  private pointToLineDistance(point: Position, lineStart: Position, lineEnd: Position): number {
    const A = point.x - lineStart.x;
    const B = point.y - lineStart.y;
    const C = lineEnd.x - lineStart.x;
    const D = lineEnd.y - lineStart.y;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;

    if (lenSq !== 0) {
      param = dot / lenSq;
    }

    let xx, yy;

    if (param < 0) {
      xx = lineStart.x;
      yy = lineStart.y;
    } else if (param > 1) {
      xx = lineEnd.x;
      yy = lineEnd.y;
    } else {
      xx = lineStart.x + param * C;
      yy = lineStart.y + param * D;
    }

    const dx = point.x - xx;
    const dy = point.y - yy;
    return Math.sqrt(dx * dx + dy * dy);
  }
}