import { Module } from '@nestjs/common';
import { FeaturesController } from './features.controller';

/**
 * Features Module
 * Handles feature-related endpoints
 * Uses Clean Architecture - controllers call use cases from application layer
 */
@Module({
  controllers: [FeaturesController],
  providers: [],
  exports: []
})
export class FeaturesModule {}