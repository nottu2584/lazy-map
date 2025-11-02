import { SubTilePosition } from '../../../../common/value-objects/SubTilePosition';
import { Plant } from './Plant';
import { TreePlant } from './TreePlant';
import {
  PlantCategory,
  PlantGrowthForm,
  PlantSize,
  PlantSpecies,
  PlantProperties
} from './value-objects';

/**
 * Herbaceous plant implementation (flowers, grasses, ferns)
 */
export class HerbaceousPlant extends Plant {
  constructor(
    id: string,
    species: PlantSpecies,
    growthForm: PlantGrowthForm,
    position: SubTilePosition,
    size: PlantSize,
    health: number = 1.0,
    age: number = 1,
    properties: PlantProperties,
    public readonly clusterSize: number = 1, // Number of individual plants in cluster
    customProperties: Record<string, any> = {}
  ) {
    super(id, species, PlantCategory.HERBACEOUS, growthForm, position, size, health, age, properties, customProperties);
  }

  getMaturityAge(): number {
    switch (this.properties.soilPreference.includes('annual') ? 'annual' : 'perennial') {
      case 'annual': return 1;
      default: return 3;
    }
  }

  canCoexistWith(other: Plant): boolean {
    // Most herbaceous plants are very tolerant
    if (other.category === PlantCategory.TREE) {
      // Can grow under light canopy
      return !(other instanceof TreePlant) || other.canopyDensity < 0.9;
    }
    return true;
  }
}