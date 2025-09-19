import { FeatureCategory, FeatureId, MapFeature } from '../../../common/entities/MapFeature';
import { SpatialBounds } from '../../../common/value-objects/SpatialBounds';
import { Position } from '../../../common/value-objects/Position';
import { WaterLevel } from '../value-objects/WaterLevel';
import { WaterQuality } from '../value-objects/WaterQuality';

/**
 * Lake-specific feature type
 */
export const LAKE_FEATURE_TYPE = 'lake';

/**
 * Lake size categories
 */
export enum LakeSize {
  POND = 'pond', // < 0.5 acres
  SMALL_LAKE = 'small_lake', // 0.5-5 acres
  MEDIUM_LAKE = 'medium_lake', // 5-50 acres
  LARGE_LAKE = 'large_lake', // 50-500 acres
  GREAT_LAKE = 'great_lake', // > 500 acres
}

/**
 * Lake formation types
 */
export enum LakeFormation {
  NATURAL = 'natural', // Natural depression, glacial
  VOLCANIC = 'volcanic', // Crater lake
  ARTIFICIAL = 'artificial', // Reservoir, dam
  OXBOW = 'oxbow', // Former river meander
  GLACIAL = 'glacial', // Formed by glacial activity
  KARST = 'karst', // Formed by groundwater erosion
}

/**
 * Shoreline characteristics
 */
export enum ShorelineType {
  SANDY = 'sandy', // Sandy beach
  ROCKY = 'rocky', // Rocky shore
  MARSHY = 'marshy', // Wetland/marsh transition
  WOODED = 'wooded', // Forest to water edge
  GRASSY = 'grassy', // Grassy meadow shore
  MUDDY = 'muddy', // Muddy/clay shore
}

/**
 * Represents a point along a lake's shoreline
 */
export class ShorelinePoint {
  constructor(
    public readonly position: Position,
    public readonly shoreType: ShorelineType,
    public readonly depth: number, // Depth at this point from shore
    public readonly accessibility: number = 0.5, // 0-1, how easy to access (0=cliff, 1=gentle slope)
  ) {
    this.validateDepth(depth);
    this.validateAccessibility(accessibility);
  }

  get isAccessible(): boolean {
    return this.accessibility >= 0.3;
  }

  get isSuitableForBoating(): boolean {
    return this.depth >= 3 && this.accessibility >= 0.5;
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

/**
 * Lake entity representing standing water features
 */
export class Lake extends MapFeature {
  private _shoreline: ShorelinePoint[] = [];
  private _islands: Position[] = [];
  private _inlets: Position[] = [];
  private _outlets: Position[] = [];

  constructor(
    id: FeatureId,
    name: string,
    area: SpatialBounds,
    public readonly waterLevel: WaterLevel,
    public readonly waterQuality: WaterQuality,
    public readonly formation: LakeFormation,
    shoreline: ShorelinePoint[] = [],
    public readonly maxDepth: number = waterLevel.depth,
    public readonly averageDepth: number = waterLevel.depth * 0.6,
    public readonly thermalStability: boolean = false, // True for deep lakes that don't freeze
    priority: number = 2,
  ) {
    super(id, name, FeatureCategory.NATURAL, area, priority);
    this.validateDepths(maxDepth, averageDepth);
    this.addShorelinePoints(shoreline);
  }

  getType(): string {
    return LAKE_FEATURE_TYPE;
  }

  canMixWith(other: MapFeature): boolean {
    // Lakes can mix with most features
    if (other.category === FeatureCategory.NATURAL) {
      const otherType = other.getType();
      // Can mix with forests (around shoreline), rivers (inlets/outlets)
      return otherType !== 'lake'; // Lakes don't directly mix with other lakes
    }

    if (other.category === FeatureCategory.RELIEF) {
      return true; // Lakes sit in valleys, basins
    }

    if (other.category === FeatureCategory.CULTURAL) {
      return true; // Settlements around lakes
    }

    if (other.category === FeatureCategory.ARTIFICIAL) {
      const otherType = other.getType();
      // Can mix with docks, bridges, but not buildings directly on water
      return otherType === 'dock' || otherType === 'bridge';
    }

    return false;
  }

  // Shoreline management
  addShorelinePoint(point: ShorelinePoint): void {
    // Shoreline points should be roughly on the edge of the lake area
    const distanceFromCenter = point.position.distanceTo(this.getCenterPosition());
    const expectedRadius = Math.sqrt(this.area.dimensions.width * this.area.dimensions.height) / 2;

    if (distanceFromCenter > expectedRadius * 1.5) {
      throw new Error('Shoreline point too far from lake center');
    }

    this._shoreline.push(point);
  }

  addShorelinePoints(points: ShorelinePoint[]): void {
    points.forEach((point) => this.addShorelinePoint(point));
  }

  get shoreline(): ShorelinePoint[] {
    return [...this._shoreline];
  }

  // Lake properties
  get sizeCategory(): LakeSize {
    const acres = this.area.dimensions.area * 0.000247105; // Convert sq ft to acres (rough)
    if (acres < 0.5) return LakeSize.POND;
    if (acres < 5) return LakeSize.SMALL_LAKE;
    if (acres < 50) return LakeSize.MEDIUM_LAKE;
    if (acres < 500) return LakeSize.LARGE_LAKE;
    return LakeSize.GREAT_LAKE;
  }

  get volume(): number {
    // Simplified volume calculation: area * average depth
    return this.area.dimensions.area * this.averageDepth;
  }

  get shorelineLength(): number {
    if (this._shoreline.length < 2) {
      // Approximate circular lake perimeter
      const radius = Math.sqrt(this.area.dimensions.area / Math.PI);
      return 2 * Math.PI * radius;
    }

    let totalLength = 0;
    for (let i = 0; i < this._shoreline.length; i++) {
      const current = this._shoreline[i];
      const next = this._shoreline[(i + 1) % this._shoreline.length];
      totalLength += current.position.distanceTo(next.position);
    }
    return totalLength;
  }

  get isNavigable(): boolean {
    return this.averageDepth >= 3 && this.sizeCategory !== LakeSize.POND;
  }

  get canFreeze(): boolean {
    return !this.thermalStability && this.waterQuality.mightFreeze && this.averageDepth < 20;
  }

  get hasIslands(): boolean {
    return this._islands.length > 0;
  }

  // Shoreline analysis
  get dominantShorelineType(): ShorelineType {
    if (this._shoreline.length === 0) return ShorelineType.GRASSY;

    const typeCounts = new Map<ShorelineType, number>();
    this._shoreline.forEach((point) => {
      const count = typeCounts.get(point.shoreType) || 0;
      typeCounts.set(point.shoreType, count + 1);
    });

    let maxCount = 0;
    let dominantType = ShorelineType.GRASSY;
    typeCounts.forEach((count, type) => {
      if (count > maxCount) {
        maxCount = count;
        dominantType = type;
      }
    });

    return dominantType;
  }

  getAccessibleShorelinePoints(): ShorelinePoint[] {
    return this._shoreline.filter((point) => point.isAccessible);
  }

  getBoatingAccessPoints(): ShorelinePoint[] {
    return this._shoreline.filter((point) => point.isSuitableForBoating);
  }

  // Islands and features
  addIsland(position: Position): void {
    if (!this.area.contains(position)) {
      throw new Error('Island must be within lake area');
    }
    this._islands.push(position);
  }

  get islands(): Position[] {
    return [...this._islands];
  }

  removeIsland(position: Position): boolean {
    const index = this._islands.findIndex((island) => island.equals(position));
    if (index >= 0) {
      this._islands.splice(index, 1);
      return true;
    }
    return false;
  }

  // Water flow connections (inlets and outlets)
  addInlet(position: Position): void {
    // Inlets should be on or near the shoreline
    this._inlets.push(position);
  }

  addOutlet(position: Position): void {
    // Outlets should be on or near the shoreline
    this._outlets.push(position);
  }

  get inlets(): Position[] {
    return [...this._inlets];
  }

  get outlets(): Position[] {
    return [...this._outlets];
  }

  get hasOutflow(): boolean {
    return this._outlets.length > 0;
  }

  get hasInflow(): boolean {
    return this._inlets.length > 0;
  }

  // Depth and navigation methods
  getDepthAt(position: Position): number {
    if (!this.containsPosition(position)) return 0;

    const centerPosition = this.getCenterPosition();
    const distanceFromCenter = position.distanceTo(centerPosition);
    const maxDistanceFromCenter =
      Math.sqrt(
        this.area.dimensions.width * this.area.dimensions.width +
          this.area.dimensions.height * this.area.dimensions.height,
      ) / 2;

    // Deeper toward center, shallower toward edges
    const depthRatio = Math.min(1, distanceFromCenter / maxDistanceFromCenter);
    const depthAtPosition = this.maxDepth * (1 - depthRatio * 0.8); // 80% depth variation

    return Math.max(0, depthAtPosition);
  }

  containsPosition(position: Position): boolean {
    return this.area.contains(position);
  }

  // Find suitable locations for various activities
  getBestFishingSpots(): Position[] {
    const spots: Position[] = [];
    const center = this.getCenterPosition();

    // Areas with moderate depth and good water quality
    if (this.waterQuality.supportsFish && this.averageDepth >= 5) {
      // Add spots around islands
      this._islands.forEach((island) => spots.push(island));

      // Add spots near inlets (nutrients flow in)
      this._inlets.forEach((inlet) => spots.push(inlet));

      // Add deep spots near center
      spots.push(center);
    }

    return spots;
  }

  getBestSwimmingAreas(): ShorelinePoint[] {
    return this._shoreline.filter(
      (point) =>
        point.isAccessible &&
        point.depth >= 3 && // Deep enough to swim
        point.depth <= 8 && // Not too deep to be scary
        (point.shoreType === ShorelineType.SANDY || point.shoreType === ShorelineType.GRASSY) &&
        this.waterQuality.isSafeForSwimming,
    );
  }

  getCampingSpots(): ShorelinePoint[] {
    return this._shoreline.filter(
      (point) =>
        point.isAccessible &&
        point.shoreType === ShorelineType.GRASSY &&
        point.accessibility >= 0.7,
    );
  }

  // Generate natural shoreline variation
  generateNaturalShoreline(pointCount: number = 16): void {
    this._shoreline = [];
    const center = this.getCenterPosition();
    const baseRadius = Math.sqrt(this.area.dimensions.area / Math.PI);

    for (let i = 0; i < pointCount; i++) {
      const angle = (i / pointCount) * 2 * Math.PI;

      // Add natural variation to radius
      const radiusVariation = 0.8 + Math.random() * 0.4; // 0.8 to 1.2 multiplier
      const radius = baseRadius * radiusVariation;

      const x = center.x + Math.cos(angle) * radius;
      const y = center.y + Math.sin(angle) * radius;
      const position = new Position(x, y);

      // Determine shore type based on formation and randomness
      const shoreType = this.determineShoreTypeByFormation();
      const depth = Math.random() * 2 + 1; // 1-3 depth at shore
      const accessibility = Math.random() * 0.5 + 0.3; // 0.3-0.8 accessibility

      this.addShorelinePoint(new ShorelinePoint(position, shoreType, depth, accessibility));
    }
  }

  private getCenterPosition(): Position {
    return new Position(this.area.x + this.area.width / 2, this.area.y + this.area.height / 2);
  }

  private determineShoreTypeByFormation(): ShorelineType {
    const random = Math.random();

    switch (this.formation) {
      case LakeFormation.VOLCANIC:
        return random < 0.7 ? ShorelineType.ROCKY : ShorelineType.SANDY;
      case LakeFormation.GLACIAL:
        return random < 0.5 ? ShorelineType.ROCKY : ShorelineType.SANDY;
      case LakeFormation.KARST:
        return random < 0.6 ? ShorelineType.ROCKY : ShorelineType.GRASSY;
      case LakeFormation.OXBOW:
        return random < 0.6 ? ShorelineType.MUDDY : ShorelineType.GRASSY;
      case LakeFormation.ARTIFICIAL:
        return random < 0.4 ? ShorelineType.ROCKY : ShorelineType.GRASSY;
      default: // NATURAL
        if (random < 0.3) return ShorelineType.SANDY;
        if (random < 0.5) return ShorelineType.ROCKY;
        if (random < 0.7) return ShorelineType.GRASSY;
        if (random < 0.85) return ShorelineType.WOODED;
        return ShorelineType.MARSHY;
    }
  }

  private validateDepths(maxDepth: number, averageDepth: number): void {
    if (!Number.isFinite(maxDepth) || maxDepth < 0) {
      throw new Error('Maximum depth must be a non-negative number');
    }
    if (!Number.isFinite(averageDepth) || averageDepth < 0) {
      throw new Error('Average depth must be a non-negative number');
    }
    if (averageDepth > maxDepth) {
      throw new Error('Average depth cannot exceed maximum depth');
    }
  }
}
