import { FeatureId } from '../../../common/value-objects/FeatureId';
import { Building } from '../entities/Building';
import { Road } from '../entities/Road';
import { Bridge } from '../entities/Bridge';

/**
 * Repository interface for Artificial context features
 * Defines data access operations for man-made structure entities
 */
export interface IArtificialFeatureRepository {
  // Building operations
  saveBuilding(building: Building): Promise<void>;
  getBuilding(id: FeatureId): Promise<Building | null>;
  getAllBuildings(): Promise<Building[]>;
  deleteBuilding(id: FeatureId): Promise<void>;

  // Road operations
  saveRoad(road: Road): Promise<void>;
  getRoad(id: FeatureId): Promise<Road | null>;
  getAllRoads(): Promise<Road[]>;
  deleteRoad(id: FeatureId): Promise<void>;

  // Bridge operations
  saveBridge(bridge: Bridge): Promise<void>;
  getBridge(id: FeatureId): Promise<Bridge | null>;
  getAllBridges(): Promise<Bridge[]>;
  deleteBridge(id: FeatureId): Promise<void>;

  // Aggregate operations
  getAllArtificialFeatures(): Promise<Array<Building | Road | Bridge>>;
  clear(): Promise<void>;
}