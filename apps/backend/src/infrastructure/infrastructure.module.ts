import {
  BcryptPasswordService,
  ConsoleNotificationService,
  createGoogleOAuthService,
  DatabaseModule,
  FeatureMixingService,
  InMemoryMapHistoryRepository,
  InMemoryMapPersistence,
  InMemoryUserRepository,
  InMemoryReliefRepository,
  InMemoryNaturalRepository,
  InMemoryArtificialRepository,
  InMemoryCulturalRepository,
  JwtAuthenticationService,
  LoggingModule,
  LoggingService,
  MapGenerationService,
  MapRepositoryAdapter,
  RandomGeneratorService,
  VegetationGenerationService
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

    // OAuth service
    {
      provide: 'IOAuthService',
      useFactory: (configService: ConfigService) => {
        const clientId = configService.get<string>('GOOGLE_CLIENT_ID', '');
        const jwtSecret = configService.get<string>('JWT_SECRET', 'your-secret-key');
        const logger = new LoggingService('OAuthService');
        return createGoogleOAuthService(clientId, jwtSecret, logger);
      },
      inject: [ConfigService],
    },
  ],
  exports: [
    'IMapGenerationService',
    'IVegetationGenerationService',
    'IFeatureMixingService',
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