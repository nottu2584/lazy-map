import { Seed } from '../../../common/value-objects/Seed';
import { TacticalMapContext } from '../../value-objects/TacticalMapContext';
import { TopographyConfig } from '../../value-objects/TopographyConfig';
import { GeologyLayerData } from './IGeologyLayerService';
import { AspectDirection } from '../../entities/TacticalMapTile';

/**
 * Topographic layer data structure
 * Represents elevation and terrain features
 */
export interface TopographyLayerData {
  tiles: TopographyTileData[][];
  minElevation: number;
  maxElevation: number;
  averageSlope: number;
}

/**
 * Topographic properties for a single tile
 */
export interface TopographyTileData {
  elevation: number; // feet above base level
  slope: number; // degrees (0-90)
  aspect: AspectDirection;
  relativeElevation: number; // -1 to 1 compared to neighbors
  isRidge: boolean;
  isValley: boolean;
  isDrainage: boolean;
}

/**
 * Service interface for topographic layer generation
 * This is a PORT in Clean Architecture - implemented by infrastructure
 */
export interface ITopographyLayerService {
  /**
   * Generate the topographic layer from geology
   * @param geology Geological layer data
   * @param context Tactical map context
   * @param seed Seed for deterministic generation
   * @param config Optional topography configuration (terrain ruggedness)
   * @returns Topographic layer data
   */
  generate(
    geology: GeologyLayerData,
    context: TacticalMapContext,
    seed: Seed,
    config?: TopographyConfig
  ): Promise<TopographyLayerData>;
}