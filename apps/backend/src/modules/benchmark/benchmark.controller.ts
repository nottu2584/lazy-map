import { Controller, Post, Body, Get, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  ApiResponse as ApiResponseType,
  GenerateTacticalMapUseCase
} from '@lazy-map/application';
import {
  ILogger,
  Seed,
  TacticalMapContext,
  BiomeType,
  ElevationZone,
  HydrologyType,
  DevelopmentLevel,
  Season
} from '@lazy-map/domain';
import { LOGGER_TOKEN } from '@lazy-map/infrastructure';

interface BenchmarkRequestDto {
  mapSizes?: { width: number; height: number }[];
  seeds?: string[];
  iterations?: number;
  layers?: string[];
}

interface LayerBenchmark {
  layer: string;
  duration: number;
  avgDuration?: number;
  minDuration?: number;
  maxDuration?: number;
}

interface BenchmarkResult {
  mapSize: { width: number; height: number };
  seed: string;
  totalDuration: number;
  layerBenchmarks: LayerBenchmark[];
  tilesPerSecond: number;
}

/**
 * Controller for benchmarking tactical map generation performance
 * Uses the GenerateTacticalMapUseCase following Clean Architecture
 */
@ApiTags('benchmark')
@Controller('benchmark')
export class BenchmarkController {

  constructor(
    @Inject(LOGGER_TOKEN) private readonly logger: ILogger,
    @Inject('GenerateTacticalMapUseCase')
    private readonly generateTacticalMapUseCase: GenerateTacticalMapUseCase
  ) {}

  @Post('run')
  @ApiOperation({ summary: 'Run performance benchmark on tactical map generation' })
  @ApiResponse({ status: 200, description: 'Benchmark completed successfully' })
  async runBenchmark(@Body() dto: BenchmarkRequestDto): Promise<ApiResponseType<any>> {
    const operationLogger = this.logger.child({
      component: 'BenchmarkController',
      operation: 'runBenchmark'
    });

    try {
      operationLogger.info('Starting tactical map benchmark', {
        metadata: {
          mapSizes: dto.mapSizes,
          seeds: dto.seeds,
          iterations: dto.iterations || 1
        }
      });

      // Default test configurations
      const mapSizes = dto.mapSizes || [
        { width: 30, height: 30 },
        { width: 50, height: 50 },
        { width: 100, height: 100 }
      ];

      const seeds = dto.seeds || ['benchmark-1', 'benchmark-2', 'benchmark-3'];
      const iterations = dto.iterations || 1;

      const results: BenchmarkResult[] = [];

      // Create a standard context for all benchmarks
      const context = TacticalMapContext.create(
        BiomeType.FOREST,
        ElevationZone.FOOTHILLS,
        HydrologyType.STREAM,
        DevelopmentLevel.SETTLED,
        Season.SPRING
      );

      for (const size of mapSizes) {
        for (const seedValue of seeds) {
          operationLogger.info(`Testing ${size.width}x${size.height} with seed ${seedValue}`);

          const iterationResults: number[] = [];
          const layerTimings: Record<string, number[]> = {
            geology: [],
            topography: [],
            hydrology: [],
            vegetation: [],
            structures: [],
            features: []
          };

          for (let i = 0; i < iterations; i++) {
            const seed = Seed.fromString(seedValue);

            // Use the use case to generate the map
            // This follows Clean Architecture - controller uses use case, not infrastructure directly
            const result = await this.generateTacticalMapUseCase.execute(
              size.width,
              size.height,
              context,
              seed
            );

            iterationResults.push(result.generationTime);

            // Extract layer timings from the result (if available)
            // For now, we'll use the total time divided by number of layers
            // In a production system, you'd want to instrument each layer individually
            const avgLayerTime = result.generationTime / 6;
            Object.keys(layerTimings).forEach(layer => {
              layerTimings[layer].push(avgLayerTime);
            });
          }

          // Calculate statistics for this map size and seed
          const totalTiles = size.width * size.height;
          const avgTotal = iterationResults.reduce((a, b) => a + b, 0) / iterations;

          const layerBenchmarks: LayerBenchmark[] = [];
          for (const [layer, times] of Object.entries(layerTimings)) {
            const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
            layerBenchmarks.push({
              layer,
              duration: avgTime,
              avgDuration: avgTime,
              minDuration: Math.min(...times),
              maxDuration: Math.max(...times)
            });
          }

          results.push({
            mapSize: size,
            seed: seedValue,
            totalDuration: avgTotal,
            layerBenchmarks,
            tilesPerSecond: (totalTiles / avgTotal) * 1000
          });
        }
      }

      // Calculate overall statistics
      const stats = this.calculateBenchmarkStats(results);

      operationLogger.info('Benchmark completed', {
        metadata: {
          totalRuns: results.length,
          averageDuration: stats.avgDuration,
          performance: stats.performance
        }
      });

      return {
        success: true,
        data: {
          results,
          statistics: stats
        },
        message: 'Benchmark completed successfully'
      };
    } catch (error) {
      operationLogger.logError(error, {
        metadata: {
          mapSizes: dto.mapSizes,
          seeds: dto.seeds
        }
      });

      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Benchmark failed',
          code: 'BENCHMARK_ERROR'
        },
        message: 'Failed to complete benchmark'
      };
    }
  }

  @Get('quick')
  @ApiOperation({ summary: 'Run a quick benchmark with default settings' })
  @ApiResponse({ status: 200, description: 'Quick benchmark completed' })
  async quickBenchmark(): Promise<ApiResponseType<any>> {
    const operationLogger = this.logger.child({
      component: 'BenchmarkController',
      operation: 'quickBenchmark'
    });

    try {
      operationLogger.info('Starting quick benchmark');

      const seed = Seed.fromString('quick-bench');
      const context = TacticalMapContext.fromSeed(seed);

      const sizes = [
        { width: 30, height: 30 },
        { width: 50, height: 50 }
      ];

      const results: any[] = [];

      for (const size of sizes) {
        const startTime = Date.now();

        const result = await this.generateTacticalMapUseCase.execute(
          size.width,
          size.height,
          context,
          seed
        );

        const duration = Date.now() - startTime;
        const totalTiles = size.width * size.height;

        results.push({
          size: `${size.width}x${size.height}`,
          duration: `${duration}ms`,
          tilesPerSecond: Math.round((totalTiles / duration) * 1000),
          layers: {
            geology: `${result.layers.geology.transitionZones.length} transition zones`,
            topography: `Elevation ${result.layers.topography.minElevation}-${result.layers.topography.maxElevation}ft`,
            hydrology: `${result.layers.hydrology.streams.length} streams, ${result.layers.hydrology.springs.length} springs`,
            vegetation: `${result.layers.vegetation.forestPatches.length} forest patches`,
            structures: `${result.layers.structures.buildings.length} buildings`,
            features: `${result.layers.features.totalFeatureCount} total features`
          }
        });
      }

      operationLogger.info('Quick benchmark completed', {
        metadata: { results }
      });

      return {
        success: true,
        data: results,
        message: 'Quick benchmark completed successfully'
      };
    } catch (error) {
      operationLogger.logError(error);

      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Quick benchmark failed',
          code: 'QUICK_BENCHMARK_ERROR'
        },
        message: 'Failed to complete quick benchmark'
      };
    }
  }

  /**
   * Calculate benchmark statistics
   */
  private calculateBenchmarkStats(results: BenchmarkResult[]): any {
    const durations = results.map(r => r.totalDuration);
    const tilesPerSec = results.map(r => r.tilesPerSecond);

    return {
      avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      performance: {
        avgTilesPerSecond: tilesPerSec.reduce((a, b) => a + b, 0) / tilesPerSec.length,
        minTilesPerSecond: Math.min(...tilesPerSec),
        maxTilesPerSecond: Math.max(...tilesPerSec)
      }
    };
  }
}