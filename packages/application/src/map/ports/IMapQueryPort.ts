import { MapGrid, MapId, MapTile } from '@lazy-map/domain';

/**
 * Query for retrieving a specific map
 */
export interface GetMapQuery {
  mapId: string;
}

/**
 * Query for retrieving a specific tile
 */
export interface GetMapTileQuery {
  mapId: string;
  x: number;
  y: number;
}

/**
 * Query for listing maps
 */
export interface ListMapsQuery {
  nameFilter?: string;
  author?: string;
  tags?: string[];
  minSize?: number;
  maxSize?: number;
  createdAfter?: Date;
  createdBefore?: Date;
  biomeType?: string;
  hasFeatures?: string[]; // Feature types that must be present
  limit?: number;
  offset?: number;
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'author' | 'size';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Legacy alias for ListMapsQuery
 */
export interface MapQuery extends ListMapsQuery {}

/**
 * Map summary for list views
 */
export interface MapSummary {
  id: string;
  name: string;
  dimensions: { width: number; height: number };
  cellSize: number;
  author?: string;
  description?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  featureCount: number;
  biomeType?: string;
}

/**
 * Detailed tile information
 */
export interface TileDetails {
  position: { x: number; y: number };
  terrainType: string;
  heightMultiplier: number;
  movementCost: number;
  isBlocked: boolean;
  features: {
    primaryFeature?: string;
    mixedFeatures: string[];
  };
  customProperties: Record<string, any>;
}

/**
 * Map statistics
 */
export interface MapStatistics {
  totalTiles: number;
  terrainDistribution: Record<string, number>;
  featureDistribution: Record<string, number>;
  averageHeight: number;
  heightRange: { min: number; max: number };
  blockedTileCount: number;
  accessibilityScore: number; // 0-1 representing how accessible the map is
}

/**
 * Generic result for map query operations
 */
export interface MapQueryResult<T> {
  success: boolean;
  data: T;
  error?: string;
  metadata?: {
    total?: number;
    limit?: number;
    offset?: number;
    hasMore?: boolean;
  };
}

/**
 * Paginated result for map queries
 */
export interface MapListResult {
  maps: MapSummary[];
  total: number;
  hasMore: boolean;
}

/**
 * Primary port for map query operations
 */
export interface IMapQueryPort {
  /**
   * Gets a map by its ID
   */
  getMapById(mapId: string): Promise<MapGrid | null>;

  /**
   * Gets a map summary by its ID
   */
  getMapSummary(mapId: string): Promise<MapSummary | null>;

  /**
   * Finds maps based on query criteria
   */
  findMaps(query: MapQuery): Promise<MapListResult>;

  /**
   * Gets detailed information about a specific tile
   */
  getTileDetails(mapId: string, x: number, y: number): Promise<TileDetails | null>;

  /**
   * Gets tiles in a specific area of a map
   */
  getTilesInArea(
    mapId: string, 
    x: number, 
    y: number, 
    width: number, 
    height: number
  ): Promise<MapTile[]>;

  /**
   * Gets statistics about a map
   */
  getMapStatistics(mapId: string): Promise<MapStatistics | null>;

  /**
   * Checks if a map exists
   */
  mapExists(mapId: string): Promise<boolean>;

  /**
   * Gets the total count of maps
   */
  getMapCount(): Promise<number>;

  /**
   * Gets recently created maps
   */
  getRecentMaps(limit?: number): Promise<MapSummary[]>;

  /**
   * Gets maps by author
   */
  getMapsByAuthor(author: string, limit?: number): Promise<MapSummary[]>;

  /**
   * Searches maps by text (name, description, tags)
   */
  searchMaps(searchText: string, limit?: number): Promise<MapSummary[]>;
}