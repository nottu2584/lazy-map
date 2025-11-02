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
 * Wetland vegetation types
 */
export enum WetlandVegetationZoneType {
  MARSH = 'marsh',
  SWAMP = 'swamp',
  BOG = 'bog',
  FEN = 'fen',
  RIPARIAN = 'riparian' // Along rivers/streams
}

/**
 * Wetland vegetation specific properties
 */
export interface WetlandVegetationProperties extends VegetationProperties {
  wetlandType: WetlandVegetationZoneType;
  waterDepth: number; // Average water depth in meters
  floodTolerance: 'low' | 'medium' | 'high';
  emergentCoverage: number; // 0-1, coverage of emergent plants
}

/**
 * Wetland vegetation zone for marshes, swamps, and water edges
 */
export class WetlandVegetationZone extends VegetationZone {
  private plantDistributions: {
    trees?: PlantDistribution;
    shrubs?: PlantDistribution;
    herbaceous: PlantDistribution;
    aquatic: PlantDistribution;
  };

  constructor(
    id: FeatureId,
    name: string,
    area: SpatialBounds,
    public readonly wetlandProperties: WetlandVegetationProperties,
    priority: number = 3
  ) {
    super(id, name, area, VegetationZoneType.WETLAND_VEGETATION, wetlandProperties, priority);
    this.plantDistributions = this.initializeDistributions();
  }

  private initializeDistributions(): typeof this.plantDistributions {
    switch (this.wetlandProperties.wetlandType) {
      case WetlandVegetationZoneType.SWAMP:
        return {
          trees: {
            species: [PlantSpecies.WILLOW],
            density: 1.5,
            minSpacing: 0.6,
            sizeVariation: 0.4,
            ageRange: [5, 80]
          },
          shrubs: {
            species: [PlantSpecies.ELDERBERRY],
            density: 3,
            minSpacing: 0.3,
            sizeVariation: 0.35,
            ageRange: [1, 20]
          },
          herbaceous: {
            species: [PlantSpecies.CATTAIL, PlantSpecies.REED, PlantSpecies.FERN],
            density: 20,
            minSpacing: 0.08,
            sizeVariation: 0.3,
            ageRange: [1, 5]
          },
          aquatic: {
            species: [PlantSpecies.WATER_LILY, PlantSpecies.ALGAE],
            density: 8,
            minSpacing: 0.2,
            sizeVariation: 0.25,
            ageRange: [1, 3]
          }
        };

      case WetlandVegetationZoneType.MARSH:
        return {
          herbaceous: {
            species: [PlantSpecies.CATTAIL, PlantSpecies.REED],
            density: 30,
            minSpacing: 0.06,
            sizeVariation: 0.25,
            ageRange: [1, 4]
          },
          aquatic: {
            species: [PlantSpecies.WATER_LILY],
            density: 5,
            minSpacing: 0.3,
            sizeVariation: 0.2,
            ageRange: [1, 2]
          }
        };

      case WetlandVegetationZoneType.BOG:
        return {
          shrubs: {
            species: [PlantSpecies.BLUEBERRY_BUSH],
            density: 2,
            minSpacing: 0.4,
            sizeVariation: 0.3,
            ageRange: [1, 15]
          },
          herbaceous: {
            species: [PlantSpecies.MOSS, PlantSpecies.FERN],
            density: 25,
            minSpacing: 0.05,
            sizeVariation: 0.2,
            ageRange: [1, 20]
          },
          aquatic: {
            species: [PlantSpecies.MOSS, PlantSpecies.ALGAE],
            density: 15,
            minSpacing: 0.1,
            sizeVariation: 0.1,
            ageRange: [1, 50]
          }
        };

      case WetlandVegetationZoneType.RIPARIAN:
        return {
          trees: {
            species: [PlantSpecies.WILLOW],
            density: 2,
            minSpacing: 0.5,
            sizeVariation: 0.35,
            ageRange: [5, 100]
          },
          shrubs: {
            species: [PlantSpecies.ELDERBERRY],
            density: 4,
            minSpacing: 0.25,
            sizeVariation: 0.4,
            ageRange: [1, 25]
          },
          herbaceous: {
            species: [PlantSpecies.REED, PlantSpecies.FERN, PlantSpecies.TALL_GRASS],
            density: 18,
            minSpacing: 0.07,
            sizeVariation: 0.35,
            ageRange: [1, 4]
          },
          aquatic: {
            species: [PlantSpecies.WATER_LILY],
            density: 3,
            minSpacing: 0.4,
            sizeVariation: 0.3,
            ageRange: [1, 2]
          }
        };

      default: // FEN
        return {
          herbaceous: {
            species: [PlantSpecies.REED, PlantSpecies.TALL_GRASS, PlantSpecies.WILDFLOWER_MIX],
            density: 22,
            minSpacing: 0.06,
            sizeVariation: 0.3,
            ageRange: [1, 3]
          },
          aquatic: {
            species: [PlantSpecies.MOSS],
            density: 12,
            minSpacing: 0.08,
            sizeVariation: 0.15,
            ageRange: [1, 30]
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
      waterDepth?: number;
    }
  ): PlantInstance[] {
    const tileSeed = this.hashValues(seed, tileX, tileY, this.id.value);
    const random = this.createSeededRandom(tileSeed);
    const plants: PlantInstance[] = [];

    // Determine water depth for this tile
    const waterDepth = environmentalFactors?.waterDepth ?? this.wetlandProperties.waterDepth;

    // Adjust density based on water depth
    let densityModifier = 1.0;
    if (waterDepth > 1.0) {
      // Deep water - only aquatic plants
      densityModifier = 0.3;
    } else if (waterDepth > 0.5) {
      // Moderate depth - emergent plants dominate
      densityModifier = 0.8;
    }

    // Generate trees (only in shallow water or edges)
    if (this.plantDistributions.trees && waterDepth < 0.3) {
      const treeDist = this.plantDistributions.trees;
      const numTrees = Math.floor(treeDist.density * densityModifier * random());

      for (let i = 0; i < numTrees; i++) {
        const species = this.selectSpecies(treeDist.species, random);
        const age = treeDist.ageRange[0] + random() * (treeDist.ageRange[1] - treeDist.ageRange[0]);
        const sizeFactor = Math.min(1, age / 50) * (1 - treeDist.sizeVariation + random() * treeDist.sizeVariation * 2);

        plants.push({
          species,
          x: tileX + random(),
          y: tileY + random(),
          age: Math.floor(age),
          height: 3 + sizeFactor * 12, // 3-15m (smaller in wetlands)
          health: 0.6 + random() * 0.3, // Slightly lower health in wet conditions
          category: 'tree',
          trunkDiameter: 0.1 + sizeFactor * 0.7,
          canopyRadius: 1 + sizeFactor * 5
        });
      }
    }

    // Generate shrubs (shallow water only)
    if (this.plantDistributions.shrubs && waterDepth < 0.2) {
      const shrubDist = this.plantDistributions.shrubs;
      const numShrubs = Math.floor(shrubDist.density * densityModifier * random());

      for (let i = 0; i < numShrubs; i++) {
        const species = this.selectSpecies(shrubDist.species, random);

        plants.push({
          species,
          x: tileX + random(),
          y: tileY + random(),
          age: Math.floor(shrubDist.ageRange[0] + random() * (shrubDist.ageRange[1] - shrubDist.ageRange[0])),
          height: 0.5 + random() * 2.5, // 0.5-3m
          health: 0.7 + random() * 0.3,
          category: 'shrub',
          stemCount: Math.floor(2 + random() * 5)
        });
      }
    }

    // Generate herbaceous plants (emergent)
    if (waterDepth < 1.0) {
      const herbDist = this.plantDistributions.herbaceous;
      const emergentDensity = densityModifier * this.wetlandProperties.emergentCoverage;
      const numHerbs = Math.floor(herbDist.density * emergentDensity * (0.8 + random() * 0.4));

      for (let i = 0; i < numHerbs; i++) {
        const species = this.selectSpecies(herbDist.species, random);

        plants.push({
          species,
          x: tileX + random(),
          y: tileY + random(),
          age: Math.floor(herbDist.ageRange[0] + random() * (herbDist.ageRange[1] - herbDist.ageRange[0])),
          height: 0.5 + random() * 1.5, // 0.5-2m (tall for cattails/reeds)
          health: 0.8 + random() * 0.2, // Healthy in wet conditions
          category: 'herb'
        });
      }
    }

    // Generate aquatic plants
    if (waterDepth > 0.1) {
      const aquaticDist = this.plantDistributions.aquatic;
      const aquaticDensity = waterDepth > 0.5 ? densityModifier * 1.5 : densityModifier;
      const numAquatic = Math.floor(aquaticDist.density * aquaticDensity * random());

      for (let i = 0; i < numAquatic; i++) {
        const species = this.selectSpecies(aquaticDist.species, random);

        plants.push({
          species,
          x: tileX + random(),
          y: tileY + random(),
          age: Math.floor(aquaticDist.ageRange[0] + random() * (aquaticDist.ageRange[1] - aquaticDist.ageRange[0])),
          height: 0.01 + random() * 0.1, // 1-11cm (floating/submerged)
          health: 0.9 + random() * 0.1, // Very healthy in water
          category: 'herb',
          coverage: 0.1 + random() * 0.3 // Coverage for floating plants
        });
      }
    }

    return plants;
  }

  protected getPlantDistributions() {
    return this.plantDistributions;
  }
}