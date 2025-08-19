import {
  MapFeature,
  FeatureCategory,
  ReliefFeatureType,
  NaturalFeatureType,
  ArtificialFeatureType,
} from './types';
import { MapTile } from '../../../map/entities';
import { TerrainType } from '../../relief/value-objects';

// Feature compatibility rules - which features can mix together
export enum CompatibilityLevel {
  INCOMPATIBLE = 0, // Features cannot coexist (e.g., water + building)
  NEUTRAL = 1, // Features can coexist but don't enhance each other
  COMPATIBLE = 2, // Features blend well together (e.g., forest + hill)
  SYNERGISTIC = 3, // Features enhance each other (e.g., oasis + desert)
}

// Interaction priorities for different aspects
export enum InteractionAspect {
  TERRAIN = 'terrain', // Which terrain type dominates
  HEIGHT = 'height', // How heights combine
  MOVEMENT = 'movement', // How movement costs combine
  BLOCKING = 'blocking', // Which blocking state wins
  VISUAL = 'visual', // Visual representation priority
}

// Feature interaction result
export interface FeatureInteraction {
  compatibility: CompatibilityLevel;
  dominantFeature: {
    [InteractionAspect.TERRAIN]: string; // Feature ID that determines terrain
    [InteractionAspect.HEIGHT]: string; // Feature ID that determines height
    [InteractionAspect.MOVEMENT]: string; // Feature ID that determines movement
    [InteractionAspect.BLOCKING]: string; // Feature ID that determines blocking
    [InteractionAspect.VISUAL]: string; // Feature ID for visual priority
  };
  heightBlending: 'add' | 'average' | 'max' | 'dominant'; // How to combine heights
  terrainModification?: TerrainType; // Special terrain for this combination
  movementModification?: number; // Movement cost adjustment
  specialProperties?: Record<string, any>; // Custom properties for mixed tiles
}

// Get compatibility between two feature types
export function getFeatureCompatibility(
  feature1: MapFeature,
  feature2: MapFeature,
): CompatibilityLevel {
  // Relief + Natural combinations
  if (isReliefAndNatural(feature1, feature2)) {
    return getReliefNaturalCompatibility(feature1, feature2);
  }

  // Relief + Artificial combinations
  if (isReliefAndArtificial(feature1, feature2)) {
    return getReliefArtificialCompatibility(feature1, feature2);
  }

  // Natural + Artificial combinations
  if (isNaturalAndArtificial(feature1, feature2)) {
    return getNaturalArtificialCompatibility(feature1, feature2);
  }

  // Cultural features are generally compatible with most others
  if (
    feature1.category === FeatureCategory.CULTURAL ||
    feature2.category === FeatureCategory.CULTURAL
  ) {
    return CompatibilityLevel.NEUTRAL;
  }

  // Same category features - usually neutral
  if (feature1.category === feature2.category) {
    return CompatibilityLevel.NEUTRAL;
  }

  return CompatibilityLevel.NEUTRAL;
}

// Calculate how features should interact
export function calculateFeatureInteraction(
  primaryFeature: MapFeature,
  secondaryFeature: MapFeature,
): FeatureInteraction {
  const compatibility = getFeatureCompatibility(primaryFeature, secondaryFeature);

  // Default interaction - primary feature dominates most aspects
  let interaction: FeatureInteraction = {
    compatibility,
    dominantFeature: {
      [InteractionAspect.TERRAIN]: primaryFeature.id,
      [InteractionAspect.HEIGHT]: primaryFeature.id,
      [InteractionAspect.MOVEMENT]: primaryFeature.id,
      [InteractionAspect.BLOCKING]: primaryFeature.id,
      [InteractionAspect.VISUAL]: primaryFeature.id,
    },
    heightBlending: 'dominant',
  };

  // Customize interaction based on specific feature combinations
  if (isReliefAndNatural(primaryFeature, secondaryFeature)) {
    interaction = customizeReliefNaturalInteraction(primaryFeature, secondaryFeature, interaction);
  } else if (isReliefAndArtificial(primaryFeature, secondaryFeature)) {
    interaction = customizeReliefArtificialInteraction(
      primaryFeature,
      secondaryFeature,
      interaction,
    );
  } else if (isNaturalAndArtificial(primaryFeature, secondaryFeature)) {
    interaction = customizeNaturalArtificialInteraction(
      primaryFeature,
      secondaryFeature,
      interaction,
    );
  }

  return interaction;
}

// Apply mixed features to a tile
// TODO: This function needs to be refactored to work with the new MapTile class interface
export function applyFeatureMixing(
  tile: MapTile,
  features: MapFeature[],
  mixingProbability: number = 0.7,
): MapTile {
  // Temporary stub implementation to avoid build errors
  // This needs proper implementation using MapTile class methods
  return tile;
}

// Apply a specific feature interaction to a tile
// TODO: This function needs to be refactored to work with the new MapTile class interface
function applyFeatureInteractionToTile(
  tile: MapTile,
  interaction: FeatureInteraction,
  primaryFeature: MapFeature,
  secondaryFeature: MapFeature,
): MapTile {
  // Temporary stub implementation
  return tile;
}

// Helper functions for feature type checking
function isReliefAndNatural(f1: MapFeature, f2: MapFeature): boolean {
  return (
    (f1.category === FeatureCategory.RELIEF && f2.category === FeatureCategory.NATURAL) ||
    (f1.category === FeatureCategory.NATURAL && f2.category === FeatureCategory.RELIEF)
  );
}

function isReliefAndArtificial(f1: MapFeature, f2: MapFeature): boolean {
  return (
    (f1.category === FeatureCategory.RELIEF && f2.category === FeatureCategory.ARTIFICIAL) ||
    (f1.category === FeatureCategory.ARTIFICIAL && f2.category === FeatureCategory.RELIEF)
  );
}

function isNaturalAndArtificial(f1: MapFeature, f2: MapFeature): boolean {
  return (
    (f1.category === FeatureCategory.NATURAL && f2.category === FeatureCategory.ARTIFICIAL) ||
    (f1.category === FeatureCategory.ARTIFICIAL && f2.category === FeatureCategory.NATURAL)
  );
}

// Relief + Natural compatibility rules
function getReliefNaturalCompatibility(f1: MapFeature, f2: MapFeature): CompatibilityLevel {
  const reliefFeature = f1.category === FeatureCategory.RELIEF ? f1 : f2;
  const naturalFeature = f1.category === FeatureCategory.NATURAL ? f1 : f2;

  const reliefType = reliefFeature.type as ReliefFeatureType;
  const naturalType = naturalFeature.type as NaturalFeatureType;

  // Highly compatible combinations
  if (
    reliefType === ReliefFeatureType.MOUNTAIN &&
    naturalType === NaturalFeatureType.FOREST
  ) {
    return CompatibilityLevel.SYNERGISTIC; // Forested mountains
  }
  if (reliefType === ReliefFeatureType.VALLEY && naturalType === NaturalFeatureType.RIVER) {
    return CompatibilityLevel.SYNERGISTIC; // Rivers flow through valleys
  }
  if (reliefType === ReliefFeatureType.BASIN && naturalType === NaturalFeatureType.LAKE) {
    return CompatibilityLevel.SYNERGISTIC; // Lakes form in basins
  }

  // Compatible combinations
  if (reliefType === ReliefFeatureType.HILL && naturalType === NaturalFeatureType.FOREST) {
    return CompatibilityLevel.COMPATIBLE; // Forested hills
  }
  if (reliefType === ReliefFeatureType.PLATEAU && naturalType === NaturalFeatureType.CLEARING) {
    return CompatibilityLevel.COMPATIBLE; // Plateau meadows
  }

  // Incompatible combinations
  if (
    naturalType === NaturalFeatureType.CAVE_SYSTEM &&
    [ReliefFeatureType.VALLEY, ReliefFeatureType.BASIN].includes(reliefType)
  ) {
    return CompatibilityLevel.INCOMPATIBLE; // Caves don't form in valleys/basins
  }

  return CompatibilityLevel.NEUTRAL;
}

// Relief + Artificial compatibility rules
function getReliefArtificialCompatibility(f1: MapFeature, f2: MapFeature): CompatibilityLevel {
  const reliefFeature = f1.category === FeatureCategory.RELIEF ? f1 : f2;
  const artificialFeature = f1.category === FeatureCategory.ARTIFICIAL ? f1 : f2;

  const reliefType = reliefFeature.type as ReliefFeatureType;
  const artificialType = artificialFeature.type as ArtificialFeatureType;

  // Highly compatible combinations
  if (
    reliefType === ReliefFeatureType.MOUNTAIN &&
    artificialType === ArtificialFeatureType.FORTIFICATION
  ) {
    return CompatibilityLevel.SYNERGISTIC; // Mountain fortresses
  }
  if (reliefType === ReliefFeatureType.HILL && artificialType === ArtificialFeatureType.TOWER) {
    return CompatibilityLevel.SYNERGISTIC; // Hilltop towers
  }

  // Compatible combinations
  if (
    reliefType === ReliefFeatureType.PLATEAU &&
    artificialType === ArtificialFeatureType.BUILDING_COMPLEX
  ) {
    return CompatibilityLevel.COMPATIBLE; // Plateau settlements
  }

  // Incompatible combinations
  if (
    reliefType === ReliefFeatureType.CLIFF &&
    [ArtificialFeatureType.ROAD_NETWORK, ArtificialFeatureType.BUILDING_COMPLEX].includes(
      artificialType,
    )
  ) {
    return CompatibilityLevel.INCOMPATIBLE; // Can't build roads/buildings on cliffs easily
  }

  return CompatibilityLevel.NEUTRAL;
}

// Natural + Artificial compatibility rules
function getNaturalArtificialCompatibility(f1: MapFeature, f2: MapFeature): CompatibilityLevel {
  const naturalFeature = f1.category === FeatureCategory.NATURAL ? f1 : f2;
  const artificialFeature = f1.category === FeatureCategory.ARTIFICIAL ? f1 : f2;

  const naturalType = naturalFeature.type as NaturalFeatureType;
  const artificialType = artificialFeature.type as ArtificialFeatureType;

  // Highly compatible combinations
  if (naturalType === NaturalFeatureType.RIVER && artificialType === ArtificialFeatureType.BRIDGE) {
    return CompatibilityLevel.SYNERGISTIC; // Bridges cross rivers
  }
  if (
    naturalType === NaturalFeatureType.CLEARING &&
    artificialType === ArtificialFeatureType.BUILDING_COMPLEX
  ) {
    return CompatibilityLevel.SYNERGISTIC; // Buildings in clearings
  }

  // Incompatible combinations
  if (
    [NaturalFeatureType.LAKE, NaturalFeatureType.POND, NaturalFeatureType.RIVER].includes(
      naturalType,
    ) &&
    [ArtificialFeatureType.BUILDING_COMPLEX, ArtificialFeatureType.WALL_SYSTEM].includes(
      artificialType,
    )
  ) {
    return CompatibilityLevel.INCOMPATIBLE; // Can't build in water
  }

  return CompatibilityLevel.NEUTRAL;
}

// Customize Relief + Natural interactions
function customizeReliefNaturalInteraction(
  f1: MapFeature,
  f2: MapFeature,
  interaction: FeatureInteraction,
): FeatureInteraction {
  const reliefFeature = f1.category === FeatureCategory.RELIEF ? f1 : f2;
  const naturalFeature = f1.category === FeatureCategory.NATURAL ? f1 : f2;

  const reliefType = reliefFeature.type as ReliefFeatureType;
  const naturalType = naturalFeature.type as NaturalFeatureType;

  // Forested mountains: Relief dominates height, natural dominates terrain
  if (
    reliefType === ReliefFeatureType.MOUNTAIN &&
    naturalType === NaturalFeatureType.FOREST
  ) {
    interaction.dominantFeature[InteractionAspect.TERRAIN] = naturalFeature.id;
    interaction.dominantFeature[InteractionAspect.HEIGHT] = reliefFeature.id;
    interaction.heightBlending = 'add'; // Forest adds to mountain height
    interaction.terrainModification = TerrainType.FOREST;
    interaction.movementModification = 3; // Difficult terrain
  }

  // Rivers in valleys: Natural dominates terrain, relief provides height context
  if (reliefType === ReliefFeatureType.VALLEY && naturalType === NaturalFeatureType.RIVER) {
    interaction.dominantFeature[InteractionAspect.TERRAIN] = naturalFeature.id;
    interaction.dominantFeature[InteractionAspect.HEIGHT] = reliefFeature.id;
    interaction.terrainModification = TerrainType.WATER;
    interaction.heightBlending = 'average';
  }

  return interaction;
}

// Customize Relief + Artificial interactions
function customizeReliefArtificialInteraction(
  f1: MapFeature,
  f2: MapFeature,
  interaction: FeatureInteraction,
): FeatureInteraction {
  const reliefFeature = f1.category === FeatureCategory.RELIEF ? f1 : f2;
  const artificialFeature = f1.category === FeatureCategory.ARTIFICIAL ? f1 : f2;

  const reliefType = reliefFeature.type as ReliefFeatureType;
  const artificialType = artificialFeature.type as ArtificialFeatureType;

  // Mountain fortresses: Artificial dominates terrain, relief provides height
  if (
    reliefType === ReliefFeatureType.MOUNTAIN &&
    artificialType === ArtificialFeatureType.FORTIFICATION
  ) {
    interaction.dominantFeature[InteractionAspect.TERRAIN] = artificialFeature.id;
    interaction.dominantFeature[InteractionAspect.HEIGHT] = reliefFeature.id;
    interaction.heightBlending = 'add'; // Fortification adds to mountain height
    interaction.terrainModification = TerrainType.WALL;
    interaction.specialProperties = { fortified: true, elevated: true };
  }

  return interaction;
}

// Customize Natural + Artificial interactions
function customizeNaturalArtificialInteraction(
  f1: MapFeature,
  f2: MapFeature,
  interaction: FeatureInteraction,
): FeatureInteraction {
  const naturalFeature = f1.category === FeatureCategory.NATURAL ? f1 : f2;
  const artificialFeature = f1.category === FeatureCategory.ARTIFICIAL ? f1 : f2;

  const naturalType = naturalFeature.type as NaturalFeatureType;
  const artificialType = artificialFeature.type as ArtificialFeatureType;

  // Bridges over rivers: Artificial dominates terrain and movement
  if (naturalType === NaturalFeatureType.RIVER && artificialType === ArtificialFeatureType.BRIDGE) {
    interaction.dominantFeature[InteractionAspect.TERRAIN] = artificialFeature.id;
    interaction.dominantFeature[InteractionAspect.MOVEMENT] = artificialFeature.id;
    interaction.terrainModification = TerrainType.ROAD;
    interaction.heightBlending = 'add'; // Bridge elevated above water
    interaction.specialProperties = { bridge: true, crossesWater: true };
  }

  return interaction;
}
