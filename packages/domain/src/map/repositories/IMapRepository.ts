import { GridMap, MapId } from '../entities';
import { FeatureArea } from '../../common/value-objects/FeatureArea';

/**
 * Query parameters for map searches
 */
export interface MapQuery {
  authorFilter?: string;
  tagFilter?: string[];
  nameFilter?: string;
  sizeFilter?: {
    minWidth?: number;
    maxWidth?: number;
    minHeight?: number;
    maxHeight?: number;
  };
  createdAfter?: Date;
  createdBefore?: Date;
  limit?: number;
  offset?: number;
}

/**
 * Paginated result for map queries
 */
export interface PaginatedMapResult {
  maps: GridMap[];
  total: number;
  hasMore: boolean;
}

/**
 * Repository interface for map persistence
 */
export interface IMapRepository {
  /**
   * Saves a map to the repository
   */
  save(map: GridMap): Promise<void>;

  /**
   * Finds a map by its ID
   */
  findById(id: MapId): Promise<GridMap | null>;

  /**
   * Finds maps based on query parameters
   */
  findByQuery(query: MapQuery): Promise<PaginatedMapResult>;

  /**
   * Finds maps that intersect with a given area
   */
  findByArea(area: FeatureArea): Promise<GridMap[]>;

  /**
   * Deletes a map by its ID
   */
  delete(id: MapId): Promise<boolean>;

  /**
   * Checks if a map exists
   */
  exists(id: MapId): Promise<boolean>;

  /**
   * Updates an existing map
   */
  update(map: GridMap): Promise<void>;

  /**
   * Gets the total count of maps
   */
  count(): Promise<number>;
}