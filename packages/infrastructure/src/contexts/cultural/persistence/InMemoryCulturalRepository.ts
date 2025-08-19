import { 
  Territory,
  Settlement,
  Region,
} from '@lazy-map/domain/contexts/cultural/entities';
import { FeatureId } from '@lazy-map/domain/common/entities/MapFeature';

/**
 * In-memory repository for cultural features
 */
export class InMemoryCulturalRepository {
  private territories = new Map<string, Territory>();
  private settlements = new Map<string, Settlement>();
  private regions = new Map<string, Region>();

  // Territory operations
  async saveTerritory(territory: Territory): Promise<void> {
    this.territories.set(territory.id, territory);
  }

  async getTerritory(id: FeatureId): Promise<Territory | null> {
    return this.territories.get(id) || null;
  }

  async getAllTerritories(): Promise<Territory[]> {
    return Array.from(this.territories.values());
  }

  async deleteTerritory(id: FeatureId): Promise<void> {
    this.territories.delete(id);
  }

  // Settlement operations
  async saveSettlement(settlement: Settlement): Promise<void> {
    this.settlements.set(settlement.id, settlement);
  }

  async getSettlement(id: FeatureId): Promise<Settlement | null> {
    return this.settlements.get(id) || null;
  }

  async getAllSettlements(): Promise<Settlement[]> {
    return Array.from(this.settlements.values());
  }

  async deleteSettlement(id: FeatureId): Promise<void> {
    this.settlements.delete(id);
  }

  // Region operations
  async saveRegion(region: Region): Promise<void> {
    this.regions.set(region.id, region);
  }

  async getRegion(id: FeatureId): Promise<Region | null> {
    return this.regions.get(id) || null;
  }

  async getAllRegions(): Promise<Region[]> {
    return Array.from(this.regions.values());
  }

  async deleteRegion(id: FeatureId): Promise<void> {
    this.regions.delete(id);
  }

  // Bulk operations
  async getAllCulturalFeatures(): Promise<(Territory | Settlement | Region)[]> {
    return [
      ...this.territories.values(),
      ...this.settlements.values(),
      ...this.regions.values(),
    ];
  }

  async clear(): Promise<void> {
    this.territories.clear();
    this.settlements.clear();
    this.regions.clear();
  }
}