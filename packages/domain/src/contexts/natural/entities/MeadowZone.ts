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
 * Meadow types
 */
export enum MeadowType {
  WILDFLOWER = 'wildflower',
  GRASSLAND = 'grassland',
  ALPINE = 'alpine',
  WET_MEADOW = 'wet_meadow'
}

/**
 * Meadow-specific properties
 */
export interface MeadowProperties extends VegetationProperties {
  meadowType: MeadowType;
  flowerDensity: number; // 0-1
  grassHeight: 'short' | 'medium' | 'tall';
  hasWildflowers: boolean;
}

/**
 * Meadow zone that generates grasses, wildflowers, and occasional shrubs
 */
export class MeadowZone extends VegetationZone {
  private plantDistributions: {
    shrubs?: PlantDistribution;
    herbaceous: PlantDistribution;
    groundCover: PlantDistribution;
  };

  constructor(
    id: FeatureId,
    name: string,
    area: SpatialBounds,
    public readonly meadowProperties: MeadowProperties,
    priority: number = 3
  ) {
    super(id, name, area, VegetationZoneType.MEADOW, meadowProperties, priority);
    this.plantDistributions = this.initializeDistributions();
  }

  private initializeDistributions(): typeof this.plantDistributions {
    switch (this.meadowProperties.meadowType) {
      case MeadowType.WILDFLOWER:
        return {
          shrubs: {
            species: [PlantSpecies.ROSE_BUSH, PlantSpecies.LAVENDER],
            density: 0.5,
            minSpacing: 0.5,
            sizeVariation: 0.3,
            ageRange: [1, 15]
          },
          herbaceous: {
            species: [PlantSpecies.WILDFLOWER_MIX, PlantSpecies.DAISY, PlantSpecies.POPPY],
            density: 25,
            minSpacing: 0.05,
            sizeVariation: 0.4,
            ageRange: [1, 3]
          },
          groundCover: {
            species: [PlantSpecies.SHORT_GRASS, PlantSpecies.TALL_GRASS],
            density: 40,
            minSpacing: 0.02,
            sizeVariation: 0.3,
            ageRange: [1, 5]
          }
        };

      case MeadowType.ALPINE:
        return {
          herbaceous: {
            species: [PlantSpecies.WILDFLOWER_MIX],
            density: 15,
            minSpacing: 0.08,
            sizeVariation: 0.2,
            ageRange: [1, 5]
          },
          groundCover: {
            species: [PlantSpecies.SHORT_GRASS, PlantSpecies.MOSS],
            density: 35,
            minSpacing: 0.03,
            sizeVariation: 0.2,
            ageRange: [1, 10]
          }
        };

      case MeadowType.WET_MEADOW:
        return {
          herbaceous: {
            species: [PlantSpecies.CATTAIL, PlantSpecies.REED],
            density: 18,
            minSpacing: 0.1,
            sizeVariation: 0.3,
            ageRange: [1, 4]
          },
          groundCover: {
            species: [PlantSpecies.TALL_GRASS, PlantSpecies.MOSS],
            density: 30,
            minSpacing: 0.03,
            sizeVariation: 0.35,
            ageRange: [1, 5]
          }
        };

      default: // GRASSLAND
        return {
          shrubs: {
            species: [PlantSpecies.SAGE],
            density: 0.3,
            minSpacing: 0.6,
            sizeVariation: 0.25,
            ageRange: [1, 20]
          },
          herbaceous: {
            species: [PlantSpecies.WILDFLOWER_MIX],
            density: 8,
            minSpacing: 0.1,
            sizeVariation: 0.35,
            ageRange: [1, 2]
          },
          groundCover: {
            species: [PlantSpecies.SHORT_GRASS, PlantSpecies.TALL_GRASS],
            density: 45,
            minSpacing: 0.02,
            sizeVariation: 0.25,
            ageRange: [1, 3]
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
        if (this.meadowProperties.meadowType === MeadowType.WET_MEADOW) {
          // Wet meadows thrive in moisture
          densityModifier *= environmentalFactors.moisture > 3 ? 1.3 : 0.7;
        } else if (this.meadowProperties.meadowType === MeadowType.ALPINE) {
          // Alpine meadows are adapted to drier conditions
          densityModifier *= environmentalFactors.moisture < 3 ? 1.1 : 0.9;
        }
      }
      if (environmentalFactors.slope && environmentalFactors.slope > 25) {
        densityModifier *= 0.8; // Less dense on steep slopes
      }
    }

    // Generate occasional shrubs
    if (this.plantDistributions.shrubs) {
      const shrubDist = this.plantDistributions.shrubs;
      const numShrubs = Math.floor(shrubDist.density * densityModifier * random());

      for (let i = 0; i < numShrubs; i++) {
        const species = this.selectSpecies(shrubDist.species, random);
        const age = shrubDist.ageRange[0] + random() * (shrubDist.ageRange[1] - shrubDist.ageRange[0]);

        plants.push({
          species,
          x: tileX + random(),
          y: tileY + random(),
          age: Math.floor(age),
          height: 0.3 + random() * 1.7, // 0.3-2m
          health: 0.7 + random() * 0.3,
          category: 'shrub',
          stemCount: Math.floor(2 + random() * 4)
        });
      }
    }

    // Generate herbaceous plants (flowers)
    if (this.meadowProperties.hasWildflowers) {
      const herbDist = this.plantDistributions.herbaceous;
      const numHerbs = Math.floor(herbDist.density * densityModifier * this.meadowProperties.flowerDensity * (0.8 + random() * 0.4));

      for (let i = 0; i < numHerbs; i++) {
        const species = this.selectSpecies(herbDist.species, random);

        plants.push({
          species,
          x: tileX + random(),
          y: tileY + random(),
          age: Math.floor(herbDist.ageRange[0] + random() * (herbDist.ageRange[1] - herbDist.ageRange[0])),
          height: 0.1 + random() * 0.6, // 10-70cm
          health: 0.6 + random() * 0.4,
          category: 'herb'
        });
      }
    }

    // Generate ground cover (grasses)
    const groundDist = this.plantDistributions.groundCover;
    const grassCoverage = Math.min(1, groundDist.density * densityModifier * 0.02);

    // Create grass patches
    const numPatches = Math.floor(3 + random() * 5);
    for (let i = 0; i < numPatches; i++) {
      const species = this.selectSpecies(groundDist.species, random);
      const patchX = tileX + random();
      const patchY = tileY + random();

      plants.push({
        species,
        x: patchX,
        y: patchY,
        age: Math.floor(groundDist.ageRange[0] + random() * (groundDist.ageRange[1] - groundDist.ageRange[0])),
        height: this.getGrassHeight(this.meadowProperties.grassHeight, random),
        health: 0.7 + random() * 0.3,
        category: 'grass',
        coverage: grassCoverage / numPatches
      });
    }

    return plants;
  }

  private getGrassHeight(grassHeight: string, random: () => number): number {
    switch (grassHeight) {
      case 'short':
        return 0.05 + random() * 0.15; // 5-20cm
      case 'tall':
        return 0.4 + random() * 0.6; // 40-100cm
      default: // medium
        return 0.2 + random() * 0.3; // 20-50cm
    }
  }

  protected getPlantDistributions() {
    return this.plantDistributions;
  }
}