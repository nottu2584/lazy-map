import { Module } from '@nestjs/common';
import { InfrastructureModule } from '../infrastructure/infrastructure.module';
import {
  GenerateMapUseCase,
  ValidateMapSettingsUseCase,
  GetMapUseCase,
  GetMapTileUseCase,
  ListMapsUseCase,
  MapApplicationService,
} from '@lazy-map/application';

@Module({
  imports: [InfrastructureModule],
  providers: [
    {
      provide: GenerateMapUseCase,
      useFactory: (
        mapGenService,
        vegetationGenService,
        mapPersistence,
        randomGen,
        notificationPort,
      ) => {
        return new GenerateMapUseCase(
          mapGenService,
          vegetationGenService,
          mapPersistence,
          randomGen,
          notificationPort,
        );
      },
      inject: [
        'IMapGenerationService',
        'IVegetationGenerationService',
        'IMapPersistencePort',
        'IRandomGeneratorService',
        'INotificationPort',
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

    // Application services
    {
      provide: MapApplicationService,
      useFactory: (
        generateMapUseCase,
        validateMapSettingsUseCase,
        getMapUseCase,
        getMapTileUseCase,
        listMapsUseCase,
      ) => {
        return new MapApplicationService(
          generateMapUseCase,
          validateMapSettingsUseCase,
          getMapUseCase,
          getMapTileUseCase,
          listMapsUseCase,
        );
      },
      inject: [
        GenerateMapUseCase,
        ValidateMapSettingsUseCase,
        GetMapUseCase,
        GetMapTileUseCase,
        ListMapsUseCase,
      ],
    },
  ],
  exports: [MapApplicationService],
})
export class ApplicationModule {}
