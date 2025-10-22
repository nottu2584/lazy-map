import {
  IMapRepository,
  MapGrid,
  MapId,
  UserId,
  MapQuery,
  PaginatedMapResult,
  SpatialBounds
} from '@lazy-map/domain';
import { IMapPersistencePort } from '@lazy-map/application';

/**
 * Adapter that implements the domain IMapRepository interface
 * by delegating to the application's IMapPersistencePort
 */
export class MapRepositoryAdapter implements IMapRepository {
  constructor(private readonly mapPersistencePort: IMapPersistencePort) {}

  async save(map: MapGrid): Promise<void> {
    return this.mapPersistencePort.saveMap(map);
  }

  async findById(id: MapId): Promise<MapGrid | null> {
    return this.mapPersistencePort.loadMap(id);
  }

  async findByQuery(query: MapQuery): Promise<PaginatedMapResult> {
    // Convert MapQuery to criteria format expected by IMapPersistencePort
    const criteria = {
      authorFilter: query.authorFilter,
      tagFilter: query.tagFilter,
      nameFilter: query.nameFilter,
      ownerFilter: query.ownerFilter,
      sizeFilter: query.sizeFilter,
      createdAfter: query.createdAfter,
      createdBefore: query.createdBefore,
      limit: query.limit,
      offset: query.offset
    };

    // Since listMaps returns MapMetadata[] which doesn't contain full map data,
    // we need to fetch all maps and filter them based on the query
    // This is a temporary implementation - in production, you'd want to optimize this
    const allMaps: MapGrid[] = [];

    // For now, we don't have a way to get all map IDs, so we return empty
    // TODO: Implement proper querying in IMapPersistencePort

    return {
      maps: allMaps,
      total: allMaps.length,
      hasMore: query.limit ? allMaps.length >= query.limit : false
    };
  }

  async findByArea(area: SpatialBounds): Promise<MapGrid[]> {
    // This would need a specialized implementation in IMapPersistencePort
    // For now, we'll return an empty array
    // TODO: Implement spatial queries in IMapPersistencePort
    return [];
  }

  async delete(id: MapId): Promise<boolean> {
    return this.mapPersistencePort.deleteMap(id);
  }

  async exists(id: MapId): Promise<boolean> {
    return this.mapPersistencePort.mapExists(id);
  }

  async update(map: MapGrid): Promise<void> {
    return this.mapPersistencePort.updateMap(map);
  }

  async count(): Promise<number> {
    return this.mapPersistencePort.getMapCount();
  }

  async findByOwnerId(ownerId: UserId): Promise<MapGrid[]> {
    return this.mapPersistencePort.findByOwner(ownerId);
  }

  async findRecentByOwnerId(ownerId: UserId, limit?: number): Promise<MapGrid[]> {
    return this.mapPersistencePort.findByOwner(ownerId, limit);
  }

  async countByOwnerId(ownerId: UserId): Promise<number> {
    const maps = await this.mapPersistencePort.findByOwner(ownerId);
    return maps.length;
  }

  async canUserAccessMap(mapId: MapId, userId?: UserId): Promise<boolean> {
    if (!userId) {
      // Public maps are accessible without authentication
      // This logic might need to be refined based on business rules
      return true;
    }

    const map = await this.mapPersistencePort.loadMap(mapId);
    if (!map) {
      return false;
    }

    // Check if the user is the owner
    // MapGrid has ownerId property at the root level
    return map.ownerId === userId;
  }
}