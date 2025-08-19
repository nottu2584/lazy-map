import { 
  Mountain,
  Hill,
  Valley,
  Plateau,
} from '@lazy-map/domain/contexts/relief/entities';
import { FeatureId } from '@lazy-map/domain/common/entities/MapFeature';

/**
 * In-memory repository for relief features
 */
export class InMemoryReliefRepository {
  private mountains = new Map<string, Mountain>();
  private hills = new Map<string, Hill>();
  private valleys = new Map<string, Valley>();
  private plateaus = new Map<string, Plateau>();

  // Mountain operations
  async saveMountain(mountain: Mountain): Promise<void> {
    this.mountains.set(mountain.id, mountain);
  }

  async getMountain(id: FeatureId): Promise<Mountain | null> {
    return this.mountains.get(id) || null;
  }

  async getAllMountains(): Promise<Mountain[]> {
    return Array.from(this.mountains.values());
  }

  async deleteMountain(id: FeatureId): Promise<void> {
    this.mountains.delete(id);
  }

  // Hill operations
  async saveHill(hill: Hill): Promise<void> {
    this.hills.set(hill.id, hill);
  }

  async getHill(id: FeatureId): Promise<Hill | null> {
    return this.hills.get(id) || null;
  }

  async getAllHills(): Promise<Hill[]> {
    return Array.from(this.hills.values());
  }

  async deleteHill(id: FeatureId): Promise<void> {
    this.hills.delete(id);
  }

  // Valley operations
  async saveValley(valley: Valley): Promise<void> {
    this.valleys.set(valley.id, valley);
  }

  async getValley(id: FeatureId): Promise<Valley | null> {
    return this.valleys.get(id) || null;
  }

  async getAllValleys(): Promise<Valley[]> {
    return Array.from(this.valleys.values());
  }

  async deleteValley(id: FeatureId): Promise<void> {
    this.valleys.delete(id);
  }

  // Plateau operations
  async savePlateau(plateau: Plateau): Promise<void> {
    this.plateaus.set(plateau.id, plateau);
  }

  async getPlateau(id: FeatureId): Promise<Plateau | null> {
    return this.plateaus.get(id) || null;
  }

  async getAllPlateaus(): Promise<Plateau[]> {
    return Array.from(this.plateaus.values());
  }

  async deletePlateau(id: FeatureId): Promise<void> {
    this.plateaus.delete(id);
  }

  // Bulk operations
  async getAllReliefFeatures(): Promise<(Mountain | Hill | Valley | Plateau)[]> {
    return [
      ...this.mountains.values(),
      ...this.hills.values(),
      ...this.valleys.values(),
      ...this.plateaus.values(),
    ];
  }

  async clear(): Promise<void> {
    this.mountains.clear();
    this.hills.clear();
    this.valleys.clear();
    this.plateaus.clear();
  }
}