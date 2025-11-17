import {
  BcryptPasswordService,
  ConsoleNotificationService,
  createGoogleOAuthService,
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
  RandomGeneratorService,
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
    { provide: 'IRandomGeneratorService', useClass: RandomGeneratorService },

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

    // OAuth service - optional, returns stub when not configured
    {
      provide: 'IOAuthService',
      useFactory: (configService: ConfigService) => {
        const clientId = configService.get<string>('GOOGLE_CLIENT_ID', '');
        const jwtSecret = configService.get<string>('JWT_SECRET', 'your-secret-key');
        const logger = new BackLoggingService('OAuthService');

        // Return stub service if OAuth is not configured
        if (!clientId) {
          return new StubOAuthService(logger);
        }

        return createGoogleOAuthService(clientId, jwtSecret, logger);
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
    'IRandomGeneratorService',
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