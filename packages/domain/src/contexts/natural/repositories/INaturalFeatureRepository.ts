import { FeatureId } from '../../../common/value-objects/FeatureId';
import { Forest } from '../entities/Forest';
import { Grassland } from '../entities/Grassland';
import { Pond } from '../entities/Pond';
import { Spring } from '../entities/Spring';
import { Wetland } from '../entities/Wetland';

/**
 * Repository interface for Natural context features
 * Defines data access operations for natural environment entities
 */
export interface INaturalFeatureRepository {
  // Forest operations
  saveForest(forest: Forest): Promise<void>;
  getForest(id: FeatureId): Promise<Forest | null>;
  getAllForests(): Promise<Forest[]>;
  deleteForest(id: FeatureId): Promise<void>;

  // Grassland operations
  saveGrassland(grassland: Grassland): Promise<void>;
  getGrassland(id: FeatureId): Promise<Grassland | null>;
  getAllGrasslands(): Promise<Grassland[]>;
  deleteGrassland(id: FeatureId): Promise<void>;

  // Spring operations
  saveSpring(spring: Spring): Promise<void>;
  getSpring(id: FeatureId): Promise<Spring | null>;
  getAllSprings(): Promise<Spring[]>;
  deleteSpring(id: FeatureId): Promise<void>;

  // Pond operations
  savePond(pond: Pond): Promise<void>;
  getPond(id: FeatureId): Promise<Pond | null>;
  getAllPonds(): Promise<Pond[]>;
  deletePond(id: FeatureId): Promise<void>;

  // Wetland operations
  saveWetland(wetland: Wetland): Promise<void>;
  getWetland(id: FeatureId): Promise<Wetland | null>;
  getAllWetlands(): Promise<Wetland[]>;
  deleteWetland(id: FeatureId): Promise<void>;

  // Aggregate operations
  getAllNaturalFeatures(): Promise<Array<Forest | Grassland | Spring | Pond | Wetland>>;
  clear(): Promise<void>;
}