// No imports needed for this file currently

// Feature classification system
export enum FeatureCategory {
  RELIEF = 'relief', // Landforms and elevation features
  NATURAL = 'natural', // Natural features (water, vegetation)
  ARTIFICIAL = 'artificial', // Man-made structures
  CULTURAL = 'cultural', // Boundaries, territories, cultural areas
}

// Relief/landform features (elevation-based terrain)
export enum ReliefFeatureType {
  MOUNTAIN = 'mountain',
  HILL = 'hill',
  VALLEY = 'valley',
  BASIN = 'basin',
  RIDGE = 'ridge',
  PLATEAU = 'plateau',
  CLIFF = 'cliff',
  CANYON = 'canyon',
  DEPRESSION = 'depression',
}

// Natural features
export enum NaturalFeatureType {
  RIVER = 'river',
  LAKE = 'lake',
  POND = 'pond',
  STREAM = 'stream',
  FOREST = 'forest', // Changed from FOREST_GROVE for clarity
  CLEARING = 'clearing',
  WETLAND = 'wetland',
  OASIS = 'oasis',
  CAVE_SYSTEM = 'cave_system',
}

// Artificial/man-made features
export enum ArtificialFeatureType {
  ROAD_NETWORK = 'road_network',
  BRIDGE = 'bridge',
  WALL_SYSTEM = 'wall_system',
  BUILDING_COMPLEX = 'building_complex',
  TOWER = 'tower',
  FORTIFICATION = 'fortification',
  QUARRY = 'quarry',
  MINE = 'mine',
  CANAL = 'canal',
}

// Cultural/boundary features
export enum CulturalFeatureType {
  TERRITORY_BOUNDARY = 'territory_boundary',
  TRADE_ROUTE = 'trade_route',
  SETTLEMENT_AREA = 'settlement_area',
  SACRED_SITE = 'sacred_site',
  BATTLEFIELD = 'battlefield',
  BORDER_CROSSING = 'border_crossing',
}

// Import and re-export SpatialBounds from common value objects
import { SpatialBounds } from '../../../common/value-objects/SpatialBounds';
export { SpatialBounds };

// Base feature interface
export interface MapFeature {
  id: string;
  name: string;
  category: FeatureCategory;
  type: ReliefFeatureType | NaturalFeatureType | ArtificialFeatureType | CulturalFeatureType;
  area: SpatialBounds;
  priority: number; // Higher priority features override lower priority ones
  properties: Record<string, any>;
}

// Feature generation settings
export interface FeatureGenerationSettings {
  generateRelief: boolean; // Generate landforms/elevation features
  generateNatural: boolean; // Generate water, vegetation features
  generateArtificial: boolean; // Generate man-made structures
  generateCultural: boolean; // Generate boundaries, territories

  // Allow features to extend beyond map boundaries
  allowOutOfBounds: boolean;
  outOfBoundsExtension: number; // How many tiles beyond map edge to consider

  // Feature density controls
  reliefDensity: number; // 0-1 probability for relief features
  naturalDensity: number; // 0-1 probability for natural features
  artificialDensity: number; // 0-1 probability for artificial features
  culturalDensity: number; // 0-1 probability for cultural features

  // Size controls
  minFeatureSize: number; // Minimum tiles per feature
  maxFeatureSize: number; // Maximum tiles per feature

  // Feature mixing controls
  enableFeatureMixing: boolean; // Allow features to blend together
  mixingProbability: number; // 0-1 probability of features mixing when they overlap
  maxMixingDepth: number; // Maximum number of features that can mix on one tile

  // Forest-specific generation settings
  forestSettings: ForestGenerationSettings;
}

// Tree types and characteristics
export enum TreeType {
  OAK = 'oak',
  PINE = 'pine',
  BIRCH = 'birch',
  MAPLE = 'maple',
  CEDAR = 'cedar',
  WILLOW = 'willow',
  FRUIT = 'fruit',
  DEAD = 'dead',
}

// Tree size categories
export enum TreeSize {
  SAPLING = 'sapling', // 0.1-0.3 tile diameter
  YOUNG = 'young', // 0.3-0.6 tile diameter
  MATURE = 'mature', // 0.6-1.2 tile diameter
  ANCIENT = 'ancient', // 1.0-2.0 tile diameter
}

// Position within a tile (sub-tile positioning)
export interface SubTilePosition {
  tileX: number; // Integer tile coordinate
  tileY: number; // Integer tile coordinate
  offsetX: number; // 0.0-1.0 position within tile
  offsetY: number; // 0.0-1.0 position within tile
}

// Individual tree instance
export interface Tree {
  id: string;
  type: TreeType;
  size: TreeSize;
  position: SubTilePosition;
  diameter: number; // Actual diameter in tile units (can exceed 1.0)
  height: number; // Tree height for visual representation
  health: number; // 0.0-1.0, affects appearance and interaction
  age: number; // Tree age in arbitrary units
  canopyDensity: number; // 0.0-1.0, affects light blocking and movement
  properties: {
    hasVines?: boolean;
    hasDeadBranches?: boolean;
    leanAngle?: number; // Tree lean in degrees
    trunkThickness?: number;
    seasonalColor?: string;
    inosculated?: string[]; // IDs of trees this one is grafted with
  };
}

// Forest generation settings
export interface ForestGenerationSettings {
  enabled: boolean;

  // Forest placement
  forestDensity: number; // 0.0-1.0 probability of forest patches
  minForestSize: number; // Minimum tiles per forest
  maxForestSize: number; // Maximum tiles per forest

  // Tree distribution within forests
  treeDensity: number; // 0.0-1.0 base tree density per tile
  treeClumping: number; // 0.0-1.0 how much trees cluster together
  speciesVariation: number; // 0.0-1.0 variety of tree types

  // Tree characteristics
  allowTreeOverlap: boolean; // Trees can share space
  maxOverlapDistance: number; // Maximum distance for tree interaction
  overlapProbability: number; // 0.0-1.0 chance of trees growing close

  // Size distribution (percentages should sum to ~1.0)
  saplingChance: number; // Chance of sapling trees
  youngChance: number; // Chance of young trees
  matureChance: number; // Chance of mature trees
  ancientChance: number; // Chance of ancient trees

  // Natural growth patterns
  enableInosculation: boolean; // Trees can graft together
  inosculationChance: number; // 0.0-1.0 probability when trees are close
  enableNaturalVariation: boolean; // Random health, lean, etc.

  // Biome influence
  biomeTypeInfluence: boolean; // Adapt tree types to biome
  preferredSpecies: TreeType[]; // Species more likely in this biome
}
