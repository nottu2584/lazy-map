import {
  MapFeature,
  FeatureId,
  IReliefFeatureRepository,
  INaturalFeatureRepository,
  IArtificialFeatureRepository,
  ICulturalFeatureRepository
} from '@lazy-map/domain';

/**
 * Use case for finding a feature by ID across all contexts
 */
export class GetFeatureByIdUseCase {
  constructor(
    private readonly reliefRepository: IReliefFeatureRepository,
    private readonly naturalRepository: INaturalFeatureRepository,
    private readonly artificialRepository: IArtificialFeatureRepository,
    private readonly culturalRepository: ICulturalFeatureRepository
  ) {}

  async execute(id: FeatureId): Promise<MapFeature | null> {
    // Try relief features
    const mountain = await this.reliefRepository.getMountain(id);
    if (mountain) return mountain;

    const hill = await this.reliefRepository.getHill(id);
    if (hill) return hill;

    const valley = await this.reliefRepository.getValley(id);
    if (valley) return valley;

    const plateau = await this.reliefRepository.getPlateau(id);
    if (plateau) return plateau;

    // Try natural features
    const forest = await this.naturalRepository.getForest(id);
    if (forest) return forest;

    const grassland = await this.naturalRepository.getGrassland(id);
    if (grassland) return grassland;

    const spring = await this.naturalRepository.getSpring(id);
    if (spring) return spring;

    const pond = await this.naturalRepository.getPond(id);
    if (pond) return pond;

    const wetland = await this.naturalRepository.getWetland(id);
    if (wetland) return wetland;

    // Try artificial features
    // TODO: Fix Building/Road/Bridge type compatibility with MapFeature
    // const building = await this.artificialRepository.getBuilding(id);
    // if (building) return building;

    // const road = await this.artificialRepository.getRoad(id);
    // if (road) return road;

    // const bridge = await this.artificialRepository.getBridge(id);
    // if (bridge) return bridge;

    // Try cultural features
    const territory = await this.culturalRepository.getTerritory(id);
    if (territory) return territory;

    const settlement = await this.culturalRepository.getSettlement(id);
    if (settlement) return settlement;

    const region = await this.culturalRepository.getRegion(id);
    if (region) return region;

    return null;
  }
}