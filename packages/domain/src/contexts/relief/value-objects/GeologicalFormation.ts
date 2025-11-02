/**
 * Geological Formation Value Object
 * Represents the bedrock geology that determines terrain features
 */

/**
 * Primary rock types based on formation process
 */
export enum RockType {
  CARBONATE = 'carbonate',       // Limestone, dolomite
  GRANITIC = 'granitic',         // Granite, granodiorite
  VOLCANIC = 'volcanic',         // Basalt, andesite, rhyolite
  CLASTIC = 'clastic',           // Sandstone, conglomerate
  METAMORPHIC = 'metamorphic',   // Schist, slate, gneiss
  EVAPORITE = 'evaporite'        // Salt, gypsum
}

/**
 * Specific minerals that compose rocks
 */
export enum Mineral {
  CALCITE = 'calcite',
  DOLOMITE = 'dolomite',
  QUARTZ = 'quartz',
  FELDSPAR = 'feldspar',
  MICA = 'mica',
  HORNBLENDE = 'hornblende',
  BASALT = 'basalt',
  GYPSUM = 'gypsum',
  HALITE = 'halite',
  CLAY = 'clay'
}

/**
 * Structural patterns in rock formations
 */
export enum GeologicalStructure {
  MASSIVE = 'massive',           // No visible structure
  HORIZONTAL = 'horizontal',     // Flat-lying beds
  VERTICAL = 'vertical',         // Upright beds
  FOLDED = 'folded',            // Bent/twisted layers
  CROSS_BEDDED = 'cross_bedded' // Angled internal layers
}

/**
 * Joint patterns in rocks (fracture orientation)
 */
export enum JointOrientation {
  ORTHOGONAL = 'orthogonal',    // Right angles (cubic)
  HEXAGONAL = 'hexagonal',      // Six-sided columns
  RANDOM = 'random',            // No pattern
  RADIAL = 'radial'             // Radiating from center
}

/**
 * Weathering process types
 */
export enum WeatheringType {
  MECHANICAL = 'mechanical',     // Physical breakdown
  CHEMICAL = 'chemical',        // Chemical dissolution
  BOTH = 'both'                 // Combined processes
}

/**
 * Rate of weathering
 */
export enum WeatheringRate {
  RAPID = 'rapid',              // <100 years
  MODERATE = 'moderate',        // 100-1000 years
  SLOW = 'slow'                 // >1000 years
}

/**
 * Permeability levels for water flow
 */
export enum PermeabilityLevel {
  HIGH = 'high',                // Water passes easily
  MODERATE = 'moderate',        // Some water passes
  LOW = 'low',                  // Little water passes
  IMPERMEABLE = 'impermeable'   // No water passes
}

/**
 * Chemical stability of rocks
 */
export enum ChemicalStability {
  STABLE = 'stable',            // Resists chemical weathering
  MODERATE = 'moderate',        // Some chemical weathering
  UNSTABLE = 'unstable'         // Rapid chemical weathering
}

/**
 * Grain size classification
 */
export enum GrainSize {
  CRYSTALLINE = 'crystalline',  // Visible crystals
  COARSE = 'coarse',            // >2mm grains
  MEDIUM = 'medium',            // 0.06-2mm grains
  FINE = 'fine',                // <0.06mm grains
  GLASSY = 'glassy'             // No grains (volcanic glass)
}

/**
 * Erosion patterns created by weathering
 */
export enum ErosionPattern {
  KARST = 'karst',              // Towers, sinkholes, caves
  EXFOLIATION = 'exfoliation',  // Domes, sheets
  COLUMNAR = 'columnar',        // Hexagonal columns
  FINS = 'fins',                // Vertical walls
  SPHEROIDAL = 'spheroidal',    // Rounded boulders
  PLATY = 'platy',              // Flat sheets
  BADLANDS = 'badlands'         // Intense erosion
}

/**
 * Terrain features resulting from erosion
 */
export enum TerrainFeature {
  // Karst features
  TOWER = 'tower',              // Vertical rock pillar
  SINKHOLE = 'sinkhole',        // Collapse depression
  CAVE = 'cave',                // Underground opening
  KARREN = 'karren',            // Solution grooves

  // Granitic features
  DOME = 'dome',                // Rounded hill
  CORESTONE = 'corestone',      // Rounded boulder
  GRUS = 'grus',                // Decomposed granite
  TOR = 'tor',                  // Stacked boulders

  // Volcanic features
  COLUMN = 'column',            // Basalt column
  LAVA_FLOW = 'lava_flow',      // Solidified lava
  VOLCANIC_NECK = 'volcanic_neck', // Resistant pipe
  TUFF = 'tuff',                // Volcanic ash

  // Clastic features
  FIN = 'fin',                  // Narrow wall
  SLOT_CANYON = 'slot_canyon',  // Narrow gorge
  HOODOO = 'hoodoo',            // Mushroom rock
  ALCOVE = 'alcove',            // Undercut shelter

  // Metamorphic features
  FOLIATION_PLANE = 'foliation_plane', // Splitting surface
  CRENULATION = 'crenulation',  // Wavy folds
  SCHIST_RAVINE = 'schist_ravine', // Deep weathered channel

  // General features
  CLIFF = 'cliff',              // Vertical face
  TALUS = 'talus',              // Rock debris slope
  LEDGE = 'ledge',              // Horizontal shelf
  RAVINE = 'ravine'             // Deep narrow valley
}

/**
 * Mineral composition of a rock
 */
export class MineralComposition {
  constructor(
    public readonly primary: Mineral,
    public readonly secondary?: Mineral,
    public readonly accessory?: Mineral[]
  ) {}

  /**
   * Check if contains a specific mineral
   */
  contains(mineral: Mineral): boolean {
    return this.primary === mineral ||
           this.secondary === mineral ||
           (this.accessory?.includes(mineral) ?? false);
  }

  /**
   * Get hardness based on mineral composition (Mohs scale 1-10)
   */
  getHardness(): number {
    const hardnessMap: Record<Mineral, number> = {
      [Mineral.HALITE]: 2,
      [Mineral.GYPSUM]: 2,
      [Mineral.CALCITE]: 3,
      [Mineral.DOLOMITE]: 4,
      [Mineral.CLAY]: 2,
      [Mineral.MICA]: 3,
      [Mineral.HORNBLENDE]: 5,
      [Mineral.FELDSPAR]: 6,
      [Mineral.BASALT]: 6,
      [Mineral.QUARTZ]: 7
    };

    return hardnessMap[this.primary] || 5;
  }
}

/**
 * Properties of the geological structure
 */
export class StructureProperties {
  constructor(
    public readonly bedding: GeologicalStructure,
    public readonly jointSpacing: number, // meters between joints
    public readonly jointOrientation: JointOrientation,
    public readonly foliation?: 'strong' | 'moderate' | 'weak'
  ) {}

  /**
   * Get the tile spacing for joints (converting meters to tiles)
   */
  getJointSpacingInTiles(): number {
    // 1 tile = 5 feet = ~1.5 meters
    return Math.round(this.jointSpacing / 1.5);
  }

  /**
   * Check if structure creates vertical features
   */
  createsVerticalFeatures(): boolean {
    return this.bedding === GeologicalStructure.VERTICAL ||
           this.jointOrientation === JointOrientation.HEXAGONAL;
  }
}

/**
 * Rock properties that affect erosion
 */
export class RockProperties {
  constructor(
    public readonly hardness: number, // Mohs scale 1-10
    public readonly permeability: PermeabilityLevel,
    public readonly chemicalStability: ChemicalStability,
    public readonly grainSize: GrainSize
  ) {}

  /**
   * Get erosion resistance (0-1, higher = more resistant)
   */
  getErosionResistance(): number {
    let resistance = this.hardness / 10; // Base from hardness

    // Adjust for chemical stability
    if (this.chemicalStability === ChemicalStability.UNSTABLE) {
      resistance *= 0.5;
    } else if (this.chemicalStability === ChemicalStability.MODERATE) {
      resistance *= 0.75;
    }

    // Fine-grained rocks are often more resistant
    if (this.grainSize === GrainSize.FINE) {
      resistance *= 1.1;
    }

    return Math.min(1, resistance);
  }

  /**
   * Check if rock type allows cave formation
   */
  allowsCaves(): boolean {
    return this.chemicalStability === ChemicalStability.UNSTABLE &&
           this.permeability !== PermeabilityLevel.IMPERMEABLE;
  }
}

/**
 * Weathering profile for the formation
 */
export class WeatheringProfile {
  constructor(
    public readonly dominant: WeatheringType,
    public readonly rate: WeatheringRate,
    public readonly products: TerrainFeature[]
  ) {}

  /**
   * Get the erosion pattern based on weathering
   */
  getErosionPattern(rockType: RockType, structure: GeologicalStructure): ErosionPattern {
    if (rockType === RockType.CARBONATE && this.dominant === WeatheringType.CHEMICAL) {
      return ErosionPattern.KARST;
    }
    if (rockType === RockType.GRANITIC && this.dominant === WeatheringType.MECHANICAL) {
      return ErosionPattern.EXFOLIATION;
    }
    if (rockType === RockType.VOLCANIC && structure === GeologicalStructure.MASSIVE) {
      return ErosionPattern.COLUMNAR;
    }
    if (rockType === RockType.CLASTIC && structure === GeologicalStructure.VERTICAL) {
      return ErosionPattern.FINS;
    }
    if (rockType === RockType.METAMORPHIC) {
      return ErosionPattern.PLATY;
    }
    if (rockType === RockType.EVAPORITE) {
      return ErosionPattern.BADLANDS;
    }
    return ErosionPattern.SPHEROIDAL; // Default
  }
}

/**
 * Complete geological formation
 */
export class GeologicalFormation {
  constructor(
    public readonly rockType: RockType,
    public readonly mineralComposition: MineralComposition,
    public readonly structure: StructureProperties,
    public readonly properties: RockProperties,
    public readonly weathering: WeatheringProfile
  ) {}

  /**
   * Get the erosion pattern for this formation
   */
  getErosionPattern(): ErosionPattern {
    return this.weathering.getErosionPattern(this.rockType, this.structure.bedding);
  }

  /**
   * Get terrain features this formation can produce
   */
  getPossibleFeatures(): TerrainFeature[] {
    const features: TerrainFeature[] = [];
    const pattern = this.getErosionPattern();

    switch (pattern) {
      case ErosionPattern.KARST:
        features.push(
          TerrainFeature.TOWER,
          TerrainFeature.SINKHOLE,
          TerrainFeature.CAVE,
          TerrainFeature.KARREN
        );
        break;
      case ErosionPattern.EXFOLIATION:
        features.push(
          TerrainFeature.DOME,
          TerrainFeature.CORESTONE,
          TerrainFeature.GRUS,
          TerrainFeature.TOR
        );
        break;
      case ErosionPattern.COLUMNAR:
        features.push(
          TerrainFeature.COLUMN,
          TerrainFeature.LAVA_FLOW,
          TerrainFeature.VOLCANIC_NECK
        );
        break;
      case ErosionPattern.FINS:
        features.push(
          TerrainFeature.FIN,
          TerrainFeature.SLOT_CANYON,
          TerrainFeature.HOODOO,
          TerrainFeature.ALCOVE
        );
        break;
      case ErosionPattern.PLATY:
        features.push(
          TerrainFeature.FOLIATION_PLANE,
          TerrainFeature.CRENULATION,
          TerrainFeature.SCHIST_RAVINE
        );
        break;
    }

    // Add general features based on properties
    if (this.properties.hardness > 6) {
      features.push(TerrainFeature.CLIFF);
    }
    if (this.structure.createsVerticalFeatures()) {
      features.push(TerrainFeature.LEDGE);
    }
    features.push(TerrainFeature.TALUS); // All rocks can create talus

    return features;
  }

  /**
   * Calculate soil depth potential (in feet)
   */
  getSoilDepthRange(): { min: number; max: number } {
    const baseDepth = 10 - this.properties.hardness; // Harder rocks = thinner soil

    // Adjust for weathering rate
    let multiplier = 1;
    if (this.weathering.rate === WeatheringRate.RAPID) {
      multiplier = 2;
    } else if (this.weathering.rate === WeatheringRate.SLOW) {
      multiplier = 0.5;
    }

    return {
      min: Math.max(0, baseDepth * multiplier * 0.5),
      max: Math.max(1, baseDepth * multiplier * 1.5)
    };
  }

  /**
   * Check if springs can occur at this formation
   */
  canHaveSprings(): boolean {
    return this.properties.permeability === PermeabilityLevel.MODERATE ||
           this.properties.permeability === PermeabilityLevel.LOW;
  }
}