import { IMapHistoryRepository, UserId, MapHistory, MapId } from '@lazy-map/domain';

/**
 * In-memory implementation of map history repository (for testing and development)
 */
export class InMemoryMapHistoryRepository implements IMapHistoryRepository {
  private histories: Map<string, MapHistory> = new Map();

  async save(mapHistory: MapHistory): Promise<void> {
    this.histories.set(mapHistory.userId.value, mapHistory);
  }

  async findByUserId(userId: UserId): Promise<MapHistory | null> {
    return this.histories.get(userId.value) || null;
  }

  async addMapToHistory(userId: UserId, mapId: MapId, mapName: string, thumbnailData?: string): Promise<void> {
    let history = await this.findByUserId(userId);
    
    if (!history) {
      history = new MapHistory(userId, []);
    }

    history.addMap(mapId, mapName, new Date(), thumbnailData);
    await this.save(history);
  }

  async removeMapFromHistory(userId: UserId, mapId: MapId): Promise<boolean> {
    const history = await this.findByUserId(userId);
    
    if (!history) {
      return false;
    }

    const removed = history.removeMap(mapId);
    if (removed) {
      await this.save(history);
    }

    return removed;
  }

  async hasMapInHistory(userId: UserId, mapId: MapId): Promise<boolean> {
    const history = await this.findByUserId(userId);
    return history ? history.hasMap(mapId) : false;
  }

  async clearHistory(userId: UserId): Promise<void> {
    const history = await this.findByUserId(userId);
    
    if (history) {
      history.clear();
      await this.save(history);
    }
  }

  async getHistorySize(userId: UserId): Promise<number> {
    const history = await this.findByUserId(userId);
    return history ? history.size : 0;
  }

  // Testing utilities
  clear(): void {
    this.histories.clear();
  }

  getAllHistories(): MapHistory[] {
    return Array.from(this.histories.values());
  }
}