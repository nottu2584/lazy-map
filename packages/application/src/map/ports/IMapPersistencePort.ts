import { MapGrid, MapId, MapMetadata, UserId } from '@lazy-map/domain';

/**
 * Transaction context for atomic operations
 */
export interface TransactionContext {
  commit(): Promise<void>;
  rollback(): Promise<void>;
}

/**
 * Output port for map persistence operations
 * This will be implemented by infrastructure layer
 */
export interface IMapPersistencePort {
  /**
   * Saves a complete map with all its features
   */
  saveMap(map: MapGrid): Promise<void>;

  /**
   * Updates an existing map
   */
  updateMap(map: MapGrid): Promise<void>;

  /**
   * Loads a map by its ID
   */
  loadMap(mapId: MapId): Promise<MapGrid | null>;

  /**
   * Deletes a map and all its features
   */
  deleteMap(mapId: MapId): Promise<boolean>;

  /**
   * Checks if a map exists
   */
  mapExists(mapId: MapId): Promise<boolean>;

  /**
   * Lists maps with filtering criteria
   */
  listMaps(criteria?: any): Promise<MapMetadata[]>;

  /**
   * Finds all maps owned by a specific user
   */
  findByOwner(userId: UserId, limit?: number): Promise<MapGrid[]>;

  /**
   * Starts a transaction for atomic operations
   */
  beginTransaction(): Promise<TransactionContext>;

  /**
   * Gets the total count of maps
   */
  getMapCount(): Promise<number>;
}