import { MapGrid, MapId, MapFeature, FeatureId, MapMetadata, UserId } from '@lazy-map/domain';

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
   * Saves a feature to a map
   */
  saveFeature(mapId: MapId, feature: MapFeature): Promise<void>;

  /**
   * Updates an existing feature
   */
  updateFeature(feature: MapFeature): Promise<void>;

  /**
   * Loads a feature by its ID
   */
  loadFeature(featureId: FeatureId): Promise<MapFeature | null>;

  /**
   * Loads all features for a map
   */
  loadMapFeatures(mapId: MapId): Promise<MapFeature[]>;

  /**
   * Deletes a feature
   */
  deleteFeature(featureId: FeatureId): Promise<boolean>;

  /**
   * Removes a feature (alias for deleteFeature)
   */
  removeFeature(featureId: FeatureId): Promise<boolean>;

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

  /**
   * Gets the total count of features
   */
  getFeatureCount(): Promise<number>;
}