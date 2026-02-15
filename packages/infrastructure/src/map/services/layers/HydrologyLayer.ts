import {
  TacticalMapContext,
  Seed,
  NoiseGenerator,
  MoistureLevel,
  HydrologyType,
  PermeabilityLevel,
  MapGenerationErrors,
  type ILogger,
  // Import from domain layer service interfaces
  IHydrologyLayerService,
  HydrologyLayerData,
  HydrologyTileData,
  StreamSegment,
  GeologyLayerData,
  TopographyLayerData,
  HydrologyConfig,
  HydrologyConstants
} from '@lazy-map/domain';

/**
 * Generates hydrological flow patterns based on topography and geology
 * Implements D8 flow accumulation algorithm for realistic drainage
 */
export class HydrologyLayer implements IHydrologyLayerService {
  private width: number = 0;
  private height: number = 0;
  private logger?: ILogger;

  // D8 flow directions (clockwise from north)
  private readonly FLOW_DIRS = [
    { dx: 0, dy: -1 }, // N
    { dx: 1, dy: -1 }, // NE
    { dx: 1, dy: 0 },  // E
    { dx: 1, dy: 1 },  // SE
    { dx: 0, dy: 1 },  // S
    { dx: -1, dy: 1 }, // SW
    { dx: -1, dy: 0 }, // W
    { dx: -1, dy: -1 } // NW
  ];

  constructor(logger?: ILogger) {
    this.logger = logger;
  }

  /**
   * Generate hydrological layer from topography and geology
   */
  async generate(
    topography: TopographyLayerData,
    geology: GeologyLayerData,
    context: TacticalMapContext,
    seed: Seed,
    config?: HydrologyConfig
  ): Promise<HydrologyLayerData> {
    if (!topography || !topography.tiles) {
      throw MapGenerationErrors.invalidLayerDependency('hydrology', 'topography');
    }
    if (!geology || !geology.tiles) {
      throw MapGenerationErrors.invalidLayerDependency('hydrology', 'geology');
    }

    this.width = topography.tiles[0].length;
    this.height = topography.tiles.length;

    this.logger?.info('Starting hydrology layer generation', {
      metadata: {
        width: this.width,
        height: this.height,
        hydrologyType: context.hydrology,
        seed: seed.getValue()
      }
    });

    try {
      // 1. Calculate flow directions using D8 algorithm
      const flowDirections = this.calculateFlowDirections(topography);
      this.logger?.debug('Calculated flow directions');

      // 2. Calculate flow accumulation
      const flowAccumulation = this.calculateFlowAccumulation(flowDirections);
      this.logger?.debug('Calculated flow accumulation');

      // 3. Place springs at geological boundaries
      const springs = this.placeSprings(geology, topography, seed, config);
      this.logger?.debug('Placed springs', { metadata: { count: springs.length } });

      // 4. Identify streams based on flow accumulation threshold
      const streamData = this.identifyStreams(flowAccumulation, flowDirections, context, config);
      this.logger?.debug('Identified streams');

      // 5. Calculate water depth and pools
      const waterDepths = this.calculateWaterDepths(
        flowAccumulation,
        topography,
        streamData,
        context,
        seed,
        config
      );
      this.logger?.debug('Calculated water depths');

      // 6. Calculate moisture levels
      const moistureLevels = this.calculateMoisture(
        waterDepths,
        flowAccumulation,
        geology,
        context
      );
      this.logger?.debug('Calculated moisture levels');

      // 7. Create tile data
      const tiles = this.createTileData(
        flowDirections,
        flowAccumulation,
        waterDepths,
        moistureLevels,
        springs,
        streamData
      );

      // 8. Extract stream segments for visualization
      const streams = this.extractStreamSegments(tiles);
      this.logger?.debug('Extracted stream segments', { metadata: { count: streams.length } });

      // 9. Calculate statistics
      const waterCoverage = this.calculateWaterCoverage(tiles);

      this.logger?.info('Hydrology layer generation complete', {
        metadata: {
          springs: springs.length,
          streams: streams.length,
          waterCoverage: waterCoverage.toFixed(2)
        }
      });

      return {
        tiles,
        streams,
        springs,
        totalWaterCoverage: waterCoverage
      };
    } catch (error) {
      this.logger?.error('Failed to generate hydrology layer', { metadata: { error: (error as Error).message } });
      throw MapGenerationErrors.layerGenerationFailed('hydrology', error as Error);
    }
  }

  /**
   * Calculate flow direction for each tile using D8 algorithm
   */
  private calculateFlowDirections(topography: TopographyLayerData): number[][] {
    const directions: number[][] = [];

    for (let y = 0; y < this.height; y++) {
      directions[y] = [];
      for (let x = 0; x < this.width; x++) {
        const currentElev = topography.tiles[y][x].elevation;
        let maxDrop = 0;
        let flowDir = -1; // -1 means sink/flat

        // Check all 8 directions
        for (let dir = 0; dir < 8; dir++) {
          const nx = x + this.FLOW_DIRS[dir].dx;
          const ny = y + this.FLOW_DIRS[dir].dy;

          // Skip out of bounds
          if (nx < 0 || nx >= this.width || ny < 0 || ny >= this.height) continue;

          const neighborElev = topography.tiles[ny][nx].elevation;
          const drop = currentElev - neighborElev;

          // Diagonal cells have longer distance (sqrt(2))
          const distance = (dir % 2 === 0) ? 1 : 1.414;
          const slope = drop / distance;

          if (slope > maxDrop) {
            maxDrop = slope;
            flowDir = dir;
          }
        }

        directions[y][x] = flowDir;
      }
    }

    return directions;
  }

  /**
   * Calculate flow accumulation using recursive algorithm
   */
  private calculateFlowAccumulation(flowDirections: number[][]): number[][] {
    const accumulation: number[][] = [];
    const visited: boolean[][] = [];

    // Initialize arrays
    for (let y = 0; y < this.height; y++) {
      accumulation[y] = new Array(this.width).fill(1); // Each cell contributes 1
      visited[y] = new Array(this.width).fill(false);
    }

    // Calculate accumulation for each cell
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (!visited[y][x]) {
          this.traceFlow(x, y, flowDirections, accumulation, visited);
        }
      }
    }

    return accumulation;
  }

  /**
   * Recursively trace flow and accumulate values
   */
  private traceFlow(
    x: number,
    y: number,
    flowDirections: number[][],
    accumulation: number[][],
    visited: boolean[][]
  ): number {
    // Mark as visited
    visited[y][x] = true;

    // Find all cells that flow into this one
    let totalFlow = 1; // Start with self-contribution

    for (let ny = 0; ny < this.height; ny++) {
      for (let nx = 0; nx < this.width; nx++) {
        if (nx === x && ny === y) continue;

        const dir = flowDirections[ny][nx];
        if (dir === -1) continue;

        // Check if this cell flows into current cell
        const targetX = nx + this.FLOW_DIRS[dir].dx;
        const targetY = ny + this.FLOW_DIRS[dir].dy;

        if (targetX === x && targetY === y) {
          // This cell flows into us
          if (!visited[ny][nx]) {
            totalFlow += this.traceFlow(nx, ny, flowDirections, accumulation, visited);
          } else {
            totalFlow += accumulation[ny][nx];
          }
        }
      }
    }

    accumulation[y][x] = totalFlow;
    return totalFlow;
  }

  /**
   * Place springs at geological boundaries and appropriate locations
   */
  private placeSprings(
    geology: GeologyLayerData,
    topography: TopographyLayerData,
    seed: Seed,
    config?: HydrologyConfig
  ): { x: number; y: number }[] {
    const springs: { x: number; y: number }[] = [];
    const springNoise = NoiseGenerator.create(seed.getValue() * 6);

    // Get spring parameters from config (with defaults)
    const springThreshold = config?.getSpringThreshold() ?? HydrologyConstants.DEFAULT_SPRING_THRESHOLD;
    const slopeBonus = config?.getSlopeSpringBonus() ?? HydrologyConstants.DEFAULT_SLOPE_BONUS;

    // Check transition zones for spring placement
    for (const pos of geology.transitionZones) {
      const x = pos.x;
      const y = pos.y;

      const geoTile = geology.tiles[y][x];
      const topoTile = topography.tiles[y][x];

      // Springs occur where permeable meets impermeable rock
      if (geoTile.formation.canHaveSprings()) {
        // Higher chance on slopes - use config-driven bonus
        const slopeBonusValue = topoTile.slope > 15 ? slopeBonus : 0;

        // Use noise for random placement
        const chance = springNoise.generateAt(x * 0.5, y * 0.5) + slopeBonusValue;

        // Use config-driven threshold
        if (chance > springThreshold) {
          springs.push({ x, y });
        }
      }
    }

    return springs;
  }

  /**
   * Identify stream channels based on flow accumulation
   */
  private identifyStreams(
    flowAccumulation: number[][],
    flowDirections: number[][],
    context: TacticalMapContext,
    config?: HydrologyConfig
  ): { isStream: boolean[][]; streamOrder: number[][] } {
    const isStream: boolean[][] = [];
    const streamOrder: number[][] = [];

    // Threshold for stream formation based on context and config
    const threshold = this.getStreamThreshold(context, config);

    // Initialize arrays
    for (let y = 0; y < this.height; y++) {
      isStream[y] = new Array(this.width).fill(false);
      streamOrder[y] = new Array(this.width).fill(0);
    }

    // Mark streams based on accumulation threshold
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (flowAccumulation[y][x] >= threshold) {
          isStream[y][x] = true;
        }
      }
    }

    // Calculate Strahler stream order
    this.calculateStreamOrder(isStream, flowDirections, streamOrder);

    return { isStream, streamOrder };
  }

  /**
   * Get appropriate stream formation threshold
   * Applies config multiplier to base thresholds (inverse relationship)
   */
  private getStreamThreshold(context: TacticalMapContext, config?: HydrologyConfig): number {
    // Base thresholds per hydrology type
    let baseThreshold: number;
    switch (context.hydrology) {
      case HydrologyType.ARID:
        baseThreshold = 25; // High threshold but reduced for 50x50 maps
        break;
      case HydrologyType.SEASONAL:
        baseThreshold = 15;
        break;
      case HydrologyType.STREAM:
        baseThreshold = 8;  // Reduced for better stream generation
        break;
      case HydrologyType.RIVER:
        baseThreshold = 5;
        break;
      case HydrologyType.WETLAND:
        baseThreshold = 3;
        break;
      default:
        baseThreshold = 10;
    }

    // Apply config multiplier (default 1.0× if no config)
    const multiplier = config?.getStreamThresholdMultiplier() ?? 1.0;
    return baseThreshold * multiplier;
  }

  /**
   * Calculate Strahler stream order
   */
  private calculateStreamOrder(
    isStream: boolean[][],
    flowDirections: number[][],
    streamOrder: number[][]
  ): void {
    // Start with order 1 for all headwater streams
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (isStream[y][x]) {
          streamOrder[y][x] = 1;
        }
      }
    }

    // Iteratively update orders
    let changed = true;
    while (changed) {
      changed = false;
      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
          if (!isStream[y][x]) continue;

          // Find tributaries
          const tributaries: number[] = [];
          for (let dir = 0; dir < 8; dir++) {
            const nx = x - this.FLOW_DIRS[dir].dx;
            const ny = y - this.FLOW_DIRS[dir].dy;

            if (nx < 0 || nx >= this.width || ny < 0 || ny >= this.height) continue;

            if (flowDirections[ny][nx] === dir && isStream[ny][nx]) {
              tributaries.push(streamOrder[ny][nx]);
            }
          }

          if (tributaries.length > 0) {
            const maxOrder = Math.max(...tributaries);
            const sameOrderCount = tributaries.filter(o => o === maxOrder).length;
            const newOrder = sameOrderCount >= 2 ? maxOrder + 1 : maxOrder;

            if (newOrder > streamOrder[y][x]) {
              streamOrder[y][x] = newOrder;
              changed = true;
            }
          }
        }
      }
    }
  }

  /**
   * Calculate water depths for streams and pools
   */
  private calculateWaterDepths(
    _flowAccumulation: number[][],
    topography: TopographyLayerData,
    streamData: { isStream: boolean[][]; streamOrder: number[][] },
    context: TacticalMapContext,
    seed: Seed,
    config?: HydrologyConfig
  ): number[][] {
    const depths: number[][] = [];
    const poolNoise = NoiseGenerator.create(seed.getValue() * 7);

    // Get pool threshold from config (with default)
    const poolThreshold = config?.getPoolThreshold() ?? HydrologyConstants.DEFAULT_POOL_THRESHOLD;

    for (let y = 0; y < this.height; y++) {
      depths[y] = [];
      for (let x = 0; x < this.width; x++) {
        let depth = 0;

        if (streamData.isStream[y][x]) {
          // Stream depth based on order
          const order = streamData.streamOrder[y][x];
          depth = this.getStreamDepth(order, context);

          // Add variation
          depth *= (0.8 + poolNoise.generateAt(x * 0.3, y * 0.3) * 0.4);

          // Deeper in valleys
          if (topography.tiles[y][x].isValley) {
            depth *= 1.5;
          }
        }

        // Check for pools in depressions - use config-driven threshold
        // Support both valley detection (discrete features) and gradient-based detection (low elevation)
        const isLowElevation = topography.tiles[y][x].elevation <=
          topography.minElevation + (topography.maxElevation - topography.minElevation) * 0.3;
        const isPoolSite = (topography.tiles[y][x].isValley || isLowElevation) &&
                          topography.tiles[y][x].slope < 5 &&
                          context.hydrology !== HydrologyType.ARID;

        if (isPoolSite) {
          const poolChance = poolNoise.generateAt(x * 0.2, y * 0.2);
          // Use config-driven threshold (lower threshold = more pools)
          if (poolChance > poolThreshold) {
            depth = Math.max(depth, 1 + poolChance * 2); // 1-3 feet
          }
        }

        depths[y][x] = depth;
      }
    }

    return depths;
  }

  /**
   * Get appropriate stream depth based on order
   */
  private getStreamDepth(order: number, context: TacticalMapContext): number {
    const baseDepth = order * 0.5; // 0.5 feet per order

    // Modify by hydrology type
    switch (context.hydrology) {
      case HydrologyType.RIVER:
        return baseDepth * 2;
      case HydrologyType.STREAM:
        return baseDepth * 1.5;
      case HydrologyType.SEASONAL:
        return baseDepth * 0.5;
      default:
        return baseDepth;
    }
  }

  /**
   * Calculate moisture levels based on water proximity and geology
   */
  private calculateMoisture(
    waterDepths: number[][],
    flowAccumulation: number[][],
    geology: GeologyLayerData,
    context: TacticalMapContext
  ): MoistureLevel[][] {
    const moisture: MoistureLevel[][] = [];

    for (let y = 0; y < this.height; y++) {
      moisture[y] = [];
      for (let x = 0; x < this.width; x++) {
        // Base moisture from context
        let level = this.getBaseMoisture(context);

        // Standing water = saturated
        if (waterDepths[y][x] > 0) {
          level = MoistureLevel.SATURATED;
        }
        // High flow accumulation = wet
        else if (flowAccumulation[y][x] > 20) {
          level = MoistureLevel.WET;
        }
        // Moderate flow = moist
        else if (flowAccumulation[y][x] > 10) {
          level = MoistureLevel.MOIST;
        }

        // Modify by permeability
        const permeability = geology.tiles[y][x].permeability;
        if (permeability === PermeabilityLevel.IMPERMEABLE && level !== MoistureLevel.SATURATED) {
          // Water doesn't penetrate, stays on surface
          level = this.increaseMoisture(level);
        } else if (permeability === PermeabilityLevel.HIGH) {
          // Water drains quickly
          level = this.decreaseMoisture(level);
        }

        moisture[y][x] = level;
      }
    }

    return moisture;
  }

  /**
   * Get base moisture level from context
   */
  private getBaseMoisture(context: TacticalMapContext): MoistureLevel {
    switch (context.hydrology) {
      case HydrologyType.ARID:
        return MoistureLevel.ARID;
      case HydrologyType.WETLAND:
        return MoistureLevel.WET;
      default:
        return MoistureLevel.MODERATE;
    }
  }

  /**
   * Increase moisture by one level
   */
  private increaseMoisture(level: MoistureLevel): MoistureLevel {
    const levels = [
      MoistureLevel.ARID,
      MoistureLevel.DRY,
      MoistureLevel.MODERATE,
      MoistureLevel.MOIST,
      MoistureLevel.WET,
      MoistureLevel.SATURATED
    ];
    const index = levels.indexOf(level);
    return levels[Math.min(levels.length - 1, index + 1)];
  }

  /**
   * Decrease moisture by one level
   */
  private decreaseMoisture(level: MoistureLevel): MoistureLevel {
    const levels = [
      MoistureLevel.ARID,
      MoistureLevel.DRY,
      MoistureLevel.MODERATE,
      MoistureLevel.MOIST,
      MoistureLevel.WET,
      MoistureLevel.SATURATED
    ];
    const index = levels.indexOf(level);
    return levels[Math.max(0, index - 1)];
  }

  /**
   * Create tile data combining all hydrological properties
   */
  private createTileData(
    flowDirections: number[][],
    flowAccumulation: number[][],
    waterDepths: number[][],
    moistureLevels: MoistureLevel[][],
    springs: { x: number; y: number }[],
    streamData: { isStream: boolean[][]; streamOrder: number[][] }
  ): HydrologyTileData[][] {
    const tiles: HydrologyTileData[][] = [];

    // Create spring lookup
    const springSet = new Set(springs.map(s => `${s.x},${s.y}`));

    for (let y = 0; y < this.height; y++) {
      tiles[y] = [];
      for (let x = 0; x < this.width; x++) {
        tiles[y][x] = {
          flowAccumulation: flowAccumulation[y][x],
          flowDirection: flowDirections[y][x],
          waterDepth: waterDepths[y][x],
          moisture: moistureLevels[y][x],
          isSpring: springSet.has(`${x},${y}`),
          isStream: streamData.isStream[y][x],
          isPool: waterDepths[y][x] > 0 && !streamData.isStream[y][x],
          streamOrder: streamData.streamOrder[y][x]
        };
      }
    }

    return tiles;
  }

  /**
   * Extract continuous stream segments for visualization
   */
  private extractStreamSegments(tiles: HydrologyTileData[][]): StreamSegment[] {
    const segments: StreamSegment[] = [];
    const visited: boolean[][] = [];

    // Initialize visited array
    for (let y = 0; y < this.height; y++) {
      visited[y] = new Array(this.width).fill(false);
    }

    // Find all stream starting points
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (tiles[y][x].isStream && !visited[y][x]) {
          const segment = this.traceStreamSegment(x, y, tiles, visited);
          if (segment.points.length > 2) {
            segments.push(segment);
          }
        }
      }
    }

    return segments;
  }

  /**
   * Trace a continuous stream segment
   */
  private traceStreamSegment(
    startX: number,
    startY: number,
    tiles: HydrologyTileData[][],
    visited: boolean[][]
  ): StreamSegment {
    const points: { x: number; y: number }[] = [];
    let x = startX;
    let y = startY;
    let maxOrder = 0;

    while (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      if (visited[y][x] || !tiles[y][x].isStream) break;

      visited[y][x] = true;
      points.push({ x, y });
      maxOrder = Math.max(maxOrder, tiles[y][x].streamOrder);

      // Follow flow direction
      const dir = tiles[y][x].flowDirection;
      if (dir === -1) break;

      x += this.FLOW_DIRS[dir].dx;
      y += this.FLOW_DIRS[dir].dy;
    }

    return {
      points,
      order: maxOrder,
      width: Math.ceil(maxOrder / 2) // Width in tiles
    };
  }

  /**
   * Calculate percentage of map covered by water
   */
  private calculateWaterCoverage(tiles: HydrologyTileData[][]): number {
    let waterCount = 0;
    let totalCount = 0;

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (tiles[y][x].waterDepth > 0) {
          waterCount++;
        }
        totalCount++;
      }
    }

    return (waterCount / totalCount) * 100;
  }
}