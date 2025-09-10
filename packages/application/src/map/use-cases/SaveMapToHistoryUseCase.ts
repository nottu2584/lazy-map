import { IMapHistoryRepository, UserId, MapId } from '@lazy-map/domain';

export interface SaveMapToHistoryCommand {
  userId: string;
  mapId: string;
  mapName: string;
  thumbnailData?: string;
}

export interface SaveMapToHistoryResult {
  success: boolean;
  errors: string[];
}

/**
 * Use case for saving a map to user's history
 */
export class SaveMapToHistoryUseCase {
  constructor(
    private readonly mapHistoryRepository: IMapHistoryRepository
  ) {}

  async execute(command: SaveMapToHistoryCommand): Promise<SaveMapToHistoryResult> {
    const errors: string[] = [];

    try {
      const userId = UserId.fromString(command.userId);
      const mapId = new MapId(command.mapId);

      await this.mapHistoryRepository.addMapToHistory(
        userId,
        mapId,
        command.mapName,
        command.thumbnailData
      );

      return {
        success: true,
        errors: []
      };

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save map to history';
      errors.push(errorMessage);
      
      return {
        success: false,
        errors
      };
    }
  }
}