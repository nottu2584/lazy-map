import {
  IReliefFeatureRepository,
  INaturalFeatureRepository,
  IArtificialFeatureRepository,
  ICulturalFeatureRepository
} from '@lazy-map/domain';

/**
 * Use case for clearing all features from all contexts
 */
export class ClearAllFeaturesUseCase {
  constructor(
    private readonly reliefRepository: IReliefFeatureRepository,
    private readonly naturalRepository: INaturalFeatureRepository,
    private readonly artificialRepository: IArtificialFeatureRepository,
    private readonly culturalRepository: ICulturalFeatureRepository
  ) {}

  async execute(): Promise<void> {
    await Promise.all([
      this.reliefRepository.clear(),
      this.naturalRepository.clear(),
      this.artificialRepository.clear(),
      this.culturalRepository.clear(),
    ]);
  }
}