import { Repository } from 'typeorm';
import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  IMapRepository,
  MapQuery,
  PaginatedMapResult,
  MapGrid,
  MapId,
  SpatialBounds,
  UserId,
  ILogger
} from '@lazy-map/domain';
import { MapEntity } from '../entities/MapEntity';
import { MapMapper } from '../mappers/MapMapper';

/**
 * PostgreSQL implementation of the IMapRepository interface.
 * Stores only map generation parameters, not the full map data.
 * Maps are regenerated on-demand from stored parameters.
 */
@Injectable()
export class PostgresMapRepository implements IMapRepository {
  constructor(
    @InjectRepository(MapEntity)
    private readonly repository: Repository<MapEntity>,
    @Inject('IMapGenerationService')
    private readonly mapGenerationService: any, // Would be the actual generation service
    @Inject('ILogger')
    private readonly logger?: ILogger
  ) {}

  async save(map: MapGrid): Promise<void> {
    // Extract the seed from the map (this would come from the generation context)
    const seed = this.extractSeedFromMap(map);
    const userId = map.ownerId?.value || 'anonymous';

    const entity = MapMapper.toPersistence(map, userId, seed);
    await this.repository.save(entity);
  }

  async findById(id: MapId): Promise<MapGrid | null> {
    const entity = await this.repository.findOne({
      where: { id: id.value },
      relations: ['user']
    });

    if (!entity) {
      return null;
    }

    // Regenerate the map from stored parameters
    return this.regenerateMapFromEntity(entity);
  }

  async findByQuery(query: MapQuery): Promise<PaginatedMapResult> {
    const queryBuilder = this.repository.createQueryBuilder('map');
    queryBuilder.leftJoinAndSelect('map.user', 'user');

    // Apply filters
    if (query.nameFilter) {
      queryBuilder.andWhere('map.name ILIKE :name', {
        name: `%${query.nameFilter}%`
      });
    }

    if (query.ownerFilter) {
      queryBuilder.andWhere('map.userId = :userId', {
        userId: query.ownerFilter.value
      });
    }

    if (query.tagFilter && query.tagFilter.length > 0) {
      queryBuilder.andWhere('map.tags && :tags', {
        tags: query.tagFilter
      });
    }

    if (query.sizeFilter) {
      if (query.sizeFilter.minWidth) {
        queryBuilder.andWhere("(map.settings->'dimensions'->>'width')::int >= :minWidth", {
          minWidth: query.sizeFilter.minWidth
        });
      }
      if (query.sizeFilter.maxWidth) {
        queryBuilder.andWhere("(map.settings->'dimensions'->>'width')::int <= :maxWidth", {
          maxWidth: query.sizeFilter.maxWidth
        });
      }
      if (query.sizeFilter.minHeight) {
        queryBuilder.andWhere("(map.settings->'dimensions'->>'height')::int >= :minHeight", {
          minHeight: query.sizeFilter.minHeight
        });
      }
      if (query.sizeFilter.maxHeight) {
        queryBuilder.andWhere("(map.settings->'dimensions'->>'height')::int <= :maxHeight", {
          maxHeight: query.sizeFilter.maxHeight
        });
      }
    }

    if (query.createdAfter) {
      queryBuilder.andWhere('map.createdAt >= :after', {
        after: query.createdAfter
      });
    }

    if (query.createdBefore) {
      queryBuilder.andWhere('map.createdAt <= :before', {
        before: query.createdBefore
      });
    }

    // Apply pagination
    const limit = query.limit || 10;
    const offset = query.offset || 0;

    const [entities, total] = await queryBuilder
      .orderBy('map.createdAt', 'DESC')
      .skip(offset)
      .take(limit)
      .getManyAndCount();

    // Regenerate maps from entities
    const maps = await Promise.all(
      entities.map(entity => this.regenerateMapFromEntity(entity))
    );

    return {
      maps: maps.filter(map => map !== null) as MapGrid[],
      total,
      hasMore: offset + limit < total
    };
  }

  async findByArea(area: SpatialBounds): Promise<MapGrid[]> {
    // This would need custom spatial queries if we stored actual tile data
    // For now, return empty array as we don't store spatial data
    return [];
  }

  async delete(id: MapId): Promise<boolean> {
    const result = await this.repository.delete({ id: id.value });
    return result.affected !== undefined && result.affected !== null && result.affected > 0;
  }

  async exists(id: MapId): Promise<boolean> {
    const count = await this.repository.count({
      where: { id: id.value }
    });
    return count > 0;
  }

  async update(map: MapGrid): Promise<void> {
    const entity = await this.repository.findOne({
      where: { id: map.id.value }
    });

    if (!entity) {
      throw new Error(`Map with id ${map.id.value} not found`);
    }

    // Update entity with new values
    MapMapper.updateEntity(entity, {
      name: map.name,
      description: map.metadata.description,
      tags: map.metadata.tags
    });

    await this.repository.save(entity);
  }

  async count(): Promise<number> {
    return await this.repository.count();
  }

  async findByOwnerId(ownerId: UserId): Promise<MapGrid[]> {
    const entities = await this.repository.find({
      where: { userId: ownerId.value },
      relations: ['user'],
      order: { createdAt: 'DESC' }
    });

    const maps = await Promise.all(
      entities.map(entity => this.regenerateMapFromEntity(entity))
    );

    return maps.filter(map => map !== null) as MapGrid[];
  }

  async findRecentByOwnerId(ownerId: UserId, limit: number = 10): Promise<MapGrid[]> {
    const entities = await this.repository.find({
      where: { userId: ownerId.value },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: limit
    });

    const maps = await Promise.all(
      entities.map(entity => this.regenerateMapFromEntity(entity))
    );

    return maps.filter(map => map !== null) as MapGrid[];
  }

  async countByOwnerId(ownerId: UserId): Promise<number> {
    return await this.repository.count({
      where: { userId: ownerId.value }
    });
  }

  async canUserAccessMap(mapId: MapId, userId?: UserId): Promise<boolean> {
    const entity = await this.repository.findOne({
      where: { id: mapId.value }
    });

    if (!entity) {
      return false;
    }

    // Public maps can be accessed by anyone
    if (entity.isPublic) {
      return true;
    }

    // Private maps require owner access
    if (!userId) {
      return false;
    }

    return entity.userId === userId.value;
  }

  /**
   * Helper method to regenerate a MapGrid from stored parameters
   * In a real implementation, this would use the MapGenerationService
   */
  private async regenerateMapFromEntity(entity: MapEntity): Promise<MapGrid | null> {
    try {
      const request = MapMapper.toGenerationRequest(entity);

      // This would actually call the map generation service
      // For now, we'll create a stub map
      const map = MapGrid.createEmpty(
        request.name,
        request.dimensions,
        request.seed || 'default-seed', // seedValue
        new Date(request.metadata.createdAt), // createdAt
        32, // default cell size
        request.metadata.author,
        request.ownerId
      );

      // Override the generated ID with the stored one
      (map as any).id = new MapId(request.id);
      (map as any).metadata = request.metadata;

      // Update access timestamp
      entity.lastAccessedAt = new Date();
      entity.viewCount++;
      await this.repository.save(entity);

      return map;
    } catch (error) {
      this.logger?.error(`Failed to regenerate map ${entity.id}`, {
        component: 'PostgresMapRepository',
        operation: 'regenerateMapFromEntity',
        metadata: { mapId: entity.id, error }
      });
      return null;
    }
  }

  /**
   * Helper method to extract seed from a map
   * In a real implementation, this would be stored with the map
   */
  private extractSeedFromMap(map: MapGrid): string {
    // This would extract the actual seed used for generation
    // For now, return a placeholder
    return `seed_${map.id.value}`;
  }
}