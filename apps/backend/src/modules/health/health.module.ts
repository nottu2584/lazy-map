import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';

/**
 * Health Module
 * Handles health check endpoints for monitoring
 * Uses Clean Architecture - controllers call use cases from application layer
 */
@Module({
  controllers: [HealthController],
  providers: [],
  exports: []
})
export class HealthModule {}