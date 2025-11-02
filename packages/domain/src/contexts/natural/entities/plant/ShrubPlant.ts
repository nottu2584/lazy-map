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
 * Shrub-specific plant implementation
 */
export class ShrubPlant extends Plant {
  constructor(
    id: string,
    species: PlantSpecies,
    position: SubTilePosition,
    size: PlantSize,
    health: number = 1.0,
    age: number = 1,
    properties: PlantProperties,
    public readonly berryYield?: number,
    customProperties: Record<string, any> = {}
  ) {
    super(id, species, PlantCategory.SHRUB, PlantGrowthForm.SHRUB, position, size, health, age, properties, customProperties);
  }

  getMaturityAge(): number {
    switch (this.size) {
      case PlantSize.TINY:
      case PlantSize.SMALL: return 2;
      case PlantSize.MEDIUM: return 5;
      case PlantSize.LARGE: return 10;
      default: return 5;
    }
  }

  canCoexistWith(other: Plant): boolean {
    if (other.category === PlantCategory.TREE) {
      // Can grow under partial canopy
      return other instanceof TreePlant && other.canopyDensity < 0.8;
    }
    if (other.category === PlantCategory.SHRUB) {
      const distance = this.getDistanceTo(other);
      return distance > (this.getCoverageRadius() + other.getCoverageRadius()) * 0.5;
    }
    return true;
  }

  private getDistanceTo(other: Plant): number {
    const dx = this.position.tileX + this.position.offsetX - (other.position.tileX + other.position.offsetX);
    const dy = this.position.tileY + this.position.offsetY - (other.position.tileY + other.position.offsetY);
    return Math.sqrt(dx * dx + dy * dy);
  }
}