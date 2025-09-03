import { MapTile, MapId, Position } from '@lazy-map/domain';
import { GetMapTileQuery, MapQueryResult } from '../ports/IMapQueryPort';
import { IMapPersistencePort } from '../ports';

/**
 * Use case for retrieving specific tile data from a map
 */
export class GetMapTileUseCase {
  constructor(
    private readonly mapPersistence: IMapPersistencePort
  ) {}

  async execute(query: GetMapTileQuery): Promise<MapQueryResult<MapTile | null>> {
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

      // Load the map first to check bounds
      const map = await this.mapPersistence.loadMap({ value: query.mapId } as MapId);
      
      if (!map) {
        return {
          success: false,
          error: `Map with ID ${query.mapId} not found`,
          data: null
        };
      }

      // Check if coordinates are within map bounds
      const position = new Position(query.x, query.y);
      if (!map.dimensions.contains(position)) {
        return {
          success: false,
          error: `Position (${query.x}, ${query.y}) is outside map bounds`,
          data: null
        };
      }

      // Get the tile
      const tile = map.getTile(position);

      return {
        success: true,
        data: tile
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

  private validateQuery(query: GetMapTileQuery): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!query.mapId || query.mapId.trim().length === 0) {
      errors.push('Map ID is required');
    }

    if (!Number.isInteger(query.x) || !Number.isInteger(query.y)) {
      errors.push('Tile coordinates must be integers');
    }

    if (query.x < 0 || query.y < 0) {
      errors.push('Tile coordinates cannot be negative');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}