import {
  MapGrid,
  MapId,
  MapMetadata,
  UserId
} from '@lazy-map/domain';
import {
  IMapPersistencePort,
  TransactionContext
} from '@lazy-map/application';

/**
 * Simple transaction context for in-memory operations
 */
class InMemoryTransactionContext implements TransactionContext {
  private operations: (() => void)[] = [];
  private rollbackOperations: (() => void)[] = [];

  addOperation(operation: () => void, rollback: () => void): void {
    this.operations.push(operation);
    this.rollbackOperations.push(rollback);
  }

  async commit(): Promise<void> {
    this.operations.forEach(op => op());
    this.operations = [];
    this.rollbackOperations = [];
  }

  async rollback(): Promise<void> {
    this.rollbackOperations.reverse().forEach(op => op());
    this.operations = [];
    this.rollbackOperations = [];
  }
}

/**
 * In-memory implementation of map persistence
 * Useful for development, testing, and demos
 */
export class InMemoryMapPersistence implements IMapPersistencePort {
  private maps = new Map<string, MapGrid>();

  async saveMap(map: MapGrid): Promise<void> {
    this.maps.set(map.id.value, map);
  }

  async updateMap(map: MapGrid): Promise<void> {
    if (!this.maps.has(map.id.value)) {
      throw new Error(`Map with ID ${map.id.value} does not exist`);
    }
    this.maps.set(map.id.value, map);
  }

  async loadMap(mapId: MapId): Promise<MapGrid | null> {
    return this.maps.get(mapId.value) || null;
  }

  async deleteMap(mapId: MapId): Promise<boolean> {
    const existed = this.maps.has(mapId.value);
    if (existed) {
      this.maps.delete(mapId.value);
    }
    return existed;
  }

  async mapExists(mapId: MapId): Promise<boolean> {
    return this.maps.has(mapId.value);
  }

  async listMaps(criteria?: any): Promise<MapMetadata[]> {
    const allMaps = Array.from(this.maps.values());
    let filteredMaps = allMaps;

    // Apply filtering criteria
    if (criteria) {
      filteredMaps = allMaps.filter(map => {
        // Author filter
        if (criteria.author && map.metadata.author !== criteria.author) {
          return false;
        }

        // Tags filter (intersection)
        if (criteria.tags && criteria.tags.$in) {
          const hasMatchingTag = criteria.tags.$in.some((tag: string) =>
            map.metadata.tags.includes(tag)
          );
          if (!hasMatchingTag) {
            return false;
          }
        }

        // Name regex filter
        if (criteria.name && criteria.name.$regex) {
          const regex = new RegExp(criteria.name.$regex, criteria.name.$options || '');
          if (!regex.test(map.name)) {
            return false;
          }
        }

        // Date filters
        if (criteria.createdAt) {
          if (criteria.createdAt.$gte && map.metadata.createdAt < criteria.createdAt.$gte) {
            return false;
          }
          if (criteria.createdAt.$lte && map.metadata.createdAt > criteria.createdAt.$lte) {
            return false;
          }
        }

        return true;
      });
    }

    // Return metadata for the filtered maps
    return filteredMaps.map(map => map.metadata);
  }

  async findByOwner(userId: UserId, limit: number = 10): Promise<MapGrid[]> {
    const allMaps = Array.from(this.maps.values());
    const userMaps = allMaps
      .filter(map => map.ownerId?.equals(userId))
      .sort((a, b) => b.metadata.createdAt.getTime() - a.metadata.createdAt.getTime()) // Sort by newest first
      .slice(0, limit);

    return userMaps;
  }

  async beginTransaction(): Promise<TransactionContext> {
    return new InMemoryTransactionContext();
  }

  async getMapCount(): Promise<number> {
    return this.maps.size;
  }

  // Additional utility methods for development/testing
  clear(): void {
    this.maps.clear();
  }
}
