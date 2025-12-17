import {
  CheckAdminAccessUseCase,
  ClearAllFeaturesUseCase,
  CompleteDiscordSignInUseCase,
  CompleteGoogleSignInUseCase,
  DeleteUserUseCase,
  DiscordSignInUseCase,
  GenerateTacticalMapUseCase,
  GetAllFeaturesUseCase,
  GetFeatureByIdUseCase,
  GetFeatureStatisticsUseCase,
  GetMapTileUseCase,
  GetMapUseCase,
  GetUserMapsUseCase,
  GetUserPermissionsUseCase,
  GetUserProfileUseCase,
  GetUserStatsUseCase,
  GoogleSignInUseCase,
  HealthCheckUseCase,
  InitiateDiscordSignInUseCase,
  InitiateGoogleSignInUseCase,
  LinkDiscordAccountUseCase,
  LinkGoogleAccountUseCase,
  ListMapsUseCase,
  ListUsersUseCase,
  LoginUserUseCase,
  PromoteUserUseCase,
  ReactivateUserUseCase,
  RegisterUserUseCase,
  SaveMapUseCase,
  SuspendUserUseCase,
  UpdateUserUseCase,
  ValidateMapSettingsUseCase,
  ValidateSeedUseCase,
} from '@lazy-map/application';
import { Module } from '@nestjs/common';
import { InfrastructureModule } from './infrastructure.module';
import { PostgresMapRepository } from '@lazy-map/infrastructure';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MapEntity } from '@lazy-map/infrastructure';

// Helper function to check if database should be used
const shouldUseDatabase = () => {
  return process.env.USE_DATABASE === 'true';
};

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

    // PostgreSQL Map Repository (when USE_DATABASE=true)
    // Provides IMapRepository using PostgresMapRepository with proper dependencies
    ...(shouldUseDatabase()
      ? [
          {
            provide: 'IMapRepository',
            useFactory: (mapEntityRepository, generateMapUseCase, logger) => {
              return new PostgresMapRepository(
                mapEntityRepository,
                generateMapUseCase,
                logger
              );
            },
            inject: [getRepositoryToken(MapEntity), GenerateTacticalMapUseCase, 'ILogger'],
          },
        ]
      : []),

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
    {
      provide: SaveMapUseCase,
      useFactory: (mapRepository, logger) => {
        return new SaveMapUseCase(mapRepository, logger);
      },
      inject: ['IMapRepository', 'ILogger'],
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
      useFactory: (userRepository, googleOAuthService, authenticationService, logger) => {
        return new GoogleSignInUseCase(userRepository, googleOAuthService, authenticationService, logger);
      },
      inject: ['IUserRepository', 'IGoogleOAuthPort', 'IAuthenticationPort', 'ILogger'],
    },
    {
      provide: DiscordSignInUseCase,
      useFactory: (userRepository, discordOAuthService, authenticationService, logger) => {
        return new DiscordSignInUseCase(userRepository, discordOAuthService, authenticationService, logger);
      },
      inject: ['IUserRepository', 'IDiscordOAuthPort', 'IAuthenticationPort', 'ILogger'],
    },
    {
      provide: LinkGoogleAccountUseCase,
      useFactory: (userRepository, googleOAuthService, logger) => {
        return new LinkGoogleAccountUseCase(userRepository, googleOAuthService, logger);
      },
      inject: ['IUserRepository', 'IGoogleOAuthPort', 'ILogger'],
    },
    {
      provide: LinkDiscordAccountUseCase,
      useFactory: (userRepository, discordOAuthService, logger) => {
        return new LinkDiscordAccountUseCase(userRepository, discordOAuthService, logger);
      },
      inject: ['IUserRepository', 'IDiscordOAuthPort', 'ILogger'],
    },
    {
      provide: InitiateGoogleSignInUseCase,
      useFactory: (googleOAuthService, logger) => {
        return new InitiateGoogleSignInUseCase(googleOAuthService, logger);
      },
      inject: ['IGoogleOAuthPort', 'ILogger'],
    },
    {
      provide: CompleteGoogleSignInUseCase,
      useFactory: (userRepository, oauthTokenRepository, googleOAuthService, authenticationService, tokenEncryptionService, logger) => {
        return new CompleteGoogleSignInUseCase(userRepository, oauthTokenRepository, googleOAuthService, authenticationService, tokenEncryptionService, logger);
      },
      inject: ['IUserRepository', 'IOAuthTokenRepository', 'IGoogleOAuthPort', 'IAuthenticationPort', 'ITokenEncryptionPort', 'ILogger'],
    },
    {
      provide: InitiateDiscordSignInUseCase,
      useFactory: (discordOAuthService, logger) => {
        return new InitiateDiscordSignInUseCase(discordOAuthService, logger);
      },
      inject: ['IDiscordOAuthPort', 'ILogger'],
    },
    {
      provide: CompleteDiscordSignInUseCase,
      useFactory: (userRepository, oauthTokenRepository, discordOAuthService, authenticationService, tokenEncryptionService, logger) => {
        return new CompleteDiscordSignInUseCase(userRepository, oauthTokenRepository, discordOAuthService, authenticationService, tokenEncryptionService, logger);
      },
      inject: ['IUserRepository', 'IOAuthTokenRepository', 'IDiscordOAuthPort', 'IAuthenticationPort', 'ITokenEncryptionPort', 'ILogger'],
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
    SaveMapUseCase,
    ValidateSeedUseCase,
    HealthCheckUseCase,
    // Export User Use Cases
    RegisterUserUseCase,
    LoginUserUseCase,
    GetUserProfileUseCase,
    GoogleSignInUseCase,
    DiscordSignInUseCase,
    LinkGoogleAccountUseCase,
    LinkDiscordAccountUseCase,
    InitiateGoogleSignInUseCase,
    CompleteGoogleSignInUseCase,
    InitiateDiscordSignInUseCase,
    CompleteDiscordSignInUseCase,
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
