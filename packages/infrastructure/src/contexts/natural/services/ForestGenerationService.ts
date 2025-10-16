import { Injectable } from '@nestjs/common';
import {
  IForestGenerationService,
  ForestGenerationSettings,
  Forest,
  TreePlant,
  PlantSpecies,
  PlantSize,
  PlantProperties,
  SubTilePosition,
  SpatialBounds,
  Position,
  FeatureId,
  Seed,
} from '@lazy-map/domain';
import { IRandomGeneratorPort, ISeededRandomGenerator } from '@lazy-map/application';
import { RandomGeneratorService } from '../../../common/utils/RandomGeneratorService';

/**
 * Infrastructure implementation of forest generation service
 * Handles the complex algorithms for tree placement and forest creation
 */
@Injectable()
export class ForestGenerationService implements IForestGenerationService {
  private randomGeneratorPort: IRandomGeneratorPort;
  private randomGenerator: ISeededRandomGenerator;

  constructor() {
    this.randomGeneratorPort = new RandomGeneratorService();
    this.randomGenerator = this.randomGeneratorPort.createRandom();
  }

  /**
   * Generate a forest with trees using various algorithms
   */
  async generateForest(
    name: string,
    area: SpatialBounds,
    settings: ForestGenerationSettings,
    seed?: Seed
  ): Promise<Forest> {
    // Initialize random generator with seed
    if (seed) {
      // Convert seed to number for the random generator
      const seedValue = this.seedToNumber(seed);
      this.randomGenerator = this.randomGeneratorPort.createSeeded(seedValue);
    }

    // Generate trees using clumping algorithm
    const trees = this.generateTreesInArea(area, settings);

    // Determine dominant species from generated trees
    const dominantSpecies = this.getDominantSpecies(trees);

    // Calculate underbrush density
    const underbrushDensity = this.randomGenerator.nextFloat(0.2, 0.8); // 0.2-0.8

    // Create forest entity
    const forestId = FeatureId.generate();
    const forest = new Forest(
      forestId,
      name,
      area,
      trees,
      dominantSpecies,
      underbrushDensity,
      2 // Default priority for forests
    );

    return forest;
  }

  /**
   * Convert Seed to number for random generator
   */
  private seedToNumber(seed: Seed): number {
    // Get string representation and convert to number hash
    const str = seed.toString();
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Generate trees within a forest area using clumped distribution
   */
  private generateTreesInArea(
    area: SpatialBounds,
    settings: ForestGenerationSettings
  ): TreePlant[] {
    const trees: TreePlant[] = [];

    // Calculate total area coverage needed
    const totalTiles = area.dimensions.width * area.dimensions.height;
    const targetTreeCount = Math.floor(
      totalTiles * settings.treeDensity * this.randomGenerator.nextFloat(0.5, 1.5)
    );

    // Generate tree positions using clumping algorithm
    const positions = this.generateClumpedPositions(
      area,
      targetTreeCount,
      settings.treeClumping
    );

    // Create trees at each position
    for (const position of positions) {
      const tree = this.generateTreeAtPosition(position, settings);
      trees.push(tree);
    }

    // Apply natural interactions if enabled
    if (settings.enableInosculation && settings.inosculationChance > 0) {
      this.applyInosculation(trees, settings.inosculationChance, settings.maxOverlapDistance);
    }

    return trees;
  }

  /**
   * Generate clumped tree positions using Poisson disk sampling with clusters
   */
  private generateClumpedPositions(
    area: SpatialBounds,
    targetCount: number,
    clumpiness: number
  ): SubTilePosition[] {
    const positions: SubTilePosition[] = [];
    const minDistance = 0.3; // Minimum distance between tree centers
    const maxAttempts = targetCount * 4;

    // Generate cluster centers
    const clusterCount = Math.max(1, Math.floor((targetCount * (1 - clumpiness)) / 5));
    const clusterCenters: Position[] = [];

    for (let i = 0; i < clusterCount; i++) {
      const x = area.position.x + this.randomGenerator.next() * area.dimensions.width;
      const y = area.position.y + this.randomGenerator.next() * area.dimensions.height;
      clusterCenters.push(new Position(x, y));
    }

    // Generate trees around cluster centers
    const treesPerCluster = Math.ceil(targetCount / clusterCount);

    for (const center of clusterCenters) {
      const clusterRadius = this.randomGenerator.nextFloat(2, 5); // 2-5 tile radius

      for (let i = 0; i < treesPerCluster && positions.length < targetCount; i++) {
        let attempts = 0;
        let validPosition = false;

        while (!validPosition && attempts < maxAttempts / clusterCount) {
          // Generate position within cluster using normal distribution
          const angle = this.randomGenerator.next() * Math.PI * 2;
          const distance =
            ((this.randomGenerator.next() + this.randomGenerator.next()) / 2) *
            clusterRadius;

          const tileX = Math.floor(center.x + Math.cos(angle) * distance);
          const tileY = Math.floor(center.y + Math.sin(angle) * distance);
          const offsetX = this.randomGenerator.next();
          const offsetY = this.randomGenerator.next();

          // Check if position is within forest area
          if (
            tileX >= area.position.x &&
            tileX < area.position.x + area.dimensions.width &&
            tileY >= area.position.y &&
            tileY < area.position.y + area.dimensions.height
          ) {
            const newPosition = new SubTilePosition(tileX, tileY, offsetX, offsetY);

            // Check minimum distance to existing trees
            const tooClose = positions.some(
              pos => this.getPositionDistance(pos, newPosition) < minDistance
            );

            if (!tooClose) {
              positions.push(newPosition);
              validPosition = true;
            }
          }
          attempts++;
        }
      }
    }

    return positions;
  }

  /**
   * Generate a tree at a specific position
   */
  private generateTreeAtPosition(
    position: SubTilePosition,
    settings: ForestGenerationSettings
  ): TreePlant {
    // Select tree size based on distribution
    const sizeRoll = this.randomGenerator.next();
    let size: PlantSize;

    if (sizeRoll < settings.saplingChance) {
      size = PlantSize.SMALL;
    } else if (sizeRoll < settings.saplingChance + settings.youngChance) {
      size = PlantSize.MEDIUM;
    } else if (sizeRoll < settings.saplingChance + settings.youngChance + settings.matureChance) {
      size = PlantSize.LARGE;
    } else {
      size = PlantSize.HUGE;
    }

    // Select tree species
    const species = this.selectTreeSpecies(settings);

    // Generate natural variations
    const health = settings.enableNaturalVariation
      ? this.randomGenerator.nextFloat(0.6, 1.0)
      : 1.0;

    const canopyDensity = this.randomGenerator.nextFloat(0.4, 0.9); // 0.4-0.9
    const age = this.generateTreeAge(size);

    // Generate tree properties
    const properties = this.generateTreeProperties(species);

    // Calculate trunk diameter based on size
    const trunkDiameter = this.calculateTrunkDiameter(size);

    // Create tree plant
    const tree = new TreePlant(
      this.generateTreeId(),
      species,
      position,
      size,
      health,
      age,
      properties,
      trunkDiameter,
      canopyDensity,
      this.randomGenerator.next() < 0.15 // 15% chance of having vines
    );

    return tree;
  }

  /**
   * Select tree species based on settings and biome
   */
  private selectTreeSpecies(settings: ForestGenerationSettings): PlantSpecies {
    if (settings.preferredSpecies.length > 0 && this.randomGenerator.next() < 0.7) {
      // 70% chance to use preferred species
      const index = this.randomGenerator.nextInt(0, settings.preferredSpecies.length);
      return settings.preferredSpecies[index];
    }

    // Default tree species selection
    const treeSpecies = [
      PlantSpecies.OAK,
      PlantSpecies.PINE,
      PlantSpecies.BIRCH,
      PlantSpecies.MAPLE,
      PlantSpecies.CEDAR,
      PlantSpecies.WILLOW,
    ];
    const index = this.randomGenerator.nextInt(0, treeSpecies.length);
    return treeSpecies[index];
  }

  /**
   * Generate tree properties based on species
   */
  private generateTreeProperties(species: PlantSpecies): PlantProperties {
    const baseProperties: PlantProperties = {
      maxHeight: 20,
      maxWidth: 10,
      growthRate: 0.5,
      foliageColor: ['green'],
      soilPreference: ['loam', 'clay'],
      lightRequirement: 'partial_shade',
      waterRequirement: 'medium',
      hardiness: 5,
      providesNesting: true,
    };

    // Customize based on species
    switch (species) {
      case PlantSpecies.OAK:
        baseProperties.maxHeight = 25;
        baseProperties.maxWidth = 20;
        baseProperties.growthRate = 0.3;
        baseProperties.lightRequirement = 'full_sun';
        break;
      case PlantSpecies.PINE:
        baseProperties.maxHeight = 30;
        baseProperties.maxWidth = 10;
        baseProperties.growthRate = 0.6;
        baseProperties.lightRequirement = 'full_sun';
        break;
      case PlantSpecies.WILLOW:
        baseProperties.maxHeight = 15;
        baseProperties.maxWidth = 15;
        baseProperties.growthRate = 0.8;
        baseProperties.waterRequirement = 'high';
        break;
      case PlantSpecies.MAPLE:
        baseProperties.maxHeight = 20;
        baseProperties.maxWidth = 15;
        baseProperties.foliageColor = ['green', 'red', 'yellow'];
        break;
      case PlantSpecies.CEDAR:
        baseProperties.maxHeight = 35;
        baseProperties.maxWidth = 12;
        baseProperties.isFragrant = true;
        break;
      case PlantSpecies.BIRCH:
        baseProperties.maxHeight = 18;
        baseProperties.maxWidth = 8;
        baseProperties.growthRate = 0.7;
        break;
    }

    return baseProperties;
  }

  /**
   * Calculate trunk diameter based on tree size
   */
  private calculateTrunkDiameter(size: PlantSize): number {
    switch (size) {
      case PlantSize.TINY:
      case PlantSize.SMALL:
        return this.randomGenerator.nextFloat(0.1, 0.3);
      case PlantSize.MEDIUM:
        return this.randomGenerator.nextFloat(0.3, 0.6);
      case PlantSize.LARGE:
        return this.randomGenerator.nextFloat(0.6, 1.2);
      case PlantSize.HUGE:
        return this.randomGenerator.nextFloat(1.0, 2.0);
      case PlantSize.MASSIVE:
        return this.randomGenerator.nextFloat(1.5, 3.0);
      default:
        return 0.5;
    }
  }

  /**
   * Generate age appropriate for tree size
   */
  private generateTreeAge(size: PlantSize): number {
    const ageRanges: Record<PlantSize, { min: number; max: number }> = {
      [PlantSize.TINY]: { min: 1, max: 5 },
      [PlantSize.SMALL]: { min: 5, max: 15 },
      [PlantSize.MEDIUM]: { min: 15, max: 40 },
      [PlantSize.LARGE]: { min: 40, max: 100 },
      [PlantSize.HUGE]: { min: 100, max: 300 },
      [PlantSize.MASSIVE]: { min: 300, max: 1000 },
    };

    const range = ageRanges[size];
    return this.randomGenerator.nextFloat(range.min, range.max);
  }

  /**
   * Apply inosculation (tree grafting) between nearby trees
   */
  private applyInosculation(
    trees: TreePlant[],
    inosculationChance: number,
    maxDistance: number
  ): void {
    for (let i = 0; i < trees.length; i++) {
      for (let j = i + 1; j < trees.length; j++) {
        const tree1 = trees[i];
        const tree2 = trees[j];

        const distance = this.getPositionDistance(tree1.position, tree2.position);

        // Trees can only graft if they're close enough and both healthy
        if (
          distance <= maxDistance &&
          tree1.health > 0.7 &&
          tree2.health > 0.7 &&
          this.randomGenerator.next() < inosculationChance
        ) {
          // Note: Since health is readonly, we can't modify it directly
          // In a real implementation, we might track grafted trees separately
          // or have a method to update tree properties
        }
      }
    }
  }

  /**
   * Calculate distance between two sub-tile positions
   */
  private getPositionDistance(pos1: SubTilePosition, pos2: SubTilePosition): number {
    const dx = pos1.tileX + pos1.offsetX - (pos2.tileX + pos2.offsetX);
    const dy = pos1.tileY + pos1.offsetY - (pos2.tileY + pos2.offsetY);
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Determine dominant species from a collection of trees
   */
  private getDominantSpecies(trees: TreePlant[]): PlantSpecies[] {
    const speciesCounts = new Map<PlantSpecies, number>();

    // Count trees by species
    for (const tree of trees) {
      const count = speciesCounts.get(tree.species) || 0;
      speciesCounts.set(tree.species, count + 1);
    }

    // Return species that make up more than 20% of the forest
    const totalTrees = trees.length;
    const dominantThreshold = totalTrees * 0.2;

    return Array.from(speciesCounts.entries())
      .filter(([_, count]) => count >= dominantThreshold)
      .sort(([_, a], [__, b]) => b - a)
      .slice(0, 3) // Top 3 species
      .map(([species]) => species);
  }

  /**
   * Generate a unique tree ID
   */
  private generateTreeId(): string {
    return `tree_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get trees that occupy or partially occupy a specific tile
   */
  getTreesInTile(trees: TreePlant[], tileX: number, tileY: number): TreePlant[] {
    return trees.filter(tree => {
      // Check if tree position is in the tile
      // Could be enhanced to check tree canopy overlap
      return tree.position.tileX === tileX && tree.position.tileY === tileY;
    });
  }

  /**
   * Calculate the coverage percentage of trees in a specific tile
   */
  getTreeCoverageInTile(trees: TreePlant[], tileX: number, tileY: number): number {
    const treesInTile = this.getTreesInTile(trees, tileX, tileY);

    if (treesInTile.length === 0) return 0;

    // Calculate coverage based on canopy density
    let totalCoverage = 0;
    for (const tree of treesInTile) {
      totalCoverage += tree.canopyDensity * 0.3; // Each tree covers ~30% of tile max
    }

    // Cap at 1.0 (100% coverage)
    return Math.min(1.0, totalCoverage);
  }
}