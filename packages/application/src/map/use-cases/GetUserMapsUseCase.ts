import { MapGrid, UserId } from '@lazy-map/domain';
import { IMapPersistencePort } from '../ports';

export class GetUserMapsQuery {
  constructor(
    public readonly userId: string,
    public readonly limit?: number
  ) {}
}

export interface GetUserMapsResult {
  success: boolean;
  data?: MapGrid[];
  error?: string;
}

/**
 * Use case for retrieving all maps owned by a specific user
 */
export class GetUserMapsUseCase {
  constructor(
    private readonly mapPersistence: IMapPersistencePort
  ) {}

  async execute(query: GetUserMapsQuery): Promise<GetUserMapsResult> {
    try {
      const userId = UserId.fromString(query.userId);
      const maps = await this.mapPersistence.findByOwner(userId, query.limit || 10);

      return {
        success: true,
        data: maps
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get user maps';
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }
}