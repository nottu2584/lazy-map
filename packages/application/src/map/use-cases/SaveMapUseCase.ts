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
 * Use case for saving a generated map to persistent storage
 */
export class SaveMapUseCase {
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

      // Validate user ID
      const userId = UserId.fromString(command.userId);

      // The map is already a MapGrid entity from the controller
      // Just save it directly to the repository
      await this.mapRepository.save(command.map);

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
}