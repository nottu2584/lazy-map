import { Module } from '@nestjs/common';
import { InfrastructureModule } from '../infrastructure/infrastructure.module';
import {
  GenerateMapUseCase,
  ValidateMapSettingsUseCase,
  GetMapUseCase,
  GetMapTileUseCase,
  ListMapsUseCase,
  GetUserMapsUseCase,
  MapService,
  RegisterUserUseCase,
  LoginUserUseCase,
  GetUserProfileUseCase,
  GoogleSignInUseCase,
  LinkGoogleAccountUseCase,
} from '@lazy-map/application';

@Module({
  imports: [InfrastructureModule],
  providers: [
    {
      provide: GenerateMapUseCase,
      useFactory: (
        mapGenService,
        vegetationGenService,
        featureMixingService,
        mapPersistence,
        randomGen,
        notificationPort,
        logger,
      ) => {
        return new GenerateMapUseCase(
          mapGenService,
          vegetationGenService,
          featureMixingService,
          mapPersistence,
          randomGen,
          notificationPort,
          logger,
        );
      },
      inject: [
        'IMapGenerationService',
        'IVegetationGenerationService',
        'IFeatureMixingService',
        'IMapPersistencePort',
        'IRandomGeneratorService',
        'INotificationPort',
        'ILogger',
      ],
    },
    {
      provide: ValidateMapSettingsUseCase,
      useFactory: () => {
        return new ValidateMapSettingsUseCase();
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

    // Application services
    {
      provide: MapService,
      useFactory: (
        generateMapUseCase,
        validateMapSettingsUseCase,
        getMapUseCase,
        getMapTileUseCase,
        listMapsUseCase,
        getUserMapsUseCase,
      ) => {
        return new MapService(
          generateMapUseCase,
          validateMapSettingsUseCase,
          getMapUseCase,
          getMapTileUseCase,
          listMapsUseCase,
          getUserMapsUseCase,
        );
      },
      inject: [
        GenerateMapUseCase,
        ValidateMapSettingsUseCase,
        GetMapUseCase,
        GetMapTileUseCase,
        ListMapsUseCase,
        GetUserMapsUseCase,
      ],
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
  ],
  exports: [
    MapService,
    RegisterUserUseCase,
    LoginUserUseCase,
    GetUserProfileUseCase,
    GoogleSignInUseCase,
    LinkGoogleAccountUseCase,
  ],
})
export class ApplicationModule {}
