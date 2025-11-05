import { Module } from '@nestjs/common';
import { MapsController } from './maps.controller';
import { ApplicationModule } from '../../application.module';

/**
 * Maps Module
 * Handles tactical map generation endpoints
 * Uses Clean Architecture - controllers call use cases from application layer
 */
@Module({
  imports: [ApplicationModule],
  controllers: [MapsController],
  providers: [],
  exports: []
})
export class MapsModule {}