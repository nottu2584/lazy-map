import { UserId } from '../../contexts/user/value-objects/UserId';
import { MapId } from './MapGrid';

/**
 * Represents a user's map history entry
 */
export class MapHistoryEntry {
  constructor(
    public readonly mapId: MapId,
    public readonly mapName: string,
    public readonly createdAt: Date,
    public readonly thumbnailData?: string // Base64 encoded thumbnail
  ) {}

  get age(): number {
    return Date.now() - this.createdAt.getTime();
  }

  equals(other: MapHistoryEntry): boolean {
    return this.mapId.equals(other.mapId);
  }
}

/**
 * Manages a user's map history with a maximum limit
 */
export class MapHistory {
  private static readonly MAX_HISTORY_SIZE = 10;
  private _entries: MapHistoryEntry[] = [];

  constructor(
    public readonly userId: UserId,
    entries: MapHistoryEntry[] = []
  ) {
    this._entries = [...entries];
    this.enforceLimit();
  }

  get entries(): ReadonlyArray<MapHistoryEntry> {
    return this._entries;
  }

  get size(): number {
    return this._entries.length;
  }

  get isEmpty(): boolean {
    return this._entries.length === 0;
  }

  get isFull(): boolean {
    return this._entries.length >= MapHistory.MAX_HISTORY_SIZE;
  }

  /**
   * Add a new map to the history
   * If the map already exists, it will be moved to the front
   * If the history is full, the oldest entry will be removed
   */
  addMap(mapId: MapId, mapName: string, accessedAt: Date, thumbnailData?: string): void {
    const existingIndex = this._entries.findIndex(entry => entry.mapId.equals(mapId));

    // Remove existing entry if found
    if (existingIndex !== -1) {
      this._entries.splice(existingIndex, 1);
    }

    // Add new entry at the beginning (most recent)
    const newEntry = new MapHistoryEntry(mapId, mapName, accessedAt, thumbnailData);
    this._entries.unshift(newEntry);

    // Enforce size limit
    this.enforceLimit();
  }

  /**
   * Remove a map from the history
   */
  removeMap(mapId: MapId): boolean {
    const index = this._entries.findIndex(entry => entry.mapId.equals(mapId));
    if (index !== -1) {
      this._entries.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Get a specific history entry
   */
  getEntry(mapId: MapId): MapHistoryEntry | null {
    return this._entries.find(entry => entry.mapId.equals(mapId)) || null;
  }

  /**
   * Check if a map is in the history
   */
  hasMap(mapId: MapId): boolean {
    return this._entries.some(entry => entry.mapId.equals(mapId));
  }

  /**
   * Get the most recent maps (up to limit)
   */
  getRecentMaps(limit: number = MapHistory.MAX_HISTORY_SIZE): MapHistoryEntry[] {
    return this._entries.slice(0, Math.min(limit, this._entries.length));
  }

  /**
   * Clear all history
   */
  clear(): void {
    this._entries = [];
  }

  /**
   * Get maps older than the specified date
   */
  getOlderThan(date: Date): MapHistoryEntry[] {
    return this._entries.filter(entry => entry.createdAt < date);
  }

  private enforceLimit(): void {
    if (this._entries.length > MapHistory.MAX_HISTORY_SIZE) {
      this._entries = this._entries.slice(0, MapHistory.MAX_HISTORY_SIZE);
    }
  }

  static get maxSize(): number {
    return MapHistory.MAX_HISTORY_SIZE;
  }

  toString(): string {
    return `MapHistory(userId: ${this.userId.value}, entries: ${this._entries.length}/${MapHistory.MAX_HISTORY_SIZE})`;
  }
}