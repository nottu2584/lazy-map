import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { ApplicationModule } from '../../application.module';

/**
 * Health Module
 * Handles health check endpoints for monitoring
 * Uses Clean Architecture - controllers call use cases from application layer
 */
@Module({
  imports: [ApplicationModule],
  controllers: [HealthController],
  providers: [],
  exports: []
})
export class HealthModule {}