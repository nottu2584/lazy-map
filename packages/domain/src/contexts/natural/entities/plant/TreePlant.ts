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
 * Tree-specific plant implementation
 */
export class TreePlant extends Plant {
  constructor(
    id: string,
    species: PlantSpecies,
    position: SubTilePosition,
    size: PlantSize,
    health: number = 1.0,
    age: number = 1,
    properties: PlantProperties,
    public readonly trunkDiameter: number,
    public readonly canopyDensity: number = 0.7,
    public readonly hasVines: boolean = false,
    customProperties: Record<string, any> = {}
  ) {
    super(id, species, PlantCategory.TREE, PlantGrowthForm.BROADLEAF_TREE, position, size, health, age, properties, customProperties);
  }

  getMaturityAge(): number {
    switch (this.size) {
      case PlantSize.TINY:
      case PlantSize.SMALL: return 10;
      case PlantSize.MEDIUM: return 25;
      case PlantSize.LARGE: return 50;
      case PlantSize.HUGE: return 100;
      case PlantSize.MASSIVE: return 200;
      default: return 25;
    }
  }

  canCoexistWith(other: Plant): boolean {
    if (other.category === PlantCategory.TREE) {
      // Trees compete for space based on canopy
      const distance = this.getDistanceTo(other);
      const minDistance = (this.getCoverageRadius() + other.getCoverageRadius()) * 0.7;
      return distance > minDistance;
    }
    // Trees can coexist with most other plants
    return true;
  }

  private getDistanceTo(other: Plant): number {
    const dx = this.position.tileX + this.position.offsetX - (other.position.tileX + other.position.offsetX);
    const dy = this.position.tileY + this.position.offsetY - (other.position.tileY + other.position.offsetY);
    return Math.sqrt(dx * dx + dy * dy);
  }
}