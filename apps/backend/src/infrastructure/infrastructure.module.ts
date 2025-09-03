import { Module } from '@nestjs/common';
import {
  MapGenerationService,
  VegetationGenerationService,
  FeatureMixingService,
  RandomGeneratorService,
  ConsoleNotificationService,
  InMemoryMapPersistence,
  TopographicFeatureRepository
} from '@lazy-map/infrastructure';

@Module({
  providers: [
    // Domain service implementations
    { provide: 'IMapGenerationService', useClass: MapGenerationService },
    { provide: 'IVegetationGenerationService', useClass: VegetationGenerationService },
    { provide: 'IFeatureMixingService', useClass: FeatureMixingService },
    { provide: 'IRandomGeneratorService', useClass: RandomGeneratorService },

    // Output port implementations
    { provide: 'IMapPersistencePort', useClass: InMemoryMapPersistence },
    { provide: 'INotificationPort', useClass: ConsoleNotificationService },

    // Topographic feature repository
    TopographicFeatureRepository,
  ],
  exports: [
    'IMapGenerationService',
    'IVegetationGenerationService',
    'IFeatureMixingService',
    'IRandomGeneratorService',
    'IMapPersistencePort',
    'INotificationPort',
    TopographicFeatureRepository,
  ],
})
export class InfrastructureModule {}