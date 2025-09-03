import { 
  Building,
  Road,
  Bridge,
  FeatureId
} from '@lazy-map/domain';

/**
 * In-memory repository for artificial features
 */
export class InMemoryArtificialRepository {
  private buildings = new Map<string, Building>();
  private roads = new Map<string, Road>();
  private bridges = new Map<string, Bridge>();

  // Building operations
  async saveBuilding(building: Building): Promise<void> {
    this.buildings.set(building.id.value, building);
  }

  async getBuilding(id: FeatureId): Promise<Building | null> {
    return this.buildings.get(id.value) || null;
  }

  async getAllBuildings(): Promise<Building[]> {
    return Array.from(this.buildings.values());
  }

  async deleteBuilding(id: FeatureId): Promise<void> {
    this.buildings.delete(id.value);
  }

  // Road operations
  async saveRoad(road: Road): Promise<void> {
    this.roads.set(road.id.value, road);
  }

  async getRoad(id: FeatureId): Promise<Road | null> {
    return this.roads.get(id.value) || null;
  }

  async getAllRoads(): Promise<Road[]> {
    return Array.from(this.roads.values());
  }

  async deleteRoad(id: FeatureId): Promise<void> {
    this.roads.delete(id.value);
  }

  // Bridge operations
  async saveBridge(bridge: Bridge): Promise<void> {
    this.bridges.set(bridge.id.value, bridge);
  }

  async getBridge(id: FeatureId): Promise<Bridge | null> {
    return this.bridges.get(id.value) || null;
  }

  async getAllBridges(): Promise<Bridge[]> {
    return Array.from(this.bridges.values());
  }

  async deleteBridge(id: FeatureId): Promise<void> {
    this.bridges.delete(id.value);
  }

  // Bulk operations
  async getAllArtificialFeatures(): Promise<(Building | Road | Bridge)[]> {
    return [
      ...this.buildings.values(),
      ...this.roads.values(),
      ...this.bridges.values(),
    ];
  }

  async clear(): Promise<void> {
    this.buildings.clear();
    this.roads.clear();
    this.bridges.clear();
  }
}