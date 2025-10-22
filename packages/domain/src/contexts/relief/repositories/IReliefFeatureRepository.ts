import { FeatureId } from '../../../common/value-objects/FeatureId';
import { Mountain } from '../entities/Mountain';
import { Hill } from '../entities/Hill';
import { Valley } from '../entities/Valley';
import { Plateau } from '../entities/Plateau';

/**
 * Repository interface for Relief context features
 * Defines data access operations for relief-related entities
 */
export interface IReliefFeatureRepository {
  // Mountain operations
  saveMountain(mountain: Mountain): Promise<void>;
  getMountain(id: FeatureId): Promise<Mountain | null>;
  getAllMountains(): Promise<Mountain[]>;
  deleteMountain(id: FeatureId): Promise<void>;

  // Hill operations
  saveHill(hill: Hill): Promise<void>;
  getHill(id: FeatureId): Promise<Hill | null>;
  getAllHills(): Promise<Hill[]>;
  deleteHill(id: FeatureId): Promise<void>;

  // Valley operations
  saveValley(valley: Valley): Promise<void>;
  getValley(id: FeatureId): Promise<Valley | null>;
  getAllValleys(): Promise<Valley[]>;
  deleteValley(id: FeatureId): Promise<void>;

  // Plateau operations
  savePlateau(plateau: Plateau): Promise<void>;
  getPlateau(id: FeatureId): Promise<Plateau | null>;
  getAllPlateaus(): Promise<Plateau[]>;
  deletePlateau(id: FeatureId): Promise<void>;

  // Aggregate operations
  getAllReliefFeatures(): Promise<Array<Mountain | Hill | Valley | Plateau>>;
  clear(): Promise<void>;
}