import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  MapGenerationService,
  VegetationGenerationService,
  FeatureMixingService,
  RandomGeneratorService,
  ConsoleNotificationService,
  InMemoryMapPersistence,
  TopographicFeatureRepository,
  BcryptPasswordService,
  JwtAuthenticationService,
  InMemoryUserRepository,
  InMemoryMapHistoryRepository,
  GoogleOAuthService,
  createGoogleOAuthService,
  LoggingModule,
  LOGGER_TOKEN,
} from '@lazy-map/infrastructure';

@Module({
  imports: [ConfigModule, LoggingModule],
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
    { provide: 'IUserRepository', useClass: InMemoryUserRepository },
    { provide: 'IMapHistoryRepository', useClass: InMemoryMapHistoryRepository },

    // OAuth service
    {
      provide: 'IOAuthService',
      useFactory: (configService: ConfigService, logger) => {
        const clientId = configService.get<string>('GOOGLE_CLIENT_ID', '');
        const jwtSecret = configService.get<string>('JWT_SECRET', 'your-secret-key');
        return createGoogleOAuthService(clientId, jwtSecret, logger);
      },
      inject: [ConfigService, LOGGER_TOKEN],
    },

    // Logger
    {
      provide: 'ILogger',
      useExisting: LOGGER_TOKEN,
    },

    // Topographic feature repository
    TopographicFeatureRepository,
  ],
  exports: [
    'IMapGenerationService',
    'IVegetationGenerationService',
    'IFeatureMixingService',
    'IRandomGeneratorService',
    'IMapPersistencePort',
    'INotificationPort',
    'IPasswordService',
    'IAuthenticationPort',
    'IUserRepository',
    'IMapHistoryRepository',
    'IOAuthService',
    'ILogger',
    TopographicFeatureRepository,
  ],
})
export class InfrastructureModule {}