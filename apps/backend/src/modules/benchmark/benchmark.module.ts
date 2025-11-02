import { Module } from '@nestjs/common';
import { BenchmarkController } from './benchmark.controller';

/**
 * Benchmark Module
 * Handles performance benchmarking for tactical map generation
 * Uses Clean Architecture - controllers call use cases from application layer
 */
@Module({
  controllers: [BenchmarkController],
  providers: [],
  exports: []
})
export class BenchmarkModule {}