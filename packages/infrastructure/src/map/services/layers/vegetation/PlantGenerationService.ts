import { Injectable, Optional, Inject } from '@nestjs/common';
import {
  Plant,
  PlantSpecies,
  PlantSize,
  BiomeType,
  MoistureLevel,
  Seed,
  NoiseGenerator,
  VegetationConfig,
  TacticalMapContext,
  HydrologyLayerData,
  TopographyLayerData,
  TreePlant,
  ShrubPlant,
  HerbaceousPlant,
  GroundCoverPlant,
  SubTilePosition,
  PlantProperties,
  PlantGrowthForm,
  type ILogger
} from '@lazy-map/domain';

/**
 * Generates individual plants based on forest distribution and environmental conditions
 * Handles tree placement, understory vegetation, and ground cover
 */
@Injectable()
export class PlantGenerationService {
  constructor(
    @Optional() @Inject('ILogger') private readonly logger?: ILogger
  ) {}

  /**
   * Distribute individual plants based on conditions
   */
  distributeVegetation(
    forestDistribution: boolean[][],
    potential: number[][],
    hydrology: HydrologyLayerData,
    topography: TopographyLayerData,
    context: TacticalMapContext,
    seed: Seed,
    config: VegetationConfig,
    width: number,
    height: number
  ): Plant[][][] {
    const plants: Plant[][][] = [];
    const plantNoise = NoiseGenerator.create(seed.getValue() * 9);

    // Get probabilities from config
    const treeProbability = config.getTreeProbability();
    const understoryProbability = config.getUnderstoryProbability();

    // Diagnostic: Count forest tiles
    let forestTileCount = 0;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (forestDistribution[y][x]) forestTileCount++;
      }
    }
    this.logger?.info('Vegetation distribution', {
      metadata: {
        forestTiles: forestTileCount,
        totalTiles: width * height,
        forestPercent: (forestTileCount / (width * height) * 100).toFixed(1),
        treeProbability: (treeProbability * 100).toFixed(1) + '%',
        expectedTrees: Math.round(forestTileCount * treeProbability)
      }
    });

    for (let y = 0; y < height; y++) {
      plants[y] = [];
      for (let x = 0; x < width; x++) {
        plants[y][x] = [];

        // Skip water tiles
        if (hydrology.tiles[y][x].waterDepth > 1) continue;

        const isForest = forestDistribution[y][x];
        const growthPotential = potential[y][x];
        const moisture = hydrology.tiles[y][x].moisture;

        if (isForest) {
          // Forest tile - probability-based tree placement
          // Use deterministic hash-based random for proper probability distribution
          const tileHash = Math.abs((x * 374761393 + y * 668265263 + seed.getValue()) % 1000000) / 1000000;
          if (tileHash < treeProbability) {
            // Place EXACTLY ONE tree (realistic for 5x5ft tile)
            const species = this.selectTreeSpecies(context.biome, moisture, seed.getValue() + x + y);
            const size = this.selectPlantSize(species, growthPotential, seed.getValue());
            plants[y][x].push(this.createTree(species, size, x, y, 0));
          }

          // Add understory (shrubs and bushes)
          const shrubHash = Math.abs((x * 668265263 + y * 374761393 + seed.getValue() * 2) % 1000000) / 1000000;
          if (shrubHash < understoryProbability) {
            const shrubSpecies = this.selectShrubSpecies(context.biome, moisture, seed.getValue() + x * y);
            plants[y][x].push(this.createShrub(shrubSpecies, PlantSize.MEDIUM, x, y, 0));
          }
        } else if (growthPotential > 0.2) {
          // Non-forest with growth potential
          const vegetationType = this.selectNonForestVegetation(
            moisture,
            topography.tiles[y][x].slope,
            context.biome,
            plantNoise.generateAt(x * 0.2, y * 0.2)
          );

          if (vegetationType === 'shrub') {
            const species = this.selectShrubSpecies(context.biome, moisture, seed.getValue() + x + y);
            plants[y][x].push(this.createShrub(species, PlantSize.SMALL, x, y, 0));
          } else if (vegetationType === 'grass') {
            plants[y][x].push(this.createHerbaceous(PlantSpecies.FERN, PlantSize.SMALL, x, y, 0));
          }
        }

        // Always add ground cover in suitable areas
        if (growthPotential > 0.1 && hydrology.tiles[y][x].waterDepth === 0) {
          plants[y][x].push(this.createGroundCover(PlantSpecies.MOSS, PlantSize.TINY, x, y, 0));
        }
      }
    }

    return plants;
  }

  /**
   * Select appropriate tree species
   */
  selectTreeSpecies(biome: BiomeType, moisture: MoistureLevel, seed: number): PlantSpecies {
    const random = (seed % 100) / 100;

    if (biome === BiomeType.FOREST) {
      if (moisture === MoistureLevel.WET) {
        return random < 0.5 ? PlantSpecies.WILLOW : PlantSpecies.OAK;
      }
      return random < 0.5 ? PlantSpecies.OAK : PlantSpecies.PINE;
    } else if (biome === BiomeType.MOUNTAIN) {
      return random < 0.7 ? PlantSpecies.PINE : PlantSpecies.OAK;
    } else if (biome === BiomeType.SWAMP) {
      return PlantSpecies.WILLOW;
    }
    return PlantSpecies.OAK;
  }

  /**
   * Select appropriate shrub species
   */
  selectShrubSpecies(biome: BiomeType, moisture: MoistureLevel, seed: number): PlantSpecies {
    const random = (seed % 100) / 100;

    if (moisture === MoistureLevel.ARID || moisture === MoistureLevel.DRY) {
      return PlantSpecies.HAZEL;
    }
    return random < 0.5 ? PlantSpecies.ELDERBERRY : PlantSpecies.FERN;
  }

  /**
   * Select plant size based on conditions
   */
  selectPlantSize(species: PlantSpecies, growthPotential: number, seed: number): PlantSize {
    const random = (seed % 100) / 100;
    const sizeValue = random * growthPotential;

    if (sizeValue > 0.8) return PlantSize.HUGE;
    if (sizeValue > 0.6) return PlantSize.LARGE;
    if (sizeValue > 0.4) return PlantSize.MEDIUM;
    if (sizeValue > 0.2) return PlantSize.SMALL;
    return PlantSize.TINY;
  }

  /**
   * Select non-forest vegetation type
   */
  selectNonForestVegetation(
    moisture: MoistureLevel,
    slope: number,
    biome: BiomeType,
    random: number
  ): 'shrub' | 'grass' | 'none' {
    if (moisture === MoistureLevel.ARID) return 'none';

    if (slope > 40) {
      return random > 0.7 ? 'shrub' : 'grass';
    }

    if (biome === BiomeType.PLAINS) {
      return random > 0.8 ? 'shrub' : 'grass';
    }

    return random > 0.5 ? 'shrub' : 'grass';
  }

  /**
   * Helper method to create a tree with all required parameters
   */
  private createTree(species: PlantSpecies, size: PlantSize, x: number, y: number, index: number): TreePlant {
    const id = `tree-${x}-${y}-${index}`;
    const position = new SubTilePosition(x, y, Math.random(), Math.random());
    const properties: PlantProperties = {
      maxHeight: 30,
      maxWidth: 20,
      growthRate: 0.5,
      foliageColor: ['green'],
      soilPreference: ['loam'],
      lightRequirement: 'partial_shade',
      waterRequirement: 'medium',
      hardiness: 5
    };
    const trunkDiameter = size === PlantSize.TINY ? 0.1 :
                          size === PlantSize.SMALL ? 0.2 :
                          size === PlantSize.MEDIUM ? 0.5 :
                          size === PlantSize.LARGE ? 1.0 :
                          size === PlantSize.HUGE ? 2.0 : 3.0;

    return new TreePlant(id, species, position, size, 1.0, 1, properties, trunkDiameter, 0.7, false);
  }

  /**
   * Helper method to create a shrub with all required parameters
   */
  private createShrub(species: PlantSpecies, size: PlantSize, x: number, y: number, index: number): ShrubPlant {
    const id = `shrub-${x}-${y}-${index}`;
    const position = new SubTilePosition(x, y, Math.random(), Math.random());
    const properties: PlantProperties = {
      maxHeight: 5,
      maxWidth: 4,
      growthRate: 0.6,
      foliageColor: ['green'],
      soilPreference: ['loam', 'sandy'],
      lightRequirement: 'partial_shade',
      waterRequirement: 'medium',
      hardiness: 4
    };

    return new ShrubPlant(id, species, position, size, 1.0, 1, properties, 3);
  }

  /**
   * Helper method to create herbaceous plant with all required parameters
   */
  private createHerbaceous(species: PlantSpecies, size: PlantSize, x: number, y: number, index: number): HerbaceousPlant {
    const id = `herb-${x}-${y}-${index}`;
    const position = new SubTilePosition(x, y, Math.random(), Math.random());
    const properties: PlantProperties = {
      maxHeight: 2,
      maxWidth: 1,
      growthRate: 0.8,
      foliageColor: ['green'],
      soilPreference: ['any'],
      lightRequirement: 'partial_shade',
      waterRequirement: 'low',
      hardiness: 3
    };

    // HerbaceousPlant needs growthForm parameter
    const growthForm = species === PlantSpecies.FERN ? PlantGrowthForm.FERN : PlantGrowthForm.HERB;
    return new HerbaceousPlant(id, species, growthForm, position, size, 1.0, 1, properties, 1);
  }

  /**
   * Helper method to create ground cover with all required parameters
   */
  private createGroundCover(species: PlantSpecies, size: PlantSize, x: number, y: number, index: number): GroundCoverPlant {
    const id = `ground-${x}-${y}-${index}`;
    const position = new SubTilePosition(x, y, Math.random(), Math.random());
    const properties: PlantProperties = {
      maxHeight: 0.2,
      maxWidth: 2,
      growthRate: 0.9,
      foliageColor: ['green'],
      soilPreference: ['any'],
      lightRequirement: 'full_shade',
      waterRequirement: 'low',
      hardiness: 5
    };

    // GroundCoverPlant doesn't take size - it's always TINY
    return new GroundCoverPlant(id, species, position, 1.0, 1, properties, 0.8);
  }
}
