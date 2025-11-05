import { Module } from '@nestjs/common';
import { BenchmarkController } from './benchmark.controller';
import { ApplicationModule } from '../../application.module';

/**
 * Benchmark Module
 * Handles performance benchmarking for tactical map generation
 * Uses Clean Architecture - controllers call use cases from application layer
 */
@Module({
  imports: [ApplicationModule],
  controllers: [BenchmarkController],
  providers: [],
  exports: []
})
export class BenchmarkModule {}