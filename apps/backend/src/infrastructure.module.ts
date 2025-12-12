import {
  BcryptPasswordService,
  ConsoleNotificationService,
  createGoogleOAuthService,
  createDiscordOAuthService,
  AesTokenEncryptionService,
  HtmlTemplateService,
  DatabaseModule,
  InMemoryMapHistoryRepository,
  InMemoryMapPersistence,
  InMemoryUserRepository,
  InMemoryOAuthTokenRepository,
  InMemoryReliefRepository,
  InMemoryNaturalRepository,
  InMemoryArtificialRepository,
  InMemoryCulturalRepository,
  JwtAuthenticationService,
  LoggingModule,
  BackLoggingService,
  GeologyLayer,
  TopographyLayer,
  HydrologyLayer,
  VegetationLayer,
  StructuresLayer,
  FeaturesLayer,
  MapRepositoryAdapter,
} from '@lazy-map/infrastructure';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Create a function to determine if database should be used
const shouldUseDatabase = () => {
  const useDb = process.env.USE_DATABASE === 'true';
  console.log('[InfrastructureModule] USE_DATABASE:', process.env.USE_DATABASE, '-> shouldUseDatabase:', useDb);
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

    // Output port implementations
    { provide: 'IMapPersistencePort', useClass: InMemoryMapPersistence },
    { provide: 'INotificationPort', useClass: ConsoleNotificationService },

    // User infrastructure services
    { provide: 'IPasswordService', useClass: BcryptPasswordService },

    // JWT Authentication Service
    {
      provide: 'IAuthenticationPort',
      useFactory: (configService: ConfigService) => {
        const jwtSecret = configService.get<string>('JWT_SECRET', 'your-secret-key');
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
      useFactory: () => {
        // Templates are located in apps/backend/src/templates
        const templatesPath = require('path').join(__dirname, 'templates');
        return new HtmlTemplateService(templatesPath);
      },
    },

    // Google OAuth Service
    {
      provide: 'IGoogleOAuthPort',
      useFactory: (configService: ConfigService) => {
        const clientId = configService.get<string>('GOOGLE_CLIENT_ID', '');
        const clientSecret = configService.get<string>('GOOGLE_CLIENT_SECRET');
        const logger = new BackLoggingService('GoogleOAuthService');

        if (!clientId) {
          logger.warn('Google OAuth not configured - GOOGLE_CLIENT_ID is missing');
          return null;
        }

        return createGoogleOAuthService(clientId, clientSecret || null, logger);
      },
      inject: [ConfigService],
    },

    // Discord OAuth Service
    {
      provide: 'IDiscordOAuthPort',
      useFactory: (configService: ConfigService) => {
        const clientId = configService.get<string>('DISCORD_CLIENT_ID', '');
        const clientSecret = configService.get<string>('DISCORD_CLIENT_SECRET', '');
        const logger = new BackLoggingService('DiscordOAuthService');

        if (!clientId || !clientSecret) {
          logger.warn('Discord OAuth not configured - DISCORD_CLIENT_ID or DISCORD_CLIENT_SECRET is missing');
          return null;
        }

        return createDiscordOAuthService(clientId, clientSecret, logger);
      },
      inject: [ConfigService],
    },

    // Repository implementations
    // When USE_DATABASE=true, DatabaseModule will provide these via its exports
    // When USE_DATABASE=false, we use in-memory implementations
    ...(shouldUseDatabase()
      ? []
      : [
          { provide: 'IUserRepository', useClass: InMemoryUserRepository },
          { provide: 'IOAuthTokenRepository', useClass: InMemoryOAuthTokenRepository },
        ]),

    // Map Repository Adapter - bridges IMapRepository (domain) with IMapPersistencePort (application)
    {
      provide: 'IMapRepository',
      useFactory: (mapPersistencePort) => {
        return new MapRepositoryAdapter(mapPersistencePort);
      },
      inject: ['IMapPersistencePort'],
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
    'IMapPersistencePort',
    'IMapRepository',
    'INotificationPort',
    'IPasswordService',
    'IAuthenticationPort',
    'ITokenEncryptionPort',
    'ITemplatePort',
    'IGoogleOAuthPort',
    'IDiscordOAuthPort',
    // IUserRepository & IOAuthTokenRepository - exported from DatabaseModule or in-memory implementations depending on USE_DATABASE
    ...(shouldUseDatabase() ? [] : ['IUserRepository', 'IOAuthTokenRepository']),
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
