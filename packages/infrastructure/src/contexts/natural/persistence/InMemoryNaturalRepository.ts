import {
  Forest,
  Grassland,
  Spring,
  Pond,
  Wetland,
  FeatureId,
  INaturalFeatureRepository
} from '@lazy-map/domain';

/**
 * In-memory repository for natural features
 */
export class InMemoryNaturalRepository implements INaturalFeatureRepository {
  private forests = new Map<string, Forest>();
  private grasslands = new Map<string, Grassland>();
  private springs = new Map<string, Spring>();
  private ponds = new Map<string, Pond>();
  private wetlands = new Map<string, Wetland>();

  // Forest operations
  async saveForest(forest: Forest): Promise<void> {
    this.forests.set(forest.id.value, forest);
  }

  async getForest(id: FeatureId): Promise<Forest | null> {
    return this.forests.get(id.value) || null;
  }

  async getAllForests(): Promise<Forest[]> {
    return Array.from(this.forests.values());
  }

  async deleteForest(id: FeatureId): Promise<void> {
    this.forests.delete(id.value);
  }

  // Grassland operations
  async saveGrassland(grassland: Grassland): Promise<void> {
    this.grasslands.set(grassland.id.value, grassland);
  }

  async getGrassland(id: FeatureId): Promise<Grassland | null> {
    return this.grasslands.get(id.value) || null;
  }

  async getAllGrasslands(): Promise<Grassland[]> {
    return Array.from(this.grasslands.values());
  }

  async deleteGrassland(id: FeatureId): Promise<void> {
    this.grasslands.delete(id.value);
  }

  // Spring operations
  async saveSpring(spring: Spring): Promise<void> {
    this.springs.set(spring.id.value, spring);
  }

  async getSpring(id: FeatureId): Promise<Spring | null> {
    return this.springs.get(id.value) || null;
  }

  async getAllSprings(): Promise<Spring[]> {
    return Array.from(this.springs.values());
  }

  async deleteSpring(id: FeatureId): Promise<void> {
    this.springs.delete(id.value);
  }

  // Pond operations
  async savePond(pond: Pond): Promise<void> {
    this.ponds.set(pond.id.value, pond);
  }

  async getPond(id: FeatureId): Promise<Pond | null> {
    return this.ponds.get(id.value) || null;
  }

  async getAllPonds(): Promise<Pond[]> {
    return Array.from(this.ponds.values());
  }

  async deletePond(id: FeatureId): Promise<void> {
    this.ponds.delete(id.value);
  }

  // Wetland operations
  async saveWetland(wetland: Wetland): Promise<void> {
    this.wetlands.set(wetland.id.value, wetland);
  }

  async getWetland(id: FeatureId): Promise<Wetland | null> {
    return this.wetlands.get(id.value) || null;
  }

  async getAllWetlands(): Promise<Wetland[]> {
    return Array.from(this.wetlands.values());
  }

  async deleteWetland(id: FeatureId): Promise<void> {
    this.wetlands.delete(id.value);
  }

  // Bulk operations
  async getAllNaturalFeatures(): Promise<Array<Forest | Grassland | Spring | Pond | Wetland>> {
    return [
      ...this.forests.values(),
      ...this.grasslands.values(),
      ...this.springs.values(),
      ...this.ponds.values(),
      ...this.wetlands.values(),
    ];
  }

  async clear(): Promise<void> {
    this.forests.clear();
    this.grasslands.clear();
    this.springs.clear();
    this.ponds.clear();
    this.wetlands.clear();
  }
}