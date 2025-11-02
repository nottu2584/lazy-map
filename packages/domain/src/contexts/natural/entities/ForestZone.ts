import { FeatureId } from '../../../common/value-objects/FeatureId';
import { SpatialBounds } from '../../../common/value-objects/SpatialBounds';
import {
  VegetationZone,
  VegetationZoneType,
  VegetationProperties,
  PlantInstance,
  PlantDistribution
} from './VegetationZone';
import { PlantSpecies } from './plant/value-objects/PlantSpecies';

/**
 * Forest types
 */
export enum ForestType {
  TEMPERATE_DECIDUOUS = 'temperate_deciduous',
  TEMPERATE_CONIFEROUS = 'temperate_coniferous',
  TEMPERATE_MIXED = 'temperate_mixed',
  BOREAL = 'boreal',
  TROPICAL_RAINFOREST = 'tropical_rainforest',
  TROPICAL_DRY = 'tropical_dry'
}

/**
 * Forest-specific properties
 */
export interface ForestProperties extends VegetationProperties {
  forestType: ForestType;
  underbrushDensity: number; // 0-1
  canopyLayers: number; // 1-3 typically
  gapFraction: number; // 0-1, fraction of area that's gaps/clearings
}

/**
 * Forest zone that generates trees, shrubs, and ground cover on-demand
 */
export class ForestZone extends VegetationZone {
  private plantDistributions: {
    trees: PlantDistribution;
    shrubs: PlantDistribution;
    herbaceous: PlantDistribution;
    groundCover: PlantDistribution;
  };

  constructor(
    id: FeatureId,
    name: string,
    area: SpatialBounds,
    public readonly forestProperties: ForestProperties,
    priority: number = 3
  ) {
    super(id, name, area, VegetationZoneType.FOREST, forestProperties, priority);
    this.plantDistributions = this.initializeDistributions();
  }

  /**
   * Initialize plant distributions based on forest type
   */
  private initializeDistributions(): typeof this.plantDistributions {
    switch (this.forestProperties.forestType) {
      case ForestType.TEMPERATE_DECIDUOUS:
        return {
          trees: {
            species: [PlantSpecies.OAK, PlantSpecies.MAPLE, PlantSpecies.BIRCH],
            density: 3,
            minSpacing: 0.4,
            sizeVariation: 0.3,
            ageRange: [10, 200]
          },
          shrubs: {
            species: [PlantSpecies.ELDERBERRY, PlantSpecies.HAZEL],
            density: 6,
            minSpacing: 0.2,
            sizeVariation: 0.4,
            ageRange: [1, 30]
          },
          herbaceous: {
            species: [PlantSpecies.FERN],
            density: 12,
            minSpacing: 0.1,
            sizeVariation: 0.5,
            ageRange: [1, 10]
          },
          groundCover: {
            species: [PlantSpecies.MOSS, PlantSpecies.SHORT_GRASS],
            density: 20,
            minSpacing: 0.05,
            sizeVariation: 0.2,
            ageRange: [1, 50]
          }
        };

      case ForestType.TEMPERATE_CONIFEROUS:
        return {
          trees: {
            species: [PlantSpecies.PINE, PlantSpecies.CEDAR],
            density: 4,
            minSpacing: 0.3,
            sizeVariation: 0.2,
            ageRange: [10, 300]
          },
          shrubs: {
            species: [PlantSpecies.BLUEBERRY_BUSH],
            density: 4,
            minSpacing: 0.25,
            sizeVariation: 0.3,
            ageRange: [1, 25]
          },
          herbaceous: {
            species: [PlantSpecies.FERN],
            density: 8,
            minSpacing: 0.15,
            sizeVariation: 0.4,
            ageRange: [1, 8]
          },
          groundCover: {
            species: [PlantSpecies.MOSS, PlantSpecies.LICHEN],
            density: 25,
            minSpacing: 0.05,
            sizeVariation: 0.1,
            ageRange: [1, 100]
          }
        };

      default:
        // Default mixed forest
        return {
          trees: {
            species: [PlantSpecies.OAK, PlantSpecies.PINE, PlantSpecies.MAPLE],
            density: 3.5,
            minSpacing: 0.35,
            sizeVariation: 0.35,
            ageRange: [10, 250]
          },
          shrubs: {
            species: [PlantSpecies.ELDERBERRY, PlantSpecies.BLUEBERRY_BUSH],
            density: 5,
            minSpacing: 0.22,
            sizeVariation: 0.35,
            ageRange: [1, 28]
          },
          herbaceous: {
            species: [PlantSpecies.FERN],
            density: 10,
            minSpacing: 0.12,
            sizeVariation: 0.45,
            ageRange: [1, 9]
          },
          groundCover: {
            species: [PlantSpecies.MOSS, PlantSpecies.SHORT_GRASS],
            density: 22,
            minSpacing: 0.05,
            sizeVariation: 0.15,
            ageRange: [1, 75]
          }
        };
    }
  }

  /**
   * Generate plants for a specific tile
   */
  generatePlantsForTile(
    tileX: number,
    tileY: number,
    seed: number,
    environmentalFactors?: {
      moisture?: number;
      elevation?: number;
      slope?: number;
      isEdge?: boolean;
    }
  ): PlantInstance[] {
    const tileSeed = this.hashValues(seed, tileX, tileY, this.id.value);
    const random = this.createSeededRandom(tileSeed);
    const plants: PlantInstance[] = [];

    // Adjust density based on environmental factors
    let densityModifier = 1.0;
    if (environmentalFactors) {
      if (environmentalFactors.isEdge) {
        densityModifier *= 0.6; // Less dense at edges
      }
      if (environmentalFactors.slope && environmentalFactors.slope > 20) {
        densityModifier *= 0.7; // Less dense on slopes
      }
      if (environmentalFactors.moisture !== undefined) {
        if (environmentalFactors.moisture < 2) {
          densityModifier *= 0.5; // Much less in dry areas
        } else if (environmentalFactors.moisture > 4) {
          densityModifier *= 1.2; // More in wet areas
        }
      }
    }

    // Check if this tile is in a gap/clearing
    const gapCheck = random();
    if (gapCheck < this.forestProperties.gapFraction) {
      // This tile is a clearing - only ground cover
      plants.push(...this.generateGroundCover(tileX, tileY, random, densityModifier * 2));
      return plants;
    }

    // Generate trees
    plants.push(...this.generateTrees(tileX, tileY, random, densityModifier));

    // Generate shrubs (more at edges)
    const shrubDensity = environmentalFactors?.isEdge ? densityModifier * 1.5 : densityModifier * 0.8;
    plants.push(...this.generateShrubs(tileX, tileY, random, shrubDensity));

    // Generate herbaceous plants
    plants.push(...this.generateHerbaceous(tileX, tileY, random, densityModifier));

    // Generate ground cover
    plants.push(...this.generateGroundCover(tileX, tileY, random, densityModifier));

    return plants;
  }

  private generateTrees(
    tileX: number,
    tileY: number,
    random: () => number,
    densityModifier: number
  ): PlantInstance[] {
    const trees: PlantInstance[] = [];
    const dist = this.plantDistributions.trees;
    const numTrees = Math.floor(dist.density * densityModifier * (0.7 + random() * 0.6));

    for (let i = 0; i < numTrees; i++) {
      const species = this.selectSpecies(dist.species, random);
      const ageFactor = random();
      const age = dist.ageRange[0] + ageFactor * (dist.ageRange[1] - dist.ageRange[0]);

      // Size based on age and variation
      const sizeFactor = Math.min(1, age / 100) * (1 - dist.sizeVariation + random() * dist.sizeVariation * 2);
      const height = 5 + sizeFactor * 25; // 5-30m
      const trunkDiameter = 0.1 + sizeFactor * 1.4; // 0.1-1.5m
      const canopyRadius = 2 + sizeFactor * 8; // 2-10m

      trees.push({
        species,
        x: tileX + random(),
        y: tileY + random(),
        age: Math.floor(age),
        height,
        health: 0.7 + random() * 0.3,
        category: 'tree',
        trunkDiameter,
        canopyRadius
      });
    }

    return trees;
  }

  private generateShrubs(
    tileX: number,
    tileY: number,
    random: () => number,
    densityModifier: number
  ): PlantInstance[] {
    const shrubs: PlantInstance[] = [];
    const dist = this.plantDistributions.shrubs;
    const numShrubs = Math.floor(dist.density * densityModifier * (0.7 + random() * 0.6));

    for (let i = 0; i < numShrubs; i++) {
      const species = this.selectSpecies(dist.species, random);
      const age = dist.ageRange[0] + random() * (dist.ageRange[1] - dist.ageRange[0]);
      const sizeFactor = Math.min(1, age / 15) * (1 - dist.sizeVariation + random() * dist.sizeVariation * 2);

      shrubs.push({
        species,
        x: tileX + random(),
        y: tileY + random(),
        age: Math.floor(age),
        height: 0.5 + sizeFactor * 3.5, // 0.5-4m
        health: 0.7 + random() * 0.3,
        category: 'shrub',
        stemCount: Math.floor(3 + random() * 7)
      });
    }

    return shrubs;
  }

  private generateHerbaceous(
    tileX: number,
    tileY: number,
    random: () => number,
    densityModifier: number
  ): PlantInstance[] {
    const herbs: PlantInstance[] = [];
    const dist = this.plantDistributions.herbaceous;
    const numHerbs = Math.floor(dist.density * densityModifier * (0.7 + random() * 0.6));

    for (let i = 0; i < numHerbs; i++) {
      const species = this.selectSpecies(dist.species, random);
      const age = dist.ageRange[0] + random() * (dist.ageRange[1] - dist.ageRange[0]);

      herbs.push({
        species,
        x: tileX + random(),
        y: tileY + random(),
        age: Math.floor(age),
        height: 0.1 + random() * 0.9, // 0.1-1m
        health: 0.6 + random() * 0.4,
        category: 'herb'
      });
    }

    return herbs;
  }

  private generateGroundCover(
    tileX: number,
    tileY: number,
    random: () => number,
    densityModifier: number
  ): PlantInstance[] {
    const groundCover: PlantInstance[] = [];
    const dist = this.plantDistributions.groundCover;

    // Ground cover is more area-based
    const coverage = Math.min(1, dist.density * densityModifier * 0.05);

    if (random() < coverage) {
      const species = this.selectSpecies(dist.species, random);

      groundCover.push({
        species,
        x: tileX + 0.5,
        y: tileY + 0.5,
        age: Math.floor(dist.ageRange[0] + random() * (dist.ageRange[1] - dist.ageRange[0])),
        height: 0.02 + random() * 0.08, // 2-10cm
        health: 0.8 + random() * 0.2,
        category: species === PlantSpecies.MOSS ? 'moss' : 'grass',
        coverage: coverage
      });
    }

    return groundCover;
  }

  protected getPlantDistributions() {
    return this.plantDistributions;
  }
}