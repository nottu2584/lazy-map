import {
  BcryptPasswordService,
  ConsoleNotificationService,
  createGoogleOAuthService,
  createDiscordOAuthService,
  CompositeOAuthService,
  DatabaseModule,
  InMemoryMapHistoryRepository,
  InMemoryMapPersistence,
  InMemoryUserRepository,
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
  StubOAuthService
} from '@lazy-map/infrastructure';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Create a function to determine if database should be used
const shouldUseDatabase = () => process.env.USE_DATABASE === 'true';

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
    { provide: 'IAuthenticationPort', useClass: JwtAuthenticationService },

    // Repository implementations
    // When USE_DATABASE=true, DatabaseModule will provide these via its exports
    // When USE_DATABASE=false, we use in-memory implementations
    ...(shouldUseDatabase()
      ? []
      : [
          { provide: 'IUserRepository', useClass: InMemoryUserRepository },
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

    // OAuth service - supports both Google and Discord OAuth
    {
      provide: 'IOAuthService',
      useFactory: (configService: ConfigService) => {
        const googleClientId = configService.get<string>('GOOGLE_CLIENT_ID', '');
        const discordClientId = configService.get<string>('DISCORD_CLIENT_ID', '');
        const discordClientSecret = configService.get<string>('DISCORD_CLIENT_SECRET', '');
        const jwtSecret = configService.get<string>('JWT_SECRET', 'your-secret-key');
        const logger = new BackLoggingService('OAuthService');

        // Return stub service if no OAuth providers are configured
        if (!googleClientId && !discordClientId) {
          return new StubOAuthService(logger);
        }

        // Create provider-specific services
        const googleService = googleClientId
          ? createGoogleOAuthService(googleClientId, jwtSecret, logger)
          : null;

        const discordService = discordClientId && discordClientSecret
          ? createDiscordOAuthService(discordClientId, discordClientSecret, jwtSecret, logger)
          : null;

        // Return composite service that supports both providers
        return new CompositeOAuthService(googleService, discordService, logger);
      },
      inject: [ConfigService],
    },
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
    'IUserRepository',
    'IMapHistoryRepository',
    'IOAuthService',
    // Feature repositories
    'IReliefFeatureRepository',
    'INaturalFeatureRepository',
    'IArtificialFeatureRepository',
    'ICulturalFeatureRepository',
  ],
})
export class InfrastructureModule {}