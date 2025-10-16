import { Forest } from '../entities/Forest';
import { SpatialBounds, Seed } from '../../../common/value-objects';
import { PlantSpecies } from '../entities/Plant';

/**
 * Forest generation settings for controlling tree placement and characteristics
 */
export interface ForestGenerationSettings {
  enabled: boolean;

  // Tree distribution within forests
  treeDensity: number; // 0.0-1.0 base tree density per tile
  treeClumping: number; // 0.0-1.0 how much trees cluster together
  speciesVariation: number; // 0.0-1.0 variety of tree types

  // Tree characteristics
  maxOverlapDistance: number; // Maximum distance for tree interaction

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
  preferredSpecies: PlantSpecies[]; // Species more likely in this biome
}

/**
 * Domain service interface for forest generation
 * Implementations handle the complex algorithms for creating forests
 */
export interface IForestGenerationService {
  /**
   * Generate a forest with trees based on provided settings
   * @param name - Name of the forest
   * @param area - Spatial bounds of the forest
   * @param settings - Generation settings controlling tree placement
   * @param seed - Optional seed for deterministic generation
   * @returns Generated forest entity with trees
   */
  generateForest(
    name: string,
    area: SpatialBounds,
    settings: ForestGenerationSettings,
    seed?: Seed
  ): Promise<Forest>;
}