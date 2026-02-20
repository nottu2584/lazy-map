import { Injectable, Inject, Optional } from '@nestjs/common';
import {
  Seed,
  NoiseGenerator,
  Position,
  VegetationType,
  type ILogger,
  FeatureType,
  ResourceLocation,
  GeologyLayerData,
  TopographyLayerData,
  HydrologyLayerData,
  VegetationLayerData,
  StructuresLayerData
} from '@lazy-map/domain';

@Injectable()
export class ResourcePlacementService {
  constructor(
    @Optional() @Inject('ILogger')
    private readonly logger?: ILogger
  ) {}

  placeResources(
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
  ): ResourceLocation[] {
    const resources: ResourceLocation[] = [];
    const resourceNoise = NoiseGenerator.create(seed.getValue() * 14);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const random = resourceNoise.generateAt(x * 0.2, y * 0.2);

        // Medicinal herbs in forest clearings
        const isClearing = layers.vegetation.clearings.some(
          c => Math.sqrt(Math.pow(c.x - x, 2) + Math.pow(c.y - y, 2)) <= c.radius
        );
        if (isClearing && random > 0.8) {
          resources.push({
            position: new Position(x, y),
            type: FeatureType.MEDICINAL_HERBS,
            quantity: Math.ceil(random * 5),
            quality: random
          });
        }

        // Berries at forest edges
        if (
          layers.vegetation.tiles[y][x].vegetationType === VegetationType.SPARSE_TREES &&
          random > 0.85
        ) {
          resources.push({
            position: new Position(x, y),
            type: FeatureType.BERRIES,
            quantity: Math.ceil(random * 3),
            quality: random * 0.8
          });
        }

        // Fresh water at springs
        if (layers.hydrology.tiles[y][x].isSpring && random > 0.5) {
          resources.push({
            position: new Position(x, y),
            type: FeatureType.FRESH_WATER,
            quantity: 10,
            quality: 1.0
          });
        }

        // Mineral deposits in exposed rock
        if (
          layers.geology.tiles[y][x].soilDepth < 0.5 &&
          layers.geology.tiles[y][x].features.length > 0 &&
          random > 0.9
        ) {
          resources.push({
            position: new Position(x, y),
            type: FeatureType.MINERAL_DEPOSIT,
            quantity: Math.ceil(random * 7),
            quality: random * 0.7
          });
        }
      }
    }

    this.logger?.debug('Placed resources', { metadata: { count: resources.length } });

    return resources;
  }
}
