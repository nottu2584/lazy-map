import { 
  Building,
  Road,
  Bridge,
} from '@lazy-map/domain/contexts/artificial/entities';
import { FeatureId } from '@lazy-map/domain/common/entities/MapFeature';

/**
 * In-memory repository for artificial features
 */
export class InMemoryArtificialRepository {
  private buildings = new Map<string, Building>();
  private roads = new Map<string, Road>();
  private bridges = new Map<string, Bridge>();

  // Building operations
  async saveBuilding(building: Building): Promise<void> {
    this.buildings.set(building.id, building);
  }

  async getBuilding(id: FeatureId): Promise<Building | null> {
    return this.buildings.get(id) || null;
  }

  async getAllBuildings(): Promise<Building[]> {
    return Array.from(this.buildings.values());
  }

  async deleteBuilding(id: FeatureId): Promise<void> {
    this.buildings.delete(id);
  }

  // Road operations
  async saveRoad(road: Road): Promise<void> {
    this.roads.set(road.id, road);
  }

  async getRoad(id: FeatureId): Promise<Road | null> {
    return this.roads.get(id) || null;
  }

  async getAllRoads(): Promise<Road[]> {
    return Array.from(this.roads.values());
  }

  async deleteRoad(id: FeatureId): Promise<void> {
    this.roads.delete(id);
  }

  // Bridge operations
  async saveBridge(bridge: Bridge): Promise<void> {
    this.bridges.set(bridge.id, bridge);
  }

  async getBridge(id: FeatureId): Promise<Bridge | null> {
    return this.bridges.get(id) || null;
  }

  async getAllBridges(): Promise<Bridge[]> {
    return Array.from(this.bridges.values());
  }

  async deleteBridge(id: FeatureId): Promise<void> {
    this.bridges.delete(id);
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