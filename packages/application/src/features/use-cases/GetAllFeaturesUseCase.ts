import {
  MapFeature,
  IReliefFeatureRepository,
  INaturalFeatureRepository,
  IArtificialFeatureRepository,
  ICulturalFeatureRepository
} from '@lazy-map/domain';

export type FeatureContext = 'relief' | 'natural' | 'artificial' | 'cultural';

/**
 * Use case for retrieving all features, optionally filtered by context
 */
export class GetAllFeaturesUseCase {
  constructor(
    private readonly reliefRepository: IReliefFeatureRepository,
    private readonly naturalRepository: INaturalFeatureRepository,
    private readonly artificialRepository: IArtificialFeatureRepository,
    private readonly culturalRepository: ICulturalFeatureRepository
  ) {}

  async execute(context?: FeatureContext): Promise<MapFeature[]> {
    if (context) {
      return this.getFeaturesByContext(context);
    }

    // Get all features from all contexts
    const [relief, natural, cultural] = await Promise.all([
      this.reliefRepository.getAllReliefFeatures(),
      this.naturalRepository.getAllNaturalFeatures(),
      // TODO: Fix artificial features type compatibility
      // this.artificialRepository.getAllArtificialFeatures(),
      this.culturalRepository.getAllCulturalFeatures(),
    ]);

    return [...relief, ...natural, ...cultural];
  }

  private async getFeaturesByContext(context: FeatureContext): Promise<MapFeature[]> {
    switch (context) {
      case 'relief':
        return this.reliefRepository.getAllReliefFeatures();
      case 'natural':
        return this.naturalRepository.getAllNaturalFeatures();
      case 'artificial':
        // TODO: Fix Building type compatibility with MapFeature
        return [] as MapFeature[];
      case 'cultural':
        return this.culturalRepository.getAllCulturalFeatures();
      default:
        throw new Error(`Invalid context: ${context}`);
    }
  }
}