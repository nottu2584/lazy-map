import { Injectable, Optional, Inject } from '@nestjs/common';
import {
  VegetationTileData,
  VegetationType,
  ForestPatch,
  Plant,
  TreePlant,
  GroundCoverPlant,
  PlantSpecies,
  HydrologyLayerData,
  type ILogger
} from '@lazy-map/domain';

/**
 * Generates tile data combining vegetation properties
 * Handles forest patch extraction and statistics calculation
 */
@Injectable()
export class TileGenerationService {
  constructor(
    @Optional() @Inject('ILogger') private readonly logger?: ILogger
  ) {}

  /**
   * Create tile data combining all vegetation properties
   */
  createTileData(
    plants: Plant[][][],
    tacticalProps: { canopyHeight: number[][]; canopyDensity: number[][]; vegetationType: VegetationType[][] },
    hydrology: HydrologyLayerData,
    width: number,
    height: number
  ): VegetationTileData[][] {
    const tiles: VegetationTileData[][] = [];

    for (let y = 0; y < height; y++) {
      tiles[y] = [];
      for (let x = 0; x < width; x++) {
        const tilePlants = plants[y][x];
        const vegType = tacticalProps.vegetationType[y][x];

        // Determine dominant species
        let dominantSpecies: PlantSpecies | null = null;
        if (tilePlants.length > 0) {
          const speciesCount = new Map<PlantSpecies, number>();
          for (const plant of tilePlants) {
            const count = speciesCount.get(plant.species) || 0;
            speciesCount.set(plant.species, count + 1);
          }
          let maxCount = 0;
          speciesCount.forEach((count, species) => {
            if (count > maxCount) {
              maxCount = count;
              dominantSpecies = species;
            }
          });
        }

        // Calculate passability
        const isPassable = vegType !== VegetationType.DENSE_TREES &&
                          hydrology.tiles[y][x].waterDepth < 2;

        // Concealment and cover
        const providesConcealment = tacticalProps.canopyDensity[y][x] > 0.3 ||
                                   vegType === VegetationType.SHRUBS;
        const providesCover = vegType === VegetationType.DENSE_TREES ||
                             (vegType === VegetationType.SPARSE_TREES && tacticalProps.canopyHeight[y][x] > 15);

        tiles[y][x] = {
          canopyHeight: tacticalProps.canopyHeight[y][x],
          canopyDensity: tacticalProps.canopyDensity[y][x],
          vegetationType: vegType,
          dominantSpecies,
          plants: tilePlants,
          groundCover: tilePlants.some(p => p instanceof GroundCoverPlant) ? 0.8 : 0.2,
          isPassable,
          providesConcealment,
          providesCover
        };
      }
    }

    return tiles;
  }

  /**
   * Extract contiguous forest patches
   */
  extractForestPatches(tiles: VegetationTileData[][], width: number, height: number): ForestPatch[] {
    const patches: ForestPatch[] = [];
    const visited: boolean[][] = [];

    for (let y = 0; y < height; y++) {
      visited[y] = Array.from({ length: width }, () => false);
    }

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (!visited[y][x] &&
            (tiles[y][x].vegetationType === VegetationType.DENSE_TREES ||
             tiles[y][x].vegetationType === VegetationType.SPARSE_TREES)) {
          const patch = this.traceForestPatch(x, y, tiles, visited, width, height);
          if (patch.tiles.length >= 3) {
            patches.push(patch);
          }
        }
      }
    }

    return patches;
  }

  /**
   * Trace a contiguous forest patch
   */
  traceForestPatch(
    startX: number,
    startY: number,
    tiles: VegetationTileData[][],
    visited: boolean[][],
    width: number,
    height: number
  ): ForestPatch {
    const patchTiles: { x: number; y: number }[] = [];
    const queue: { x: number; y: number }[] = [{ x: startX, y: startY }];
    visited[startY][startX] = true;

    let coniferCount = 0;
    let deciduousCount = 0;
    let totalDensity = 0;

    while (queue.length > 0) {
      const { x, y } = queue.shift()!;
      patchTiles.push({ x, y });

      // Track forest composition
      const tilePlants = tiles[y][x].plants;
      for (const plant of tilePlants) {
        if (plant instanceof TreePlant) {
          if (plant.species === PlantSpecies.PINE) coniferCount++;
          else deciduousCount++;
        }
      }
      totalDensity += tiles[y][x].canopyDensity;

      // Check neighbors
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nx = x + dx;
          const ny = y + dy;

          if (nx >= 0 && nx < width && ny >= 0 && ny < height &&
              !visited[ny][nx] &&
              (tiles[ny][nx].vegetationType === VegetationType.DENSE_TREES ||
               tiles[ny][nx].vegetationType === VegetationType.SPARSE_TREES)) {
            visited[ny][nx] = true;
            queue.push({ x: nx, y: ny });
          }
        }
      }
    }

    // Determine forest type
    let type: 'deciduous' | 'coniferous' | 'mixed';
    if (coniferCount > deciduousCount * 2) type = 'coniferous';
    else if (deciduousCount > coniferCount * 2) type = 'deciduous';
    else type = 'mixed';

    return {
      tiles: patchTiles,
      type,
      density: totalDensity / patchTiles.length
    };
  }

  /**
   * Calculate layer statistics
   */
  calculateStatistics(tiles: VegetationTileData[][], width: number, height: number): {
    treeCount: number;
    avgCanopy: number;
  } {
    let treeCount = 0;
    let totalCanopy = 0;
    let canopyTiles = 0;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const tilePlants = tiles[y][x].plants;
        for (const plant of tilePlants) {
          if (plant instanceof TreePlant) treeCount++;
        }

        if (tiles[y][x].canopyDensity > 0) {
          totalCanopy += tiles[y][x].canopyDensity;
          canopyTiles++;
        }
      }
    }

    return {
      treeCount,
      avgCanopy: canopyTiles > 0 ? totalCanopy / canopyTiles : 0
    };
  }
}
