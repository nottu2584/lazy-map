import {
  ILogger,
  IMapRepository,
  MapGrid,
  UserId
} from '@lazy-map/domain';

export interface SaveMapCommand {
  map: MapGrid;
  userId: string;
  name?: string;
  description?: string;
}

export interface SaveMapResult {
  success: boolean;
  mapId?: string;
  error?: string;
}

/**
 * Use case for saving a generated map to persistent storage.
 * Enforces a per-user limit: when exceeded, the oldest maps are deleted.
 */
export class SaveMapUseCase {
  private static readonly MAX_MAPS_PER_USER = 10;

  constructor(
    private readonly mapRepository: IMapRepository,
    private readonly logger?: ILogger
  ) {}

  async execute(command: SaveMapCommand): Promise<SaveMapResult> {
    try {
      this.logger?.debug('Saving map', {
        component: 'SaveMapUseCase',
        operation: 'execute',
        metadata: {
          mapId: command.map.id.value,
          userId: command.userId,
          name: command.name
        }
      });

      const userId = UserId.fromString(command.userId);

      await this.mapRepository.save(command.map);
      await this.evictOldMaps(userId);

      this.logger?.info('Map saved successfully', {
        component: 'SaveMapUseCase',
        operation: 'execute',
        entityId: command.map.id.value,
        metadata: {
          userId: userId.value,
          name: command.name || command.map.name
        }
      });

      return {
        success: true,
        mapId: command.map.id.value
      };

    } catch (error) {
      this.logger?.error('Failed to save map', {
        component: 'SaveMapUseCase',
        operation: 'execute',
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error',
          userId: command.userId
        }
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save map'
      };
    }
  }

  private async evictOldMaps(userId: UserId): Promise<void> {
    const count = await this.mapRepository.countByOwnerId(userId);
    if (count <= SaveMapUseCase.MAX_MAPS_PER_USER) return;

    const allMaps = await this.mapRepository.findByOwnerId(userId);
    const sortedByNewest = allMaps.sort(
      (a, b) => b.metadata.createdAt.getTime() - a.metadata.createdAt.getTime()
    );
    const toDelete = sortedByNewest.slice(SaveMapUseCase.MAX_MAPS_PER_USER);

    for (const map of toDelete) {
      await this.mapRepository.delete(map.id);
      this.logger?.debug('Evicted old map', {
        component: 'SaveMapUseCase',
        operation: 'evictOldMaps',
        metadata: { mapId: map.id.value, userId: userId.value }
      });
    }
  }
}