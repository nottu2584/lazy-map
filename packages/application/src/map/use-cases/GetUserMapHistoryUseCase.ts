import { IMapHistoryRepository, UserId } from '@lazy-map/domain';

export interface GetUserMapHistoryCommand {
  userId: string;
  limit?: number;
}

export interface MapHistoryEntry {
  mapId: string;
  mapName: string;
  createdAt: Date;
  thumbnailData?: string;
}

export interface GetUserMapHistoryResult {
  success: boolean;
  history: MapHistoryEntry[];
  totalCount: number;
  errors: string[];
}

/**
 * Use case for retrieving user's map history
 */
export class GetUserMapHistoryUseCase {
  constructor(
    private readonly mapHistoryRepository: IMapHistoryRepository
  ) {}

  async execute(command: GetUserMapHistoryCommand): Promise<GetUserMapHistoryResult> {
    const errors: string[] = [];

    try {
      const userId = UserId.fromString(command.userId);
      const mapHistory = await this.mapHistoryRepository.findByUserId(userId);

      if (!mapHistory) {
        return {
          success: true,
          history: [],
          totalCount: 0,
          errors: []
        };
      }

      const limit = command.limit || 10;
      const recentEntries = mapHistory.getRecentMaps(limit);

      return {
        success: true,
        history: recentEntries.map(entry => ({
          mapId: entry.mapId.value,
          mapName: entry.mapName,
          createdAt: entry.createdAt,
          thumbnailData: entry.thumbnailData
        })),
        totalCount: mapHistory.size,
        errors: []
      };

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get map history';
      errors.push(errorMessage);
      
      return {
        success: false,
        history: [],
        totalCount: 0,
        errors
      };
    }
  }
}