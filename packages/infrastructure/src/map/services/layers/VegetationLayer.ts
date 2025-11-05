import {
  TacticalMapContext,
  Seed,
  NoiseGenerator,
  BiomeType,
  MoistureLevel,
  TreePlant,
  ShrubPlant,
  HerbaceousPlant,
  GroundCoverPlant,
  Plant,
  PlantSpecies,
  PlantSize,
  SubTilePosition,
  PlantProperties,
  PlantGrowthForm,
  MapGenerationErrors,
  type ILogger,
  // Import from domain layer service interfaces
  IVegetationLayerService,
  VegetationLayerData,
  VegetationTileData,
  VegetationType,
  ForestPatch,
  GeologyLayerData,
  TopographyLayerData,
  HydrologyLayerData
} from '@lazy-map/domain';

/**
 * Generates vegetation patterns based on moisture, elevation, and soil
 * Creates realistic plant distributions for tactical combat
 */
export class VegetationLayer implements IVegetationLayerService {
  private width: number = 0;
  private height: number = 0;
  private logger?: ILogger;

  constructor(logger?: ILogger) {
    this.logger = logger;
  }

  /**
   * Generate vegetation layer from environmental conditions
   */
  async generate(
    hydrology: HydrologyLayerData,
    topography: TopographyLayerData,
    geology: GeologyLayerData,
    context: TacticalMapContext,
    seed: Seed
  ): Promise<VegetationLayerData> {
    this.width = hydrology.tiles[0].length;
    this.height = hydrology.tiles.length;

    // 1. Determine base vegetation potential
    const vegetationPotential = this.calculateVegetationPotential(
      hydrology,
      topography,
      geology,
      context
    );

    // 2. Generate forest patches using cellular automata
    const forestDistribution = this.generateForestPatches(
      vegetationPotential,
      context,
      seed
    );

    // 3. Place individual plants based on local conditions
    const plantDistribution = this.distributeVegetation(
      forestDistribution,
      vegetationPotential,
      hydrology,
      topography,
      context,
      seed
    );

    // 4. Identify clearings and meadows
    const clearings = this.identifyClearings(plantDistribution);

    // 5. Calculate tactical properties
    const tacticalProperties = this.calculateTacticalProperties(plantDistribution, hydrology);

    // 6. Create tile data
    const tiles = this.createTileData(
      plantDistribution,
      tacticalProperties,
      hydrology
    );

    // 7. Extract forest patches for visualization
    const forestPatches = this.extractForestPatches(tiles);

    // 8. Calculate statistics
    const stats = this.calculateStatistics(tiles);

    return {
      tiles,
      forestPatches,
      clearings,
      totalTreeCount: stats.treeCount,
      averageCanopyCoverage: stats.avgCanopy
    };
  }

  /**
   * Calculate vegetation growth potential for each tile
   */
  private calculateVegetationPotential(
    hydrology: HydrologyLayerData,
    topography: TopographyLayerData,
    geology: GeologyLayerData,
    context: TacticalMapContext
  ): number[][] {
    const potential: number[][] = [];

    for (let y = 0; y < this.height; y++) {
      potential[y] = [];
      for (let x = 0; x < this.width; x++) {
        const moisture = hydrology.tiles[y][x].moisture;
        const slope = topography.tiles[y][x].slope;
        const elevation = topography.tiles[y][x].elevation;
        const soilDepth = geology.tiles[y][x].soilDepth;

        // Base potential from biome
        let value = this.getBiomePotential(context.biome);

        // Moisture is critical
        value *= this.getMoistureFactor(moisture);

        // Slope affects growth
        if (slope > 60) value *= 0.1; // Very steep
        else if (slope > 40) value *= 0.3;
        else if (slope > 20) value *= 0.7;

        // Soil depth matters
        if (soilDepth < 0.5) value *= 0.2; // Bare rock
        else if (soilDepth < 2) value *= 0.6;

        // Elevation zones
        if (context.elevation === 'alpine' && elevation > 60) {
          value *= 0.3; // Tree line effects
        }

        potential[y][x] = Math.max(0, Math.min(1, value));
      }
    }

    return potential;
  }

  /**
   * Get base vegetation potential for biome
   */
  private getBiomePotential(biome: BiomeType): number {
    switch (biome) {
      case BiomeType.FOREST:
        return 1.0;
      case BiomeType.PLAINS:
        return 0.4;
      case BiomeType.DESERT:
        return 0.1;
      case BiomeType.SWAMP:
        return 0.8;
      case BiomeType.MOUNTAIN:
        return 0.5;
      case BiomeType.COASTAL:
        return 0.6;
      default:
        return 0.5;
    }
  }

  /**
   * Get moisture growth factor
   */
  private getMoistureFactor(moisture: MoistureLevel): number {
    switch (moisture) {
      case MoistureLevel.SATURATED:
        return 0.7; // Too wet for most trees
      case MoistureLevel.WET:
        return 1.0;
      case MoistureLevel.MOIST:
        return 0.9;
      case MoistureLevel.MODERATE:
        return 0.7;
      case MoistureLevel.DRY:
        return 0.3;
      case MoistureLevel.ARID:
        return 0.1;
      default:
        return 0.5;
    }
  }

  /**
   * Generate forest patches using cellular automata
   */
  private generateForestPatches(
    potential: number[][],
    context: TacticalMapContext,
    seed: Seed
  ): boolean[][] {
    const forest: boolean[][] = [];
    const forestNoise = NoiseGenerator.create(seed.getValue() * 8);

    // Initialize with noise-based seeding
    for (let y = 0; y < this.height; y++) {
      forest[y] = [];
      for (let x = 0; x < this.width; x++) {
        const noise = forestNoise.generateAt(x * 0.1, y * 0.1);
        const threshold = 0.5 - potential[y][x] * 0.3;
        forest[y][x] = noise > threshold && potential[y][x] > 0.3;
      }
    }

    // Apply cellular automata for natural clustering
    for (let i = 0; i < 3; i++) {
      forest.forEach((row, y) => {
        row.forEach((_, x) => {
          const neighbors = this.countForestNeighbors(forest, x, y);
          if (neighbors >= 5) {
            forest[y][x] = true;
          } else if (neighbors <= 2) {
            forest[y][x] = false;
          }
        });
      });
    }

    return forest;
  }

  /**
   * Count neighboring forest tiles
   */
  private countForestNeighbors(forest: boolean[][], x: number, y: number): number {
    let count = 0;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height) {
          if (forest[ny][nx]) count++;
        }
      }
    }
    return count;
  }

  /**
   * Distribute individual plants based on conditions
   */
  private distributeVegetation(
    forestDistribution: boolean[][],
    potential: number[][],
    hydrology: HydrologyLayerData,
    topography: TopographyLayerData,
    context: TacticalMapContext,
    seed: Seed
  ): Plant[][][] {
    const plants: Plant[][][] = [];
    const plantNoise = NoiseGenerator.create(seed.getValue() * 9);

    for (let y = 0; y < this.height; y++) {
      plants[y] = [];
      for (let x = 0; x < this.width; x++) {
        plants[y][x] = [];

        // Skip water tiles
        if (hydrology.tiles[y][x].waterDepth > 1) continue;

        const isForest = forestDistribution[y][x];
        const growthPotential = potential[y][x];
        const moisture = hydrology.tiles[y][x].moisture;

        if (isForest) {
          // Forest tile - add trees
          const treeCount = Math.floor(1 + plantNoise.generateAt(x * 0.5, y * 0.5) * 2);
          for (let i = 0; i < treeCount; i++) {
            const species = this.selectTreeSpecies(context.biome, moisture, seed.getValue() + x + y + i);
            const size = this.selectPlantSize(species, growthPotential, seed.getValue() + i);
            plants[y][x].push(this.createTree(species, size, x, y, i));
          }

          // Add understory
          const shrubChance = plantNoise.generateAt(x * 0.3, y * 0.3);
          if (shrubChance > 0.6) {
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
  private selectTreeSpecies(biome: BiomeType, moisture: MoistureLevel, seed: number): PlantSpecies {
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
  private selectShrubSpecies(biome: BiomeType, moisture: MoistureLevel, seed: number): PlantSpecies {
    const random = (seed % 100) / 100;

    if (moisture === MoistureLevel.ARID || moisture === MoistureLevel.DRY) {
      return PlantSpecies.HAZEL;
    }
    return random < 0.5 ? PlantSpecies.ELDERBERRY : PlantSpecies.FERN;
  }

  /**
   * Select plant size based on conditions
   */
  private selectPlantSize(species: PlantSpecies, growthPotential: number, seed: number): PlantSize {
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
  private selectNonForestVegetation(
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
   * Identify natural clearings
   */
  private identifyClearings(plants: Plant[][][]): { x: number; y: number; radius: number }[] {
    const clearings: { x: number; y: number; radius: number }[] = [];
    const visited: boolean[][] = [];

    for (let y = 0; y < this.height; y++) {
      visited[y] = new Array(this.width).fill(false);
    }

    for (let y = 2; y < this.height - 2; y++) {
      for (let x = 2; x < this.width - 2; x++) {
        if (visited[y][x]) continue;

        // Check if this could be center of clearing
        if (this.isClearingCenter(plants, x, y)) {
          const radius = this.measureClearingRadius(plants, x, y);
          if (radius >= 2) {
            clearings.push({ x, y, radius });
            // Mark area as visited
            for (let dy = -radius; dy <= radius; dy++) {
              for (let dx = -radius; dx <= radius; dx++) {
                const nx = x + dx;
                const ny = y + dy;
                if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height) {
                  visited[ny][nx] = true;
                }
              }
            }
          }
        }
      }
    }

    return clearings;
  }

  /**
   * Check if position could be clearing center
   */
  private isClearingCenter(plants: Plant[][][], x: number, y: number): boolean {
    // No trees in center
    const hasTree = plants[y][x].some(p => p instanceof TreePlant);
    if (hasTree) return false;

    // Check surrounding has some trees
    let treeCount = 0;
    for (let dy = -3; dy <= 3; dy++) {
      for (let dx = -3; dx <= 3; dx++) {
        if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height) {
          if (plants[ny][nx].some(p => p instanceof TreePlant)) {
            treeCount++;
          }
        }
      }
    }

    return treeCount >= 5;
  }

  /**
   * Measure clearing radius
   */
  private measureClearingRadius(plants: Plant[][][], cx: number, cy: number): number {
    let radius = 1;

    while (radius < 5) {
      for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
        const x = Math.round(cx + Math.cos(angle) * radius);
        const y = Math.round(cy + Math.sin(angle) * radius);

        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
          return radius - 1;
        }

        if (plants[y][x].some(p => p instanceof TreePlant)) {
          return radius - 1;
        }
      }
      radius++;
    }

    return radius;
  }

  /**
   * Calculate tactical properties for vegetation
   */
  private calculateTacticalProperties(
    plants: Plant[][][],
    hydrology: HydrologyLayerData
  ): { canopyHeight: number[][]; canopyDensity: number[][]; vegetationType: VegetationType[][] } {
    const canopyHeight: number[][] = [];
    const canopyDensity: number[][] = [];
    const vegetationType: VegetationType[][] = [];

    for (let y = 0; y < this.height; y++) {
      canopyHeight[y] = [];
      canopyDensity[y] = [];
      vegetationType[y] = [];

      for (let x = 0; x < this.width; x++) {
        const tilePlants = plants[y][x];

        // Calculate canopy height (tallest plant)
        let maxHeight = 0;
        let treeCount = 0;
        let shrubCount = 0;

        for (const plant of tilePlants) {
          const height = this.getPlantHeight(plant);
          maxHeight = Math.max(maxHeight, height);

          if (plant instanceof TreePlant) treeCount++;
          else if (plant instanceof ShrubPlant) shrubCount++;
        }

        canopyHeight[y][x] = maxHeight;

        // Calculate density
        if (treeCount > 0) {
          canopyDensity[y][x] = Math.min(1, treeCount * 0.4);
        } else if (shrubCount > 0) {
          canopyDensity[y][x] = Math.min(1, shrubCount * 0.3);
        } else {
          canopyDensity[y][x] = tilePlants.length > 0 ? 0.1 : 0;
        }

        // Determine vegetation type
        if (treeCount >= 2) {
          vegetationType[y][x] = VegetationType.DENSE_TREES;
        } else if (treeCount === 1) {
          vegetationType[y][x] = VegetationType.SPARSE_TREES;
        } else if (shrubCount > 0) {
          // Check for wetland vegetation based on moisture
          if (hydrology.tiles[y][x].moisture === 'saturated' ||
              hydrology.tiles[y][x].moisture === 'wet') {
            vegetationType[y][x] = VegetationType.UNDERGROWTH;
          } else {
            vegetationType[y][x] = VegetationType.SHRUBS;
          }
        } else if (tilePlants.length > 0) {
          vegetationType[y][x] = VegetationType.GRASS;
        } else {
          vegetationType[y][x] = VegetationType.NONE;
        }
      }
    }

    return { canopyHeight, canopyDensity, vegetationType };
  }

  /**
   * Get plant height in feet
   */
  private getPlantHeight(plant: Plant): number {
    const baseHeight = plant instanceof TreePlant ? 20 :
                      plant instanceof ShrubPlant ? 5 :
                      plant instanceof HerbaceousPlant ? 2 : 0.5;

    const sizeMultiplier = {
      [PlantSize.TINY]: 0.3,
      [PlantSize.SMALL]: 0.5,
      [PlantSize.MEDIUM]: 1.0,
      [PlantSize.LARGE]: 1.5,
      [PlantSize.HUGE]: 2.0,
      [PlantSize.MASSIVE]: 3.0
    };

    return baseHeight * sizeMultiplier[plant.size];
  }

  /**
   * Create tile data combining all vegetation properties
   */
  private createTileData(
    plants: Plant[][][],
    tacticalProps: { canopyHeight: number[][]; canopyDensity: number[][]; vegetationType: VegetationType[][] },
    hydrology: HydrologyLayerData
  ): VegetationTileData[][] {
    const tiles: VegetationTileData[][] = [];

    for (let y = 0; y < this.height; y++) {
      tiles[y] = [];
      for (let x = 0; x < this.width; x++) {
        const tilePlants = plants[y][x];
        const vegType = tacticalProps.vegetationType[y][x];

        // Determine dominant species
        let dominantSpecies: PlantSpecies | null = null;
        if (tilePlants.length > 0) {
          const speciesCount = new Map<PlantSpecies, number>();
          for (const plant of tilePlants) {
            const count = speciesCount.get(plant.species) || 0;
            speciesCount.set(plant.species, count + 1);
          }
          let maxCount = 0;
          speciesCount.forEach((count, species) => {
            if (count > maxCount) {
              maxCount = count;
              dominantSpecies = species;
            }
          });
        }

        // Calculate passability
        const isPassable = vegType !== VegetationType.DENSE_TREES &&
                          hydrology.tiles[y][x].waterDepth < 2;

        // Concealment and cover
        const providesConcealment = tacticalProps.canopyDensity[y][x] > 0.3 ||
                                   vegType === VegetationType.SHRUBS;
        const providesCover = vegType === VegetationType.DENSE_TREES ||
                             (vegType === VegetationType.SPARSE_TREES && tacticalProps.canopyHeight[y][x] > 15);

        tiles[y][x] = {
          canopyHeight: tacticalProps.canopyHeight[y][x],
          canopyDensity: tacticalProps.canopyDensity[y][x],
          vegetationType: vegType,
          dominantSpecies,
          plants: tilePlants,
          groundCover: tilePlants.some(p => p instanceof GroundCoverPlant) ? 0.8 : 0.2,
          isPassable,
          providesConcealment,
          providesCover
        };
      }
    }

    return tiles;
  }

  /**
   * Extract contiguous forest patches
   */
  private extractForestPatches(tiles: VegetationTileData[][]): ForestPatch[] {
    const patches: ForestPatch[] = [];
    const visited: boolean[][] = [];

    for (let y = 0; y < this.height; y++) {
      visited[y] = new Array(this.width).fill(false);
    }

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (!visited[y][x] &&
            (tiles[y][x].vegetationType === VegetationType.DENSE_TREES ||
             tiles[y][x].vegetationType === VegetationType.SPARSE_TREES)) {
          const patch = this.traceForestPatch(x, y, tiles, visited);
          if (patch.tiles.length >= 3) {
            patches.push(patch);
          }
        }
      }
    }

    return patches;
  }

  /**
   * Trace a contiguous forest patch
   */
  private traceForestPatch(
    startX: number,
    startY: number,
    tiles: VegetationTileData[][],
    visited: boolean[][]
  ): ForestPatch {
    const patchTiles: { x: number; y: number }[] = [];
    const queue: { x: number; y: number }[] = [{ x: startX, y: startY }];
    visited[startY][startX] = true;

    let coniferCount = 0;
    let deciduousCount = 0;
    let totalDensity = 0;

    while (queue.length > 0) {
      const { x, y } = queue.shift()!;
      patchTiles.push({ x, y });

      // Track forest composition
      const tilePlants = tiles[y][x].plants;
      for (const plant of tilePlants) {
        if (plant instanceof TreePlant) {
          if (plant.species === PlantSpecies.PINE) coniferCount++;
          else deciduousCount++;
        }
      }
      totalDensity += tiles[y][x].canopyDensity;

      // Check neighbors
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nx = x + dx;
          const ny = y + dy;

          if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height &&
              !visited[ny][nx] &&
              (tiles[ny][nx].vegetationType === VegetationType.DENSE_TREES ||
               tiles[ny][nx].vegetationType === VegetationType.SPARSE_TREES)) {
            visited[ny][nx] = true;
            queue.push({ x: nx, y: ny });
          }
        }
      }
    }

    // Determine forest type
    let type: 'deciduous' | 'coniferous' | 'mixed';
    if (coniferCount > deciduousCount * 2) type = 'coniferous';
    else if (deciduousCount > coniferCount * 2) type = 'deciduous';
    else type = 'mixed';

    return {
      tiles: patchTiles,
      type,
      density: totalDensity / patchTiles.length
    };
  }

  /**
   * Calculate layer statistics
   */
  private calculateStatistics(tiles: VegetationTileData[][]): {
    treeCount: number;
    avgCanopy: number;
  } {
    let treeCount = 0;
    let totalCanopy = 0;
    let canopyTiles = 0;

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const tilePlants = tiles[y][x].plants;
        for (const plant of tilePlants) {
          if (plant instanceof TreePlant) treeCount++;
        }

        if (tiles[y][x].canopyDensity > 0) {
          totalCanopy += tiles[y][x].canopyDensity;
          canopyTiles++;
        }
      }
    }

    return {
      treeCount,
      avgCanopy: canopyTiles > 0 ? totalCanopy / canopyTiles : 0
    };
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