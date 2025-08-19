import { TerrainType } from '@lazy-map/domain';
import { TreeType } from '@lazy-map/domain';
import { MapGenerationSettings } from './types';

// Default map generation settings
export const DEFAULT_MAP_SETTINGS: MapGenerationSettings = {
  dimensions: { width: 20, height: 20 },
  cellSize: 32,
  terrainDistribution: {
    [TerrainType.GRASS]: 0.4,
    [TerrainType.FOREST]: 0.2,
    [TerrainType.MOUNTAIN]: 0.1,
    [TerrainType.WATER]: 0.1,
    [TerrainType.DESERT]: 0.05,
    [TerrainType.ROAD]: 0.1,
    [TerrainType.BUILDING]: 0.05,
  },
  elevationVariance: 0.3,
  elevationMultiplier: 1.0, // Base multiplier for elevation heights
  addHeightNoise: false, // Don't add noise by default
  heightVariance: 0.2, // Controls variation in height multipliers (only when addHeightNoise is true)
  inclinationChance: 0.3, // 30% chance for a tile to have inclination
  generateRivers: true,
  generateRoads: true,
  generateBuildings: true,
  biomeType: 'temperate' as const,

  // Feature generation settings
  featureSettings: {
    generateRelief: true, // Generate landforms/elevation features
    generateNatural: true, // Generate water, vegetation features
    generateArtificial: true, // Generate man-made structures
    generateCultural: false, // Less common by default

    allowOutOfBounds: true,
    outOfBoundsExtension: 5, // 5 tiles beyond map edge

    reliefDensity: 0.3, // 30% chance for relief features
    naturalDensity: 0.4, // 40% chance for natural features
    artificialDensity: 0.2, // 20% chance for artificial features
    culturalDensity: 0.1, // 10% chance for cultural features

    minFeatureSize: 4, // At least 2x2 tiles
    maxFeatureSize: 64, // Up to 8x8 tiles

    // Feature mixing settings
    enableFeatureMixing: true, // Enable feature blending
    mixingProbability: 0.7, // 70% chance features mix when overlapping
    maxMixingDepth: 3, // Up to 3 features can mix on one tile

    // Forest generation settings
    forestSettings: {
      enabled: true,
      
      // Forest placement
      forestDensity: 0.3,              // 30% chance of forest patches
      minForestSize: 9,                // Minimum 3x3 tiles per forest
      maxForestSize: 100,              // Maximum 10x10 tiles per forest
      
      // Tree distribution within forests
      treeDensity: 0.6,                // 60% tree density per tile
      treeClumping: 0.7,               // 70% clumping (trees cluster together)
      speciesVariation: 0.5,           // 50% species variety
      
      // Tree characteristics
      allowTreeOverlap: true,          // Trees can share space naturally
      maxOverlapDistance: 1.5,         // Trees within 1.5 tiles can interact
      overlapProbability: 0.4,         // 40% chance of trees growing close
      
      // Size distribution (should sum to ~1.0)
      saplingChance: 0.15,             // 15% saplings
      youngChance: 0.35,               // 35% young trees
      matureChance: 0.4,               // 40% mature trees
      ancientChance: 0.1,              // 10% ancient trees
      
      // Natural growth patterns
      enableInosculation: true,        // Trees can graft together
      inosculationChance: 0.1,         // 10% chance when trees are close
      enableNaturalVariation: true,    // Random health, lean, etc.
      
      // Biome influence
      biomeTypeInfluence: true,        // Adapt tree types to biome
      preferredSpecies: [              // Default temperate forest species
        TreeType.OAK,
        TreeType.MAPLE,
        TreeType.BIRCH,
      ],
    },
  },
};
