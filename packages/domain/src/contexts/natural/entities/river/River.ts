import { FeatureCategory, FeatureId, MapFeature } from '../../../../common/entities/MapFeature';
import { SpatialBounds } from '../../../../common/value-objects/SpatialBounds';
import { Position } from '../../../../common/value-objects/Position';
import { FlowDirection } from '../../value-objects/FlowDirection';
import { WaterLevel } from '../../value-objects/WaterLevel';
import { WaterQuality } from '../../value-objects/WaterQuality';
import { RIVER_FEATURE_TYPE } from './constants';
import { RiverWidth, getWidthCategory } from './enums/RiverWidth';
import { RiverSegmentType } from './enums/RiverSegmentType';
import { RiverPoint } from './value-objects/RiverPoint';
import { ValidationError, DomainRuleError } from '../../../../common/errors/DomainError';

/**
 * River entity representing flowing water features
 * Core domain entity for hydrographic systems
 */
export class River extends MapFeature {
  private _path: RiverPoint[] = [];
  private _tributaries: Map<string, River> = new Map();

  constructor(
    id: FeatureId,
    name: string,
    area: SpatialBounds,
    public readonly waterLevel: WaterLevel,
    public readonly waterQuality: WaterQuality,
    public readonly averageWidth: number,
    path: RiverPoint[] = [],
    public readonly isNavigable: boolean = false,
    priority: number = 3,
  ) {
    super(id, name, FeatureCategory.NATURAL, area, priority);
    this.validateAverageWidth(averageWidth);
    this.addPathPoints(path);
  }

  getType(): string {
    return RIVER_FEATURE_TYPE;
  }

  canMixWith(other: MapFeature): boolean {
    // Rivers can mix with most features except buildings
    if (other.category === FeatureCategory.ARTIFICIAL) {
      const otherType = other.getType();
      // Can mix with bridges, but not with buildings or roads directly
      return otherType === 'bridge';
    }

    // Can mix with natural features (forests along banks)
    if (other.category === FeatureCategory.NATURAL) {
      return true;
    }

    // Can mix with relief features (rivers flow through valleys)
    if (other.category === FeatureCategory.RELIEF) {
      return true;
    }

    // Can mix with cultural features (settlements along rivers)
    if (other.category === FeatureCategory.CULTURAL) {
      return true;
    }

    return false;
  }

  // Path management
  addPathPoint(point: RiverPoint): void {
    if (!this.area.contains(point.position)) {
      throw new DomainRuleError(
        'RIVER_POINT_OUT_OF_BOUNDS',
        'River point must be within river area',
        'Cannot add point outside river boundaries',
        {
          component: 'River',
          operation: 'addPathPoint',
          metadata: {
            pointPosition: point.position.toString(),
            riverArea: this.area.toString()
          }
        }
      );
    }
    this._path.push(point);
  }

  addPathPoints(points: RiverPoint[]): void {
    points.forEach((point) => this.addPathPoint(point));
  }

  get path(): RiverPoint[] {
    return [...this._path];
  }

  get source(): RiverPoint | undefined {
    return this._path.find((point) => point.segmentType === RiverSegmentType.SOURCE);
  }

  get mouth(): RiverPoint | undefined {
    return this._path.find(
      (point) =>
        point.segmentType === RiverSegmentType.MOUTH ||
        point.segmentType === RiverSegmentType.DELTA,
    );
  }

  // River properties
  get length(): number {
    if (this._path.length < 2) return 0;

    let totalLength = 0;
    for (let i = 1; i < this._path.length; i++) {
      totalLength += this._path[i - 1].position.distanceTo(this._path[i].position);
    }
    return totalLength;
  }

  get widthCategory(): RiverWidth {
    return getWidthCategory(this.averageWidth);
  }

  get averageDepth(): number {
    if (this._path.length === 0) return this.waterLevel.depth;
    const totalDepth = this._path.reduce((sum, point) => sum + point.depth, 0);
    return totalDepth / this._path.length;
  }

  get averageFlowVelocity(): number {
    if (this._path.length === 0) return 0;
    const totalVelocity = this._path.reduce((sum, point) => sum + point.flowDirection.velocity, 0);
    return totalVelocity / this._path.length;
  }

  get isCrossable(): boolean {
    return this.averageWidth < 25 && this.averageDepth < 3;
  }

  get hasRapids(): boolean {
    return this._path.some((point) => point.segmentType === RiverSegmentType.RAPIDS);
  }

  get hasMeanders(): boolean {
    return this._path.some(
      (point) =>
        point.segmentType === RiverSegmentType.MEANDER ||
        point.segmentType === RiverSegmentType.CURVE,
    );
  }

  // Tributary management
  addTributary(tributary: River): void {
    // Find confluence point where tributary joins this river
    const confluencePoint = this.findConfluencePoint(tributary);
    if (!confluencePoint) {
      throw new DomainRuleError(
        'RIVER_TRIBUTARY_NO_CONFLUENCE',
        'Tributary must connect to main river within its area',
        'Rivers must connect at a valid confluence point',
        {
          component: 'River',
          operation: 'addTributary',
          metadata: {
            mainRiverId: this.id.value,
            tributaryId: tributary.id.value
          }
        }
      );
    }

    this._tributaries.set(tributary.id.value, tributary);

    // Add confluence point to main river if not already present
    const hasConfluence = this._path.some(
      (point) =>
        point.segmentType === RiverSegmentType.CONFLUENCE &&
        point.position.distanceTo(confluencePoint) < 1,
    );

    if (!hasConfluence) {
      this.addPathPoint(
        new RiverPoint(
          confluencePoint,
          this.averageWidth * 1.2, // Slightly wider at confluence
          this.averageDepth * 1.1, // Slightly deeper at confluence
          this.getFlowDirectionAt(confluencePoint),
          RiverSegmentType.CONFLUENCE,
        ),
      );
    }
  }

  get tributaries(): River[] {
    return Array.from(this._tributaries.values());
  }

  getTributary(id: string): River | undefined {
    return this._tributaries.get(id);
  }

  // Flow and navigation methods
  getFlowDirectionAt(position: Position): FlowDirection {
    // Find the nearest path point and return its flow direction
    if (this._path.length === 0) {
      return FlowDirection.random(2); // Default moderate flow
    }

    let nearestPoint = this._path[0];
    let minDistance = position.distanceTo(nearestPoint.position);

    for (const point of this._path) {
      const distance = position.distanceTo(point.position);
      if (distance < minDistance) {
        minDistance = distance;
        nearestPoint = point;
      }
    }

    return nearestPoint.flowDirection;
  }

  getWidthAt(position: Position): number {
    if (this._path.length === 0) return this.averageWidth;

    // Find nearest path point and return its width
    let nearestPoint = this._path[0];
    let minDistance = position.distanceTo(nearestPoint.position);

    for (const point of this._path) {
      const distance = position.distanceTo(point.position);
      if (distance < minDistance) {
        minDistance = distance;
        nearestPoint = point;
      }
    }

    return nearestPoint.width;
  }

  getDepthAt(position: Position): number {
    if (this._path.length === 0) return this.waterLevel.depth;

    // Find nearest path point and return its depth
    let nearestPoint = this._path[0];
    let minDistance = position.distanceTo(nearestPoint.position);

    for (const point of this._path) {
      const distance = position.distanceTo(point.position);
      if (distance < minDistance) {
        minDistance = distance;
        nearestPoint = point;
      }
    }

    return nearestPoint.depth;
  }

  // Check if a position is within the river (considering width)
  containsPosition(position: Position): boolean {
    if (this._path.length < 2) {
      return this.area.contains(position);
    }

    // Check if position is within river width of any segment
    for (let i = 1; i < this._path.length; i++) {
      const start = this._path[i - 1];
      const end = this._path[i];
      const segmentWidth = (start.width + end.width) / 2;

      // Calculate distance from position to river segment
      const distance = this.distanceToSegment(position, start.position, end.position);
      if (distance <= segmentWidth / 2) {
        return true;
      }
    }

    return false;
  }

  // Get crossing points for roads/paths
  getCrossingPoints(): Position[] {
    return this._path
      .filter((point) => point.width < 50 && point.depth < 4) // Crossable sections
      .map((point) => point.position);
  }

  // Generate natural bends and curves
  addNaturalMeanders(intensity: number = 0.5): void {
    if (this._path.length < 3) return;

    const meanderIntensity = Math.max(0, Math.min(1, intensity));
    const newPath: RiverPoint[] = [];

    for (let i = 0; i < this._path.length; i++) {
      const point = this._path[i];
      newPath.push(point);

      // Add meander points between existing points
      if (i < this._path.length - 1 && Math.random() < meanderIntensity) {
        const nextPoint = this._path[i + 1];
        const midPosition = new Position(
          (point.position.x + nextPoint.position.x) / 2 + (Math.random() - 0.5) * 2,
          (point.position.y + nextPoint.position.y) / 2 + (Math.random() - 0.5) * 2,
        );

        const meanderPoint = new RiverPoint(
          midPosition,
          (point.width + nextPoint.width) / 2,
          (point.depth + nextPoint.depth) / 2,
          point.flowDirection,
          RiverSegmentType.MEANDER,
        );

        if (this.area.contains(midPosition)) {
          newPath.push(meanderPoint);
        }
      }
    }

    this._path = newPath;
  }

  private findConfluencePoint(tributary: River): Position | null {
    // Find where tributary area intersects with this river area
    const intersection = this.area.intersection(tributary.area);
    if (!intersection) return null;

    // Return center of intersection as confluence point
    return new Position(
      intersection.x + intersection.width / 2,
      intersection.y + intersection.height / 2,
    );
  }

  private distanceToSegment(point: Position, start: Position, end: Position): number {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.sqrt(dx * dx + dy * dy);

    if (length === 0) return point.distanceTo(start);

    const t = Math.max(
      0,
      Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / (length * length)),
    );

    const projectionX = start.x + t * dx;
    const projectionY = start.y + t * dy;

    return point.distanceTo(new Position(projectionX, projectionY));
  }

  private validateAverageWidth(width: number): void {
    if (!Number.isFinite(width) || width <= 0) {
      throw new ValidationError(
        'RIVER_INVALID_WIDTH',
        'River average width must be a positive number',
        'River width must be greater than zero',
        {
          component: 'River',
          metadata: { providedWidth: width }
        }
      );
    }
  }
}