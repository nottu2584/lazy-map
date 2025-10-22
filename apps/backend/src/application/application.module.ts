import { Module } from '@nestjs/common';
import { InfrastructureModule } from '../infrastructure/infrastructure.module';
import {
  GenerateMapUseCase,
  ValidateMapSettingsUseCase,
  ValidateSeedUseCase,
  GetMapUseCase,
  GetMapTileUseCase,
  ListMapsUseCase,
  GetUserMapsUseCase,
  RegisterUserUseCase,
  LoginUserUseCase,
  GetUserProfileUseCase,
  GoogleSignInUseCase,
  LinkGoogleAccountUseCase,
  GetAllFeaturesUseCase,
  GetFeatureByIdUseCase,
  GetFeatureStatisticsUseCase,
  ClearAllFeaturesUseCase,
} from '@lazy-map/application';

@Module({
  imports: [InfrastructureModule],
  providers: [
    {
      provide: GenerateMapUseCase,
      useFactory: (
        mapGenService,
        vegetationGenService,
        featureMixingService,
        mapPersistence,
        randomGen,
        notificationPort,
        logger,
      ) => {
        return new GenerateMapUseCase(
          mapGenService,
          vegetationGenService,
          featureMixingService,
          mapPersistence,
          randomGen,
          notificationPort,
          logger,
        );
      },
      inject: [
        'IMapGenerationService',
        'IVegetationGenerationService',
        'IFeatureMixingService',
        'IMapPersistencePort',
        'IRandomGeneratorService',
        'INotificationPort',
        'ILogger',
      ],
    },
    {
      provide: ValidateMapSettingsUseCase,
      useFactory: () => {
        return new ValidateMapSettingsUseCase();
      },
    },
    {
      provide: ValidateSeedUseCase,
      useFactory: () => {
        return new ValidateSeedUseCase();
      },
    },
    {
      provide: GetMapUseCase,
      useFactory: (mapPersistence) => {
        return new GetMapUseCase(mapPersistence);
      },
      inject: ['IMapPersistencePort'],
    },
    {
      provide: GetMapTileUseCase,
      useFactory: (mapPersistence) => {
        return new GetMapTileUseCase(mapPersistence);
      },
      inject: ['IMapPersistencePort'],
    },
    {
      provide: ListMapsUseCase,
      useFactory: (mapPersistence) => {
        return new ListMapsUseCase(mapPersistence);
      },
      inject: ['IMapPersistencePort'],
    },
    {
      provide: GetUserMapsUseCase,
      useFactory: (mapPersistence) => {
        return new GetUserMapsUseCase(mapPersistence);
      },
      inject: ['IMapPersistencePort'],
    },

    // Provide Use Cases with string tokens for injection
    {
      provide: 'GenerateMapUseCase',
      useExisting: GenerateMapUseCase,
    },
    {
      provide: 'GetMapUseCase',
      useExisting: GetMapUseCase,
    },
    {
      provide: 'GetUserMapsUseCase',
      useExisting: GetUserMapsUseCase,
    },
    {
      provide: 'ValidateSeedUseCase',
      useExisting: ValidateSeedUseCase,
    },

    // User use cases
    {
      provide: RegisterUserUseCase,
      useFactory: (userRepository, passwordService, authenticationPort) => {
        return new RegisterUserUseCase(userRepository, passwordService, authenticationPort);
      },
      inject: ['IUserRepository', 'IPasswordService', 'IAuthenticationPort'],
    },
    {
      provide: LoginUserUseCase,
      useFactory: (userRepository, passwordService, authenticationPort) => {
        return new LoginUserUseCase(userRepository, passwordService, authenticationPort);
      },
      inject: ['IUserRepository', 'IPasswordService', 'IAuthenticationPort'],
    },
    {
      provide: GetUserProfileUseCase,
      useFactory: (userRepository) => {
        return new GetUserProfileUseCase(userRepository);
      },
      inject: ['IUserRepository'],
    },
    {
      provide: GoogleSignInUseCase,
      useFactory: (userRepository, oauthService, logger) => {
        return new GoogleSignInUseCase(userRepository, oauthService, logger);
      },
      inject: ['IUserRepository', 'IOAuthService', 'ILogger'],
    },
    {
      provide: LinkGoogleAccountUseCase,
      useFactory: (userRepository, oauthService, logger) => {
        return new LinkGoogleAccountUseCase(userRepository, oauthService, logger);
      },
      inject: ['IUserRepository', 'IOAuthService', 'ILogger'],
    },

    // Feature use cases
    {
      provide: GetAllFeaturesUseCase,
      useFactory: (reliefRepo, naturalRepo, artificialRepo, culturalRepo) => {
        return new GetAllFeaturesUseCase(reliefRepo, naturalRepo, artificialRepo, culturalRepo);
      },
      inject: ['IReliefFeatureRepository', 'INaturalFeatureRepository', 'IArtificialFeatureRepository', 'ICulturalFeatureRepository'],
    },
    {
      provide: GetFeatureByIdUseCase,
      useFactory: (reliefRepo, naturalRepo, artificialRepo, culturalRepo) => {
        return new GetFeatureByIdUseCase(reliefRepo, naturalRepo, artificialRepo, culturalRepo);
      },
      inject: ['IReliefFeatureRepository', 'INaturalFeatureRepository', 'IArtificialFeatureRepository', 'ICulturalFeatureRepository'],
    },
    {
      provide: GetFeatureStatisticsUseCase,
      useFactory: (reliefRepo, naturalRepo, artificialRepo, culturalRepo) => {
        return new GetFeatureStatisticsUseCase(reliefRepo, naturalRepo, artificialRepo, culturalRepo);
      },
      inject: ['IReliefFeatureRepository', 'INaturalFeatureRepository', 'IArtificialFeatureRepository', 'ICulturalFeatureRepository'],
    },
    {
      provide: ClearAllFeaturesUseCase,
      useFactory: (reliefRepo, naturalRepo, artificialRepo, culturalRepo) => {
        return new ClearAllFeaturesUseCase(reliefRepo, naturalRepo, artificialRepo, culturalRepo);
      },
      inject: ['IReliefFeatureRepository', 'INaturalFeatureRepository', 'IArtificialFeatureRepository', 'ICulturalFeatureRepository'],
    },
    {
      provide: 'GetAllFeaturesUseCase',
      useExisting: GetAllFeaturesUseCase,
    },
    {
      provide: 'GetFeatureByIdUseCase',
      useExisting: GetFeatureByIdUseCase,
    },
    {
      provide: 'GetFeatureStatisticsUseCase',
      useExisting: GetFeatureStatisticsUseCase,
    },
    {
      provide: 'ClearAllFeaturesUseCase',
      useExisting: ClearAllFeaturesUseCase,
    },
  ],
  exports: [
    // Export Map Use Cases
    GenerateMapUseCase,
    GetMapUseCase,
    GetUserMapsUseCase,
    ValidateSeedUseCase,
    'GenerateMapUseCase',
    'GetMapUseCase',
    'GetUserMapsUseCase',
    'ValidateSeedUseCase',
    // Export User Use Cases
    RegisterUserUseCase,
    LoginUserUseCase,
    GetUserProfileUseCase,
    GoogleSignInUseCase,
    LinkGoogleAccountUseCase,
    // Export Feature Use Cases
    GetAllFeaturesUseCase,
    GetFeatureByIdUseCase,
    GetFeatureStatisticsUseCase,
    ClearAllFeaturesUseCase,
    'GetAllFeaturesUseCase',
    'GetFeatureByIdUseCase',
    'GetFeatureStatisticsUseCase',
    'ClearAllFeaturesUseCase',
  ],
})
export class ApplicationModule {}
