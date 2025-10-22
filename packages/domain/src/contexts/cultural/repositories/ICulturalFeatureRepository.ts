import { FeatureId } from '../../../common/value-objects/FeatureId';
import { Territory } from '../entities/Territory';
import { Settlement } from '../entities/Settlement';
import { Region } from '../entities/Region';

/**
 * Repository interface for Cultural context features
 * Defines data access operations for cultural and social entities
 */
export interface ICulturalFeatureRepository {
  // Territory operations
  saveTerritory(territory: Territory): Promise<void>;
  getTerritory(id: FeatureId): Promise<Territory | null>;
  getAllTerritories(): Promise<Territory[]>;
  deleteTerritory(id: FeatureId): Promise<void>;

  // Settlement operations
  saveSettlement(settlement: Settlement): Promise<void>;
  getSettlement(id: FeatureId): Promise<Settlement | null>;
  getAllSettlements(): Promise<Settlement[]>;
  deleteSettlement(id: FeatureId): Promise<void>;

  // Region operations
  saveRegion(region: Region): Promise<void>;
  getRegion(id: FeatureId): Promise<Region | null>;
  getAllRegions(): Promise<Region[]>;
  deleteRegion(id: FeatureId): Promise<void>;

  // Aggregate operations
  getAllCulturalFeatures(): Promise<Array<Territory | Settlement | Region>>;
  clear(): Promise<void>;
}