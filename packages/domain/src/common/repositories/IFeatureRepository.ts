import { MapFeature, FeatureId, FeatureCategory } from '../entities/MapFeature';
import { FeatureArea } from '../value-objects/FeatureArea';

/**
 * Query parameters for feature searches
 */
export interface FeatureQuery {
  categoryFilter?: FeatureCategory[];
  typeFilter?: string[];
  nameFilter?: string;
  areaFilter?: FeatureArea;
  priorityFilter?: {
    min?: number;
    max?: number;
  };
  limit?: number;
  offset?: number;
}

/**
 * Paginated result for feature queries
 */
export interface PaginatedFeatureResult {
  features: MapFeature[];
  total: number;
  hasMore: boolean;
}

/**
 * Repository interface for feature persistence
 */
export interface IFeatureRepository {
  /**
   * Saves a feature to the repository
   */
  save(feature: MapFeature): Promise<void>;

  /**
   * Finds a feature by its ID
   */
  findById(id: FeatureId): Promise<MapFeature | null>;

  /**
   * Finds features based on query parameters
   */
  findByQuery(query: FeatureQuery): Promise<PaginatedFeatureResult>;

  /**
   * Finds features by category
   */
  findByCategory(category: FeatureCategory): Promise<MapFeature[]>;

  /**
   * Finds features that intersect with a given area
   */
  findByArea(area: FeatureArea): Promise<MapFeature[]>;

  /**
   * Finds features within a map
   */
  findByMapId(mapId: string): Promise<MapFeature[]>;

  /**
   * Deletes a feature by its ID
   */
  delete(id: FeatureId): Promise<boolean>;

  /**
   * Checks if a feature exists
   */
  exists(id: FeatureId): Promise<boolean>;

  /**
   * Updates an existing feature
   */
  update(feature: MapFeature): Promise<void>;

  /**
   * Gets the total count of features
   */
  count(): Promise<number>;
}