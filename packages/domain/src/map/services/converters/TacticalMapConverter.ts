import { MapTile } from '../../entities';
import { Position } from '../../../common/value-objects/Position';
import { Seed } from '../../../common/value-objects/Seed';
import { Terrain } from '../../../contexts/relief/value-objects/TerrainType';
import { TacticalMapContext } from '../../value-objects/TacticalMapContext';
import { ITacticalMapConverter, TacticalMapLayers } from '../ITacticalMapConverter';
import { StructureType } from '../layers/IStructuresLayerService';
import { VegetationType } from '../../entities/TacticalMapTile';

/**
 * Domain service that converts layered tactical map data
 * into tile-based MapGrid representation
 *
 * Flattens complex layer data into simple tile properties:
 * - Topography → heightMultiplier
 * - Geology + Hydrology + Vegetation → terrain type
 * - Structures + Features → blocked status, features
 */
export class TacticalMapConverter implements ITacticalMapConverter {
  /**
   * Convert layered tactical map data into 2D tile array
   */
  convertToTiles(
    width: number,
    height: number,
    layers: TacticalMapLayers,
    context: TacticalMapContext,
    seed: Seed
  ): MapTile[][] {
    const tiles: MapTile[][] = [];

    for (let y = 0; y < height; y++) {
      tiles[y] = [];
      for (let x = 0; x < width; x++) {
        tiles[y][x] = this.convertTile(x, y, layers);
      }
    }

    return tiles;
  }

  /**
   * Convert a single tile's layered data into MapTile
   */
  private convertTile(x: number, y: number, layers: TacticalMapLayers): MapTile {
    const position = new Position(x, y);

    // Extract data from each layer
    const geologyTile = layers.geology.tiles[y][x];
    const topographyTile = layers.topography.tiles[y][x];
    const hydrologyTile = layers.hydrology.tiles[y][x];
    const vegetationTile = layers.vegetation.tiles[y][x];
    const structureTile = layers.structures.tiles[y][x];

    // Determine terrain type by priority
    const terrain = this.determineTerrain(
      structureTile,
      hydrologyTile,
      vegetationTile,
      topographyTile,
      geologyTile
    );

    // Calculate height multiplier from elevation
    // Normalize elevation to reasonable multiplier (0.5 to 2.0)
    const heightMultiplier = this.calculateHeightMultiplier(topographyTile.elevation);

    // Create the tile
    const tile = new MapTile(position, terrain, heightMultiplier);

    // Apply blocking if structure exists
    if (structureTile.hasStructure && !structureTile.isRoad && !structureTile.isPath) {
      tile.block();
    }

    // Apply blocking if vegetation is impassable
    if (!vegetationTile.isPassable) {
      tile.block();
    }

    return tile;
  }

  /**
   * Determine terrain type by checking layers in priority order:
   * 1. Structures (highest priority - buildings, walls, roads)
   * 2. Hydrology (water features)
   * 3. Vegetation (forests, dense growth)
   * 4. Topography + Geology (mountains, rocks, grass)
   */
  private determineTerrain(
    structure: any,
    hydrology: any,
    vegetation: any,
    topography: any,
    geology: any
  ): Terrain {
    // Priority 1: Structures
    if (structure.hasStructure) {
      switch (structure.structureType) {
        case StructureType.WALL:
          return Terrain.wall();
        case StructureType.HOUSE:
        case StructureType.BARN:
        case StructureType.TOWER:
        case StructureType.WELL:
        case StructureType.SHRINE:
          return Terrain.building();
        case StructureType.ROAD:
        case StructureType.BRIDGE:
          return Terrain.road();
        default:
          return Terrain.building();
      }
    }

    if (structure.isRoad) {
      return Terrain.road();
    }

    // Priority 2: Water
    if (hydrology.waterDepth > 0 || hydrology.isStream || hydrology.isPool) {
      return Terrain.water();
    }

    // Priority 3: Dense vegetation
    if (vegetation.vegetationType === VegetationType.DENSE_TREES ||
        vegetation.vegetationType === VegetationType.SPARSE_TREES) {
      return Terrain.forest();
    }

    // Priority 4: Topography (high elevation = mountain)
    if (topography.elevation > 40) { // Above 40 feet is mountainous
      return Terrain.mountain();
    }

    if (topography.isRidge) {
      return Terrain.mountain();
    }

    // Default: Grass (basic passable terrain)
    return Terrain.grass();
  }

  /**
   * Calculate height multiplier from elevation in feet
   * Normalizes to a reasonable range for rendering
   *
   * @param elevation - Elevation in feet
   * @returns Height multiplier (0.5 to 2.5)
   */
  private calculateHeightMultiplier(elevation: number): number {
    // Normalize elevation to multiplier
    // Assuming base elevation around 0-100 feet
    // 0 feet → 0.5 multiplier (low areas)
    // 50 feet → 1.0 multiplier (normal)
    // 100+ feet → 2.0+ multiplier (elevated)

    if (elevation <= 0) {
      return 0.5;
    }

    if (elevation >= 100) {
      return 2.0 + ((elevation - 100) / 100); // Scale beyond 2.0 for very high areas
    }

    // Linear interpolation between 0.5 and 2.0 for 0-100 feet
    return 0.5 + (elevation / 100) * 1.5;
  }
}
