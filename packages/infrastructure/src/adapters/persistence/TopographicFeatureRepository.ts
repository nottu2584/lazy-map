import { FeatureId, MapFeature } from '@lazy-map/domain/common/entities/MapFeature';
import { InMemoryReliefRepository } from '../../contexts/relief/persistence/InMemoryReliefRepository';
import { InMemoryNaturalRepository } from '../../contexts/natural/persistence/InMemoryNaturalRepository';
import { InMemoryArtificialRepository } from '../../contexts/artificial/persistence/InMemoryArtificialRepository';
import { InMemoryCulturalRepository } from '../../contexts/cultural/persistence/InMemoryCulturalRepository';

/**
 * Central repository that coordinates all topographic feature repositories
 */
export class TopographicFeatureRepository {
  private reliefRepo = new InMemoryReliefRepository();
  private naturalRepo = new InMemoryNaturalRepository();
  private artificialRepo = new InMemoryArtificialRepository();
  private culturalRepo = new InMemoryCulturalRepository();

  // Relief context access
  get relief() {
    return this.reliefRepo;
  }

  // Natural context access
  get natural() {
    return this.naturalRepo;
  }

  // Artificial context access
  get artificial() {
    return this.artificialRepo;
  }

  // Cultural context access
  get cultural() {
    return this.culturalRepo;
  }

  /**
   * Get all features across all contexts
   */
  async getAllFeatures(): Promise<MapFeature[]> {
    const [relief, natural, artificial, cultural] = await Promise.all([
      this.reliefRepo.getAllReliefFeatures(),
      this.naturalRepo.getAllNaturalFeatures(),
      this.artificialRepo.getAllArtificialFeatures(),
      this.culturalRepo.getAllCulturalFeatures(),
    ]);

    return [...relief, ...natural, ...artificial, ...cultural];
  }

  /**
   * Find a feature by ID across all contexts
   */
  async findFeatureById(id: FeatureId): Promise<MapFeature | null> {
    // Try relief features
    const mountain = await this.reliefRepo.getMountain(id);
    if (mountain) return mountain;

    const hill = await this.reliefRepo.getHill(id);
    if (hill) return hill;

    const valley = await this.reliefRepo.getValley(id);
    if (valley) return valley;

    const plateau = await this.reliefRepo.getPlateau(id);
    if (plateau) return plateau;

    // Try natural features
    const forest = await this.naturalRepo.getForest(id);
    if (forest) return forest;

    const tree = await this.naturalRepo.getTree(id);
    if (tree) return tree;

    // Try artificial features
    const building = await this.artificialRepo.getBuilding(id);
    if (building) return building;

    const road = await this.artificialRepo.getRoad(id);
    if (road) return road;

    const bridge = await this.artificialRepo.getBridge(id);
    if (bridge) return bridge;

    // Try cultural features
    const territory = await this.culturalRepo.getTerritory(id);
    if (territory) return territory;

    const settlement = await this.culturalRepo.getSettlement(id);
    if (settlement) return settlement;

    const region = await this.culturalRepo.getRegion(id);
    if (region) return region;

    return null;
  }

  /**
   * Clear all features from all contexts
   */
  async clearAll(): Promise<void> {
    await Promise.all([
      this.reliefRepo.clear(),
      this.naturalRepo.clear(),
      this.artificialRepo.clear(),
      this.culturalRepo.clear(),
    ]);
  }

  /**
   * Get feature count by context
   */
  async getFeatureStatistics(): Promise<{
    relief: number;
    natural: number;
    artificial: number;
    cultural: number;
    total: number;
  }> {
    const [relief, natural, artificial, cultural] = await Promise.all([
      this.reliefRepo.getAllReliefFeatures(),
      this.naturalRepo.getAllNaturalFeatures(),
      this.artificialRepo.getAllArtificialFeatures(),
      this.culturalRepo.getAllCulturalFeatures(),
    ]);

    return {
      relief: relief.length,
      natural: natural.length,
      artificial: artificial.length,
      cultural: cultural.length,
      total: relief.length + natural.length + artificial.length + cultural.length,
    };
  }
}