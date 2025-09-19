import {
  CardinalDirection,
  Dimensions,
  SpatialBounds,
  FeatureId,
  FlowDirection,
  HydrographicGenerationResult,
  HydrographicGenerationSettings,
  IHydrographyService,
  IRandomGenerator,
  Lake,
  LakeFormation,
  LakeGenerationSettings,
  Pond,
  Position,
  River,
  RiverGenerationSettings,
  RiverPoint,
  RiverSegmentType,
  Spring,
  SpringGenerationSettings,
  SpringType,
  WaterClarity,
  WaterLevel,
  WaterQuality,
  WaterSalinity,
  WaterTemperature,
  Wetland,
  WetlandGenerationSettings,
  WetlandType
} from '@lazy-map/domain';

/**
 * Infrastructure implementation of hydrographic generation service
 */
export class HydrographicGenerationService implements IHydrographyService {
  
  async generateWaterSystem(
    area: SpatialBounds,
    settings: HydrographicGenerationSettings,
    randomGenerator: IRandomGenerator
  ): Promise<HydrographicGenerationResult> {
    const startTime = Date.now();
    const result: HydrographicGenerationResult = {
      success: false,
      rivers: [],
      lakes: [],
      springs: [],
      ponds: [],
      wetlands: [],
      totalWaterCoverage: 0,
      interconnectionScore: 0,
      biodiversityScore: 0,
      generationTime: 0,
      warnings: [],
    };

    try {
      // Calculate optimal placements
      const placements = await this.calculateOptimalPlacements(area, settings, [], randomGenerator);

      // Generate springs first (water sources)
      if (settings.springDensity > 0) {
        for (const springPos of placements.springPlacements) {
          const spring = await this.generateSpring(springPos, settings.defaultSpringSettings, randomGenerator);
          result.springs.push(spring);
        }
      }

      // Generate lakes
      if (settings.lakeDensity > 0) {
        for (const lakeArea of placements.lakePlacements) {
          const lake = await this.generateLake(lakeArea, settings.defaultLakeSettings, randomGenerator);
          result.lakes.push(lake);
        }
      }

      // Generate rivers (connecting springs and lakes)
      if (settings.riverDensity > 0) {
        for (const riverPlacement of placements.riverPlacements) {
          const river = await this.generateRiver(
            riverPlacement.area,
            settings.defaultRiverSettings,
            riverPlacement.source,
            riverPlacement.mouth,
            randomGenerator
          );
          result.rivers.push(river);
        }
      }

      // Generate ponds
      if (settings.pondDensity > 0) {
        const pondCount = Math.floor(settings.pondDensity * area.dimensions.area / 1000);
        for (let i = 0; i < pondCount; i++) {
          const pondArea = this.generateRandomArea(area, randomGenerator, 50, 200);
          const pond = await this.generatePond(pondArea, randomGenerator.next() < 0.3, randomGenerator);
          result.ponds.push(pond);
        }
      }

      // Generate wetlands
      if (settings.wetlandDensity > 0) {
        for (const wetlandArea of placements.wetlandPlacements) {
          const wetland = await this.generateWetland(wetlandArea, settings.defaultWetlandSettings, randomGenerator);
          result.wetlands.push(wetland);
        }
      }

      // Connect water features if enabled
      if (settings.allowInterconnectedSystems) {
        await this.connectWaterFeatures(result.rivers, result.lakes, result.springs, randomGenerator);
      }

      // Calculate final metrics
      result.totalWaterCoverage = this.calculateWaterCoverage(result, area);
      result.interconnectionScore = this.calculateInterconnectionScore(result);
      result.biodiversityScore = this.calculateBiodiversityScore(result, settings);
      
      result.success = true;
      result.generationTime = Date.now() - startTime;

    } catch (error) {
      result.error = error instanceof Error ? error.message : 'Unknown error';
      result.generationTime = Date.now() - startTime;
    }

    return result;
  }

  async generateRiver(
    area: SpatialBounds,
    settings: RiverGenerationSettings,
    source?: Position,
    mouth?: Position,
    randomGenerator?: IRandomGenerator
  ): Promise<River> {
    const rng = randomGenerator || this.createDefaultRandomGenerator();
    
    // Generate river path
    const actualSource = source || this.generateSourcePosition(area, rng);
    const actualMouth = mouth || this.generateMouthPosition(area, actualSource, rng);
    const path = await this.generateRiverPath(actualSource, actualMouth, area, settings, rng);

    // Create river points along the path
    const riverPoints: RiverPoint[] = [];
    for (let i = 0; i < path.length; i++) {
      const position = path[i];
      const progress = i / (path.length - 1);
      
      // Width varies along the river (generally wider toward mouth)
      const widthMultiplier = 0.6 + (progress * 0.4) + (rng.next() * 0.2 - 0.1);
      const width = settings.averageWidth * widthMultiplier;
      
      // Depth calculation using same pattern as tile height
      const baseDepth = width * 0.1; // Base depth proportional to width
      const depthNoise = this.getDepthNoiseAt(position, rng);
      const depthVariation = (depthNoise - 0.5) * 3; // Similar to heightVariance pattern
      const depth = Math.max(0.5, baseDepth + depthVariation); // Ensure minimum depth
      
      // Flow direction toward next point
      let flowDir: FlowDirection;
      if (i < path.length - 1) {
        const nextPos = path[i + 1];
        const angle = Math.atan2(nextPos.x - position.x, -(nextPos.y - position.y)) * 180 / Math.PI;
        const normalizedAngle = ((angle % 360) + 360) % 360;
        flowDir = new FlowDirection(normalizedAngle, settings.baseFlowVelocity);
      } else {
        flowDir = new FlowDirection(0, settings.baseFlowVelocity);
      }

      // Determine segment type
      let segmentType = RiverSegmentType.STRAIGHT;
      if (i === 0) segmentType = RiverSegmentType.SOURCE;
      else if (i === path.length - 1) segmentType = RiverSegmentType.MOUTH;
      else if (rng.next() < 0.1) segmentType = RiverSegmentType.RAPIDS;
      else if (settings.meandering > 0.5 && rng.next() < 0.2) segmentType = RiverSegmentType.MEANDER;

      riverPoints.push(new RiverPoint(position, width, depth, flowDir, segmentType));
    }

    // Create water level and quality
    const waterLevel = this.generateWaterLevel(settings, rng);
    const waterQuality = settings.waterQuality;

    const river = new River(
      FeatureId.generate(),
      this.generateRiverName(rng),
      area,
      waterLevel,
      waterQuality,
      settings.averageWidth,
      riverPoints,
      waterLevel.isNavigable
    );

    // Add natural meanders if specified
    if (settings.meandering > 0) {
      river.addNaturalMeanders(settings.meandering);
    }

    return river;
  }

  async generateLake(
    area: SpatialBounds,
    settings: LakeGenerationSettings,
    randomGenerator?: IRandomGenerator
  ): Promise<Lake> {
    const rng = randomGenerator || this.createDefaultRandomGenerator();

    // Calculate depth using same pattern as tile height
    const centerPos = new Position(area.x + area.width/2, area.y + area.height/2);
    const baseDepth = settings.averageDepth;
    const depthNoise = this.getDepthNoiseAt(centerPos, rng);
    const depthVariation = (depthNoise - 0.5) * (baseDepth * 0.4); // 40% variation
    const actualDepth = Math.max(1.0, baseDepth + depthVariation);
    
    // Create water level and quality
    const waterLevel = WaterLevel.fromDepth(actualDepth, false);
    const waterQuality = settings.waterQuality;

    const lake = new Lake(
      FeatureId.generate(),
      this.generateLakeName(rng),
      area,
      waterLevel,
      waterQuality,
      settings.formation,
      [],
      Math.max(actualDepth, actualDepth * 1.2), // maxDepth slightly higher than actual
      actualDepth,
      settings.thermalStability
    );

    // Generate natural shoreline
    const shorelinePointCount = Math.max(8, Math.floor(16 * (1 + settings.irregularity)));
    lake.generateNaturalShoreline(shorelinePointCount);

    // Generate islands if enabled
    if (settings.generateIslands && rng.next() < settings.islandChance) {
      const islandCount = Math.floor(rng.next() * 3) + 1;
      for (let i = 0; i < islandCount; i++) {
        const center = new Position(
          area.x + area.width * (0.2 + rng.next() * 0.6),
          area.y + area.height * (0.2 + rng.next() * 0.6)
        );
        lake.addIsland(center);
      }
    }

    // Generate inlets and outlets
    if (settings.generateInlets) {
      const inletCount = Math.floor(rng.next() * 2) + 1;
      for (let i = 0; i < inletCount; i++) {
        const inletPos = this.generateShorelinePosition(area, rng);
        lake.addInlet(inletPos);
      }
    }

    if (settings.generateOutlets) {
      const outletPos = this.generateShorelinePosition(area, rng);
      lake.addOutlet(outletPos);
    }

    return lake;
  }

  async generateSpring(
    position: Position,
    settings: SpringGenerationSettings,
    randomGenerator?: IRandomGenerator
  ): Promise<Spring> {
    const rng = randomGenerator || this.createDefaultRandomGenerator();
    
    // Create small area around spring
    const springArea = new SpatialBounds(
      new Position(position.x - 5, position.y - 5),
      new Dimensions(10, 10)
    );

    // Generate water quality based on spring type
    let waterQuality: WaterQuality;
    switch (settings.springType) {
      case SpringType.THERMAL:
        waterQuality = WaterQuality.hotSpring();
        break;
      case SpringType.MINERAL:
        waterQuality = new WaterQuality(
          WaterClarity.CLEAR,
          WaterTemperature.COOL,
          WaterSalinity.FRESH,
          0, 8, 2 // Low pollution, high oxygen, low nutrients
        );
        break;
      default:
        waterQuality = WaterQuality.pristine();
    }

    // Generate outflow direction
    const outflowAngle = rng.next() * 360;
    const outflowDirection = new FlowDirection(outflowAngle, settings.flowRate / 10);

    return new Spring(
      FeatureId.generate(),
      this.generateSpringName(settings.springType, rng),
      springArea,
      settings.springType,
      waterQuality,
      settings.flowRate,
      settings.temperature,
      outflowDirection,
      true
    );
  }

  async generatePond(
    area: SpatialBounds,
    seasonal: boolean,
    randomGenerator?: IRandomGenerator
  ): Promise<Pond> {
    const rng = randomGenerator || this.createDefaultRandomGenerator();
    
    // Depth calculation using same pattern as tile height
    const baseDepth = 3.0; // Base pond depth
    const centerPos = new Position(area.x + area.width/2, area.y + area.height/2);
    const depthNoise = this.getDepthNoiseAt(centerPos, rng);
    const depthVariation = (depthNoise - 0.5) * 2; // Smaller variation for ponds
    const depth = Math.max(1.0, baseDepth + depthVariation); // 1-5 feet depth
    const waterLevel = seasonal 
      ? WaterLevel.seasonal(depth, depth * 0.5, depth * 1.5)
      : WaterLevel.fromDepth(depth);
    
    const waterQuality = WaterQuality.lake(); // Default lake-like quality

    return new Pond(
      FeatureId.generate(),
      this.generatePondName(rng),
      area,
      waterLevel,
      waterQuality,
      depth,
      seasonal,
      rng.next() < 0.3 // 30% chance of outflow
    );
  }

  async generateWetland(
    area: SpatialBounds,
    settings: WetlandGenerationSettings,
    randomGenerator?: IRandomGenerator
  ): Promise<Wetland> {
    const rng = randomGenerator || this.createDefaultRandomGenerator();

    return new Wetland(
      FeatureId.generate(),
      this.generateWetlandName(settings.wetlandType, rng),
      area,
      settings.wetlandType,
      settings.waterLevel,
      settings.waterQuality,
      settings.vegetationDensity,
      settings.seasonal
    );
  }

  async connectWaterFeatures(
    rivers: River[],
    lakes: Lake[],
    springs: Spring[],
    randomGenerator: IRandomGenerator
  ): Promise<void> {
    // Simple connection logic - springs can feed into rivers, rivers into lakes
    for (const spring of springs) {
      const nearbyRivers = rivers.filter(river => 
        river.area.overlaps(spring.area) || 
        this.getDistance(spring.area, river.area) < 100
      );

      if (nearbyRivers.length > 0 && randomGenerator.next() < 0.7) {
        // Connect spring to nearest river (would require more complex implementation)
      }
    }

    // Rivers flowing into lakes
    for (const lake of lakes) {
      const nearbyRivers = rivers.filter(river =>
        this.getDistance(river.area, lake.area) < 50
      );

      for (const river of nearbyRivers) {
        if (randomGenerator.next() < 0.5) {
          // Connect river to lake (would require more complex implementation)
          const connectionPoint = new Position(
            lake.area.x + randomGenerator.next() * lake.area.width,
            lake.area.y + randomGenerator.next() * lake.area.height
          );
          lake.addInlet(connectionPoint);
        }
      }
    }
  }

  async generateRiverPath(
    source: Position,
    mouth: Position,
    area: SpatialBounds,
    settings: RiverGenerationSettings,
    randomGenerator: IRandomGenerator
  ): Promise<Position[]> {
    const path: Position[] = [source];
    
    // Simple pathfinding with meandering
    const distance = source.distanceTo(mouth);
    const segmentCount = Math.max(5, Math.floor(distance / 20));
    
    for (let i = 1; i < segmentCount; i++) {
      const progress = i / segmentCount;
      
      // Base interpolation toward mouth
      const baseX = source.x + (mouth.x - source.x) * progress;
      const baseY = source.y + (mouth.y - source.y) * progress;
      
      // Add meandering variation
      const meanderAmount = settings.meandering * 20 * Math.sin(progress * Math.PI * 4);
      const perpX = -(mouth.y - source.y) / distance * meanderAmount * randomGenerator.next();
      const perpY = (mouth.x - source.x) / distance * meanderAmount * randomGenerator.next();
      
      const point = new Position(baseX + perpX, baseY + perpY);
      
      // Keep within area bounds
      if (area.contains(point)) {
        path.push(point);
      }
    }
    
    path.push(mouth);
    return path;
  }

  validateWaterSystem(
    rivers: River[],
    lakes: Lake[],
    springs: Spring[]
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check for basic validity
    for (const river of rivers) {
      if (river.path.length < 2) {
        errors.push(`River ${river.name} has insufficient path points`);
      }
      if (river.averageWidth <= 0) {
        errors.push(`River ${river.name} has invalid width`);
      }
    }

    for (const lake of lakes) {
      if (lake.maxDepth < lake.averageDepth) {
        errors.push(`Lake ${lake.name} has inconsistent depth values`);
      }
    }

    for (const spring of springs) {
      if (spring.flowRate < 0) {
        errors.push(`Spring ${spring.name} has invalid flow rate`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  getDefaultSettingsForClimate(climate: 'arid' | 'temperate' | 'tropical' | 'arctic'): HydrographicGenerationSettings {
    const baseSettings: HydrographicGenerationSettings = {
      riverDensity: 0.3,
      lakeDensity: 0.2,
      springDensity: 0.1,
      pondDensity: 0.15,
      wetlandDensity: 0.1,
      defaultRiverSettings: this.getDefaultRiverSettings(),
      defaultLakeSettings: this.getDefaultLakeSettings(),
      defaultSpringSettings: this.getDefaultSpringSettings(),
      defaultWetlandSettings: this.getDefaultWetlandSettings(),
      allowInterconnectedSystems: true,
      maintainWaterBalance: true,
      respectTopography: true,
      climate,
      seasonality: true,
      naturalismLevel: 0.8,
      biodiversityFocus: true
    };

    // Adjust based on climate
    switch (climate) {
      case 'arid':
        baseSettings.riverDensity *= 0.3;
        baseSettings.lakeDensity *= 0.5;
        baseSettings.springDensity *= 1.5; // Springs more important in arid regions
        baseSettings.pondDensity *= 0.2;
        baseSettings.wetlandDensity *= 0.1;
        break;
      case 'tropical':
        baseSettings.riverDensity *= 1.5;
        baseSettings.lakeDensity *= 1.2;
        baseSettings.wetlandDensity *= 2.0;
        break;
      case 'arctic':
        baseSettings.riverDensity *= 0.7;
        baseSettings.lakeDensity *= 0.8;
        baseSettings.wetlandDensity *= 0.3;
        break;
    }

    return baseSettings;
  }

  async calculateOptimalPlacements(
    area: SpatialBounds,
    settings: HydrographicGenerationSettings,
    existingFeatures: any[],
    randomGenerator: IRandomGenerator
  ): Promise<{
    riverPlacements: { source: Position; mouth: Position; area: SpatialBounds }[];
    lakePlacements: SpatialBounds[];
    springPlacements: Position[];
    wetlandPlacements: SpatialBounds[];
  }> {
    const result = {
      riverPlacements: [] as { source: Position; mouth: Position; area: SpatialBounds }[],
      lakePlacements: [] as SpatialBounds[],
      springPlacements: [] as Position[],
      wetlandPlacements: [] as SpatialBounds[]
    };

    // Calculate counts based on density and area
    const totalArea = area.dimensions.area;
    const riverCount = Math.floor(settings.riverDensity * totalArea / 2000);
    const lakeCount = Math.floor(settings.lakeDensity * totalArea / 1500);
    const springCount = Math.floor(settings.springDensity * totalArea / 1000);
    const wetlandCount = Math.floor(settings.wetlandDensity * totalArea / 800);

    // Generate spring positions (prefer higher elevations)
    for (let i = 0; i < springCount; i++) {
      const springPos = new Position(
        area.x + randomGenerator.next() * area.width,
        area.y + randomGenerator.next() * area.height
      );
      result.springPlacements.push(springPos);
    }

    // Generate lake areas
    for (let i = 0; i < lakeCount; i++) {
      const lakeArea = this.generateRandomArea(area, randomGenerator, 200, 800);
      result.lakePlacements.push(lakeArea);
    }

    // Generate river placements
    for (let i = 0; i < riverCount; i++) {
      const source = new Position(
        area.x + randomGenerator.next() * area.width,
        area.y + randomGenerator.next() * area.height
      );
      const mouth = new Position(
        area.x + randomGenerator.next() * area.width,
        area.y + randomGenerator.next() * area.height
      );
      const riverArea = this.calculateRiverArea(source, mouth, settings.defaultRiverSettings.averageWidth);
      
      result.riverPlacements.push({ source, mouth, area: riverArea });
    }

    // Generate wetland areas (prefer low-lying areas)
    for (let i = 0; i < wetlandCount; i++) {
      const wetlandArea = this.generateRandomArea(area, randomGenerator, 150, 500);
      result.wetlandPlacements.push(wetlandArea);
    }

    return result;
  }

  applySeasonalChanges(
    waterFeatures: (River | Lake | Wetland | Pond)[],
    season: 'spring' | 'summer' | 'autumn' | 'winter',
    climate: 'arid' | 'temperate' | 'tropical' | 'arctic'
  ): void {
    // Implementation would modify water levels, flow rates, etc. based on season
    // This is a simplified version
    for (const feature of waterFeatures) {
      if (feature instanceof River || feature instanceof Lake) {
        const waterLevel = feature.waterLevel;
        if (waterLevel.seasonal) {
          // Adjust depth based on season
          const seasonalDepth = waterLevel.getSeasonalDepth(season);
          // Would need to update the feature's current depth state
        }
      }
    }
  }

  calculateFlowDirection(
    position: Position,
    elevationData?: number[][],
    randomGenerator?: IRandomGenerator
  ): FlowDirection {
    const rng = randomGenerator || this.createDefaultRandomGenerator();
    
    if (elevationData) {
      // Use elevation data to determine flow direction (simplified)
      // In practice, this would analyze the gradient
      return FlowDirection.fromCardinal(CardinalDirection.SOUTH, 2 + rng.next() * 3);
    }
    
    // Random flow direction if no elevation data
    return FlowDirection.random(2 + rng.next() * 3);
  }

  generateWaterQuality(
    featureType: 'river' | 'lake' | 'spring' | 'pond' | 'wetland',
    environment: {
      elevation: number;
      distanceFromSource: number;
      pollution: number;
      climate: 'arid' | 'temperate' | 'tropical' | 'arctic';
    },
    randomGenerator?: IRandomGenerator
  ): WaterQuality {
    switch (featureType) {
      case 'spring':
        return WaterQuality.pristine();
      case 'river':
        return WaterQuality.river();
      case 'lake':
        return WaterQuality.lake();
      case 'pond':
        return WaterQuality.lake();
      case 'wetland':
        return WaterQuality.wetland();
      default:
        return WaterQuality.pristine();
    }
  }

  async generateTributaries(
    mainRiver: River,
    settings: RiverGenerationSettings,
    area: SpatialBounds,
    randomGenerator: IRandomGenerator
  ): Promise<River[]> {
    const tributaries: River[] = [];
    
    if (!settings.allowTributaries || settings.maxTributaries === 0) {
      return tributaries;
    }

    const tributaryCount = Math.min(
      settings.maxTributaries,
      Math.floor(randomGenerator.next() * settings.maxTributaries * settings.tributaryChance)
    );

    for (let i = 0; i < tributaryCount; i++) {
      // Create smaller tributary settings
      const tributarySettings: RiverGenerationSettings = {
        ...settings,
        averageWidth: settings.averageWidth * 0.6,
        minLength: settings.minLength * 0.4,
        maxLength: settings.maxLength * 0.7,
        allowTributaries: false, // No sub-tributaries
        maxTributaries: 0
      };

      // Find a point along the main river to connect
      const connectionPoint = this.findTributaryConnectionPoint(mainRiver, randomGenerator);
      if (connectionPoint) {
        const source = this.generateTributarySource(connectionPoint, area, randomGenerator);
        if (source) {
          const tributary = await this.generateRiver(
            area,
            tributarySettings,
            source,
            connectionPoint,
            randomGenerator
          );
          tributaries.push(tributary);
        }
      }
    }

    return tributaries;
  }

  // Helper methods
  private createDefaultRandomGenerator(): IRandomGenerator {
    return {
      next: () => Math.random(),
      nextInt: (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min,
      nextFloat: (min: number, max: number) => Math.random() * (max - min) + min,
      choice: <T>(items: T[]): T => items[Math.floor(Math.random() * items.length)],
      shuffle: <T>(array: T[]): T[] => {
        const result = [...array];
        for (let i = result.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
      },
      seed: (value: number) => {
        // Simple seed implementation - in a real implementation this would properly seed Math.random
        // For now, this is a placeholder
      }
    };
  }

  private generateWaterLevel(settings: RiverGenerationSettings, rng: IRandomGenerator, position?: Position): WaterLevel {
    // Use same noise-based pattern as tile height if position provided
    let depth: number;
    if (position) {
      const baseDepth = 3.0; // Base depth similar to tile base height
      const depthNoise = this.getDepthNoiseAt(position, rng);
      const depthVariation = (depthNoise - 0.5) * 3; // Same pattern as heightVariance
      depth = Math.max(1.0, baseDepth + depthVariation); // 1-6 feet range
    } else {
      // Fallback to simpler calculation
      depth = 2 + rng.next() * 4; // 2-6 feet average
    }
    
    return settings.seasonal 
      ? WaterLevel.seasonal(depth, depth * 0.7, depth * 1.3)
      : WaterLevel.fromDepth(depth);
  }

  /**
   * Generate deterministic depth noise using same pattern as tile height calculation
   * Mimics the noise generation from MapGenerationService
   */
  private getDepthNoiseAt(position: Position, rng: IRandomGenerator): number {
    // Validate position coordinates
    if (!Number.isFinite(position.x) || !Number.isFinite(position.y)) {
      console.warn('Invalid position coordinates:', position);
      return 0.5; // Return neutral noise value
    }
    
    // Create deterministic noise seed from random generator
    const noiseSeed = rng.nextInt(1, 1000000);
    
    // Use same noise calculation pattern as MapGenerationService
    // Scale factor 0.05 matches tile height generation
    const x = position.x * 0.05;
    const y = position.y * 0.05;
    
    // Validate scaled coordinates
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      console.warn('Invalid scaled coordinates:', { x, y, originalPosition: position });
      return 0.5; // Return neutral noise value
    }
    
    // Hash-based noise that's deterministic (same as MapGenerationService)
    let n = Math.sin(x * 12.9898 + y * 78.233 + noiseSeed) * 43758.5453;
    n = n - Math.floor(n);
    
    // Validate noise value
    if (!Number.isFinite(n)) {
      console.warn('Invalid noise value:', n);
      n = 0.5;
    }
    
    // Smooth the noise using deterministic functions
    const dx = Math.sin((x + noiseSeed) * 0.1) * 0.1;
    const dy = Math.sin((y + noiseSeed) * 0.1) * 0.1;
    
    const result = Math.max(0, Math.min(1, n + dx + dy));
    
    // Final validation
    if (!Number.isFinite(result)) {
      console.warn('Invalid final result:', result);
      return 0.5;
    }
    
    return result;
  }

  private generateSourcePosition(area: SpatialBounds, rng: IRandomGenerator): Position {
    const x = area.x + rng.next() * area.width;
    const y = area.y + rng.next() * area.height * 0.3; // Prefer upper part of area for sources
    
    // Validate coordinates
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      console.warn('Invalid source coordinates:', { x, y, area });
      throw new Error('Position coordinates must be finite numbers');
    }
    
    return new Position(x, y);
  }

  private generateMouthPosition(area: SpatialBounds, source: Position, rng: IRandomGenerator): Position {
    const x = area.x + rng.next() * area.width;
    const y = area.y + area.height * 0.7 + rng.next() * area.height * 0.3; // Prefer lower part
    
    // Validate coordinates
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      console.warn('Invalid mouth coordinates:', { x, y, area, source });
      throw new Error('Position coordinates must be finite numbers');
    }
    
    return new Position(x, y);
  }

  private generateShorelinePosition(area: SpatialBounds, rng: IRandomGenerator): Position {
    // Generate position on the perimeter
    const side = Math.floor(rng.next() * 4);
    switch (side) {
      case 0: return new Position(area.x, area.y + rng.next() * area.height);
      case 1: return new Position(area.x + area.width, area.y + rng.next() * area.height);
      case 2: return new Position(area.x + rng.next() * area.width, area.y);
      default: return new Position(area.x + rng.next() * area.width, area.y + area.height);
    }
  }

  private generateRandomArea(
    parentArea: SpatialBounds,
    rng: IRandomGenerator,
    minSize: number,
    maxSize: number
  ): SpatialBounds {
    const size = minSize + rng.next() * (maxSize - minSize);
    const rawWidth = Math.max(1, Math.sqrt(size) * (0.8 + rng.next() * 0.4));
    const rawHeight = Math.max(1, size / rawWidth);
    
    // Round dimensions before using them in position calculations
    const width = Math.round(rawWidth);
    const height = Math.round(rawHeight);
    
    const x = parentArea.x + rng.next() * Math.max(0, parentArea.width - width);
    const y = parentArea.y + rng.next() * Math.max(0, parentArea.height - height);
    
    return new SpatialBounds(
      new Position(x, y),
      new Dimensions(width, height)
    );
  }

  private calculateRiverArea(source: Position, mouth: Position, width: number): SpatialBounds {
    const minX = Math.min(source.x, mouth.x) - width / 2;
    const maxX = Math.max(source.x, mouth.x) + width / 2;
    const minY = Math.min(source.y, mouth.y) - width / 2;
    const maxY = Math.max(source.y, mouth.y) + width / 2;
    
    return new SpatialBounds(
      new Position(minX, minY),
      new Dimensions(maxX - minX, maxY - minY)
    );
  }

  private findTributaryConnectionPoint(river: River, rng: IRandomGenerator): Position | null {
    const path = river.path;
    if (path.length < 2) return null;
    
    // Select random point along river (not source or mouth)
    const index = 1 + Math.floor(rng.next() * (path.length - 2));
    return path[index].position;
  }

  private generateTributarySource(
    connectionPoint: Position,
    area: SpatialBounds,
    rng: IRandomGenerator
  ): Position | null {
    // Generate source position away from connection point
    const angle = rng.next() * 2 * Math.PI;
    const distance = 50 + rng.next() * 100;
    
    const sourceX = connectionPoint.x + Math.cos(angle) * distance;
    const sourceY = connectionPoint.y + Math.sin(angle) * distance;
    const source = new Position(sourceX, sourceY);
    
    return area.contains(source) ? source : null;
  }

  private getDistance(area1: SpatialBounds, area2: SpatialBounds): number {
    const center1 = new Position(area1.x + area1.width / 2, area1.y + area1.height / 2);
    const center2 = new Position(area2.x + area2.width / 2, area2.y + area2.height / 2);
    return center1.distanceTo(center2);
  }

  private calculateWaterCoverage(result: HydrographicGenerationResult, totalArea: SpatialBounds): number {
    let waterArea = 0;
    
    result.lakes.forEach((lake: Lake) => waterArea += lake.area.dimensions.area);
    result.rivers.forEach((river: River) => waterArea += river.area.dimensions.area);
    result.ponds.forEach((pond: Pond) => waterArea += pond.area.dimensions.area);
    result.wetlands.forEach((wetland: Wetland) => waterArea += wetland.area.dimensions.area);
    
    return (waterArea / totalArea.dimensions.area) * 100;
  }

  private calculateInterconnectionScore(result: HydrographicGenerationResult): number {
    let score = 0;
    const maxScore = 10;
    
    // Points for rivers connecting to lakes
    result.rivers.forEach((river: River) => {
      if (river.tributaries.length > 0) score += 1;
    });
    
    // Points for lakes with inlets/outlets
    result.lakes.forEach((lake: Lake) => {
      if (lake.hasInflow) score += 1;
      if (lake.hasOutflow) score += 1;
    });
    
    return Math.min(maxScore, score);
  }

  private calculateBiodiversityScore(
    result: HydrographicGenerationResult,
    settings: HydrographicGenerationSettings
  ): number {
    let score = 0;
    
    // Points for variety of feature types
    if (result.rivers.length > 0) score += 2;
    if (result.lakes.length > 0) score += 2;
    if (result.springs.length > 0) score += 2;
    if (result.ponds.length > 0) score += 1;
    if (result.wetlands.length > 0) score += 2;
    
    // Additional points for wetlands (high biodiversity)
    score += result.wetlands.reduce((sum: number, wetland: Wetland) => sum + wetland.biodiversityScore, 0) / 10;
    
    return Math.min(10, score);
  }

  // Name generators
  private generateRiverName(rng: IRandomGenerator): string {
    const riverNames = ['Silverbrook', 'Willowstream', 'Rapidflow', 'Clearwater', 'Stonebrook'];
    return riverNames[Math.floor(rng.next() * riverNames.length)];
  }

  private generateLakeName(rng: IRandomGenerator): string {
    const lakeNames = ['Crystal Lake', 'Mirror Lake', 'Moonwater', 'Deepblue', 'Serenity Lake'];
    return lakeNames[Math.floor(rng.next() * lakeNames.length)];
  }

  private generateSpringName(type: SpringType, rng: IRandomGenerator): string {
    const prefixes = type === SpringType.THERMAL ? ['Hot', 'Warm', 'Steam'] : ['Clear', 'Fresh', 'Pure'];
    const suffixes = ['Spring', 'Source', 'Well'];
    const prefix = prefixes[Math.floor(rng.next() * prefixes.length)];
    const suffix = suffixes[Math.floor(rng.next() * suffixes.length)];
    return `${prefix} ${suffix}`;
  }

  private generatePondName(rng: IRandomGenerator): string {
    const pondNames = ['Lily Pond', 'Quiet Pond', 'Duck Pond', 'Frog Pond', 'Peaceful Pond'];
    return pondNames[Math.floor(rng.next() * pondNames.length)];
  }

  private generateWetlandName(type: WetlandType, rng: IRandomGenerator): string {
    const typeNames = {
      [WetlandType.MARSH]: 'Marsh',
      [WetlandType.SWAMP]: 'Swamp',
      [WetlandType.BOG]: 'Bog',
      [WetlandType.FEN]: 'Fen',
      [WetlandType.PRAIRIE_POTHOLE]: 'Prairie Pothole',
      [WetlandType.VERNAL_POOL]: 'Vernal Pool'
    };
    
    const adjectives = ['Misty', 'Wild', 'Ancient', 'Hidden', 'Sacred'];
    const adj = adjectives[Math.floor(rng.next() * adjectives.length)];
    return `${adj} ${typeNames[type]}`;
  }

  private getDefaultRiverSettings(): RiverGenerationSettings {
    return {
      minLength: 100,
      maxLength: 500,
      averageWidth: 15,
      widthVariation: 0.3,
      baseFlowVelocity: 3,
      meandering: 0.4,
      naturalObstacles: true,
      waterQuality: WaterQuality.river(),
      seasonal: false,
      allowPartial: true,
      requireSource: false,
      requireMouth: false,
      allowTributaries: true,
      maxTributaries: 2,
      tributaryChance: 0.3,
      elevation: 100,
      climate: 'temperate',
      terrain: 'hilly'
    };
  }

  private getDefaultLakeSettings(): LakeGenerationSettings {
    return {
      minSize: 200,
      maxSize: 1000,
      irregularity: 0.5,
      formation: LakeFormation.NATURAL,
      averageDepth: 15,
      maxDepth: 30,
      shallowAreas: 0.3,
      waterQuality: WaterQuality.lake(),
      thermalStability: false,
      generateIslands: true,
      islandChance: 0.2,
      generateInlets: true,
      generateOutlets: true,
      shorelineComplexity: 0.6,
      accessibilityRatio: 0.7
    };
  }

  private getDefaultSpringSettings(): SpringGenerationSettings {
    return {
      springType: SpringType.GRAVITY,
      flowRate: 5,
      temperature: 55,
      preferHighElevation: true,
      preferRockFormations: false,
      nearWaterFeatures: false,
      generateOutflow: true,
      outflowLength: 50
    };
  }

  private getDefaultWetlandSettings(): WetlandGenerationSettings {
    return {
      wetlandType: WetlandType.MARSH,
      size: 300,
      vegetationDensity: 0.7,
      seasonal: false,
      waterLevel: WaterLevel.fromDepth(1),
      waterQuality: WaterQuality.wetland(),
      preferLowElevation: true,
      nearWaterSources: true
    };
  }
}