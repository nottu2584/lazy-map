import { IMapPersistencePort } from '@lazy-map/application';
import {
  AesTokenEncryptionService,
  BackLoggingService,
  BcryptPasswordService,
  BedrockPatternService,
  BridgeGenerationService,
  BuildingGenerationService,
  BuildingPlacementService,
  ClearingCalculationService,
  ConfigurationCalculationService,
  ConsoleNotificationService,
  createDiscordOAuthService,
  createGoogleOAuthService,
  DatabaseModule,
  DecorationGenerationService,
  ElevationGenerationService,
  ErosionModelService,
  FlowCalculationService,
  ForestGenerationService,
  FormationSelectionService,
  GeologicalFeaturesService,
  GeologyLayer,
  GeologyTileGenerationService,
  HtmlTemplateService,
  HybridMapRepository,
  InMemoryOAuthStateService,
  RefreshTokenService,
  HydrologyLayer,
  InMemoryMapHistoryRepository,
  InMemoryMapPersistence,
  InMemoryOAuthTokenRepository,
  InMemoryRefreshTokenRepository,
  InMemoryUserRepository,
  JwtAuthenticationService,
  LayoutGenerationService,
  LoggingModule,
  MapRepositoryAdapter,
  MoistureCalculationService,
  PlantGenerationService,
  PotentialCalculationService,
  RoadGenerationService,
  RoomAllocationService,
  SegmentGenerationService,
  SiteCalculationService,
  SoilCalculationService,
  SpringGenerationService,
  StreamCalculationService,
  StructuresLayer,
  StructureTileGenerationService,
  TacticalCalculationService,
  TerrainSmoothingService,
  TopographyCalculationService,
  TopographyLayer,
  VegetationLayer,
  VegetationTileGenerationService,
  WaterDepthCalculationService,
  WeatheringService,
} from '@lazy-map/infrastructure';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Create a function to determine if database should be used
const shouldUseDatabase = () => {
  const useDb = process.env.USE_DATABASE === 'true';
  console.log(
    '[InfrastructureModule] USE_DATABASE:',
    process.env.USE_DATABASE,
    '-> shouldUseDatabase:',
    useDb,
  );
  return useDb;
};

@Module({
  imports: [
    ConfigModule,
    LoggingModule,
    // Import DatabaseModule when database is enabled
    ...(shouldUseDatabase() ? [DatabaseModule] : []),
  ],
  providers: [
    // Tactical Layer service implementations
    { provide: 'IGeologyLayerService', useClass: GeologyLayer },
    { provide: 'ITopographyLayerService', useClass: TopographyLayer },
    { provide: 'IHydrologyLayerService', useClass: HydrologyLayer },
    { provide: 'IVegetationLayerService', useClass: VegetationLayer },
    { provide: 'IStructuresLayerService', useClass: StructuresLayer },

    // Geology internal services
    FormationSelectionService,
    BedrockPatternService,
    WeatheringService,
    SoilCalculationService,
    GeologyTileGenerationService,

    // Topography internal services
    ElevationGenerationService,
    ErosionModelService,
    GeologicalFeaturesService,
    TerrainSmoothingService,
    TopographyCalculationService,

    // Vegetation internal services
    PotentialCalculationService,
    ForestGenerationService,
    PlantGenerationService,
    ClearingCalculationService,
    TacticalCalculationService,
    VegetationTileGenerationService,

    // Hydrology internal services
    FlowCalculationService,
    SpringGenerationService,
    StreamCalculationService,
    WaterDepthCalculationService,
    MoistureCalculationService,
    SegmentGenerationService,

    // Structures internal services
    SiteCalculationService,
    BuildingPlacementService,
    RoadGenerationService,
    BridgeGenerationService,
    DecorationGenerationService,
    StructureTileGenerationService,

    // Building internal services
    BuildingGenerationService,
    ConfigurationCalculationService,
    RoomAllocationService,
    LayoutGenerationService,

    // Output port implementations
    // Only provide IMapPersistencePort when NOT using database
    ...(shouldUseDatabase()
      ? []
      : [{ provide: 'IMapPersistencePort', useClass: InMemoryMapPersistence }]),
    { provide: 'INotificationPort', useClass: ConsoleNotificationService },

    // User infrastructure services
    { provide: 'IPasswordService', useClass: BcryptPasswordService },

    // JWT Authentication Service
    {
      provide: 'IAuthenticationPort',
      useFactory: (configService: ConfigService) => {
        const jwtSecret = configService.get<string>('JWT_SECRET', 'your-secret-key');
        console.log(
          '[InfrastructureModule JwtAuthenticationService] JWT_SECRET:',
          jwtSecret?.substring(0, 20) + '...',
        );
        const logger = new BackLoggingService('JwtAuthenticationService');
        return new JwtAuthenticationService(jwtSecret, logger);
      },
      inject: [ConfigService],
    },

    // Token Encryption Service
    {
      provide: 'ITokenEncryptionPort',
      useFactory: (configService: ConfigService) => {
        const encryptionKey = configService.get<string>('OAUTH_TOKEN_ENCRYPTION_KEY');
        const logger = new BackLoggingService('TokenEncryptionService');
        return new AesTokenEncryptionService(encryptionKey, logger);
      },
      inject: [ConfigService],
    },

    // HTML Template Service
    {
      provide: 'ITemplatePort',
      useFactory: (configService: ConfigService) => {
        // Templates are located in apps/backend/src/templates
        const templatesPath = require('path').join(__dirname, 'templates');

        // Get allowed frontend URLs from environment
        const allowedUrlsStr = configService.get<string>(
          'ALLOWED_FRONTEND_URLS',
          'http://localhost:5173',
        );
        const allowedOrigins = allowedUrlsStr.split(',').map((url) => url.trim());

        return new HtmlTemplateService(templatesPath, allowedOrigins);
      },
      inject: [ConfigService],
    },

    // Google OAuth Service
    {
      provide: 'IGoogleOAuthPort',
      useFactory: (configService: ConfigService) => {
        const clientId = configService.get<string>('GOOGLE_CLIENT_ID', '');
        const clientSecret = configService.get<string>('GOOGLE_CLIENT_SECRET');
        const redirectUri = configService.get<string>('GOOGLE_OAUTH_REDIRECT_URI', '');
        const logger = new BackLoggingService('GoogleOAuthService');

        if (!clientId) {
          logger.warn('Google OAuth not configured - GOOGLE_CLIENT_ID is missing');
          return null;
        }

        if (!redirectUri) {
          logger.warn('Google OAuth not configured - GOOGLE_OAUTH_REDIRECT_URI is missing');
          return null;
        }

        return createGoogleOAuthService(clientId, clientSecret || null, redirectUri, logger);
      },
      inject: [ConfigService],
    },

    // Discord OAuth Service
    {
      provide: 'IDiscordOAuthPort',
      useFactory: (configService: ConfigService) => {
        const clientId = configService.get<string>('DISCORD_CLIENT_ID', '');
        const clientSecret = configService.get<string>('DISCORD_CLIENT_SECRET', '');
        const redirectUri = configService.get<string>('DISCORD_OAUTH_REDIRECT_URI', '');
        const logger = new BackLoggingService('DiscordOAuthService');

        if (!clientId || !clientSecret) {
          logger.warn(
            'Discord OAuth not configured - DISCORD_CLIENT_ID or DISCORD_CLIENT_SECRET is missing',
          );
          return null;
        }

        if (!redirectUri) {
          logger.warn('Discord OAuth not configured - DISCORD_OAUTH_REDIRECT_URI is missing');
          return null;
        }

        return createDiscordOAuthService(clientId, clientSecret, redirectUri, logger);
      },
      inject: [ConfigService],
    },

    // Repository implementations
    // When USE_DATABASE=true, DatabaseModule provides database repositories
    // When USE_DATABASE=false, we use in-memory implementations
    ...(shouldUseDatabase()
      ? []
      : [
          { provide: 'IUserRepository', useClass: InMemoryUserRepository },
          { provide: 'IOAuthTokenRepository', useClass: InMemoryOAuthTokenRepository },
          { provide: 'IRefreshTokenRepository', useClass: InMemoryRefreshTokenRepository },
        ]),

    // Hybrid Map Repository - only when NOT using database
    // When USE_DATABASE=true, ApplicationModule provides IMapRepository (PostgresMapRepository)
    ...(shouldUseDatabase()
      ? []
      : [
          {
            provide: 'IMapRepository',
            useFactory: (mapPersistencePort: IMapPersistencePort, logger?: any) => {
              const inMemoryRepo = new MapRepositoryAdapter(new InMemoryMapPersistence());
              return new HybridMapRepository(inMemoryRepo, null, logger);
            },
            inject: ['IMapPersistencePort', { token: 'ILogger', optional: true }],
          },
        ]),

    { provide: 'IMapHistoryRepository', useClass: InMemoryMapHistoryRepository },

    // OAuth CSRF state management (singleton — shared across initiate/complete)
    {
      provide: 'IOAuthStatePort',
      useFactory: () => new InMemoryOAuthStateService(),
    },

    // Refresh token generation and hashing
    {
      provide: 'IRefreshTokenPort',
      useFactory: () => new RefreshTokenService(),
    },

  ],
  exports: [
    'IGeologyLayerService',
    'ITopographyLayerService',
    'IHydrologyLayerService',
    'IVegetationLayerService',
    'IStructuresLayerService',
    'INotificationPort',
    'IPasswordService',
    'IAuthenticationPort',
    'ITokenEncryptionPort',
    'ITemplatePort',
    'IGoogleOAuthPort',
    'IDiscordOAuthPort',
    // When USE_DATABASE=false, export in-memory implementations
    // When USE_DATABASE=true, DatabaseModule exports these (IUserRepository, IOAuthTokenRepository, IMapRepository)
    ...(shouldUseDatabase()
      ? []
      : ['IUserRepository', 'IOAuthTokenRepository', 'IRefreshTokenRepository', 'IMapRepository', 'IMapPersistencePort']),
    'IMapHistoryRepository',
    'IOAuthStatePort',
    'IRefreshTokenPort',
    // Re-export DatabaseModule when enabled (provides IUserRepository, IMapRepository, IOAuthTokenRepository)
    ...(shouldUseDatabase() ? [DatabaseModule] : []),
  ],
})
export class InfrastructureModule {}
