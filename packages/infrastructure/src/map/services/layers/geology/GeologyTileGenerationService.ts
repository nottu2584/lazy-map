import { Injectable, Inject, Optional } from '@nestjs/common';
import {
  GeologicalFormation,
  TerrainFeature,
  GeologyTileData,
  Position,
  type ILogger
} from '@lazy-map/domain';

@Injectable()
export class GeologyTileGenerationService {
  constructor(
    @Optional() @Inject('ILogger')
    private readonly logger?: ILogger
  ) {}

  createTiles(
    width: number,
    height: number,
    bedrock: GeologicalFormation[][],
    weatheredSurface: TerrainFeature[][][],
    soilDepths: number[][]
  ): GeologyTileData[][] {
    const tiles: GeologyTileData[][] = [];

    for (let y = 0; y < height; y++) {
      tiles[y] = [];
      for (let x = 0; x < width; x++) {
        const formation = bedrock[y][x];
        const features = weatheredSurface[y][x];
        const soilDepth = soilDepths[y][x];
        const fractureIntensity = 1 / (formation.structure.jointSpacing + 1);

        tiles[y][x] = {
          formation,
          soilDepth,
          permeability: formation.properties.permeability,
          features,
          fractureIntensity
        };
      }
    }

    this.logger?.debug('Created geology tile data', {
      metadata: { width, height }
    });

    return tiles;
  }

  findTransitionZones(
    width: number,
    height: number,
    bedrock: GeologicalFormation[][]
  ): Position[] {
    const transitions: Position[] = [];

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const current = bedrock[y][x];
        const neighbors = [
          bedrock[y - 1][x],
          bedrock[y + 1][x],
          bedrock[y][x - 1],
          bedrock[y][x + 1]
        ];

        if (neighbors.some(n => n !== current)) {
          transitions.push(new Position(x, y));
        }
      }
    }

    return transitions;
  }
}
