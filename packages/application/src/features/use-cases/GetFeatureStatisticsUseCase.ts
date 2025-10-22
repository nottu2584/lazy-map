import {
  IReliefFeatureRepository,
  INaturalFeatureRepository,
  IArtificialFeatureRepository,
  ICulturalFeatureRepository
} from '@lazy-map/domain';

export interface FeatureStatistics {
  relief: number;
  natural: number;
  artificial: number;
  cultural: number;
  total: number;
}

/**
 * Use case for retrieving feature statistics by context
 */
export class GetFeatureStatisticsUseCase {
  constructor(
    private readonly reliefRepository: IReliefFeatureRepository,
    private readonly naturalRepository: INaturalFeatureRepository,
    private readonly artificialRepository: IArtificialFeatureRepository,
    private readonly culturalRepository: ICulturalFeatureRepository
  ) {}

  async execute(): Promise<FeatureStatistics> {
    const [relief, natural, artificial, cultural] = await Promise.all([
      this.reliefRepository.getAllReliefFeatures(),
      this.naturalRepository.getAllNaturalFeatures(),
      this.artificialRepository.getAllArtificialFeatures(),
      this.culturalRepository.getAllCulturalFeatures(),
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