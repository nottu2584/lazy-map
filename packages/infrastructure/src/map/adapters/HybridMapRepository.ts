import {
  IMapRepository,
  MapGrid,
  MapId,
  UserId,
  MapQuery,
  PaginatedMapResult,
  type ILogger
} from '@lazy-map/domain';

/**
 * Hybrid Map Repository
 *
 * Routes storage based on authentication status:
 * - Anonymous users (no ownerId): Always use in-memory storage
 * - Authenticated users (has ownerId): Use database storage when available
 *
 * This ensures:
 * 1. Anonymous user data never persists to database
 * 2. Authenticated user data persists when USE_DATABASE=true
 * 3. Clear separation of concerns for privacy and performance
 */
export class HybridMapRepository implements IMapRepository {
  constructor(
    private readonly inMemoryRepository: IMapRepository,
    private readonly databaseRepository: IMapRepository | null,
    private readonly logger?: ILogger
  ) {
    this.logger?.info('HybridMapRepository initialized', {
      metadata: {
        hasDatabaseRepository: databaseRepository !== null
      }
    });
  }

  /**
   * Routes to appropriate repository based on map ownership
   */
  private getRepository(map: MapGrid): IMapRepository {
    // Anonymous users always use in-memory storage
    if (!map.ownerId) {
      this.logger?.debug('Routing to in-memory storage (anonymous user)', {
        metadata: { mapId: map.id.value }
      });
      return this.inMemoryRepository;
    }

    // Authenticated users use database if available, otherwise in-memory
    if (this.databaseRepository) {
      this.logger?.debug('Routing to database storage (authenticated user)', {
        metadata: {
          mapId: map.id.value,
          ownerId: map.ownerId.value
        }
      });
      return this.databaseRepository;
    }

    this.logger?.debug('Routing to in-memory storage (no database configured)', {
      metadata: {
        mapId: map.id.value,
        ownerId: map.ownerId?.value
      }
    });
    return this.inMemoryRepository;
  }

  /**
   * Routes to appropriate repository for retrieval operations
   * Tries database first (if available), falls back to in-memory
   */
  private async getRepositoryForRetrieval(): Promise<IMapRepository[]> {
    // Search both repositories for flexibility
    // Database has priority, but in-memory may have unsaved maps
    return this.databaseRepository
      ? [this.databaseRepository, this.inMemoryRepository]
      : [this.inMemoryRepository];
  }

  async save(map: MapGrid): Promise<void> {
    const repository = this.getRepository(map);
    await repository.save(map);
  }

  async findById(id: MapId): Promise<MapGrid | null> {
    const repositories = await this.getRepositoryForRetrieval();

    // Try each repository in order
    for (const repo of repositories) {
      const map = await repo.findById(id);
      if (map) {
        return map;
      }
    }

    return null;
  }

  async findByQuery(query: MapQuery): Promise<PaginatedMapResult> {
    const repositories = await this.getRepositoryForRetrieval();

    // For queries, we prioritize database if available
    // (anonymous in-memory maps wouldn't match ownerFilter anyway)
    const primaryRepo = repositories[0];
    return primaryRepo.findByQuery(query);
  }


  async delete(id: MapId): Promise<boolean> {
    const repositories = await this.getRepositoryForRetrieval();

    // Try to delete from all repositories
    const results = await Promise.all(
      repositories.map(repo => repo.delete(id))
    );

    // Return true if deleted from any repository
    return results.some(result => result);
  }

  async exists(id: MapId): Promise<boolean> {
    const repositories = await this.getRepositoryForRetrieval();

    // Check all repositories
    for (const repo of repositories) {
      if (await repo.exists(id)) {
        return true;
      }
    }

    return false;
  }

  async update(map: MapGrid): Promise<void> {
    const repository = this.getRepository(map);
    await repository.update(map);
  }

  async count(): Promise<number> {
    const repositories = await this.getRepositoryForRetrieval();

    // Sum counts from all repositories
    const counts = await Promise.all(
      repositories.map(repo => repo.count())
    );

    return counts.reduce((sum, count) => sum + count, 0);
  }

  async findByOwnerId(ownerId: UserId): Promise<MapGrid[]> {
    // Owner-specific queries always go to database (or in-memory if no DB)
    const repository = this.databaseRepository || this.inMemoryRepository;
    return repository.findByOwnerId(ownerId);
  }

  async findRecentByOwnerId(ownerId: UserId, limit?: number): Promise<MapGrid[]> {
    // Owner-specific queries always go to database (or in-memory if no DB)
    const repository = this.databaseRepository || this.inMemoryRepository;
    return repository.findRecentByOwnerId(ownerId, limit);
  }

  async countByOwnerId(ownerId: UserId): Promise<number> {
    // Owner-specific queries always go to database (or in-memory if no DB)
    const repository = this.databaseRepository || this.inMemoryRepository;
    return repository.countByOwnerId(ownerId);
  }

  async canUserAccessMap(mapId: MapId, userId?: UserId): Promise<boolean> {
    const repositories = await this.getRepositoryForRetrieval();

    // Check all repositories
    for (const repo of repositories) {
      if (await repo.canUserAccessMap(mapId, userId)) {
        return true;
      }
    }

    return false;
  }
}
