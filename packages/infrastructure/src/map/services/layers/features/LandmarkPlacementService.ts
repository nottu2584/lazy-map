import { Injectable, Inject, Optional } from '@nestjs/common';
import {
  Seed,
  NoiseGenerator,
  Position,
  VegetationType,
  TerrainFeature,
  type ILogger,
  FeatureType,
  LandmarkLocation,
  GeologyLayerData,
  TopographyLayerData,
  HydrologyLayerData,
  VegetationLayerData,
  StructuresLayerData,
  TopographyTileData
} from '@lazy-map/domain';

@Injectable()
export class LandmarkPlacementService {
  constructor(
    @Optional() @Inject('ILogger')
    private readonly logger?: ILogger
  ) {}

  placeLandmarks(
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
  ): LandmarkLocation[] {
    const landmarks: LandmarkLocation[] = [];
    const landmarkNoise = NoiseGenerator.create(seed.getValue() * 15);

    // Ancient trees in old forests
    for (let y = 2; y < height - 2; y++) {
      for (let x = 2; x < width - 2; x++) {
        if (
          layers.vegetation.tiles[y][x].vegetationType === VegetationType.DENSE_TREES &&
          layers.vegetation.tiles[y][x].canopyHeight > 30 &&
          landmarkNoise.generateAt(x * 0.1, y * 0.1) > 0.95
        ) {
          landmarks.push({
            position: new Position(x, y),
            type: FeatureType.ANCIENT_TREE,
            significance: 0.7,
            lore: "An ancient tree, centuries old, its gnarled roots tell stories of ages past"
          });
        }
      }
    }

    // Standing stones on high ground (ridges)
    for (const ridge of this.findRidges(layers.topography)) {
      if (landmarkNoise.generateAt(ridge.x * 0.15, ridge.y * 0.15) > 0.9) {
        landmarks.push({
          position: new Position(ridge.x, ridge.y),
          type: FeatureType.STANDING_STONES,
          significance: 0.8,
          lore: "Weathered stones arranged in an ancient pattern, their purpose lost to time"
        });
      }
    }

    // Cave entrances
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (
          layers.geology.tiles[y][x].features.includes(TerrainFeature.CAVE) &&
          landmarkNoise.generateAt(x * 0.2, y * 0.2) > 0.85
        ) {
          landmarks.push({
            position: new Position(x, y),
            type: FeatureType.CAVE_ENTRANCE,
            significance: 0.6,
            lore: "A dark opening in the rock face beckons the brave or foolish"
          });
        }
      }
    }

    // Battlefield remains near ruins
    for (const building of layers.structures.buildings) {
      const pos = building.getPosition();
      if (
        building.isRuin() &&
        landmarkNoise.generateAt(pos.x * 0.1, pos.y * 0.1) > 0.7
      ) {
        landmarks.push({
          position: new Position(pos.x, pos.y),
          type: FeatureType.BATTLEFIELD_REMAINS,
          significance: 0.5,
          lore: "Rusted weapons and broken shields tell of a forgotten battle"
        });
      }
    }

    this.logger?.debug('Placed landmarks', { metadata: { count: landmarks.length } });

    return landmarks;
  }

  private findRidges(topography: TopographyLayerData): { x: number; y: number }[] {
    const ridges: { x: number; y: number }[] = [];
    const tiles = topography.tiles as TopographyTileData[][];

    for (let y = 0; y < tiles.length; y++) {
      for (let x = 0; x < tiles[y].length; x++) {
        if (tiles[y][x].isRidge) {
          ridges.push({ x, y });
        }
      }
    }

    return ridges;
  }
}
