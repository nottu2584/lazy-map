import { UserId } from '../../contexts/user/value-objects/UserId';
import { MapHistory, MapHistoryEntry } from '../entities/MapHistory';
import { MapId } from '../entities/MapGrid';

/**
 * Domain service for map history operations
 */
export interface IMapHistoryService {
  /**
   * Get or create a user's map history
   */
  getUserHistory(userId: UserId): Promise<MapHistory>;

  /**
   * Add a map to user's history
   */
  addToHistory(userId: UserId, mapId: MapId, mapName: string, thumbnailData?: string): Promise<void>;

  /**
   * Remove a map from user's history
   */
  removeFromHistory(userId: UserId, mapId: MapId): Promise<boolean>;

  /**
   * Get user's recent maps
   */
  getRecentMaps(userId: UserId, limit?: number): Promise<MapHistoryEntry[]>;

  /**
   * Clear user's entire history
   */
  clearUserHistory(userId: UserId): Promise<void>;

  /**
   * Check if a map is in user's history
   */
  isMapInHistory(userId: UserId, mapId: MapId): Promise<boolean>;

  /**
   * Get the size of user's history
   */
  getHistorySize(userId: UserId): Promise<number>;

  /**
   * Clean up old entries across all users (maintenance operation)
   */
  cleanupOldEntries(olderThanDays: number): Promise<number>;
}