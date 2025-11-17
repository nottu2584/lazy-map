import { Seed } from '../../../common/value-objects/Seed';
import { TacticalMapContext } from '../../value-objects/TacticalMapContext';
import { VegetationLayerData } from './IVegetationLayerService';
import { HydrologyLayerData } from './IHydrologyLayerService';
import { TopographyLayerData } from './ITopographyLayerService';
import { Building } from '../../../contexts/artificial/entities/Building';
import { Bridge } from '../../../contexts/artificial/entities/Bridge';
import { MaterialType } from '../../../contexts/artificial/enums/MaterialType';

/**
 * Structures layer data structure
 * Represents buildings and infrastructure
 */
export interface StructuresLayerData {
  tiles: StructureTileData[][];
  buildings: Building[];
  roads: RoadNetwork;
  bridges: Bridge[];
  totalStructureCount: number;
}

/**
 * Structure properties for a single tile
 */
export interface StructureTileData {
  hasStructure: boolean;
  structureType: StructureType | null;
  material: MaterialType | null;
  height: number; // feet above ground
  isRoad: boolean;
  isPath: boolean;
  condition: StructureCondition;
}

/**
 * Types of structures
 */
export enum StructureType {
  HOUSE = 'house',
  BARN = 'barn',
  TOWER = 'tower',
  WALL = 'wall',
  ROAD = 'road',
  BRIDGE = 'bridge',
  WELL = 'well',
  SHRINE = 'shrine',
  RUIN = 'ruin'
}

/**
 * Condition of structures
 */
export enum StructureCondition {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor',
  RUINED = 'ruined'
}

/**
 * Road network representation
 */
export interface RoadNetwork {
  segments: RoadSegment[];
  intersections: { x: number; y: number }[];
  totalLength: number;
}

/**
 * A segment of road between intersections
 */
export interface RoadSegment {
  points: { x: number; y: number }[];
  width: number; // tiles
  material: MaterialType;
}

/**
 * Service interface for structures layer generation
 * This is a PORT in Clean Architecture - implemented by infrastructure
 */
export interface IStructuresLayerService {
  /**
   * Generate the structures layer from vegetation, hydrology, and topography
   * @param vegetation Vegetation layer data
   * @param hydrology Hydrological layer data
   * @param topography Topographic layer data
   * @param context Tactical map context
   * @param seed Seed for deterministic generation
   * @returns Structures layer data
   */
  generate(
    vegetation: VegetationLayerData,
    hydrology: HydrologyLayerData,
    topography: TopographyLayerData,
    context: TacticalMapContext,
    seed: Seed
  ): Promise<StructuresLayerData>;
}