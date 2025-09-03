import { MapMetadata } from '@lazy-map/domain';
import { ListMapsQuery, MapQueryResult } from '../ports/IMapQueryPort';
import { IMapPersistencePort } from '../ports';

/**
 * Use case for listing available maps with optional filtering
 */
export class ListMapsUseCase {
  constructor(
    private readonly mapPersistence: IMapPersistencePort
  ) {}

  async execute(query: ListMapsQuery): Promise<MapQueryResult<MapMetadata[]>> {
    try {
      // Validate query
      const validationResult = this.validateQuery(query);
      if (!validationResult.isValid) {
        return {
          success: false,
          error: `Validation failed: ${validationResult.errors.join(', ')}`,
          data: []
        };
      }

      // Build filter criteria
      const filterCriteria = this.buildFilterCriteria(query);

      // Get maps with filtering
      const maps = await this.mapPersistence.listMaps(filterCriteria);

      // Apply sorting if specified
      const sortedMaps = this.applySorting(maps, query.sortBy, query.sortOrder);

      // Apply pagination if specified
      const paginatedMaps = this.applyPagination(sortedMaps, query.limit, query.offset);

      return {
        success: true,
        data: paginatedMaps,
        metadata: {
          total: maps.length,
          limit: query.limit,
          offset: query.offset || 0,
          hasMore: query.limit ? (query.offset || 0) + query.limit < maps.length : false
        }
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      return {
        success: false,
        error: errorMessage,
        data: []
      };
    }
  }

  private validateQuery(query: ListMapsQuery): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (query.limit !== undefined && query.limit <= 0) {
      errors.push('Limit must be positive if specified');
    }

    if (query.offset !== undefined && query.offset < 0) {
      errors.push('Offset cannot be negative');
    }

    if (query.sortBy) {
      const validSortFields = ['name', 'createdAt', 'updatedAt', 'author', 'size'];
      if (!validSortFields.includes(query.sortBy)) {
        errors.push(`Invalid sort field. Must be one of: ${validSortFields.join(', ')}`);
      }
    }

    if (query.sortOrder && !['asc', 'desc'].includes(query.sortOrder)) {
      errors.push('Sort order must be "asc" or "desc"');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private buildFilterCriteria(query: ListMapsQuery): any {
    const criteria: any = {};

    if (query.author) {
      criteria.author = query.author;
    }

    if (query.tags && query.tags.length > 0) {
      criteria.tags = { $in: query.tags };
    }

    if (query.nameFilter) {
      criteria.name = { $regex: query.nameFilter, $options: 'i' };
    }

    if (query.minSize || query.maxSize) {
      criteria.size = {};
      if (query.minSize) criteria.size.$gte = query.minSize;
      if (query.maxSize) criteria.size.$lte = query.maxSize;
    }

    if (query.createdAfter || query.createdBefore) {
      criteria.createdAt = {};
      if (query.createdAfter) criteria.createdAt.$gte = query.createdAfter;
      if (query.createdBefore) criteria.createdAt.$lte = query.createdBefore;
    }

    return criteria;
  }

  private applySorting(
    maps: MapMetadata[], 
    sortBy?: string, 
    sortOrder: 'asc' | 'desc' = 'desc'
  ): MapMetadata[] {
    if (!sortBy) {
      return maps;
    }

    return [...maps].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'name':
          // MapMetadata doesn't have name, so we can't sort by name directly
          // This would need to be implemented differently or the persistence layer
          // would need to return richer metadata
          aValue = 'unknown';
          bValue = 'unknown';
          break;
        case 'createdAt':
          aValue = a.createdAt;
          bValue = b.createdAt;
          break;
        case 'updatedAt':
          aValue = a.updatedAt;
          bValue = b.updatedAt;
          break;
        case 'author':
          aValue = a.author?.toLowerCase() || '';
          bValue = b.author?.toLowerCase() || '';
          break;
        case 'size':
          // MapMetadata doesn't have dimensions, this would need to be handled
          // by a richer data structure from the persistence layer
          aValue = 0;
          bValue = 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }

  private applyPagination(
    maps: MapMetadata[], 
    limit?: number, 
    offset: number = 0
  ): MapMetadata[] {
    if (!limit) {
      return maps.slice(offset);
    }

    return maps.slice(offset, offset + limit);
  }
}