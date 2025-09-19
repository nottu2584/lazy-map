import {
  CoordinatedRandomGenerator,
  DeterministicIdGenerator,
  MapGrid,
  IMapGenerationService,
  MapGenerationSettings,
  MapMetadata,
  MapTile,
  Position,
  SeedUtils,
  Terrain,
  TerrainType
} from '@lazy-map/domain';

import { SpatialBounds, IHydrographyService } from '@lazy-map/domain';
import { HydrographicGenerationService } from '../../contexts/natural/services/HydrographicGenerationService';

// Using the domain interface for MapGenerationResult

/**
 * Concrete implementation of map generation service
 */
export class MapGenerationService implements IMapGenerationService {
  private hydrographicService: IHydrographyService;

  constructor(hydrographicService?: IHydrographyService) {
    this.hydrographicService = hydrographicService || new HydrographicGenerationService();
  }
  /**
   * Validates map generation settings
   */
  async validateSettings(settings: MapGenerationSettings): Promise<string[]> {
    const warnings: string[] = [];
    
    // Validate dimensions
    if (settings.dimensions.width <= 0 || settings.dimensions.height <= 0) {
      warnings.push('Map dimensions must be positive');
    }
    
    if (settings.dimensions.width > 1000 || settings.dimensions.height > 1000) {
      warnings.push('Map dimensions exceed maximum size (1000x1000)');
    }
    
    // Validate cell size
    if (settings.cellSize <= 0) {
      warnings.push('Cell size must be positive');
    }
    
    if (settings.cellSize > 200) {
      warnings.push('Cell size exceeds maximum (200)');
    }
    
    // Validate terrain distribution
    if (!settings.terrainDistribution || Object.keys(settings.terrainDistribution).length === 0) {
      warnings.push('No terrain distribution specified, using defaults');
    }
    
    // Validate biome type
    if (settings.biomeType && !this.getSupportedBiomes().includes(settings.biomeType)) {
      warnings.push(`Unsupported biome type: ${settings.biomeType}. Using default.`);
    }
    
    // Validate hydrographic settings
    if (settings.integrateWaterFeatures) {
      if (!settings.hydrographicSettings) {
        warnings.push('Water feature integration enabled but no hydrographic settings provided');
      } else {
        // Validate hydrographic density settings
        const hydrographicSettings = settings.hydrographicSettings;
        if (hydrographicSettings.riverDensity < 0 || hydrographicSettings.riverDensity > 1) {
          warnings.push('River density must be between 0 and 1');
        }
        if (hydrographicSettings.lakeDensity < 0 || hydrographicSettings.lakeDensity > 1) {
          warnings.push('Lake density must be between 0 and 1');
        }
        if (hydrographicSettings.naturalismLevel < 0 || hydrographicSettings.naturalismLevel > 1) {
          warnings.push('Naturalism level must be between 0 and 1');
        }
      }
    }
    
    return warnings;
  }
  
  /**
   * Gets supported biome types
   */
  getSupportedBiomes(): string[] {
    return ['temperate', 'tropical', 'arctic', 'desert', 'mixed'];
  }
  async generateMap(settings: MapGenerationSettings): Promise<import('@lazy-map/domain').MapGenerationResult> {
    const startTime = performance.now();
    const warnings: string[] = [];
    
    // Validate and normalize the seed
    const seedValidation = SeedUtils.validateSeed(settings.seed);
    if (!seedValidation.isValid) {
      warnings.push(`Seed validation failed: ${seedValidation.error}`);
      return {
        map: {} as MapGrid,
        featuresGenerated: 0,
        generationTime: 0,
        warnings
      };
    }

    if (seedValidation.warnings) {
      warnings.push(...seedValidation.warnings);
    }

    const normalizedSeed = seedValidation.normalizedSeed!;
    
    // Create coordinated random generator and ID generator
    const coordinatedRandom = new CoordinatedRandomGenerator(normalizedSeed);
    const idGenerator = new DeterministicIdGenerator(coordinatedRandom.getSubSeed('ids'));
    
    // Generate deterministic IDs
    const mapId = idGenerator.generateMapId();
    const timestamp = Math.floor(normalizedSeed / 1000); // Deterministic timestamp based on seed
    const metadata = new MapMetadata(
      new Date(timestamp * 1000),
      new Date(timestamp * 1000),
      'System Generator',
      'Generated map',
      []
    );

    // Generate terrain using coordinated randomization
    const tiles = await this.generateTerrain(settings, coordinatedRandom, warnings);
    
    // Create the map with deterministic name
    const mapName = `Generated Map ${normalizedSeed}`;
    const map = new MapGrid(
      mapId,
      mapName,
      settings.dimensions,
      settings.cellSize,
      tiles,
      metadata
    );

    // Generate hydrographic features if enabled
    let waterFeatures;
    if (settings.integrateWaterFeatures && settings.hydrographicSettings) {
      const mapArea = new SpatialBounds(
        new Position(0, 0),
        settings.dimensions
      );

      const hydrographicRandom = coordinatedRandom.getSubGenerator(CoordinatedRandomGenerator.CONTEXTS.FEATURES);
      const hydrographicResult = await this.hydrographicService.generateWaterSystem(
        mapArea,
        settings.hydrographicSettings,
        hydrographicRandom
      );

      if (hydrographicResult.success) {
        // Integrate water features into the map terrain
        this.integrateWaterFeaturesIntoTerrain(tiles, hydrographicResult, settings);

        waterFeatures = {
          riversGenerated: hydrographicResult.rivers.length,
          lakesGenerated: hydrographicResult.lakes.length,
          springsGenerated: hydrographicResult.springs.length,
          pondsGenerated: hydrographicResult.ponds.length,
          wetlandsGenerated: hydrographicResult.wetlands.length,
          totalWaterCoverage: hydrographicResult.totalWaterCoverage,
          interconnectionScore: hydrographicResult.interconnectionScore,
          biodiversityScore: hydrographicResult.biodiversityScore
        };

        warnings.push(...hydrographicResult.warnings);
      } else {
        warnings.push(`Hydrographic generation failed: ${hydrographicResult.error}`);
      }
    }

    return {
      map,
      featuresGenerated: waterFeatures ? 
        (waterFeatures.riversGenerated + waterFeatures.lakesGenerated + 
         waterFeatures.springsGenerated + waterFeatures.pondsGenerated + 
         waterFeatures.wetlandsGenerated) : 0,
      generationTime: performance.now() - startTime,
      warnings,
      waterFeatures
    };
  }

  private async generateTerrain(
    settings: MapGenerationSettings,
    coordinatedRandom: CoordinatedRandomGenerator,
    warnings: string[]
  ): Promise<MapTile[][]> {
    const { dimensions } = settings;
    const tiles: MapTile[][] = [];

    // Get terrain-specific random generator
    const terrainRandom = coordinatedRandom.getSubGenerator(CoordinatedRandomGenerator.CONTEXTS.TERRAIN);
    
    // Create deterministic noise generator
    const noiseGen = this.createDeterministicNoiseGenerator(terrainRandom);
    
    // Normalize terrain distribution
    const distribution = this.normalizeTerrainDistribution(settings.terrainDistribution);
    
    // Generate tiles deterministically
    for (let y = 0; y < dimensions.height; y++) {
      const row: MapTile[] = [];
      
      for (let x = 0; x < dimensions.width; x++) {
        const position = new Position(x, y);
        const tile = this.generateTile(position, settings, distribution, noiseGen, terrainRandom);
        row.push(tile);
      }
      
      tiles.push(row);
    }

    // Apply post-processing with coordinated randomization
    const elevationRandom = coordinatedRandom.getSubGenerator(CoordinatedRandomGenerator.CONTEXTS.ELEVATION);
    this.applyElevationVariance(tiles, settings, noiseGen, elevationRandom);
    this.applyInclinationEffects(tiles, settings, elevationRandom);

    return tiles;
  }

  private generateTile(
    position: Position,
    settings: MapGenerationSettings,
    distribution: Record<string, number>,
    noiseGen: (x: number, y: number) => number,
    randomGen: any
  ): MapTile {
    // Get base noise value for this position
    const noiseValue = noiseGen(position.x * 0.1, position.y * 0.1);
    
    // Select terrain type based on distribution and noise
    const terrainType = this.selectTerrainType(distribution, noiseValue, randomGen);
    
    // Generate height multiplier
    const baseHeight = 1.0;
    const heightVariation = settings.addHeightNoise ? 
      (noiseGen(position.x * 0.05, position.y * 0.05) - 0.5) * settings.heightVariance :
      0;
    const heightMultiplier = Math.max(0.1, baseHeight + heightVariation);

    // Calculate movement cost based on terrain (handled by Terrain class)
    const _movementCost = this.calculateMovementCost(terrainType, heightMultiplier);
    
    // Determine if blocked
    const isBlocked = this.shouldBeBlocked(terrainType, heightMultiplier, noiseValue);

    const terrain = this.createTerrainFromType(terrainType);
    const tile = new MapTile(position, terrain, heightMultiplier);
    if (isBlocked) {
      tile.block();
    }
    return tile;
  }

  private normalizeTerrainDistribution(distribution: Record<string, number>): Record<string, number> {
    const total = Object.values(distribution).reduce((sum, val) => sum + val, 0);
    
    if (total === 0) {
      // Default distribution if none provided
      return {
        'grassland': 0.4,
        'forest': 0.3,
        'mountain': 0.2,
        'water': 0.1
      };
    }

    // Normalize to sum to 1
    const normalized: Record<string, number> = {};
    Object.entries(distribution).forEach(([terrain, value]) => {
      normalized[terrain] = value / total;
    });

    return normalized;
  }

  private selectTerrainType(
    distribution: Record<string, number>,
    noiseValue: number,
    randomGen: any
  ): TerrainType {
    // Use noise value as primary selector, but add slight randomization for variety
    const adjustedNoise = Math.max(0, Math.min(1, noiseValue + (randomGen.nextFloat(-0.1, 0.1))));
    let cumulative = 0;
    
    for (const [terrainName, probability] of Object.entries(distribution)) {
      cumulative += probability;
      if (adjustedNoise <= cumulative) {
        return this.stringToTerrainType(terrainName);
      }
    }
    
    // Fallback
    return TerrainType.GRASS;
  }

  private stringToTerrainType(terrainName: string): TerrainType {
    const normalized = terrainName.toLowerCase();
    
    switch (normalized) {
      case 'grassland':
      case 'grass':
        return TerrainType.GRASS;
      case 'forest':
      case 'woods':
        return TerrainType.FOREST;
      case 'mountain':
      case 'mountains':
      case 'hills':
        return TerrainType.MOUNTAIN;
      case 'water':
      case 'ocean':
      case 'sea':
      case 'lake':
        return TerrainType.WATER;
      case 'desert':
      case 'sand':
        return TerrainType.DESERT;
      case 'swamp':
      case 'marsh':
        return TerrainType.SWAMP;
      default:
        return TerrainType.GRASS;
    }
  }

  private calculateMovementCost(terrainType: TerrainType, heightMultiplier: number): number {
    // Base movement costs by terrain type
    let baseCost: number;
    
    switch (terrainType) {
      case TerrainType.GRASS:
        baseCost = 1.0;
        break;
      case TerrainType.FOREST:
        baseCost = 1.5;
        break;
      case TerrainType.MOUNTAIN:
        baseCost = 2.5;
        break;
      case TerrainType.WATER:
        baseCost = 3.0; // Difficult to traverse
        break;
      case TerrainType.DESERT:
        baseCost = 1.8;
        break;
      case TerrainType.SWAMP:
        baseCost = 2.2;
        break;
      default:
        baseCost = 1.0;
    }
    
    // Adjust for elevation
    const elevationFactor = 1 + (heightMultiplier - 1) * 0.5;
    
    return Math.round((baseCost * elevationFactor) * 10) / 10;
  }

  private shouldBeBlocked(
    terrainType: TerrainType,
    heightMultiplier: number,
    noiseValue: number
  ): boolean {
    // Very high elevations are blocked
    if (heightMultiplier > 2.5) {
      return true;
    }
    
    // Some terrain types can be blocked based on noise
    switch (terrainType) {
      case TerrainType.MOUNTAIN:
        return heightMultiplier > 2.0 && noiseValue > 0.8;
      case TerrainType.WATER:
        return noiseValue > 0.9; // Deep water
      default:
        return false;
    }
  }

  private applyElevationVariance(
    tiles: MapTile[][],
    settings: MapGenerationSettings,
    noiseGen: (x: number, y: number) => number,
    randomGen: any
  ): void {
    const variance = settings.elevationVariance;
    const multiplier = settings.elevationMultiplier;
    
    if (variance <= 0 || multiplier <= 0) {
      return;
    }

    for (let y = 0; y < tiles.length; y++) {
      for (let x = 0; x < tiles[y].length; x++) {
        const tile = tiles[y][x];
        
        // Apply elevation variance using different noise scale
        const elevationNoise = noiseGen(x * 0.02, y * 0.02);
        const elevationAdjustment = (elevationNoise - 0.5) * variance * multiplier;
        
        // Update tile height
        const newHeight = Math.max(0.1, tile.heightMultiplier + elevationAdjustment);
        
        // Create new tile with updated height
        const newMovementCost = this.calculateMovementCost(tile.terrainType, newHeight);
        const newIsBlocked = this.shouldBeBlocked(tile.terrainType, newHeight, elevationNoise);
        
        const terrain = this.createTerrainFromType(tile.terrainType);
        const newTile = new MapTile(tile.position, terrain, newHeight);
        if (newIsBlocked) {
          newTile.block();
        }
        // Copy custom properties
        Object.entries(tile.customProperties).forEach(([key, value]) => {
          newTile.setCustomProperty(key, value);
        });
        tiles[y][x] = newTile;
      }
    }
  }

  private applyInclinationEffects(tiles: MapTile[][], settings: MapGenerationSettings, randomGen: any): void {
    const inclinationChance = settings.inclinationChance;
    
    if (inclinationChance <= 0) {
      return;
    }

    // Simple inclination effect: increase movement costs for steep slopes
    for (let y = 1; y < tiles.length - 1; y++) {
      for (let x = 1; x < tiles[y].length - 1; x++) {
        const currentTile = tiles[y][x];
        
        // Check neighboring tiles for height differences
        const neighbors = [
          tiles[y-1][x], tiles[y+1][x], // North, South
          tiles[y][x-1], tiles[y][x+1]  // West, East
        ];
        
        const heightDifferences = neighbors.map(neighbor => 
          Math.abs(currentTile.heightMultiplier - neighbor.heightMultiplier)
        );
        
        const maxHeightDiff = Math.max(...heightDifferences);
        
        // Apply inclination penalty if height difference is significant (using deterministic random)
        if (maxHeightDiff > 0.5 && randomGen.nextFloat(0, 1) < inclinationChance) {
          const inclinationPenalty = maxHeightDiff * 0.5;
          const newMovementCost = currentTile.movementCost + inclinationPenalty;
          
          const terrain = this.createTerrainFromType(currentTile.terrainType);
          const newTile = new MapTile(
            currentTile.position,
            terrain,
            currentTile.heightMultiplier
          );
          if (currentTile.isBlocked) {
            newTile.block();
          }
          // Copy custom properties
          Object.entries(currentTile.customProperties).forEach(([key, value]) => {
            newTile.setCustomProperty(key, value);
          });
          tiles[y][x] = newTile;
        }
      }
    }
  }

  private createDeterministicNoiseGenerator(randomGen: any): (x: number, y: number) => number {
    // Deterministic noise generator using coordinated random
    const noiseSeed = randomGen.nextInt(1, 1000000);
    
    return (x: number, y: number): number => {
      // Hash-based noise that's deterministic
      let n = Math.sin(x * 12.9898 + y * 78.233 + noiseSeed) * 43758.5453;
      n = n - Math.floor(n);
      
      // Smooth the noise using deterministic functions
      const dx = Math.sin((x + noiseSeed) * 0.1) * 0.1;
      const dy = Math.sin((y + noiseSeed) * 0.1) * 0.1;
      
      return Math.max(0, Math.min(1, n + dx + dy));
    };
  }

  // Keep old method for backward compatibility but make it deterministic
  private createTerrainFromType(terrainType: TerrainType): Terrain {
    switch (terrainType) {
      case TerrainType.GRASS:
        return Terrain.grass();
      case TerrainType.FOREST:
        return Terrain.forest();
      case TerrainType.MOUNTAIN:
        return Terrain.mountain();
      case TerrainType.WATER:
        return Terrain.water();
      case TerrainType.DESERT:
        return new Terrain(TerrainType.DESERT, 2, true, false);
      case TerrainType.SNOW:
        return new Terrain(TerrainType.SNOW, 2, true, false);
      case TerrainType.SWAMP:
        return new Terrain(TerrainType.SWAMP, 3, true, false);
      case TerrainType.ROAD:
        return new Terrain(TerrainType.ROAD, 0.5, true, false);
      case TerrainType.BUILDING:
        return new Terrain(TerrainType.BUILDING, Infinity, false, false);
      case TerrainType.WALL:
        return new Terrain(TerrainType.WALL, Infinity, false, false);
      default:
        return Terrain.grass();
    }
  }

  private createNoiseGenerator(seed?: number): (x: number, y: number) => number {
    const actualSeed = seed || 123456; // Use fixed fallback instead of Math.random()
    
    return (x: number, y: number): number => {
      // Simple hash-based noise
      let n = Math.sin(x * 12.9898 + y * 78.233 + actualSeed) * 43758.5453;
      n = n - Math.floor(n);
      
      // Smooth the noise a bit
      const dx = Math.sin(x * 0.1) * 0.1;
      const dy = Math.sin(y * 0.1) * 0.1;
      
      return Math.max(0, Math.min(1, n + dx + dy));
    };
  }

  /**
   * Integrate hydrographic features into the map terrain
   */
  private integrateWaterFeaturesIntoTerrain(
    tiles: MapTile[][],
    hydrographicResult: any,
    settings: MapGenerationSettings
  ): void {
    // Convert rivers to water terrain
    for (const river of hydrographicResult.rivers) {
      this.applyRiverToTerrain(tiles, river, settings);
    }

    // Convert lakes to water terrain
    for (const lake of hydrographicResult.lakes) {
      this.applyLakeToTerrain(tiles, lake, settings);
    }

    // Convert ponds to water terrain
    for (const pond of hydrographicResult.ponds) {
      this.applyPondToTerrain(tiles, pond, settings);
    }

    // Convert wetlands to swamp terrain
    for (const wetland of hydrographicResult.wetlands) {
      this.applyWetlandToTerrain(tiles, wetland, settings);
    }

    // Springs create small water areas
    for (const spring of hydrographicResult.springs) {
      this.applySpringToTerrain(tiles, spring, settings);
    }
  }

  private applyRiverToTerrain(tiles: MapTile[][], river: any, settings: MapGenerationSettings): void {
    for (const riverPoint of river.path) {
      const x = Math.floor(riverPoint.position.x / settings.cellSize);
      const y = Math.floor(riverPoint.position.y / settings.cellSize);

      if (this.isValidTilePosition(tiles, x, y)) {
        const currentTile = tiles[y][x];
        const waterTerrain = Terrain.water();
        const waterTile = new MapTile(
          currentTile.position,
          waterTerrain,
          currentTile.heightMultiplier * 0.8 // Rivers are slightly lower
        );

        // Add river metadata
        waterTile.setCustomProperty('featureType', 'river');
        waterTile.setCustomProperty('riverId', river.id.value);
        waterTile.setCustomProperty('riverName', river.name);
        waterTile.setCustomProperty('width', riverPoint.width);
        waterTile.setCustomProperty('depth', riverPoint.depth);
        waterTile.setCustomProperty('flowDirection', riverPoint.flowDirection);

        tiles[y][x] = waterTile;

        // Apply river width (affect adjacent tiles)
        const widthInTiles = Math.ceil(riverPoint.width / settings.cellSize);
        for (let dx = -widthInTiles; dx <= widthInTiles; dx++) {
          for (let dy = -widthInTiles; dy <= widthInTiles; dy++) {
            const nx = x + dx;
            const ny = y + dy;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (this.isValidTilePosition(tiles, nx, ny) && distance <= widthInTiles) {
              if (distance === 0) continue; // Skip center tile (already processed)

              const adjacentTile = tiles[ny][nx];
              if (adjacentTile.terrainType !== TerrainType.WATER) {
                // Create riverbank terrain (modify existing)
                adjacentTile.setCustomProperty('nearRiver', true);
                adjacentTile.setCustomProperty('riverDistance', distance);
              }
            }
          }
        }
      }
    }
  }

  private applyLakeToTerrain(tiles: MapTile[][], lake: any, settings: MapGenerationSettings): void {
    // Apply water terrain to the entire lake area
    const startX = Math.floor(lake.area.x / settings.cellSize);
    const startY = Math.floor(lake.area.y / settings.cellSize);
    const endX = Math.floor((lake.area.x + lake.area.width) / settings.cellSize);
    const endY = Math.floor((lake.area.y + lake.area.height) / settings.cellSize);

    for (let y = startY; y <= endY; y++) {
      for (let x = startX; x <= endX; x++) {
        if (this.isValidTilePosition(tiles, x, y)) {
          // Check if position is actually within lake (for irregular shapes)
          const tileCenter = new Position(
            x * settings.cellSize + settings.cellSize / 2,
            y * settings.cellSize + settings.cellSize / 2
          );

          if (lake.containsPosition(tileCenter)) {
            const currentTile = tiles[y][x];
            const waterTerrain = Terrain.water();
            const depth = lake.getDepthAt(tileCenter);
            const waterTile = new MapTile(
              currentTile.position,
              waterTerrain,
              Math.max(0.1, currentTile.heightMultiplier - (depth * 0.1)) // Lower based on depth
            );

            // Add lake metadata
            waterTile.setCustomProperty('featureType', 'lake');
            waterTile.setCustomProperty('lakeId', lake.id.value);
            waterTile.setCustomProperty('lakeName', lake.name);
            waterTile.setCustomProperty('depth', depth);
            waterTile.setCustomProperty('lakeSize', lake.sizeCategory);
            waterTile.setCustomProperty('navigable', lake.isNavigable);

            tiles[y][x] = waterTile;
          }
        }
      }
    }
  }

  private applyPondToTerrain(tiles: MapTile[][], pond: any, settings: MapGenerationSettings): void {
    const startX = Math.floor(pond.area.x / settings.cellSize);
    const startY = Math.floor(pond.area.y / settings.cellSize);
    const endX = Math.floor((pond.area.x + pond.area.width) / settings.cellSize);
    const endY = Math.floor((pond.area.y + pond.area.height) / settings.cellSize);

    for (let y = startY; y <= endY; y++) {
      for (let x = startX; x <= endX; x++) {
        if (this.isValidTilePosition(tiles, x, y)) {
          const currentTile = tiles[y][x];
          const waterTerrain = Terrain.water();
          const waterTile = new MapTile(
            currentTile.position,
            waterTerrain,
            Math.max(0.1, currentTile.heightMultiplier - (pond.depth * 0.05))
          );

          // Add pond metadata
          waterTile.setCustomProperty('featureType', 'pond');
          waterTile.setCustomProperty('pondId', pond.id.value);
          waterTile.setCustomProperty('pondName', pond.name);
          waterTile.setCustomProperty('depth', pond.depth);
          waterTile.setCustomProperty('seasonal', pond.seasonal);

          tiles[y][x] = waterTile;
        }
      }
    }
  }

  private applyWetlandToTerrain(tiles: MapTile[][], wetland: any, settings: MapGenerationSettings): void {
    const startX = Math.floor(wetland.area.x / settings.cellSize);
    const startY = Math.floor(wetland.area.y / settings.cellSize);
    const endX = Math.floor((wetland.area.x + wetland.area.width) / settings.cellSize);
    const endY = Math.floor((wetland.area.y + wetland.area.height) / settings.cellSize);

    for (let y = startY; y <= endY; y++) {
      for (let x = startX; x <= endX; x++) {
        if (this.isValidTilePosition(tiles, x, y)) {
          const currentTile = tiles[y][x];
          const swampTerrain = new Terrain(TerrainType.SWAMP, 2.5, true, false);
          const swampTile = new MapTile(
            currentTile.position,
            swampTerrain,
            Math.max(0.1, currentTile.heightMultiplier - 0.2) // Slightly lower
          );

          // Add wetland metadata
          swampTile.setCustomProperty('featureType', 'wetland');
          swampTile.setCustomProperty('wetlandId', wetland.id.value);
          swampTile.setCustomProperty('wetlandName', wetland.name);
          swampTile.setCustomProperty('wetlandType', wetland.wetlandType);
          swampTile.setCustomProperty('vegetationDensity', wetland.vegetationDensity);
          swampTile.setCustomProperty('biodiversityScore', wetland.biodiversityScore);

          tiles[y][x] = swampTile;
        }
      }
    }
  }

  private applySpringToTerrain(tiles: MapTile[][], spring: any, settings: MapGenerationSettings): void {
    const centerX = Math.floor((spring.area.x + spring.area.width / 2) / settings.cellSize);
    const centerY = Math.floor((spring.area.y + spring.area.height / 2) / settings.cellSize);

    // Springs affect a small area (typically 1-2 tiles)
    const radius = 1;
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const x = centerX + dx;
        const y = centerY + dy;

        if (this.isValidTilePosition(tiles, x, y)) {
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance <= radius) {
            const currentTile = tiles[y][x];
            
            if (distance === 0) {
              // Center tile becomes water
              const waterTerrain = Terrain.water();
              const springTile = new MapTile(
                currentTile.position,
                waterTerrain,
                currentTile.heightMultiplier
              );

              springTile.setCustomProperty('featureType', 'spring');
              springTile.setCustomProperty('springId', spring.id.value);
              springTile.setCustomProperty('springName', spring.name);
              springTile.setCustomProperty('springType', spring.springType);
              springTile.setCustomProperty('flowRate', spring.flowRate);
              springTile.setCustomProperty('temperature', spring.temperature);

              tiles[y][x] = springTile;
            } else {
              // Adjacent tiles are marked as near spring
              currentTile.setCustomProperty('nearSpring', true);
              currentTile.setCustomProperty('springDistance', distance);
            }
          }
        }
      }
    }
  }

  private isValidTilePosition(tiles: MapTile[][], x: number, y: number): boolean {
    return y >= 0 && y < tiles.length && x >= 0 && x < tiles[0].length;
  }
}