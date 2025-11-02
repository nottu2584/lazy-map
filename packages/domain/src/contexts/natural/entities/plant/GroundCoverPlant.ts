import { SubTilePosition } from '../../../../common/value-objects/SubTilePosition';
import { Plant } from './Plant';
import {
  PlantCategory,
  PlantGrowthForm,
  PlantSize,
  PlantSpecies,
  PlantProperties
} from './value-objects';

/**
 * Ground cover plant implementation (mosses, lichens)
 */
export class GroundCoverPlant extends Plant {
  constructor(
    id: string,
    species: PlantSpecies,
    position: SubTilePosition,
    health: number = 1.0,
    age: number = 1,
    properties: PlantProperties,
    public readonly coverage: number = 0.5, // How much of the tile area is covered
    customProperties: Record<string, any> = {}
  ) {
    super(id, species, PlantCategory.MOSS, PlantGrowthForm.MOSS, position, PlantSize.TINY, health, age, properties, customProperties);
  }

  getMaturityAge(): number {
    return 2;
  }

  canCoexistWith(other: Plant): boolean {
    // Mosses can grow almost anywhere
    return true;
  }
}