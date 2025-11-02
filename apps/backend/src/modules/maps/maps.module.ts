import { Module } from '@nestjs/common';
import { MapsController } from './maps.controller';

/**
 * Maps Module
 * Handles tactical map generation endpoints
 * Uses Clean Architecture - controllers call use cases from application layer
 */
@Module({
  controllers: [MapsController],
  providers: [],
  exports: []
})
export class MapsModule {}