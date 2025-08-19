import { FeatureArea } from '../../../common/value-objects/FeatureArea';
import { Forest, Grassland, GrasslandType } from '../entities';
import { Plant, PlantSpecies, PlantCategory } from '../entities/Plant';
import { IRandomGenerator } from '../../../common/interfaces/IRandomGenerator';

/**
 * Biome types that influence vegetation generation
 */
export enum BiomeType {
  TEMPERATE_FOREST = 'temperate_forest',
  TROPICAL_RAINFOREST = 'tropical_rainforest',
  BOREAL_FOREST = 'boreal_forest',
  TEMPERATE_GRASSLAND = 'temperate_grassland',
  TROPICAL_GRASSLAND = 'tropical_grassland',
  DESERT = 'desert',
  TUNDRA = 'tundra',
  WETLAND = 'wetland',
  MEDITERRANEAN = 'mediterranean',
  ALPINE = 'alpine'
}

/**
 * Enhanced forest generation settings
 */
export interface EnhancedForestGenerationSettings {
  // Basic forest properties
  treeDensity: number;
  treeClumping: number;
  allowTreeOverlap: boolean;
  enableInosculation: boolean;
  preferredTreeSpecies: PlantSpecies[];
  
  // Understory vegetation
  generateUnderstory: boolean;
  understoryDensity: number;
  shrubDensity: number;
  fernDensity: number;
  flowerDensity: number;
  mossCoverage: number;
  
  // Diversity settings
  speciesDiversity: number; // 0-1, higher means more species variety
  ageVariation: number; // 0-1, variation in tree ages
  naturalDisturbance: number; // 0-1, creates gaps and dead trees
  
  // Size distribution
  saplingChance: number;
  youngChance: number;
  matureChance: number;
  ancientChance: number;
  
  // Environmental factors
  soilFertility: number;
  moisture: number;
  lightLevel: number; // Affected by canopy density
  
  // Special features
  hasVines: boolean;
  vineChance: number;
  hasDeadFalls: boolean;
  clearingChance: number; // Chance for natural clearings
}

/**
 * Grassland generation settings
 */
export interface GrasslandGenerationSettings {
  grasslandType: GrasslandType;
  
  // Basic properties
  grassDensity: number;
  averageHeight: number;
  plantDiversity: number;
  
  // Plant composition (percentages should sum to ~1.0)
  grassPercentage: number;
  wildflowerPercentage: number;
  fernPercentage: number;
  shrubPercentage: number;
  mossPercentage: number;
  
  // Species preferences
  preferredGrassSpecies: PlantSpecies[];
  preferredFlowerSpecies: PlantSpecies[];
  preferredShrubSpecies: PlantSpecies[];
  
  // Environmental factors
  soilMoisture: number; // 0-1
  soilFertility: number; // 0-1
  drainageQuality: number; // 0-1, affects wetland plants
  windExposure: number; // 0-1, affects plant height and form
  
  // Seasonal variation
  enableSeasonalChanges: boolean;
  bloomingSeasons: string[]; // When flowers bloom
  dormantSeason?: string; // When plants go dormant
  
  // Distribution patterns
  clumpingFactor: number; // How clustered plants are
  patchVariation: number; // Creates patches of different plant types
  edgeVariation: number; // Variation at grassland edges
  
  // Special features
  hasRareSpecies: boolean;
  rareSpeciesChance: number;
  hasInsectPaths: boolean; // Creates natural pathways
  pathDensity: number;
}


/**
 * Vegetation generation result
 */
export interface VegetationGenerationResult {
  success: boolean;
  generatedPlants: number;
  speciesCount: number;
  coveragePercentage: number;
  biodiversityIndex: number;
  warnings?: string[];
  error?: string;
}

/**
 * Service interface for generating diverse vegetation
 */
export interface IVegetationGenerationService {
  /**
   * Generate an enhanced forest with diverse plant life
   */
  generateEnhancedForest(
    area: FeatureArea,
    settings: EnhancedForestGenerationSettings,
    biome: BiomeType,
    randomGenerator: IRandomGenerator
  ): Promise<{ forest: Forest; result: VegetationGenerationResult }>;

  /**
   * Generate a grassland with various plant types
   */
  generateGrassland(
    area: FeatureArea,
    settings: GrasslandGenerationSettings,
    biome: BiomeType,
    randomGenerator: IRandomGenerator
  ): Promise<{ grassland: Grassland; result: VegetationGenerationResult }>;

  /**
   * Generate understory vegetation for existing forest
   */
  generateUnderstoryVegetation(
    forest: Forest,
    settings: Partial<EnhancedForestGenerationSettings>,
    randomGenerator: IRandomGenerator
  ): Promise<Plant[]>;

  /**
   * Generate transition zone between different vegetation types
   */
  generateTransitionZone(
    area: FeatureArea,
    fromBiome: BiomeType,
    toBiome: BiomeType,
    transitionWidth: number,
    randomGenerator: IRandomGenerator
  ): Promise<Plant[]>;

  /**
   * Get appropriate plant species for a biome
   */
  getSpeciesForBiome(biome: BiomeType, category?: PlantCategory): PlantSpecies[];

  /**
   * Get default settings for a biome and vegetation type
   */
  getDefaultForestSettings(biome: BiomeType): EnhancedForestGenerationSettings;
  getDefaultGrasslandSettings(biome: BiomeType): GrasslandGenerationSettings;

  /**
   * Validate vegetation generation settings
   */
  validateForestSettings(settings: EnhancedForestGenerationSettings): string[];
  validateGrasslandSettings(settings: GrasslandGenerationSettings): string[];

  /**
   * Calculate plant interactions and competition
   */
  calculatePlantInteractions(plants: Plant[]): void;

  /**
   * Apply seasonal changes to vegetation
   */
  applySeasonalChanges(
    plants: Plant[],
    season: 'spring' | 'summer' | 'autumn' | 'winter',
    biome: BiomeType
  ): void;

  /**
   * Generate plant properties based on species and environment
   */
  generatePlantProperties(
    species: PlantSpecies,
    environmentalFactors: {
      soilFertility: number;
      moisture: number;
      lightLevel: number;
      temperature: number;
    }
  ): any; // PlantProperties, but avoiding import here

  /**
   * Calculate optimal plant density for an area
   */
  calculateOptimalPlantDensity(
    area: FeatureArea,
    vegetationType: 'forest' | 'grassland',
    biome: BiomeType
  ): number;
}