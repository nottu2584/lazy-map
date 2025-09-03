import { GridMap, MapId } from '@lazy-map/domain';
import { GetMapQuery, MapQueryResult } from '../ports/IMapQueryPort';
import { IMapPersistencePort } from '../ports';

/**
 * Use case for retrieving map data
 */
export class GetMapUseCase {
  constructor(
    private readonly mapPersistence: IMapPersistencePort
  ) {}

  async execute(query: GetMapQuery): Promise<MapQueryResult<GridMap | null>> {
    try {
      // Validate query
      const validationResult = this.validateQuery(query);
      if (!validationResult.isValid) {
        return {
          success: false,
          error: `Validation failed: ${validationResult.errors.join(', ')}`,
          data: null
        };
      }

      // Load the map
      const map = await this.mapPersistence.loadMap({ value: query.mapId } as MapId);

      return {
        success: true,
        data: map
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      return {
        success: false,
        error: errorMessage,
        data: null
      };
    }
  }

  private validateQuery(query: GetMapQuery): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!query.mapId || query.mapId.trim().length === 0) {
      errors.push('Map ID is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}