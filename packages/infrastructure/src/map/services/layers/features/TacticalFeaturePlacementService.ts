import { Injectable, Inject, Optional } from '@nestjs/common';
import {
  Seed,
  NoiseGenerator,
  Position,
  BuildingType,
  type ILogger,
  FeatureType,
  TacticalFeatureLocation,
  GeologyLayerData,
  TopographyLayerData,
  HydrologyLayerData,
  VegetationLayerData,
  StructuresLayerData
} from '@lazy-map/domain';

@Injectable()
export class TacticalFeaturePlacementService {
  constructor(
    @Optional() @Inject('ILogger')
    private readonly logger?: ILogger
  ) {}

  identifyTacticalFeatures(
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
  ): TacticalFeatureLocation[] {
    const features: TacticalFeatureLocation[] = [];
    const tacticalNoise = NoiseGenerator.create(seed.getValue() * 16);

    // High ground positions
    const highPoints = this.findHighPoints(layers.topography);
    for (const point of highPoints) {
      if (
        layers.vegetation.tiles[point.y][point.x].isPassable &&
        tacticalNoise.generateAt(point.x * 0.1, point.y * 0.1) > 0.7
      ) {
        features.push({
          position: new Position(point.x, point.y),
          type: FeatureType.HIGH_GROUND,
          controlRadius: 5
        });
      }
    }

    // Choke points in valleys
    const chokePoints = this.findChokePoints(width, height, layers.topography, layers.vegetation);
    for (const choke of chokePoints) {
      features.push({
        position: new Position(choke.x, choke.y),
        type: FeatureType.CHOKE_POINT,
        controlRadius: 3
      });
    }

    // Ambush sites in dense vegetation near roads
    for (const segment of layers.structures.roads.segments) {
      for (const point of segment.points) {
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            if (dx === 0 && dy === 0) continue;
            const x = point.x + dx;
            const y = point.y + dy;

            if (
              x >= 0 && x < width && y >= 0 && y < height &&
              layers.vegetation.tiles[y][x].providesConcealment &&
              tacticalNoise.generateAt(x * 0.2, y * 0.2) > 0.85
            ) {
              features.push({
                position: new Position(x, y),
                type: FeatureType.AMBUSH_SITE,
                controlRadius: 2
              });
            }
          }
        }
      }
    }

    // Vantage points on elevated structures
    for (const building of layers.structures.buildings) {
      if (building.getType() === BuildingType.TOWER) {
        const pos = building.getPosition();
        features.push({
          position: new Position(pos.x, pos.y),
          type: FeatureType.VANTAGE_POINT,
          controlRadius: 8
        });
      }
    }

    this.logger?.debug('Identified tactical features', { metadata: { count: features.length } });

    return features;
  }

  private findHighPoints(topography: TopographyLayerData): { x: number; y: number }[] {
    const points: { x: number; y: number }[] = [];
    const threshold = topography.maxElevation * 0.8;

    for (let y = 0; y < topography.tiles.length; y++) {
      for (let x = 0; x < topography.tiles[y].length; x++) {
        if (topography.tiles[y][x].elevation >= threshold) {
          points.push({ x, y });
        }
      }
    }

    return points;
  }

  private findChokePoints(
    width: number,
    height: number,
    topography: TopographyLayerData,
    vegetation: VegetationLayerData
  ): { x: number; y: number }[] {
    const chokePoints: { x: number; y: number }[] = [];

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        if (topography.tiles[y][x].isValley && vegetation.tiles[y][x].isPassable) {
          let blockedSides = 0;
          if (!vegetation.tiles[y - 1][x].isPassable) blockedSides++;
          if (!vegetation.tiles[y + 1][x].isPassable) blockedSides++;
          if (!vegetation.tiles[y][x - 1].isPassable) blockedSides++;
          if (!vegetation.tiles[y][x + 1].isPassable) blockedSides++;

          if (blockedSides >= 2) {
            chokePoints.push({ x, y });
          }
        }
      }
    }

    return chokePoints;
  }
}
