import { Position } from '../../../common/value-objects/Position';
import { Seed } from '../../../common/value-objects/Seed';

/**
 * Settlement size categories
 */
export enum SettlementSize {
  HAMLET = 'hamlet',       // 3-7 buildings
  VILLAGE = 'village',     // 8-20 buildings
  TOWN = 'town',          // 21-50 buildings
  CITY = 'city'           // 50+ buildings
}

/**
 * Historical period for architectural style
 */
export enum HistoricalPeriod {
  ANCIENT = 'ancient',
  EARLY_MEDIEVAL = 'early_medieval',
  HIGH_MEDIEVAL = 'high_medieval',
  LATE_MEDIEVAL = 'late_medieval',
  RENAISSANCE = 'renaissance'
}

/**
 * Settlement plan with building placements
 */
export interface SettlementPlan {
  size: SettlementSize;
  buildings: PlannedBuilding[];
  roads: PlannedRoad[];
  center: Position; // Town center/square
  enclosure?: SettlementEnclosure;
}

/**
 * Planned building in settlement
 */
export interface PlannedBuilding {
  type: string;
  position: Position;
  orientation: number;
  priority: number; // Build order
  shareWalls?: string[]; // IDs of buildings to share walls with
}

/**
 * Planned road/path
 */
export interface PlannedRoad {
  start: Position;
  end: Position;
  width: number;
  type: 'main' | 'secondary' | 'alley';
}

/**
 * Settlement enclosure (walls, palisade, etc.)
 */
export interface SettlementEnclosure {
  type: 'wall' | 'palisade' | 'hedge' | 'ditch';
  gates: Position[];
}

/**
 * Topographical suitability for building
 */
export interface SuitabilityMap {
  width: number;
  height: number;
  suitability: number[][]; // 0-1 values
  optimalSites: Position[];
  constraints: Position[]; // Areas that can't be built on
}

/**
 * Service interface for settlement planning
 * This is a domain interface (port) that will be implemented in infrastructure
 */
export interface ISettlementPlanningService {
  /**
   * Plan a complete settlement layout
   * @param terrain Terrain suitability map
   * @param size Settlement size
   * @param period Historical period for style
   * @param seed Seed for deterministic generation
   * @returns Settlement plan with building positions
   */
  planSettlement(
    terrain: SuitabilityMap,
    size: SettlementSize,
    period: HistoricalPeriod,
    seed: Seed
  ): Promise<SettlementPlan>;

  /**
   * Select optimal building sites from terrain
   * @param terrain Terrain data
   * @param count Number of sites needed
   * @param minSpacing Minimum spacing between buildings
   * @param seed Seed for deterministic selection
   * @returns Array of building positions
   */
  selectBuildingSites(
    terrain: SuitabilityMap,
    count: number,
    minSpacing: number,
    seed: Seed
  ): Promise<Position[]>;

  /**
   * Determine which buildings should share walls
   * @param buildings Planned buildings
   * @param maxDistance Maximum distance to consider sharing
   * @returns Map of building pairs that should share walls
   */
  determineSharedWalls(
    buildings: PlannedBuilding[],
    maxDistance: number
  ): Promise<Map<string, string[]>>;

  /**
   * Plan road network for settlement
   * @param buildings Building positions
   * @param terrain Terrain data
   * @param seed Seed for deterministic generation
   * @returns Road network connecting buildings
   */
  planRoadNetwork(
    buildings: PlannedBuilding[],
    terrain: SuitabilityMap,
    seed: Seed
  ): Promise<PlannedRoad[]>;
}