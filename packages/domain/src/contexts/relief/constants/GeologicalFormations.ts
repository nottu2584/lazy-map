import {
  GeologicalFormation,
  RockType,
  MineralComposition,
  Mineral,
  StructureProperties,
  GeologicalStructure,
  JointOrientation,
  RockProperties,
  PermeabilityLevel,
  ChemicalStability,
  GrainSize,
  WeatheringProfile,
  WeatheringType,
  WeatheringRate,
  TerrainFeature
} from '../value-objects/GeologicalFormation';

/**
 * Predefined geological formations for different terrain types
 */

// ============================================================================
// CARBONATE FORMATIONS (Create karst terrain)
// ============================================================================

export const LIMESTONE_KARST = new GeologicalFormation(
  RockType.CARBONATE,
  new MineralComposition(Mineral.CALCITE, Mineral.DOLOMITE),
  new StructureProperties(
    GeologicalStructure.HORIZONTAL,
    5, // 5 meter joint spacing = ~3 tiles
    JointOrientation.ORTHOGONAL
  ),
  new RockProperties(
    3, // Mohs hardness
    PermeabilityLevel.MODERATE,
    ChemicalStability.UNSTABLE,
    GrainSize.FINE
  ),
  new WeatheringProfile(
    WeatheringType.CHEMICAL,
    WeatheringRate.MODERATE,
    [TerrainFeature.TOWER, TerrainFeature.SINKHOLE, TerrainFeature.CAVE, TerrainFeature.KARREN]
  )
);

export const DOLOMITE_TOWERS = new GeologicalFormation(
  RockType.CARBONATE,
  new MineralComposition(Mineral.DOLOMITE, Mineral.CALCITE),
  new StructureProperties(
    GeologicalStructure.HORIZONTAL,
    3, // Closer joint spacing for more towers
    JointOrientation.ORTHOGONAL
  ),
  new RockProperties(
    4, // Slightly harder than limestone
    PermeabilityLevel.LOW,
    ChemicalStability.MODERATE,
    GrainSize.CRYSTALLINE
  ),
  new WeatheringProfile(
    WeatheringType.CHEMICAL,
    WeatheringRate.SLOW,
    [TerrainFeature.TOWER, TerrainFeature.LEDGE, TerrainFeature.CLIFF]
  )
);

// ============================================================================
// GRANITIC FORMATIONS (Create dome and boulder terrain)
// ============================================================================

export const GRANITE_DOME = new GeologicalFormation(
  RockType.GRANITIC,
  new MineralComposition(Mineral.QUARTZ, Mineral.FELDSPAR, [Mineral.MICA]),
  new StructureProperties(
    GeologicalStructure.MASSIVE,
    10, // Wide joint spacing
    JointOrientation.ORTHOGONAL
  ),
  new RockProperties(
    6, // Hard rock
    PermeabilityLevel.LOW,
    ChemicalStability.MODERATE,
    GrainSize.COARSE
  ),
  new WeatheringProfile(
    WeatheringType.MECHANICAL,
    WeatheringRate.SLOW,
    [TerrainFeature.DOME, TerrainFeature.CORESTONE, TerrainFeature.GRUS, TerrainFeature.TOR]
  )
);

export const WEATHERED_GRANODIORITE = new GeologicalFormation(
  RockType.GRANITIC,
  new MineralComposition(Mineral.FELDSPAR, Mineral.QUARTZ, [Mineral.HORNBLENDE]),
  new StructureProperties(
    GeologicalStructure.MASSIVE,
    7, // Moderate joint spacing
    JointOrientation.RANDOM
  ),
  new RockProperties(
    5, // Slightly softer than granite
    PermeabilityLevel.MODERATE,
    ChemicalStability.MODERATE,
    GrainSize.MEDIUM
  ),
  new WeatheringProfile(
    WeatheringType.BOTH,
    WeatheringRate.MODERATE,
    [TerrainFeature.CORESTONE, TerrainFeature.GRUS, TerrainFeature.RAVINE]
  )
);

// ============================================================================
// VOLCANIC FORMATIONS (Create columnar and flow terrain)
// ============================================================================

export const BASALT_COLUMNS = new GeologicalFormation(
  RockType.VOLCANIC,
  new MineralComposition(Mineral.BASALT),
  new StructureProperties(
    GeologicalStructure.MASSIVE,
    2, // Close columnar joints
    JointOrientation.HEXAGONAL
  ),
  new RockProperties(
    6, // Hard rock
    PermeabilityLevel.LOW,
    ChemicalStability.STABLE,
    GrainSize.FINE
  ),
  new WeatheringProfile(
    WeatheringType.MECHANICAL,
    WeatheringRate.SLOW,
    [TerrainFeature.COLUMN, TerrainFeature.TALUS, TerrainFeature.CLIFF]
  )
);

export const VOLCANIC_TUFF = new GeologicalFormation(
  RockType.VOLCANIC,
  new MineralComposition(Mineral.CLAY, Mineral.QUARTZ),
  new StructureProperties(
    GeologicalStructure.HORIZONTAL,
    4,
    JointOrientation.RANDOM
  ),
  new RockProperties(
    2, // Very soft
    PermeabilityLevel.HIGH,
    ChemicalStability.UNSTABLE,
    GrainSize.FINE
  ),
  new WeatheringProfile(
    WeatheringType.BOTH,
    WeatheringRate.RAPID,
    [TerrainFeature.TUFF, TerrainFeature.ALCOVE, TerrainFeature.HOODOO]
  )
);

// ============================================================================
// CLASTIC FORMATIONS (Create canyon and fin terrain)
// ============================================================================

export const SANDSTONE_FINS = new GeologicalFormation(
  RockType.CLASTIC,
  new MineralComposition(Mineral.QUARTZ, Mineral.CLAY),
  new StructureProperties(
    GeologicalStructure.VERTICAL,
    3, // Creates narrow fins
    JointOrientation.ORTHOGONAL
  ),
  new RockProperties(
    5, // Moderate hardness
    PermeabilityLevel.HIGH,
    ChemicalStability.STABLE,
    GrainSize.MEDIUM
  ),
  new WeatheringProfile(
    WeatheringType.MECHANICAL,
    WeatheringRate.MODERATE,
    [TerrainFeature.FIN, TerrainFeature.SLOT_CANYON, TerrainFeature.ALCOVE]
  )
);

export const CROSS_BEDDED_SANDSTONE = new GeologicalFormation(
  RockType.CLASTIC,
  new MineralComposition(Mineral.QUARTZ),
  new StructureProperties(
    GeologicalStructure.CROSS_BEDDED,
    5,
    JointOrientation.RANDOM
  ),
  new RockProperties(
    4, // Softer than massive sandstone
    PermeabilityLevel.HIGH,
    ChemicalStability.STABLE,
    GrainSize.COARSE
  ),
  new WeatheringProfile(
    WeatheringType.MECHANICAL,
    WeatheringRate.MODERATE,
    [TerrainFeature.HOODOO, TerrainFeature.ALCOVE, TerrainFeature.FIN]
  )
);

// ============================================================================
// METAMORPHIC FORMATIONS (Create folded and platy terrain)
// ============================================================================

export const FOLIATED_SCHIST = new GeologicalFormation(
  RockType.METAMORPHIC,
  new MineralComposition(Mineral.MICA, Mineral.QUARTZ, [Mineral.FELDSPAR]),
  new StructureProperties(
    GeologicalStructure.FOLDED,
    2,
    JointOrientation.RANDOM,
    'strong' // Strong foliation
  ),
  new RockProperties(
    4, // Moderate hardness
    PermeabilityLevel.LOW,
    ChemicalStability.MODERATE,
    GrainSize.MEDIUM
  ),
  new WeatheringProfile(
    WeatheringType.BOTH,
    WeatheringRate.MODERATE,
    [TerrainFeature.FOLIATION_PLANE, TerrainFeature.SCHIST_RAVINE, TerrainFeature.CRENULATION]
  )
);

export const SLATE_BEDS = new GeologicalFormation(
  RockType.METAMORPHIC,
  new MineralComposition(Mineral.CLAY, Mineral.MICA),
  new StructureProperties(
    GeologicalStructure.HORIZONTAL,
    1, // Very close cleavage
    JointOrientation.ORTHOGONAL,
    'strong'
  ),
  new RockProperties(
    3, // Soft rock
    PermeabilityLevel.IMPERMEABLE,
    ChemicalStability.STABLE,
    GrainSize.FINE
  ),
  new WeatheringProfile(
    WeatheringType.MECHANICAL,
    WeatheringRate.MODERATE,
    [TerrainFeature.FOLIATION_PLANE, TerrainFeature.TALUS, TerrainFeature.LEDGE]
  )
);

// ============================================================================
// EVAPORITE FORMATIONS (Create badlands terrain)
// ============================================================================

export const GYPSUM_BADLANDS = new GeologicalFormation(
  RockType.EVAPORITE,
  new MineralComposition(Mineral.GYPSUM, Mineral.HALITE),
  new StructureProperties(
    GeologicalStructure.HORIZONTAL,
    2,
    JointOrientation.RANDOM
  ),
  new RockProperties(
    2, // Very soft
    PermeabilityLevel.MODERATE,
    ChemicalStability.UNSTABLE,
    GrainSize.CRYSTALLINE
  ),
  new WeatheringProfile(
    WeatheringType.CHEMICAL,
    WeatheringRate.RAPID,
    [TerrainFeature.SINKHOLE, TerrainFeature.CAVE, TerrainFeature.RAVINE]
  )
);

// ============================================================================
// FORMATION COLLECTIONS BY BIOME
// ============================================================================

/**
 * Get appropriate formations for a biome
 */
export function getFormationsForBiome(biome: string): GeologicalFormation[] {
  switch (biome) {
    case 'mountain':
      return [
        LIMESTONE_KARST,
        DOLOMITE_TOWERS,
        GRANITE_DOME,
        BASALT_COLUMNS,
        FOLIATED_SCHIST,
        SLATE_BEDS
      ];

    case 'desert':
      return [
        SANDSTONE_FINS,
        CROSS_BEDDED_SANDSTONE,
        GYPSUM_BADLANDS,
        VOLCANIC_TUFF
      ];

    case 'forest':
      return [
        GRANITE_DOME,
        WEATHERED_GRANODIORITE,
        FOLIATED_SCHIST,
        LIMESTONE_KARST
      ];

    case 'plains':
      return [
        LIMESTONE_KARST,
        CROSS_BEDDED_SANDSTONE,
        SLATE_BEDS
      ];

    case 'coastal':
      return [
        SANDSTONE_FINS,
        BASALT_COLUMNS,
        LIMESTONE_KARST
      ];

    case 'swamp':
      return [
        LIMESTONE_KARST,
        GYPSUM_BADLANDS
      ];

    case 'underground':
      return [
        LIMESTONE_KARST,
        DOLOMITE_TOWERS,
        GYPSUM_BADLANDS
      ];

    default:
      return [GRANITE_DOME]; // Default fallback
  }
}