import {
  ClearAllFeaturesUseCase,
  DeleteUserUseCase,
  GenerateTacticalMapUseCase,
  GetAllFeaturesUseCase,
  GetFeatureByIdUseCase,
  GetFeatureStatisticsUseCase,
  GetMapTileUseCase,
  GetMapUseCase,
  GetUserMapsUseCase,
  GetUserProfileUseCase,
  GetUserStatsUseCase,
  GoogleSignInUseCase,
  HealthCheckUseCase,
  LinkGoogleAccountUseCase,
  ListMapsUseCase,
  ListUsersUseCase,
  LoginUserUseCase,
  PromoteUserUseCase,
  ReactivateUserUseCase,
  RegisterUserUseCase,
  SuspendUserUseCase,
  UpdateUserUseCase,
  ValidateMapSettingsUseCase,
  ValidateSeedUseCase,
  CheckAdminAccessUseCase,
  GetUserPermissionsUseCase,
} from '@lazy-map/application';
import { Module } from '@nestjs/common';
import { InfrastructureModule } from './infrastructure.module';

@Module({
  imports: [InfrastructureModule],
  providers: [
    // Tactical Map Generation Use Case
    {
      provide: GenerateTacticalMapUseCase,
      useFactory: (
        geologyService,
        topographyService,
        hydrologyService,
        vegetationService,
        structuresService,
        featuresService,
        logger
      ) => {
        return new GenerateTacticalMapUseCase(
          geologyService,
          topographyService,
          hydrologyService,
          vegetationService,
          structuresService,
          featuresService,
          logger
        );
      },
      inject: [
        'IGeologyLayerService',
        'ITopographyLayerService',
        'IHydrologyLayerService',
        'IVegetationLayerService',
        'IStructuresLayerService',
        'IFeaturesLayerService',
        'ILogger'
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
      provide: HealthCheckUseCase,
      useFactory: () => {
        return new HealthCheckUseCase();
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

    // Admin use cases
    {
      provide: CheckAdminAccessUseCase,
      useFactory: (userRepository, logger) => {
        return new CheckAdminAccessUseCase(userRepository, logger);
      },
      inject: ['IUserRepository', 'ILogger'],
    },
    {
      provide: GetUserPermissionsUseCase,
      useFactory: (userRepository, logger) => {
        return new GetUserPermissionsUseCase(userRepository, logger);
      },
      inject: ['IUserRepository', 'ILogger'],
    },
    {
      provide: ListUsersUseCase,
      useFactory: (userRepository) => {
        return new ListUsersUseCase(userRepository);
      },
      inject: ['IUserRepository'],
    },
    {
      provide: UpdateUserUseCase,
      useFactory: (userRepository) => {
        return new UpdateUserUseCase(userRepository);
      },
      inject: ['IUserRepository'],
    },
    {
      provide: SuspendUserUseCase,
      useFactory: (userRepository) => {
        return new SuspendUserUseCase(userRepository);
      },
      inject: ['IUserRepository'],
    },
    {
      provide: ReactivateUserUseCase,
      useFactory: (userRepository) => {
        return new ReactivateUserUseCase(userRepository);
      },
      inject: ['IUserRepository'],
    },
    {
      provide: PromoteUserUseCase,
      useFactory: (userRepository) => {
        return new PromoteUserUseCase(userRepository);
      },
      inject: ['IUserRepository'],
    },
    {
      provide: DeleteUserUseCase,
      useFactory: (userRepository) => {
        return new DeleteUserUseCase(userRepository);
      },
      inject: ['IUserRepository'],
    },
    {
      provide: GetUserStatsUseCase,
      useFactory: (userRepository) => {
        return new GetUserStatsUseCase(userRepository);
      },
      inject: ['IUserRepository'],
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
  ],
  exports: [
    // Export Map Use Cases
    GenerateTacticalMapUseCase,
    GetMapUseCase,
    GetUserMapsUseCase,
    ValidateSeedUseCase,
    HealthCheckUseCase,
    // Export User Use Cases
    RegisterUserUseCase,
    LoginUserUseCase,
    GetUserProfileUseCase,
    GoogleSignInUseCase,
    LinkGoogleAccountUseCase,
    // Export Admin Use Cases
    CheckAdminAccessUseCase,
    GetUserPermissionsUseCase,
    ListUsersUseCase,
    UpdateUserUseCase,
    SuspendUserUseCase,
    ReactivateUserUseCase,
    PromoteUserUseCase,
    DeleteUserUseCase,
    GetUserStatsUseCase,
    // Export Feature Use Cases
    GetAllFeaturesUseCase,
    GetFeatureByIdUseCase,
    GetFeatureStatisticsUseCase,
    ClearAllFeaturesUseCase,
  ],
})
export class ApplicationModule {}
