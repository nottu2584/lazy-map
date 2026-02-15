import { IMapPersistencePort } from '@lazy-map/application';
import {
  AesTokenEncryptionService,
  BackLoggingService,
  BcryptPasswordService,
  ConsoleNotificationService,
  createDiscordOAuthService,
  createGoogleOAuthService,
  DatabaseModule,
  ElevationGenerationService,
  ErosionModelService,
  FeaturesLayer,
  GeologicalFeaturesService,
  GeologyLayer,
  HtmlTemplateService,
  HybridMapRepository,
  HydrologyLayer,
  InMemoryArtificialRepository,
  InMemoryCulturalRepository,
  InMemoryMapHistoryRepository,
  InMemoryMapPersistence,
  InMemoryNaturalRepository,
  InMemoryOAuthTokenRepository,
  InMemoryReliefRepository,
  InMemoryUserRepository,
  JwtAuthenticationService,
  LoggingModule,
  MapRepositoryAdapter,
  StructuresLayer,
  TerrainSmoothingService,
  TopographyCalculationService,
  TopographyLayer,
  VegetationLayer,
  PotentialCalculationService,
  ForestGenerationService,
  PlantGenerationService,
  ClearingCalculationService,
  TacticalCalculationService,
  FlowCalculationService,
  SpringGenerationService,
  StreamCalculationService,
  WaterDepthCalculationService,
  MoistureCalculationService,
  SegmentGenerationService,
  SiteCalculationService,
  BuildingPlacementService,
  RoadGenerationService,
  BridgeGenerationService,
  DecorationGenerationService,
  StructureTileGenerationService,
  BuildingGenerationService,
  ConfigurationCalculationService,
  RoomAllocationService,
  LayoutGenerationService,
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
    { provide: 'IFeaturesLayerService', useClass: FeaturesLayer },

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
        ]),

    // Hybrid Map Repository - always provided
    // Routes anonymous users → in-memory storage (never persists to DB)
    // Routes authenticated users → database storage (when USE_DATABASE=true)
    {
      provide: 'IMapRepository',
      useFactory: (mapPersistencePort: IMapPersistencePort, logger?: any) => {
        // Always create in-memory repository for anonymous users
        const inMemoryRepo = new MapRepositoryAdapter(new InMemoryMapPersistence());

        // If database is enabled, get database repository for authenticated users
        const databaseRepo = shouldUseDatabase()
          ? new MapRepositoryAdapter(mapPersistencePort)
          : null;

        // Return hybrid repository that routes based on authentication
        return new HybridMapRepository(inMemoryRepo, databaseRepo, logger);
      },
      inject: ['IMapPersistencePort', { token: 'ILogger', optional: true }],
    },

    { provide: 'IMapHistoryRepository', useClass: InMemoryMapHistoryRepository },

    // Feature repositories
    { provide: 'IReliefFeatureRepository', useClass: InMemoryReliefRepository },
    { provide: 'INaturalFeatureRepository', useClass: InMemoryNaturalRepository },
    { provide: 'IArtificialFeatureRepository', useClass: InMemoryArtificialRepository },
    { provide: 'ICulturalFeatureRepository', useClass: InMemoryCulturalRepository },
  ],
  exports: [
    'IGeologyLayerService',
    'ITopographyLayerService',
    'IHydrologyLayerService',
    'IVegetationLayerService',
    'IStructuresLayerService',
    'IFeaturesLayerService',
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
      : ['IUserRepository', 'IOAuthTokenRepository', 'IMapRepository', 'IMapPersistencePort']),
    'IMapHistoryRepository',
    // Feature repositories
    'IReliefFeatureRepository',
    'INaturalFeatureRepository',
    'IArtificialFeatureRepository',
    'ICulturalFeatureRepository',
    // Re-export DatabaseModule when enabled (provides IUserRepository, IMapRepository, IOAuthTokenRepository)
    ...(shouldUseDatabase() ? [DatabaseModule] : []),
  ],
})
export class InfrastructureModule {}
