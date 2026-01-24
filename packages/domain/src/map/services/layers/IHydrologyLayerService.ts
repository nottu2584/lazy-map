import { Seed } from '../../../common/value-objects/Seed';
import { TacticalMapContext } from '../../value-objects/TacticalMapContext';
import { HydrologyConfig } from '../../value-objects/HydrologyConfig';
import { GeologyLayerData } from './IGeologyLayerService';
import { TopographyLayerData } from './ITopographyLayerService';
import { MoistureLevel } from '../../../contexts/natural/value-objects/MoistureLevel';

/**
 * Hydrological layer data structure
 * Represents water features and flow
 */
export interface HydrologyLayerData {
  tiles: HydrologyTileData[][];
  streams: StreamSegment[];
  springs: { x: number; y: number }[];
  totalWaterCoverage: number; // Percentage of map with water
}

/**
 * Hydrological properties for a single tile
 */
export interface HydrologyTileData {
  flowAccumulation: number; // Upstream contributing area (number of tiles)
  flowDirection: number; // Direction of water flow (0-7, -1 for sink)
  waterDepth: number; // Standing/flowing water depth in feet
  moisture: MoistureLevel;
  isSpring: boolean; // Water source
  isStream: boolean; // Part of a stream
  isPool: boolean; // Standing water
  streamOrder: number; // Strahler stream order (0 = no stream)
}

/**
 * Represents a continuous stream segment
 */
export interface StreamSegment {
  points: { x: number; y: number }[];
  order: number; // Strahler order
  width: number; // tiles wide
}

/**
 * Service interface for hydrological layer generation
 * This is a PORT in Clean Architecture - implemented by infrastructure
 */
export interface IHydrologyLayerService {
  /**
   * Generate the hydrological layer from topography and geology
   * @param topography Topographic layer data
   * @param geology Geological layer data
   * @param context Tactical map context
   * @param seed Seed for deterministic generation
   * @param config Optional hydrology configuration (water abundance)
   * @returns Hydrological layer data
   */
  generate(
    topography: TopographyLayerData,
    geology: GeologyLayerData,
    context: TacticalMapContext,
    seed: Seed,
    config?: HydrologyConfig
  ): Promise<HydrologyLayerData>;
}