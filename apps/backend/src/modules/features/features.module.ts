import { Module } from '@nestjs/common';
import { FeaturesController } from './features.controller';
import { ApplicationModule } from '../../application.module';

/**
 * Features Module
 * Handles feature-related endpoints
 * Uses Clean Architecture - controllers call use cases from application layer
 */
@Module({
  imports: [ApplicationModule],
  controllers: [FeaturesController],
  providers: [],
  exports: []
})
export class FeaturesModule {}