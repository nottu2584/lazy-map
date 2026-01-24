import { Seed } from '../../../common/value-objects/Seed';
import { TacticalMapContext } from '../../value-objects/TacticalMapContext';
import { VegetationConfig } from '../../value-objects/VegetationConfig';
import { GeologyLayerData } from './IGeologyLayerService';
import { TopographyLayerData } from './ITopographyLayerService';
import { HydrologyLayerData } from './IHydrologyLayerService';
import { Plant } from '../../../contexts/natural/entities/plant/Plant';
import { PlantSpecies } from '../../../contexts/natural/entities/plant/value-objects';
import { VegetationType } from '../../entities/TacticalMapTile';

/**
 * Vegetation layer data structure
 * Represents plant life and forests
 */
export interface VegetationLayerData {
  tiles: VegetationTileData[][];
  forestPatches: ForestPatch[];
  clearings: { x: number; y: number; radius: number }[];
  totalTreeCount: number;
  averageCanopyCoverage: number; // 0-1
}

/**
 * Vegetation properties for a single tile
 */
export interface VegetationTileData {
  canopyHeight: number; // feet above ground
  canopyDensity: number; // 0-1 coverage
  vegetationType: VegetationType;
  dominantSpecies: PlantSpecies | null;
  plants: Plant[]; // Individual plants in this tile
  groundCover: number; // 0-1 ground vegetation coverage
  isPassable: boolean; // Can units move through
  providesConcealment: boolean;
  providesCover: boolean; // Hard cover for combat
}

/**
 * Represents a contiguous forest area
 */
export interface ForestPatch {
  tiles: { x: number; y: number }[];
  type: 'deciduous' | 'coniferous' | 'mixed';
  density: number; // 0-1
}

/**
 * Service interface for vegetation layer generation
 * This is a PORT in Clean Architecture - implemented by infrastructure
 */
export interface IVegetationLayerService {
  /**
   * Generate the vegetation layer from hydrology, topography, and geology
   * @param hydrology Hydrological layer data
   * @param topography Topographic layer data
   * @param geology Geological layer data
   * @param context Tactical map context
   * @param seed Seed for deterministic generation
   * @param config Optional vegetation configuration (density control)
   * @returns Vegetation layer data
   */
  generate(
    hydrology: HydrologyLayerData,
    topography: TopographyLayerData,
    geology: GeologyLayerData,
    context: TacticalMapContext,
    seed: Seed,
    config?: VegetationConfig
  ): Promise<VegetationLayerData>;
}