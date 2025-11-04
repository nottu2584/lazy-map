/**
 * Building material properties for medieval/ancient structures
 * Determines wall thickness, durability, and construction methods
 */
export class BuildingMaterial {
  private constructor(
    private readonly type: MaterialType,
    private readonly wallThickness: number, // in feet
    private readonly durability: number, // 0-1 scale
    private readonly weatherResistance: number, // 0-1 scale
    private readonly costFactor: number, // relative cost multiplier
    private readonly availableInBiome: string[]
  ) {
    Object.freeze(this);
  }

  /**
   * Predefined medieval building materials
   */
  static readonly MATERIALS = {
    MUD_BRICK: new BuildingMaterial(
      MaterialType.MUD,
      1.0, // 1ft thick walls
      0.3, // low durability
      0.2, // poor weather resistance
      0.1, // very cheap
      ['desert', 'plains', 'swamp']
    ),

    WATTLE_DAUB: new BuildingMaterial(
      MaterialType.WATTLE,
      0.5, // 6 inch walls
      0.4, // moderate-low durability
      0.3, // poor-moderate weather resistance
      0.2, // cheap
      ['forest', 'plains', 'rural']
    ),

    WOOD_PLANK: new BuildingMaterial(
      MaterialType.WOOD_PLANK,
      0.5, // 6 inch walls
      0.6, // moderate durability
      0.5, // moderate weather resistance
      0.4, // affordable
      ['forest', 'mountain', 'coastal']
    ),

    WOOD_LOG: new BuildingMaterial(
      MaterialType.WOOD_LOG,
      1.5, // 1.5ft thick walls
      0.7, // good durability
      0.6, // good weather resistance
      0.5, // moderate cost
      ['forest', 'mountain']
    ),

    STONE_RUBBLE: new BuildingMaterial(
      MaterialType.STONE_RUBBLE,
      1.5, // 1.5ft thick walls
      0.8, // very good durability
      0.8, // excellent weather resistance
      0.6, // expensive
      ['mountain', 'coastal', 'plains']
    ),

    STONE_CUT: new BuildingMaterial(
      MaterialType.STONE_CUT,
      2.0, // 2ft thick walls
      0.9, // excellent durability
      0.9, // excellent weather resistance
      0.8, // very expensive
      ['mountain', 'urban', 'castle']
    ),

    STONE_FORTIFIED: new BuildingMaterial(
      MaterialType.STONE_FORTIFIED,
      3.0, // 3ft thick walls (castle walls)
      1.0, // maximum durability
      1.0, // maximum weather resistance
      1.0, // extremely expensive
      ['castle', 'fortification']
    )
  };

  /**
   * Select material based on wealth level and biome
   * Uses deterministic selection based on seed
   */
  static selectMaterial(
    wealthLevel: number, // 0-1
    biome: string,
    seedValue: number
  ): BuildingMaterial {
    // Get available materials for this biome
    const available = this.getMaterialsForBiome(biome);

    // Filter by wealth level
    const affordable = available.filter(mat => mat.costFactor <= wealthLevel);

    if (affordable.length === 0) {
      // If nothing affordable, use cheapest available
      return available.reduce((min, mat) =>
        mat.costFactor < min.costFactor ? mat : min
      );
    }

    // Deterministic selection based on seed
    const index = Math.abs(seedValue) % affordable.length;
    return affordable[index];
  }

  /**
   * Get materials available in a specific biome
   */
  private static getMaterialsForBiome(biome: string): BuildingMaterial[] {
    const materials: BuildingMaterial[] = [];

    for (const material of Object.values(this.MATERIALS)) {
      if (material.availableInBiome.includes(biome) ||
          material.availableInBiome.includes('*')) {
        materials.push(material);
      }
    }

    // Fallback to basic materials if none found
    if (materials.length === 0) {
      materials.push(this.MATERIALS.WATTLE_DAUB, this.MATERIALS.WOOD_PLANK);
    }

    return materials;
  }

  /**
   * Check if material can support multiple floors
   */
  canSupportFloors(floorCount: number): boolean {
    // Mud and wattle can't support more than 1 floor
    if (this.durability < 0.5) {
      return floorCount <= 1;
    }
    // Wood can support 2 floors
    if (this.durability < 0.8) {
      return floorCount <= 2;
    }
    // Stone can support 3+ floors
    return floorCount <= 4;
  }

  /**
   * Get material degradation over time
   */
  getDegradation(age: number, weatherExposure: number): number {
    const baseDecay = age * 0.01; // 1% per year base
    const weatherDecay = weatherExposure * (1 - this.weatherResistance) * 0.02;
    return Math.min(1, baseDecay + weatherDecay);
  }

  // Getters
  getType(): MaterialType { return this.type; }
  getWallThickness(): number { return this.wallThickness; }
  getDurability(): number { return this.durability; }
  getWeatherResistance(): number { return this.weatherResistance; }
  getCostFactor(): number { return this.costFactor; }

  /**
   * Check if this material is suitable for a building type
   */
  isSuitableFor(buildingType: BuildingType): boolean {
    switch (buildingType) {
      case BuildingType.CASTLE:
      case BuildingType.FORTIFICATION:
        return this.durability >= 0.8; // Need stone

      case BuildingType.CHURCH:
      case BuildingType.MANOR:
        return this.durability >= 0.6; // Need at least good wood or stone

      case BuildingType.BARN:
      case BuildingType.STABLE:
        return this.type === MaterialType.WOOD_PLANK ||
               this.type === MaterialType.WOOD_LOG;

      default:
        return true; // Houses can use any material
    }
  }
}

/**
 * Material types enum
 */
export enum MaterialType {
  MUD = 'mud',
  WATTLE = 'wattle',
  WOOD_PLANK = 'wood_plank',
  WOOD_LOG = 'wood_log',
  STONE_RUBBLE = 'stone_rubble',
  STONE_CUT = 'stone_cut',
  STONE_FORTIFIED = 'stone_fortified'
}

/**
 * Building types that determine material requirements
 */
export enum BuildingType {
  HUT = 'hut',
  HOUSE = 'house',
  COTTAGE = 'cottage',
  FARMHOUSE = 'farmhouse',
  TOWNHOUSE = 'townhouse',
  MANOR = 'manor',
  BARN = 'barn',
  STABLE = 'stable',
  WORKSHOP = 'workshop',
  TAVERN = 'tavern',
  INN = 'inn',
  CHURCH = 'church',
  CHAPEL = 'chapel',
  MILL = 'mill',
  TOWER = 'tower',
  GATEHOUSE = 'gatehouse',
  CASTLE = 'castle',
  FORTIFICATION = 'fortification',
  RUIN = 'ruin'
}