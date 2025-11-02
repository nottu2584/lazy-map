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
 * Shrubland types
 */
export enum ShrublandType {
  SCRUBLAND = 'scrubland',
  CHAPARRAL = 'chaparral',
  HEATH = 'heath',
  MOORLAND = 'moorland',
  FOREST_EDGE = 'forest_edge'
}

/**
 * Shrubland-specific properties
 */
export interface ShrublandProperties extends VegetationProperties {
  shrublandType: ShrublandType;
  shrubHeight: 'low' | 'medium' | 'tall';
  thorniness: number; // 0-1, how thorny/defensive the shrubs are
  fruitBearing: boolean;
}

/**
 * Shrubland zone for areas dominated by shrubs and bushes
 */
export class ShrublandZone extends VegetationZone {
  private plantDistributions: {
    trees?: PlantDistribution;
    shrubs: PlantDistribution;
    herbaceous: PlantDistribution;
    groundCover: PlantDistribution;
  };

  constructor(
    id: FeatureId,
    name: string,
    area: SpatialBounds,
    public readonly shrublandProperties: ShrublandProperties,
    priority: number = 3
  ) {
    super(id, name, area, VegetationZoneType.SHRUBLAND, shrublandProperties, priority);
    this.plantDistributions = this.initializeDistributions();
  }

  private initializeDistributions(): typeof this.plantDistributions {
    switch (this.shrublandProperties.shrublandType) {
      case ShrublandType.FOREST_EDGE:
        return {
          trees: {
            species: [PlantSpecies.BIRCH, PlantSpecies.PINE],
            density: 0.5,
            minSpacing: 0.8,
            sizeVariation: 0.4,
            ageRange: [5, 50]
          },
          shrubs: {
            species: [PlantSpecies.ELDERBERRY, PlantSpecies.HAZEL, PlantSpecies.BLACKTHORN],
            density: 8,
            minSpacing: 0.15,
            sizeVariation: 0.35,
            ageRange: [1, 25]
          },
          herbaceous: {
            species: [PlantSpecies.FERN, PlantSpecies.WILDFLOWER_MIX],
            density: 12,
            minSpacing: 0.08,
            sizeVariation: 0.4,
            ageRange: [1, 5]
          },
          groundCover: {
            species: [PlantSpecies.SHORT_GRASS, PlantSpecies.MOSS],
            density: 20,
            minSpacing: 0.04,
            sizeVariation: 0.25,
            ageRange: [1, 10]
          }
        };

      case ShrublandType.CHAPARRAL:
        return {
          shrubs: {
            species: [PlantSpecies.SAGE, PlantSpecies.BLACKTHORN],
            density: 10,
            minSpacing: 0.12,
            sizeVariation: 0.3,
            ageRange: [1, 30]
          },
          herbaceous: {
            species: [PlantSpecies.SAGE, PlantSpecies.LAVENDER],
            density: 8,
            minSpacing: 0.1,
            sizeVariation: 0.35,
            ageRange: [1, 6]
          },
          groundCover: {
            species: [PlantSpecies.SHORT_GRASS],
            density: 15,
            minSpacing: 0.05,
            sizeVariation: 0.2,
            ageRange: [1, 3]
          }
        };

      case ShrublandType.HEATH:
        return {
          shrubs: {
            species: [PlantSpecies.BLUEBERRY_BUSH, PlantSpecies.HAZEL],
            density: 6,
            minSpacing: 0.2,
            sizeVariation: 0.25,
            ageRange: [1, 20]
          },
          herbaceous: {
            species: [PlantSpecies.WILDFLOWER_MIX, PlantSpecies.FERN],
            density: 10,
            minSpacing: 0.08,
            sizeVariation: 0.3,
            ageRange: [1, 4]
          },
          groundCover: {
            species: [PlantSpecies.MOSS, PlantSpecies.LICHEN],
            density: 25,
            minSpacing: 0.03,
            sizeVariation: 0.15,
            ageRange: [1, 50]
          }
        };

      case ShrublandType.MOORLAND:
        return {
          shrubs: {
            species: [PlantSpecies.BLUEBERRY_BUSH],
            density: 4,
            minSpacing: 0.25,
            sizeVariation: 0.2,
            ageRange: [1, 15]
          },
          herbaceous: {
            species: [PlantSpecies.FERN],
            density: 6,
            minSpacing: 0.12,
            sizeVariation: 0.25,
            ageRange: [1, 8]
          },
          groundCover: {
            species: [PlantSpecies.MOSS, PlantSpecies.LICHEN, PlantSpecies.SHORT_GRASS],
            density: 30,
            minSpacing: 0.02,
            sizeVariation: 0.1,
            ageRange: [1, 100]
          }
        };

      default: // SCRUBLAND
        return {
          shrubs: {
            species: [PlantSpecies.SAGE, PlantSpecies.BLACKTHORN],
            density: 7,
            minSpacing: 0.18,
            sizeVariation: 0.35,
            ageRange: [1, 35]
          },
          herbaceous: {
            species: [PlantSpecies.SAGE],
            density: 5,
            minSpacing: 0.12,
            sizeVariation: 0.4,
            ageRange: [1, 5]
          },
          groundCover: {
            species: [PlantSpecies.SHORT_GRASS],
            density: 18,
            minSpacing: 0.04,
            sizeVariation: 0.3,
            ageRange: [1, 2]
          }
        };
    }
  }

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
      if (environmentalFactors.moisture !== undefined) {
        // Most shrublands prefer drier conditions
        if (environmentalFactors.moisture < 3) {
          densityModifier *= 1.2; // Thrives in dry conditions
        } else if (environmentalFactors.moisture > 4) {
          densityModifier *= 0.6; // Struggles in wet conditions
        }
      }
      if (environmentalFactors.slope && environmentalFactors.slope > 15) {
        // Shrubs often do well on slopes
        densityModifier *= 1.1;
      }
      if (environmentalFactors.isEdge) {
        // More dense at edges (transitional zone)
        densityModifier *= 1.3;
      }
    }

    // Generate occasional trees (if present)
    if (this.plantDistributions.trees) {
      const treeDist = this.plantDistributions.trees;
      const numTrees = Math.floor(treeDist.density * densityModifier * random());

      for (let i = 0; i < numTrees; i++) {
        const species = this.selectSpecies(treeDist.species, random);
        const age = treeDist.ageRange[0] + random() * (treeDist.ageRange[1] - treeDist.ageRange[0]);
        const sizeFactor = Math.min(1, age / 40) * (1 - treeDist.sizeVariation + random() * treeDist.sizeVariation * 2);

        plants.push({
          species,
          x: tileX + random(),
          y: tileY + random(),
          age: Math.floor(age),
          height: 2 + sizeFactor * 10, // 2-12m (smaller trees)
          health: 0.6 + random() * 0.3,
          category: 'tree',
          trunkDiameter: 0.05 + sizeFactor * 0.4,
          canopyRadius: 1 + sizeFactor * 4
        });
      }
    }

    // Generate shrubs (dominant vegetation)
    const shrubDist = this.plantDistributions.shrubs;
    const numShrubs = Math.floor(shrubDist.density * densityModifier * (0.8 + random() * 0.4));

    for (let i = 0; i < numShrubs; i++) {
      const species = this.selectSpecies(shrubDist.species, random);
      const age = shrubDist.ageRange[0] + random() * (shrubDist.ageRange[1] - shrubDist.ageRange[0]);
      const sizeFactor = Math.min(1, age / 20) * (1 - shrubDist.sizeVariation + random() * shrubDist.sizeVariation * 2);

      const height = this.getShrubHeight(this.shrublandProperties.shrubHeight, sizeFactor, random);

      plants.push({
        species,
        x: tileX + random(),
        y: tileY + random(),
        age: Math.floor(age),
        height,
        health: 0.7 + random() * 0.3,
        category: 'shrub',
        stemCount: Math.floor(3 + random() * 8)
      });
    }

    // Generate herbaceous plants
    const herbDist = this.plantDistributions.herbaceous;
    const numHerbs = Math.floor(herbDist.density * densityModifier * (0.7 + random() * 0.6));

    for (let i = 0; i < numHerbs; i++) {
      const species = this.selectSpecies(herbDist.species, random);

      plants.push({
        species,
        x: tileX + random(),
        y: tileY + random(),
        age: Math.floor(herbDist.ageRange[0] + random() * (herbDist.ageRange[1] - herbDist.ageRange[0])),
        height: 0.1 + random() * 0.5, // 10-60cm
        health: 0.6 + random() * 0.4,
        category: 'herb'
      });
    }

    // Generate ground cover
    const groundDist = this.plantDistributions.groundCover;
    const coverage = Math.min(1, groundDist.density * densityModifier * 0.03);

    if (random() < coverage) {
      const species = this.selectSpecies(groundDist.species, random);

      plants.push({
        species,
        x: tileX + 0.5,
        y: tileY + 0.5,
        age: Math.floor(groundDist.ageRange[0] + random() * (groundDist.ageRange[1] - groundDist.ageRange[0])),
        height: 0.02 + random() * 0.08, // 2-10cm
        health: 0.7 + random() * 0.3,
        category: species === PlantSpecies.MOSS || species === PlantSpecies.LICHEN ? 'moss' : 'grass',
        coverage
      });
    }

    return plants;
  }

  private getShrubHeight(shrubHeight: string, sizeFactor: number, random: () => number): number {
    const baseHeight = random() * 0.5; // Random variation
    switch (shrubHeight) {
      case 'low':
        return 0.3 + sizeFactor * 1.2 + baseHeight * 0.2; // 0.3-1.7m
      case 'tall':
        return 1.5 + sizeFactor * 3 + baseHeight * 0.5; // 1.5-5m
      default: // medium
        return 0.8 + sizeFactor * 2 + baseHeight * 0.3; // 0.8-3.1m
    }
  }

  protected getPlantDistributions() {
    return this.plantDistributions;
  }
}