import { Injectable, Inject, Optional } from '@nestjs/common';
import {
  Seed,
  NoiseGenerator,
  Position,
  TerrainFeature,
  VegetationType,
  type ILogger,
  FeatureType,
  HazardLevel,
  HazardLocation,
  GeologyLayerData,
  TopographyLayerData,
  HydrologyLayerData,
  VegetationLayerData,
  StructuresLayerData
} from '@lazy-map/domain';

@Injectable()
export class HazardPlacementService {
  constructor(
    @Optional() @Inject('ILogger')
    private readonly logger?: ILogger
  ) {}

  placeHazards(
    width: number,
    height: number,
    layers: {
      geology: GeologyLayerData;
      topography: TopographyLayerData;
      hydrology: HydrologyLayerData;
      vegetation: VegetationLayerData;
      structures: StructuresLayerData;
    },
    seed: Seed
  ): HazardLocation[] {
    const hazards: HazardLocation[] = [];
    const hazardNoise = NoiseGenerator.create(seed.getValue() * 13);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        // Skip areas with structures
        if (layers.structures.tiles[y][x].hasStructure) continue;

        const random = hazardNoise.generateAt(x * 0.15, y * 0.15);

        // Quicksand in wetlands
        if (
          layers.hydrology.tiles[y][x].moisture === 'saturated' &&
          layers.topography.tiles[y][x].slope < 5 &&
          random > 0.9
        ) {
          hazards.push({
            position: new Position(x, y),
            type: FeatureType.QUICKSAND,
            level: HazardLevel.SEVERE,
            radius: 1
          });
        }

        // Unstable ground on steep slopes
        if (
          layers.topography.tiles[y][x].slope > 50 &&
          layers.geology.tiles[y][x].features.includes(TerrainFeature.TALUS) &&
          random > 0.85
        ) {
          hazards.push({
            position: new Position(x, y),
            type: FeatureType.UNSTABLE_GROUND,
            level: HazardLevel.MODERATE,
            radius: 2
          });
        }

        // Poison plants in dense vegetation
        if (
          layers.vegetation.tiles[y][x].vegetationType === VegetationType.DENSE_TREES &&
          random > 0.95
        ) {
          hazards.push({
            position: new Position(x, y),
            type: FeatureType.POISON_PLANTS,
            level: HazardLevel.MINOR,
            radius: 1
          });
        }

        // Animal dens in suitable locations
        if (
          layers.geology.tiles[y][x].features.includes(TerrainFeature.CAVE) &&
          layers.vegetation.tiles[y][x].vegetationType !== 'none' &&
          random > 0.8
        ) {
          hazards.push({
            position: new Position(x, y),
            type: FeatureType.ANIMAL_DEN,
            level: HazardLevel.MODERATE,
            radius: 3
          });
        }
      }
    }

    this.logger?.debug('Placed hazards', { metadata: { count: hazards.length } });

    return hazards;
  }
}
