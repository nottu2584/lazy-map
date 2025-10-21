import { MapGrid, MapId, MapMetadata, Dimensions, UserId } from '@lazy-map/domain';
import { MapEntity } from '../entities/MapEntity';

/**
 * Mapper for converting between MapGrid domain entity and MapEntity database entity.
 * Note: We only store generation parameters, not the full map data.
 * The map can be regenerated deterministically from these parameters.
 */
export class MapMapper {
  /**
   * Extract generation parameters from MapGrid for persistence
   */
  static toPersistence(map: MapGrid, userId: string, seed: string): MapEntity {
    return new MapEntity({
      id: map.id.value,
      name: map.name,
      seed: seed,
      description: map.metadata.description || '',
      userId: userId,
      settings: {
        dimensions: {
          width: map.dimensions.width,
          height: map.dimensions.height
        },
        terrain: {
          type: 'default', // This would come from the generation context
          elevation: {
            min: 0,
            max: 100
          }
        },
        features: {
          // These would be populated based on the actual features used
          forests: {
            enabled: false,
            density: 0
          },
          rivers: {
            enabled: false,
            count: 0
          },
          buildings: {
            enabled: false,
            density: 0
          },
          roads: {
            enabled: false,
            connectedness: 0
          }
        },
        generation: {
          algorithm: 'perlin',
          noiseScale: 0.1,
          octaves: 4
        }
      },
      // Metadata
      isPublic: false,
      isFavorite: false,
      category: null,
      tags: map.metadata.tags || null,
      viewCount: 0,
      downloadCount: 0,
      lastAccessedAt: null,
      createdAt: map.metadata.createdAt,
      updatedAt: map.metadata.updatedAt
    });
  }

  /**
   * Create a MapGenerationRequest from database entity
   * The actual map generation would be handled by the MapGenerationService
   */
  static toGenerationRequest(entity: MapEntity): {
    id: string;
    name: string;
    seed: string;
    dimensions: Dimensions;
    settings: any;
    metadata: MapMetadata;
    ownerId?: UserId;
  } {
    return {
      id: entity.id,
      name: entity.name,
      seed: entity.seed,
      dimensions: new Dimensions(
        entity.settings.dimensions.width,
        entity.settings.dimensions.height
      ),
      settings: entity.settings,
      metadata: new MapMetadata(
        entity.createdAt,
        entity.updatedAt,
        entity.user?.username,
        entity.description || undefined,
        entity.tags || []
      ),
      ownerId: entity.userId ? new UserId(entity.userId) : undefined
    };
  }

  /**
   * Update an existing MapEntity with new settings
   */
  static updateEntity(entity: MapEntity, updates: Partial<{
    name: string;
    description: string;
    isPublic: boolean;
    isFavorite: boolean;
    category: string;
    tags: string[];
    settings: any;
  }>): MapEntity {
    if (updates.name !== undefined) entity.name = updates.name;
    if (updates.description !== undefined) entity.description = updates.description;
    if (updates.isPublic !== undefined) entity.isPublic = updates.isPublic;
    if (updates.isFavorite !== undefined) entity.isFavorite = updates.isFavorite;
    if (updates.category !== undefined) entity.category = updates.category;
    if (updates.tags !== undefined) entity.tags = updates.tags;
    if (updates.settings !== undefined) {
      entity.settings = { ...entity.settings, ...updates.settings };
    }

    entity.updatedAt = new Date();
    entity.lastAccessedAt = new Date();

    return entity;
  }

  /**
   * Convert array of database entities to generation requests
   */
  static toGenerationRequestArray(entities: MapEntity[]): any[] {
    return entities.map(entity => this.toGenerationRequest(entity));
  }
}