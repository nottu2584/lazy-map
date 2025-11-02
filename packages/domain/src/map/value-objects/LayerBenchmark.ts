import { TopographicLayer } from './TopographicLayer';

/**
 * Benchmark data for a single layer generation
 * Following Clean Architecture: Pure domain value object
 */
export class LayerBenchmark {
  constructor(
    public readonly layer: TopographicLayer,
    public readonly startTime: number,
    public readonly endTime: number,
    public readonly featuresGenerated: number,
    public readonly tilesAffected: number,
    public readonly memoryUsed: number,
    public readonly errors: Error[] = []
  ) {
    this.validate();
  }

  /**
   * Calculate duration in milliseconds
   */
  get duration(): number {
    return this.endTime - this.startTime;
  }

  /**
   * Check if generation was successful
   */
  get isSuccessful(): boolean {
    return this.errors.length === 0;
  }

  /**
   * Get performance rating based on duration
   * Target: < 1000ms per layer for 100x100 map
   */
  get performanceRating(): PerformanceRating {
    const duration = this.duration;

    if (duration < 500) return PerformanceRating.EXCELLENT;
    if (duration < 1000) return PerformanceRating.GOOD;
    if (duration < 2000) return PerformanceRating.ACCEPTABLE;
    if (duration < 5000) return PerformanceRating.SLOW;
    return PerformanceRating.CRITICAL;
  }

  /**
   * Get layer name
   */
  get layerName(): string {
    return TopographicLayer[this.layer];
  }

  /**
   * Calculate features per second
   */
  get featuresPerSecond(): number {
    const seconds = this.duration / 1000;
    return seconds > 0 ? Math.round(this.featuresGenerated / seconds) : 0;
  }

  /**
   * Calculate tiles per millisecond
   */
  get tilesPerMillisecond(): number {
    return this.duration > 0 ? this.tilesAffected / this.duration : 0;
  }

  /**
   * Validate benchmark data
   */
  private validate(): void {
    if (this.startTime < 0 || this.endTime < 0) {
      throw new Error('Benchmark times cannot be negative');
    }

    if (this.endTime < this.startTime) {
      throw new Error('End time cannot be before start time');
    }

    if (this.featuresGenerated < 0 || this.tilesAffected < 0) {
      throw new Error('Feature and tile counts cannot be negative');
    }

    if (this.memoryUsed < 0) {
      throw new Error('Memory usage cannot be negative');
    }
  }

  /**
   * Format memory usage as human-readable string
   */
  formatMemory(): string {
    const kb = this.memoryUsed / 1024;
    const mb = kb / 1024;

    if (mb >= 1) {
      return `${mb.toFixed(2)} MB`;
    } else if (kb >= 1) {
      return `${kb.toFixed(2)} KB`;
    } else {
      return `${this.memoryUsed} bytes`;
    }
  }

  /**
   * Convert to summary string
   */
  toString(): string {
    return `${this.layerName}: ${this.duration}ms, ${this.featuresGenerated} features, ${this.tilesAffected} tiles, ${this.formatMemory()}`;
  }

  /**
   * Convert to JSON
   */
  toJSON(): SerializedLayerBenchmark {
    return {
      layer: this.layer,
      layerName: this.layerName,
      startTime: this.startTime,
      endTime: this.endTime,
      duration: this.duration,
      featuresGenerated: this.featuresGenerated,
      tilesAffected: this.tilesAffected,
      memoryUsed: this.memoryUsed,
      memoryFormatted: this.formatMemory(),
      performanceRating: this.performanceRating,
      featuresPerSecond: this.featuresPerSecond,
      errors: this.errors.map(e => e.message),
      isSuccessful: this.isSuccessful
    };
  }
}

/**
 * Performance rating enum
 */
export enum PerformanceRating {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  ACCEPTABLE = 'acceptable',
  SLOW = 'slow',
  CRITICAL = 'critical'
}

/**
 * Aggregate benchmark for entire map generation
 */
export class MapGenerationBenchmark {
  private layerBenchmarks: Map<TopographicLayer, LayerBenchmark>;

  constructor(
    public readonly mapName: string,
    public readonly mapSize: { width: number; height: number },
    public readonly totalStartTime: number,
    public readonly totalEndTime: number
  ) {
    this.layerBenchmarks = new Map();
  }

  /**
   * Add a layer benchmark
   */
  addLayerBenchmark(benchmark: LayerBenchmark): void {
    this.layerBenchmarks.set(benchmark.layer, benchmark);
  }

  /**
   * Get total duration
   */
  get totalDuration(): number {
    return this.totalEndTime - this.totalStartTime;
  }

  /**
   * Get sum of layer durations (might differ from total due to overhead)
   */
  get layerDurationSum(): number {
    let sum = 0;
    for (const benchmark of this.layerBenchmarks.values()) {
      sum += benchmark.duration;
    }
    return sum;
  }

  /**
   * Get overhead (time not accounted for in layers)
   */
  get overhead(): number {
    return Math.max(0, this.totalDuration - this.layerDurationSum);
  }

  /**
   * Get total features generated
   */
  get totalFeatures(): number {
    let sum = 0;
    for (const benchmark of this.layerBenchmarks.values()) {
      sum += benchmark.featuresGenerated;
    }
    return sum;
  }

  /**
   * Get total tiles affected
   */
  get totalTilesAffected(): number {
    let sum = 0;
    for (const benchmark of this.layerBenchmarks.values()) {
      sum += benchmark.tilesAffected;
    }
    return sum;
  }

  /**
   * Get total memory used
   */
  get totalMemoryUsed(): number {
    let sum = 0;
    for (const benchmark of this.layerBenchmarks.values()) {
      sum += benchmark.memoryUsed;
    }
    return sum;
  }

  /**
   * Get slowest layer
   */
  getSlowestLayer(): LayerBenchmark | undefined {
    let slowest: LayerBenchmark | undefined;
    let maxDuration = 0;

    for (const benchmark of this.layerBenchmarks.values()) {
      if (benchmark.duration > maxDuration) {
        maxDuration = benchmark.duration;
        slowest = benchmark;
      }
    }

    return slowest;
  }

  /**
   * Get fastest layer
   */
  getFastestLayer(): LayerBenchmark | undefined {
    let fastest: LayerBenchmark | undefined;
    let minDuration = Infinity;

    for (const benchmark of this.layerBenchmarks.values()) {
      if (benchmark.duration < minDuration) {
        minDuration = benchmark.duration;
        fastest = benchmark;
      }
    }

    return fastest;
  }

  /**
   * Get performance bottlenecks
   */
  getBottlenecks(threshold: number = 2000): TopographicLayer[] {
    const bottlenecks: TopographicLayer[] = [];

    for (const benchmark of this.layerBenchmarks.values()) {
      if (benchmark.duration > threshold) {
        bottlenecks.push(benchmark.layer);
      }
    }

    return bottlenecks;
  }

  /**
   * Get overall performance rating
   */
  get overallRating(): PerformanceRating {
    // Based on 5 second pessimistic target
    const duration = this.totalDuration;

    if (duration < 1000) return PerformanceRating.EXCELLENT;
    if (duration < 2500) return PerformanceRating.GOOD;
    if (duration < 5000) return PerformanceRating.ACCEPTABLE;
    if (duration < 10000) return PerformanceRating.SLOW;
    return PerformanceRating.CRITICAL;
  }

  /**
   * Check if generation met performance target
   */
  meetsTarget(targetMs: number = 5000): boolean {
    return this.totalDuration <= targetMs;
  }

  /**
   * Get suggestions for improvement
   */
  getSuggestions(): string[] {
    const suggestions: string[] = [];

    // Check overall performance
    if (!this.meetsTarget()) {
      suggestions.push(`Generation took ${this.totalDuration}ms, exceeding 5s target`);
    }

    // Check for bottlenecks
    const bottlenecks = this.getBottlenecks();
    if (bottlenecks.length > 0) {
      const names = bottlenecks.map(l => TopographicLayer[l]).join(', ');
      suggestions.push(`Optimize slow layers: ${names}`);
    }

    // Check memory usage
    const memoryMB = this.totalMemoryUsed / (1024 * 1024);
    if (memoryMB > 50) {
      suggestions.push(`High memory usage: ${memoryMB.toFixed(2)}MB`);
    }

    // Check overhead
    const overheadPercent = (this.overhead / this.totalDuration) * 100;
    if (overheadPercent > 20) {
      suggestions.push(`High overhead: ${overheadPercent.toFixed(1)}% of time not in layers`);
    }

    return suggestions;
  }

  /**
   * Format as console table
   */
  toConsoleTable(): string {
    const rows: string[] = [];
    rows.push('Layer Generation Benchmark Report');
    rows.push('='.repeat(60));
    rows.push(`Map: ${this.mapName} (${this.mapSize.width}x${this.mapSize.height})`);
    rows.push(`Total Duration: ${this.totalDuration}ms`);
    rows.push(`Performance: ${this.overallRating.toUpperCase()}`);
    rows.push('-'.repeat(60));

    // Layer details
    for (const benchmark of this.layerBenchmarks.values()) {
      const bar = this.createProgressBar(benchmark.duration, this.totalDuration);
      rows.push(`${benchmark.layerName.padEnd(12)} ${benchmark.duration.toString().padStart(6)}ms ${bar}`);
    }

    rows.push('-'.repeat(60));
    rows.push(`Overhead: ${this.overhead}ms`);
    rows.push(`Total Features: ${this.totalFeatures}`);
    rows.push(`Total Memory: ${(this.totalMemoryUsed / (1024 * 1024)).toFixed(2)}MB`);

    // Suggestions
    const suggestions = this.getSuggestions();
    if (suggestions.length > 0) {
      rows.push('');
      rows.push('Suggestions:');
      suggestions.forEach(s => rows.push(`  • ${s}`));
    }

    return rows.join('\n');
  }

  /**
   * Create a simple progress bar
   */
  private createProgressBar(value: number, total: number, width: number = 20): string {
    const percentage = total > 0 ? value / total : 0;
    const filled = Math.round(percentage * width);
    const empty = width - filled;

    return `[${'\u2588'.repeat(filled)}${'\u2591'.repeat(empty)}] ${(percentage * 100).toFixed(1)}%`;
  }

  /**
   * Convert to JSON
   */
  toJSON(): SerializedMapGenerationBenchmark {
    return {
      mapName: this.mapName,
      mapSize: this.mapSize,
      totalStartTime: this.totalStartTime,
      totalEndTime: this.totalEndTime,
      totalDuration: this.totalDuration,
      layerDurationSum: this.layerDurationSum,
      overhead: this.overhead,
      totalFeatures: this.totalFeatures,
      totalTilesAffected: this.totalTilesAffected,
      totalMemoryUsed: this.totalMemoryUsed,
      overallRating: this.overallRating,
      meetsTarget: this.meetsTarget(),
      layers: Array.from(this.layerBenchmarks.values()).map(b => b.toJSON()),
      bottlenecks: this.getBottlenecks().map(l => TopographicLayer[l]),
      suggestions: this.getSuggestions()
    };
  }
}

/**
 * Serialized formats for JSON export
 */
export interface SerializedLayerBenchmark {
  layer: TopographicLayer;
  layerName: string;
  startTime: number;
  endTime: number;
  duration: number;
  featuresGenerated: number;
  tilesAffected: number;
  memoryUsed: number;
  memoryFormatted: string;
  performanceRating: PerformanceRating;
  featuresPerSecond: number;
  errors: string[];
  isSuccessful: boolean;
}

export interface SerializedMapGenerationBenchmark {
  mapName: string;
  mapSize: { width: number; height: number };
  totalStartTime: number;
  totalEndTime: number;
  totalDuration: number;
  layerDurationSum: number;
  overhead: number;
  totalFeatures: number;
  totalTilesAffected: number;
  totalMemoryUsed: number;
  overallRating: PerformanceRating;
  meetsTarget: boolean;
  layers: SerializedLayerBenchmark[];
  bottlenecks: string[];
  suggestions: string[];
}