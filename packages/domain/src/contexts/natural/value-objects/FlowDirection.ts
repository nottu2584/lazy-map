/**
 * Cardinal and intercardinal directions for water flow
 */
export enum CardinalDirection {
  NORTH = 'north',
  NORTHEAST = 'northeast',
  EAST = 'east',
  SOUTHEAST = 'southeast',
  SOUTH = 'south',
  SOUTHWEST = 'southwest',
  WEST = 'west',
  NORTHWEST = 'northwest',
}

/**
 * Represents flow direction with angle and velocity for water features
 */
export class FlowDirection {
  constructor(
    public readonly angle: number, // 0-360 degrees, 0 = North
    public readonly velocity: number, // 0-10, relative flow strength
  ) {
    this.validateAngle(angle);
    this.validateVelocity(velocity);
  }

  /**
   * Create flow direction from cardinal direction
   */
  static fromCardinal(direction: CardinalDirection, velocity: number = 1): FlowDirection {
    const angleMap = {
      [CardinalDirection.NORTH]: 0,
      [CardinalDirection.NORTHEAST]: 45,
      [CardinalDirection.EAST]: 90,
      [CardinalDirection.SOUTHEAST]: 135,
      [CardinalDirection.SOUTH]: 180,
      [CardinalDirection.SOUTHWEST]: 225,
      [CardinalDirection.WEST]: 270,
      [CardinalDirection.NORTHWEST]: 315,
    };

    return new FlowDirection(angleMap[direction], velocity);
  }

  /**
   * Create random flow direction
   */
  static random(velocity?: number): FlowDirection {
    const angle = Math.random() * 360;
    const vel = velocity ?? Math.random() * 5 + 1; // 1-6 default range
    return new FlowDirection(angle, vel);
  }

  /**
   * Get the cardinal direction closest to this angle
   */
  getCardinalDirection(): CardinalDirection {
    const normalized = ((this.angle % 360) + 360) % 360;

    if (normalized < 22.5 || normalized >= 337.5) return CardinalDirection.NORTH;
    if (normalized < 67.5) return CardinalDirection.NORTHEAST;
    if (normalized < 112.5) return CardinalDirection.EAST;
    if (normalized < 157.5) return CardinalDirection.SOUTHEAST;
    if (normalized < 202.5) return CardinalDirection.SOUTH;
    if (normalized < 247.5) return CardinalDirection.SOUTHWEST;
    if (normalized < 292.5) return CardinalDirection.WEST;
    return CardinalDirection.NORTHWEST;
  }

  /**
   * Get flow direction as unit vector
   */
  getVector(): { x: number; y: number } {
    const radians = (this.angle * Math.PI) / 180;
    return {
      x: Math.sin(radians) * this.velocity,
      y: -Math.cos(radians) * this.velocity, // Negative because Y increases downward
    };
  }

  /**
   * Calculate the opposite flow direction
   */
  reverse(): FlowDirection {
    return new FlowDirection((this.angle + 180) % 360, this.velocity);
  }

  /**
   * Check if this flow direction conflicts with another (opposite directions)
   */
  conflictsWith(other: FlowDirection): boolean {
    const angleDiff = Math.abs(this.angle - other.angle);
    const normalizedDiff = Math.min(angleDiff, 360 - angleDiff);
    return normalizedDiff > 135 && normalizedDiff < 225; // Roughly opposite
  }

  /**
   * Combine with another flow direction (for confluences)
   */
  combineWith(other: FlowDirection): FlowDirection {
    const thisVector = this.getVector();
    const otherVector = other.getVector();

    const combinedX = thisVector.x + otherVector.x;
    const combinedY = thisVector.y + otherVector.y;

    const combinedVelocity = Math.sqrt(combinedX * combinedX + combinedY * combinedY);
    const combinedAngle = (Math.atan2(combinedX, -combinedY) * 180) / Math.PI;
    const normalizedAngle = ((combinedAngle % 360) + 360) % 360;

    return new FlowDirection(normalizedAngle, Math.min(combinedVelocity, 10));
  }

  private validateAngle(angle: number): void {
    if (!Number.isFinite(angle)) {
      throw new Error('Flow direction angle must be a finite number');
    }
  }

  private validateVelocity(velocity: number): void {
    if (!Number.isFinite(velocity) || velocity < 0 || velocity > 10) {
      throw new Error('Flow velocity must be between 0 and 10');
    }
  }

  equals(other: FlowDirection): boolean {
    return (
      Math.abs(this.angle - other.angle) < 0.1 && Math.abs(this.velocity - other.velocity) < 0.1
    );
  }

  toString(): string {
    return `FlowDirection(${this.angle}°, velocity: ${this.velocity})`;
  }
}
