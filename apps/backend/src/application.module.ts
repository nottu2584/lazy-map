import {
  CheckAdminAccessUseCase,
  CompleteDiscordSignInUseCase,
  CompleteGoogleSignInUseCase,
  DeleteUserUseCase,
  GenerateTacticalMapUseCase,
  GetMapUseCase,
  GetUserMapsUseCase,
  GetUserPermissionsUseCase,
  GetUserProfileUseCase,
  GetUserStatsUseCase,
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
  RefreshTokenUseCase,
  RegisterUserUseCase,
  SaveMapUseCase,
  SuspendUserUseCase,
  UpdateUserUseCase,
  ValidateSeedUseCase,
} from '@lazy-map/application';
import { ILogger, ITacticalMapConverter, TacticalMapConverter } from '@lazy-map/domain';
import { MapEntity, PostgresMapRepository } from '@lazy-map/infrastructure';
import { Module } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InfrastructureModule } from './infrastructure.module';

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
        logger,
      ) => {
        return new GenerateTacticalMapUseCase(
          geologyService,
          topographyService,
          hydrologyService,
          vegetationService,
          structuresService,
          logger,
        );
      },
      inject: [
        'IGeologyLayerService',
        'ITopographyLayerService',
        'IHydrologyLayerService',
        'IVegetationLayerService',
        'IStructuresLayerService',
        'ILogger',
      ],
    },

    // Tactical Map Converter (domain service)
    // Converts layered tactical map data to tile-based MapGrid representation
    {
      provide: 'ITacticalMapConverter',
      useClass: TacticalMapConverter,
    },

    // PostgreSQL Map Repository (when USE_DATABASE=true)
    // Provides IMapRepository using PostgresMapRepository with proper dependencies
    ...(shouldUseDatabase()
      ? [
          {
            provide: 'IMapRepository',
            useFactory: (
              mapEntityRepository: Repository<MapEntity>,
              generateMapUseCase: GenerateTacticalMapUseCase,
              tileConverter: ITacticalMapConverter,
              logger: ILogger,
            ) => {
              return new PostgresMapRepository(
                mapEntityRepository,
                generateMapUseCase,
                tileConverter,
                logger,
              );
            },
            inject: [
              getRepositoryToken(MapEntity),
              GenerateTacticalMapUseCase,
              'ITacticalMapConverter',
              'ILogger',
            ],
          },
          // Also provide IMapPersistencePort as a wrapper around PostgresMapRepository
          // This allows use cases that depend on IMapPersistencePort to work with PostgreSQL
          {
            provide: 'IMapPersistencePort',
            useFactory: (mapRepository: any) => {
              // Adapt IMapRepository methods to IMapPersistencePort interface
              return {
                saveMap: (map: any) => mapRepository.save(map),
                updateMap: (map: any) => mapRepository.update(map),
                loadMap: (mapId: any) => mapRepository.findById(mapId),
                deleteMap: (mapId: any) => mapRepository.delete(mapId),
                mapExists: (mapId: any) => mapRepository.exists(mapId),
                findByOwner: (userId: any, _limit?: number) => mapRepository.findByOwnerId(userId),
                getMapCount: () => mapRepository.count(),
                listMaps: async () => {
                  throw new Error('Not implemented');
                },
                beginTransaction: async () => {
                  throw new Error('Not implemented');
                },
              };
            },
            inject: ['IMapRepository'],
          },
        ]
      : []),

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
      useFactory: (userRepository, passwordService, authenticationPort, refreshTokenService, refreshTokenRepository) => {
        return new RegisterUserUseCase(userRepository, passwordService, authenticationPort, refreshTokenService, refreshTokenRepository);
      },
      inject: ['IUserRepository', 'IPasswordService', 'IAuthenticationPort', 'IRefreshTokenPort', 'IRefreshTokenRepository'],
    },
    {
      provide: LoginUserUseCase,
      useFactory: (userRepository, passwordService, authenticationPort, refreshTokenService, refreshTokenRepository) => {
        return new LoginUserUseCase(userRepository, passwordService, authenticationPort, refreshTokenService, refreshTokenRepository);
      },
      inject: ['IUserRepository', 'IPasswordService', 'IAuthenticationPort', 'IRefreshTokenPort', 'IRefreshTokenRepository'],
    },
    {
      provide: GetUserProfileUseCase,
      useFactory: (userRepository) => {
        return new GetUserProfileUseCase(userRepository);
      },
      inject: ['IUserRepository'],
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
      useFactory: (googleOAuthService, oauthStateService, logger) => {
        return new InitiateGoogleSignInUseCase(googleOAuthService, oauthStateService, logger);
      },
      inject: ['IGoogleOAuthPort', 'IOAuthStatePort', 'ILogger'],
    },
    {
      provide: CompleteGoogleSignInUseCase,
      useFactory: (
        userRepository,
        oauthTokenRepository,
        googleOAuthService,
        authenticationService,
        tokenEncryptionService,
        oauthStateService,
        refreshTokenService,
        refreshTokenRepository,
        logger,
      ) => {
        return new CompleteGoogleSignInUseCase(
          userRepository,
          oauthTokenRepository,
          googleOAuthService,
          authenticationService,
          tokenEncryptionService,
          oauthStateService,
          refreshTokenService,
          refreshTokenRepository,
          logger,
        );
      },
      inject: [
        'IUserRepository',
        'IOAuthTokenRepository',
        'IGoogleOAuthPort',
        'IAuthenticationPort',
        'ITokenEncryptionPort',
        'IOAuthStatePort',
        'IRefreshTokenPort',
        'IRefreshTokenRepository',
        'ILogger',
      ],
    },
    {
      provide: InitiateDiscordSignInUseCase,
      useFactory: (discordOAuthService, oauthStateService, logger) => {
        return new InitiateDiscordSignInUseCase(discordOAuthService, oauthStateService, logger);
      },
      inject: ['IDiscordOAuthPort', 'IOAuthStatePort', 'ILogger'],
    },
    {
      provide: CompleteDiscordSignInUseCase,
      useFactory: (
        userRepository,
        oauthTokenRepository,
        discordOAuthService,
        authenticationService,
        tokenEncryptionService,
        oauthStateService,
        refreshTokenService,
        refreshTokenRepository,
        logger,
      ) => {
        return new CompleteDiscordSignInUseCase(
          userRepository,
          oauthTokenRepository,
          discordOAuthService,
          authenticationService,
          tokenEncryptionService,
          oauthStateService,
          refreshTokenService,
          refreshTokenRepository,
          logger,
        );
      },
      inject: [
        'IUserRepository',
        'IOAuthTokenRepository',
        'IDiscordOAuthPort',
        'IAuthenticationPort',
        'ITokenEncryptionPort',
        'IOAuthStatePort',
        'IRefreshTokenPort',
        'IRefreshTokenRepository',
        'ILogger',
      ],
    },

    // Refresh token use case
    {
      provide: RefreshTokenUseCase,
      useFactory: (
        refreshTokenRepository,
        userRepository,
        refreshTokenService,
        authenticationService,
        logger,
      ) => {
        return new RefreshTokenUseCase(
          refreshTokenRepository,
          userRepository,
          refreshTokenService,
          authenticationService,
          logger,
        );
      },
      inject: [
        'IRefreshTokenRepository',
        'IUserRepository',
        'IRefreshTokenPort',
        'IAuthenticationPort',
        'ILogger',
      ],
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
    LinkGoogleAccountUseCase,
    LinkDiscordAccountUseCase,
    InitiateGoogleSignInUseCase,
    CompleteGoogleSignInUseCase,
    InitiateDiscordSignInUseCase,
    CompleteDiscordSignInUseCase,
    RefreshTokenUseCase,
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
  ],
})
export class ApplicationModule {}
