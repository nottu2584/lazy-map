import { MapGrid, MapId } from '../entities';
import { UserId } from '../../contexts/user/value-objects/UserId';

/**
 * Query parameters for map searches
 */
export interface MapQuery {
  authorFilter?: string;
  tagFilter?: string[];
  nameFilter?: string;
  ownerFilter?: UserId; // Filter by map owner
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
  maps: MapGrid[];
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
  save(map: MapGrid): Promise<void>;

  /**
   * Finds a map by its ID
   */
  findById(id: MapId): Promise<MapGrid | null>;

  /**
   * Finds maps based on query parameters
   */
  findByQuery(query: MapQuery): Promise<PaginatedMapResult>;

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
  update(map: MapGrid): Promise<void>;

  /**
   * Gets the total count of maps
   */
  count(): Promise<number>;

  /**
   * Finds maps owned by a specific user
   */
  findByOwnerId(ownerId: UserId): Promise<MapGrid[]>;

  /**
   * Finds recent maps owned by a specific user
   */
  findRecentByOwnerId(ownerId: UserId, limit?: number): Promise<MapGrid[]>;

  /**
   * Counts maps owned by a specific user
   */
  countByOwnerId(ownerId: UserId): Promise<number>;

  /**
   * Checks if a user can access a specific map
   */
  canUserAccessMap(mapId: MapId, userId?: UserId): Promise<boolean>;
}