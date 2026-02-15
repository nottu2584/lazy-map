import { Injectable, Optional, Inject } from '@nestjs/common';
import {
  TreePlant,
  ShrubPlant,
  HerbaceousPlant,
  GroundCoverPlant,
  PlantSpecies,
  PlantSize,
  SubTilePosition,
  PlantProperties,
  PlantGrowthForm,
  type ILogger
} from '@lazy-map/domain';

/**
 * Factory service for creating plant instances
 * Handles instantiation of all plant types with proper defaults
 */
@Injectable()
export class PlantFactoryService {
  constructor(
    @Optional() @Inject('ILogger') private readonly logger?: ILogger
  ) {}

  /**
   * Helper method to create a tree with all required parameters
   */
  createTree(species: PlantSpecies, size: PlantSize, x: number, y: number, index: number): TreePlant {
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
  createShrub(species: PlantSpecies, size: PlantSize, x: number, y: number, index: number): ShrubPlant {
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
  createHerbaceous(species: PlantSpecies, size: PlantSize, x: number, y: number, index: number): HerbaceousPlant {
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
  createGroundCover(species: PlantSpecies, size: PlantSize, x: number, y: number, index: number): GroundCoverPlant {
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
