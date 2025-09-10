import { Module } from '@nestjs/common';
import {
  MapGenerationService,
  VegetationGenerationService,
  FeatureMixingService,
  RandomGeneratorService,
  ConsoleNotificationService,
  InMemoryMapPersistence,
  TopographicFeatureRepository,
  BcryptPasswordService,
  JwtAuthenticationService,
  InMemoryUserRepository,
  InMemoryMapHistoryRepository,
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

    // User infrastructure services
    { provide: 'IPasswordService', useClass: BcryptPasswordService },
    { provide: 'IAuthenticationPort', useClass: JwtAuthenticationService },
    { provide: 'IUserRepository', useClass: InMemoryUserRepository },
    { provide: 'IMapHistoryRepository', useClass: InMemoryMapHistoryRepository },

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
    'IPasswordService',
    'IAuthenticationPort',
    'IUserRepository',
    'IMapHistoryRepository',
    TopographicFeatureRepository,
  ],
})
export class InfrastructureModule {}