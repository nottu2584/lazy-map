import { MapTile } from '../entities';
import { Seed } from '../../common/value-objects';
import { TacticalMapContext } from '../value-objects/TacticalMapContext';
import {
  GeologyLayerData,
  TopographyLayerData,
  HydrologyLayerData,
  VegetationLayerData,
  StructuresLayerData,
  FeaturesLayerData
} from './layers';

/**
 * Input for tactical map to tile conversion
 * Contains all generated layer data
 */
export interface TacticalMapLayers {
  geology: GeologyLayerData;
  topography: TopographyLayerData;
  hydrology: HydrologyLayerData;
  vegetation: VegetationLayerData;
  structures: StructuresLayerData;
  features: FeaturesLayerData;
}

/**
 * Domain service interface for converting layered tactical map data
 * into tile-based MapGrid representation
 *
 * This converter flattens the rich layer-based generation result
 * into simple tile properties suitable for MapGrid entity
 */
export interface ITacticalMapConverter {
  /**
   * Convert layered tactical map data into 2D tile array
   *
   * @param width - Map width in tiles
   * @param height - Map height in tiles
   * @param layers - All generated layer data
   * @param context - Generation context for biome/development info
   * @param seed - Seed used for generation
   * @returns 2D array of MapTile entities
   */
  convertToTiles(
    width: number,
    height: number,
    layers: TacticalMapLayers,
    context: TacticalMapContext,
    seed: Seed
  ): MapTile[][];
}
