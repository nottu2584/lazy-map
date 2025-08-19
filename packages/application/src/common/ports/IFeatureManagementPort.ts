import { Forest, MapFeature, TreePlant as Tree } from '@lazy-map/domain';

/**
 * Command for creating a forest feature
 */
export interface CreateForestCommand {
  mapId: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  forestSettings: {
    treeDensity: number;
    treeClumping: number;
    allowTreeOverlap: boolean;
    enableInosculation: boolean;
    preferredSpecies: string[];
    underbrushDensity?: number;
  };
  seed?: number;
}

/**
 * Command for updating a forest
 */
export interface UpdateForestCommand {
  featureId: string;
  name?: string;
  addTrees?: number;
  removeTrees?: string[];
  ageForest?: number;
}

/**
 * Command for removing a feature
 */
export interface RemoveFeatureCommand {
  featureId: string;
  mapId?: string;
}

/**
 * Query for finding features
 */
export interface FeatureQuery {
  mapId?: string;
  category?: string;
  type?: string;
  namePattern?: string;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  limit?: number;
  offset?: number;
}

/**
 * Result of feature operations
 */
export interface FeatureOperationResult {
  success: boolean;
  feature?: MapFeature;
  error?: string;
  warnings?: string[];
}

/**
 * Paginated result for feature queries
 */
export interface FeatureQueryResult {
  features: MapFeature[];
  total: number;
  hasMore: boolean;
}

/**
 * Primary port for feature management operations
 */
export interface IFeatureManagementPort {
  /**
   * Creates a new forest feature
   */
  createForest(command: CreateForestCommand): Promise<FeatureOperationResult>;

  /**
   * Updates an existing forest
   */
  updateForest(command: UpdateForestCommand): Promise<FeatureOperationResult>;

  /**
   * Removes a feature from a map
   */
  removeFeature(featureId: string): Promise<FeatureOperationResult>;

  /**
   * Gets a feature by its ID
   */
  getFeature(featureId: string): Promise<MapFeature | null>;

  /**
   * Finds features based on query criteria
   */
  findFeatures(query: FeatureQuery): Promise<FeatureQueryResult>;

  /**
   * Gets all features for a specific map
   */
  getMapFeatures(mapId: string): Promise<MapFeature[]>;

  /**
   * Gets detailed information about a forest
   */
  getForestDetails(featureId: string): Promise<{
    forest: Forest;
    treeCount: number;
    speciesDistribution: Record<string, number>;
    healthStats: {
      healthy: number;
      dying: number;
      dead: number;
      averageHealth: number;
    };
    densityLevel: string;
  } | null>;

  /**
   * Gets trees in a specific area of a forest
   */
  getTreesInArea(featureId: string, x: number, y: number, width: number, height: number): Promise<Tree[]>;
}