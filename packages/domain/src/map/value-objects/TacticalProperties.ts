/**
 * Tactical properties for a map tile
 * These properties affect combat and movement in tabletop games
 */
export class TacticalProperties {
  constructor(
    public readonly movementCost: number,        // Multiplier for movement (1 = normal, 2 = difficult terrain)
    public readonly coverLevel: CoverLevel,      // Physical protection from attacks
    public readonly concealmentLevel: ConcealmentLevel, // Visual obscuration
    public readonly elevationAdvantage: number,  // Bonus/penalty for elevation (-1 to +1)
    public readonly lineOfSight: LineOfSight,   // Visibility characteristics
    public readonly hazardLevel: number,         // Damage or effect severity (0-10)
    public readonly isChokepointPoint: boolean,  // Strategic bottleneck
    public readonly isDefensible: boolean        // Good defensive position
  ) {}

  /**
   * Create tactical properties from terrain characteristics
   */
  static fromTerrain(
    elevation: number,
    slope: number,
    vegetation: string,
    hasStructure: boolean,
    hasWater: boolean,
    terrainFeatures: string[]
  ): TacticalProperties {
    // Calculate movement cost
    let movementCost = 1;
    if (slope > 45) movementCost += 1; // Steep slopes
    if (slope > 60) movementCost += 1; // Very steep
    if (hasWater) movementCost += 1;   // Water slows movement
    if (vegetation === 'dense_forest') movementCost += 0.5;
    if (vegetation === 'wetland_vegetation') movementCost += 1;

    // Determine cover level
    let coverLevel = CoverLevel.NONE;
    if (hasStructure) {
      coverLevel = CoverLevel.TOTAL;
    } else if (terrainFeatures.includes('tower') || terrainFeatures.includes('column')) {
      coverLevel = CoverLevel.THREE_QUARTERS;
    } else if (terrainFeatures.includes('corestone') || terrainFeatures.includes('ledge')) {
      coverLevel = CoverLevel.HALF;
    } else if (slope > 30) {
      coverLevel = CoverLevel.QUARTER;
    }

    // Determine concealment
    let concealmentLevel = ConcealmentLevel.NONE;
    if (vegetation === 'dense_forest') {
      concealmentLevel = ConcealmentLevel.HEAVY;
    } else if (vegetation === 'sparse_forest' || vegetation === 'shrubland') {
      concealmentLevel = ConcealmentLevel.LIGHT;
    }

    // Calculate elevation advantage
    const elevationAdvantage = Math.min(1, Math.max(-1, elevation / 50));

    // Determine line of sight
    let lineOfSight = LineOfSight.CLEAR;
    if (vegetation === 'dense_forest' || hasStructure) {
      lineOfSight = LineOfSight.BLOCKED;
    } else if (vegetation === 'sparse_forest' || terrainFeatures.includes('tower')) {
      lineOfSight = LineOfSight.OBSTRUCTED;
    }

    // Calculate hazard level
    let hazardLevel = 0;
    if (terrainFeatures.includes('sinkhole')) hazardLevel = 5;
    if (terrainFeatures.includes('cave')) hazardLevel = 3;
    if (terrainFeatures.includes('ravine')) hazardLevel = 4;
    if (slope > 70) hazardLevel = Math.max(hazardLevel, 2);

    // Determine if chokepoint (narrow passages)
    const isChokepointPoint = terrainFeatures.includes('slot_canyon') ||
                              terrainFeatures.includes('fin') ||
                              (hasStructure && terrainFeatures.includes('bridge'));

    // Determine if defensible
    const isDefensible = coverLevel >= CoverLevel.HALF &&
                         elevationAdvantage > 0 &&
                         !isChokepointPoint;

    return new TacticalProperties(
      movementCost,
      coverLevel,
      concealmentLevel,
      elevationAdvantage,
      lineOfSight,
      hazardLevel,
      isChokepointPoint,
      isDefensible
    );
  }

  /**
   * Get total defense bonus for this tile
   */
  getDefenseBonus(): number {
    let bonus = 0;

    // Cover bonuses (AC bonus in D&D terms)
    switch (this.coverLevel) {
      case CoverLevel.QUARTER: bonus += 1; break;
      case CoverLevel.HALF: bonus += 2; break;
      case CoverLevel.THREE_QUARTERS: bonus += 5; break;
      case CoverLevel.TOTAL: bonus += 10; break;
    }

    // Concealment bonuses (miss chance)
    switch (this.concealmentLevel) {
      case ConcealmentLevel.LIGHT: bonus += 1; break;
      case ConcealmentLevel.HEAVY: bonus += 2; break;
    }

    // Elevation bonus
    bonus += Math.round(this.elevationAdvantage * 2);

    // Defensive position bonus
    if (this.isDefensible) bonus += 2;

    return bonus;
  }

  /**
   * Check if movement is possible through this tile
   */
  isPassable(): boolean {
    return this.movementCost < 99 && this.hazardLevel < 10;
  }

  /**
   * Check if ranged attacks can pass through
   */
  allowsRangedAttacks(): boolean {
    return this.lineOfSight !== LineOfSight.BLOCKED;
  }

  /**
   * Get description for game master
   */
  getDescription(): string {
    const descriptions: string[] = [];

    // Movement
    if (this.movementCost > 1) {
      descriptions.push(`Difficult terrain (${this.movementCost}x movement cost)`);
    }

    // Cover
    if (this.coverLevel !== CoverLevel.NONE) {
      descriptions.push(`Provides ${this.coverLevel} cover`);
    }

    // Concealment
    if (this.concealmentLevel !== ConcealmentLevel.NONE) {
      descriptions.push(`${this.concealmentLevel} concealment`);
    }

    // Elevation
    if (Math.abs(this.elevationAdvantage) > 0.3) {
      const advantage = this.elevationAdvantage > 0 ? 'high ground' : 'low ground';
      descriptions.push(`${advantage} (${Math.round(this.elevationAdvantage * 100)}%)`);
    }

    // Special properties
    if (this.isChokepointPoint) descriptions.push('Chokepoint');
    if (this.isDefensible) descriptions.push('Defensible position');
    if (this.hazardLevel > 0) descriptions.push(`Hazardous (level ${this.hazardLevel})`);

    return descriptions.join(', ') || 'Clear terrain';
  }
}

/**
 * Level of physical cover provided
 */
export enum CoverLevel {
  NONE = 'none',                    // No cover
  QUARTER = 'quarter',              // +1 AC
  HALF = 'half',                    // +2 AC
  THREE_QUARTERS = 'three_quarters', // +5 AC
  TOTAL = 'total'                   // Cannot be targeted
}

/**
 * Level of visual concealment
 */
export enum ConcealmentLevel {
  NONE = 'none',        // Clear visibility
  LIGHT = 'light',      // 20% miss chance
  HEAVY = 'heavy'       // 50% miss chance
}

/**
 * Line of sight characteristics
 */
export enum LineOfSight {
  CLEAR = 'clear',           // Unobstructed view
  OBSTRUCTED = 'obstructed', // Partially blocked
  BLOCKED = 'blocked'        // Cannot see through
}

/**
 * Movement type restrictions
 */
export enum MovementType {
  WALK = 'walk',
  CLIMB = 'climb',
  SWIM = 'swim',
  FLY = 'fly',
  BURROW = 'burrow'
}

/**
 * Tactical advantage types
 */
export enum TacticalAdvantage {
  HIGH_GROUND = 'high_ground',
  FLANKING = 'flanking',
  AMBUSH = 'ambush',
  FORTIFIED = 'fortified',
  BOTTLENECK = 'bottleneck'
}