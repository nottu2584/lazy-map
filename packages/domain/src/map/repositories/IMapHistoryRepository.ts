import { UserId } from '../../contexts/user/value-objects/UserId';
import { MapHistory } from '../entities/MapHistory';
import { MapId } from '../entities/MapGrid';

/**
 * Repository interface for MapHistory aggregate
 */
export interface IMapHistoryRepository {
  /**
   * Save a user's map history
   */
  save(mapHistory: MapHistory): Promise<void>;

  /**
   * Find a user's map history
   */
  findByUserId(userId: UserId): Promise<MapHistory | null>;

  /**
   * Add a map to a user's history
   * Creates history if it doesn't exist
   */
  addMapToHistory(userId: UserId, mapId: MapId, mapName: string, thumbnailData?: string): Promise<void>;

  /**
   * Remove a map from a user's history
   */
  removeMapFromHistory(userId: UserId, mapId: MapId): Promise<boolean>;

  /**
   * Check if a user has a specific map in their history
   */
  hasMapInHistory(userId: UserId, mapId: MapId): Promise<boolean>;

  /**
   * Clear a user's entire history
   */
  clearHistory(userId: UserId): Promise<void>;

  /**
   * Get count of maps in user's history
   */
  getHistorySize(userId: UserId): Promise<number>;
}