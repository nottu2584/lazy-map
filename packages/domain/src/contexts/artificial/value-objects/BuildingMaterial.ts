/**
 * Wall construction styles/techniques from ancient to renaissance periods
 * These describe HOW walls are built, not just what they're made of
 */
export enum ConstructionStyle {
  // Ancient Period Styles
  MUD_BRICK = 'mud_brick',           // Adobe - sun-dried mud and straw bricks
  RUBBLE_MASONRY = 'rubble_masonry', // Irregular stones with mud/clay mortar
  CYCLOPEAN = 'cyclopean',           // Massive boulders, no mortar (Greek/Mycenaean)
  ASHLAR = 'ashlar',                 // Precisely cut squared stones
  OPUS_INCERTUM = 'opus_incertum',   // Roman concrete with irregular stone facing
  OPUS_RETICULATUM = 'opus_reticulatum', // Roman concrete with diagonal net pattern
  OPUS_LATERICIUM = 'opus_latericium',   // Roman concrete with fired brick facing

  // Medieval Period Styles
  WATTLE_DAUB = 'wattle_daub',       // Woven wood lattice with clay/dung/straw daub
  TIMBER_FRAME = 'timber_frame',     // Heavy timber structural frame (generic)
  BRICK_NOG = 'brick_nog',           // Timber frame with brick nogging infill
  STONE_NOG = 'stone_nog',           // Timber frame with stone nogging infill
  RUBBLE_CORE = 'rubble_core',       // Castle walls - ashlar faces with rubble core

  // Renaissance & Later Styles
  BRICK_LAID = 'brick_laid',         // Fired clay bricks with mortar
  DRESSED_STONE = 'dressed_stone',   // Refined cut stone blocks

  // Simple/Poor Styles
  COB = 'cob',                       // Mixed earth, straw, and water (no bricks)
  PALISADE = 'palisade',             // Wooden stakes/logs for fortification
  TURF = 'turf'                      // Stacked sod/earth blocks
}

/**
 * Primary materials that walls are made from
 * What consumers actually need to know for gameplay
 */
export enum WallMaterial {
  STONE = 'stone',     // Stone-based walls
  WOOD = 'wood',       // Wood-based walls
  BRICK = 'brick',     // Brick-based walls
  EARTH = 'earth',     // Earth/mud-based walls
  COMPOSITE = 'composite' // Mixed material walls
}

/**
 * Building material properties for medieval/ancient structures
 * Combines primary material with construction style for complete wall definition
 */
export class BuildingMaterial {
  private constructor(
    private readonly primaryMaterial: WallMaterial,
    private readonly constructionStyle: ConstructionStyle,
    private readonly wallThickness: number, // in feet
    private readonly durability: number, // 0-1 scale
    private readonly weatherResistance: number, // 0-1 scale
    private readonly costFactor: number, // relative cost multiplier
    private readonly availableInBiome: string[]
  ) {
    Object.freeze(this);
  }

  /**
   * Predefined historical building materials from ancient to renaissance periods
   */
  static readonly MATERIALS = {
    // Ancient Period Materials
    MUD_BRICK: new BuildingMaterial(
      WallMaterial.EARTH,
      ConstructionStyle.MUD_BRICK,
      1.5, // 1.5ft adobe walls
      0.3, // low durability
      0.2, // poor weather resistance
      0.1, // very cheap
      ['desert', 'plains', 'mesopotamian', 'egyptian']
    ),

    CYCLOPEAN: new BuildingMaterial(
      WallMaterial.STONE,
      ConstructionStyle.CYCLOPEAN,
      3.0, // 3ft+ massive boulders
      0.95, // exceptional durability
      0.9, // excellent weather resistance
      0.7, // expensive (labor intensive)
      ['greek', 'mycenaean', 'mountain', 'fortress']
    ),

    ASHLAR: new BuildingMaterial(
      WallMaterial.STONE,
      ConstructionStyle.ASHLAR,
      2.0, // 2ft precisely cut blocks
      0.9, // excellent durability
      0.85, // excellent weather resistance
      0.85, // very expensive
      ['urban', 'temple', 'palace', 'monumental']
    ),

    OPUS_INCERTUM: new BuildingMaterial(
      WallMaterial.COMPOSITE,
      ConstructionStyle.OPUS_INCERTUM,
      2.0, // 2ft Roman concrete core
      0.85, // excellent durability
      0.8, // good weather resistance
      0.5, // moderate cost
      ['roman', 'italian', 'provincial']
    ),

    OPUS_RETICULATUM: new BuildingMaterial(
      WallMaterial.COMPOSITE,
      ConstructionStyle.OPUS_RETICULATUM,
      2.0, // 2ft Roman concrete with net pattern
      0.87, // excellent durability
      0.82, // very good weather resistance
      0.6, // moderate-high cost
      ['roman', 'urban', 'villa']
    ),

    OPUS_LATERICIUM: new BuildingMaterial(
      WallMaterial.COMPOSITE,
      ConstructionStyle.OPUS_LATERICIUM,
      2.0, // 2ft Roman concrete with brick facing
      0.88, // excellent durability
      0.85, // excellent weather resistance
      0.65, // moderate-high cost
      ['roman', 'imperial', 'bath', 'basilica']
    ),

    // Medieval Period Materials
    WATTLE_DAUB: new BuildingMaterial(
      WallMaterial.COMPOSITE,
      ConstructionStyle.WATTLE_DAUB,
      0.5, // 6 inch woven wood with daub
      0.4, // moderate-low durability
      0.3, // poor-moderate weather resistance
      0.15, // very cheap
      ['forest', 'plains', 'rural', 'peasant']
    ),

    TIMBER_FRAME: new BuildingMaterial(
      WallMaterial.WOOD,
      ConstructionStyle.TIMBER_FRAME,
      0.75, // 9 inch heavy timber frame
      0.6, // moderate durability
      0.5, // moderate weather resistance
      0.35, // affordable
      ['forest', 'town', 'medieval', 'germanic']
    ),

    BRICK_NOG: new BuildingMaterial(
      WallMaterial.COMPOSITE,
      ConstructionStyle.BRICK_NOG,
      0.75, // 9 inch frame + brick infill
      0.7, // good durability
      0.65, // good weather resistance
      0.5, // moderate cost
      ['town', 'urban', 'late_medieval', 'flemish']
    ),

    STONE_NOG: new BuildingMaterial(
      WallMaterial.COMPOSITE,
      ConstructionStyle.STONE_NOG,
      0.75, // 9 inch frame + stone infill
      0.75, // good-high durability
      0.7, // good weather resistance
      0.55, // moderate-high cost
      ['town', 'quarry', 'highland', 'english']
    ),

    RUBBLE_MASONRY: new BuildingMaterial(
      WallMaterial.STONE,
      ConstructionStyle.RUBBLE_MASONRY,
      2.0, // 2ft irregular stones with mortar
      0.8, // very good durability
      0.75, // good weather resistance
      0.4, // moderate cost
      ['mountain', 'coastal', 'village', 'farmstead']
    ),

    RUBBLE_CORE: new BuildingMaterial(
      WallMaterial.STONE,
      ConstructionStyle.RUBBLE_CORE,
      6.0, // 6ft+ castle walls (ashlar faces, rubble fill)
      0.95, // exceptional durability
      0.9, // excellent weather resistance
      1.0, // extremely expensive
      ['castle', 'fortress', 'cathedral', 'keep']
    ),

    // Renaissance & Later Materials
    BRICK_LAID: new BuildingMaterial(
      WallMaterial.BRICK,
      ConstructionStyle.BRICK_LAID,
      1.0, // 1ft fired brick walls
      0.8, // high durability
      0.75, // good weather resistance
      0.45, // moderate cost
      ['urban', 'renaissance', 'industrial', 'dutch']
    ),

    DRESSED_STONE: new BuildingMaterial(
      WallMaterial.STONE,
      ConstructionStyle.DRESSED_STONE,
      1.5, // 1.5ft refined cut stone
      0.85, // very high durability
      0.8, // very good weather resistance
      0.7, // expensive
      ['renaissance', 'baroque', 'palazzo', 'mansion']
    ),

    // Simple/Poor Materials
    COB: new BuildingMaterial(
      WallMaterial.EARTH,
      ConstructionStyle.COB,
      2.0, // 2ft thick earth walls
      0.35, // low-moderate durability
      0.25, // poor weather resistance
      0.05, // extremely cheap
      ['rural', 'peasant', 'agricultural', 'vernacular']
    ),

    PALISADE: new BuildingMaterial(
      WallMaterial.WOOD,
      ConstructionStyle.PALISADE,
      0.5, // 6 inch wooden stakes
      0.4, // moderate-low durability
      0.35, // poor-moderate weather resistance
      0.2, // cheap
      ['frontier', 'fortification', 'motte', 'bailey']
    ),

    TURF: new BuildingMaterial(
      WallMaterial.EARTH,
      ConstructionStyle.TURF,
      2.5, // 2.5ft stacked sod blocks
      0.3, // low durability
      0.3, // poor weather resistance
      0.02, // almost free
      ['northern', 'icelandic', 'scottish', 'temporary']
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
      materials.push(this.MATERIALS.WATTLE_DAUB, this.MATERIALS.TIMBER_FRAME, this.MATERIALS.COB);
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

  // Getters - Material-first API
  getMaterial(): WallMaterial { return this.primaryMaterial; }
  getConstructionStyle(): ConstructionStyle { return this.constructionStyle; }
  getWallThickness(): number { return this.wallThickness; }
  getDurability(): number { return this.durability; }
  getWeatherResistance(): number { return this.weatherResistance; }
  getCostFactor(): number { return this.costFactor; }

  /**
   * Legacy getter for compatibility - maps to primary material
   * @deprecated Use getMaterial() instead
   */
  getType(): string {
    return this.primaryMaterial;
  }

  /**
   * Check if this material is suitable for a building type
   */
  isSuitableFor(buildingType: BuildingType): boolean {
    switch (buildingType) {
      case BuildingType.CASTLE:
      case BuildingType.FORTIFICATION:
        return this.durability >= 0.8; // Need strong materials

      case BuildingType.CHURCH:
      case BuildingType.MANOR:
        return this.durability >= 0.6; // Need at least good wood or stone

      case BuildingType.BARN:
      case BuildingType.STABLE:
        // Barns/stables typically use wood or composite materials
        return this.primaryMaterial === WallMaterial.WOOD ||
               this.primaryMaterial === WallMaterial.COMPOSITE ||
               (this.primaryMaterial === WallMaterial.EARTH && this.constructionStyle === ConstructionStyle.COB);

      default:
        return true; // Houses can use any material
    }
  }
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
  FORTIFICATION = 'fortification'
}