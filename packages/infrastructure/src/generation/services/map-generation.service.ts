import { generateId, simpleNoise } from '@lazy-map/domain';
import {
  createEmptyTile,
  MapTile,
  TerrainType,
  TileInclination,
  getMovementCost,
  isTerrainBlocked,
} from '@lazy-map/domain';
import {
  MapFeature,
  getFeatureMapIntersection,
  sortFeaturesByPriority,
  applyFeatureMixing,
} from '@lazy-map/domain';
import { GridMap, MapGenerationSettings } from '../types';
import { DEFAULT_MAP_SETTINGS } from '../defaults';
import { FeatureGenerationService } from './feature-generation.service';

export class MapGenerationService {
  constructor(private featureGenerationService: FeatureGenerationService) {}

  generateMap(settings: Partial<MapGenerationSettings> = {}): GridMap {
    const config = { ...DEFAULT_MAP_SETTINGS, ...settings };

    // Create the grid
    const tiles: MapTile[][] = [];

    for (let y = 0; y < config.dimensions.height; y++) {
      tiles[y] = [];
      for (let x = 0; x < config.dimensions.width; x++) {
        const tile = createEmptyTile(x, y);

        // Apply terrain generation algorithm
        tile.terrainType = this.generateTerrain(x, y, config);
        tile.heightMultiplier = this.generateHeightMultiplier(x, y, config);
        tile.inclination = this.generateInclination(x, y, config);
        tile.movementCost = getMovementCost(tile.terrainType);
        tile.isBlocked = isTerrainBlocked(tile.terrainType);

        tiles[y][x] = tile;
      }
    }

    // Generate features
    const features = this.featureGenerationService.generateFeatures(
      config.dimensions,
      config.featureSettings,
    );

    // Apply features to tiles
    this.applyFeaturesToTiles(tiles, features, config.dimensions, config);

    const map: GridMap = {
      id: generateId(),
      name: `Generated Map ${new Date().toISOString()}`,
      dimensions: config.dimensions,
      cellSize: config.cellSize,
      tiles,
      features,
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        description: 'Auto-generated battlemap with features',
        tags: ['generated', config.biomeType || 'temperate'],
      },
    };

    return map;
  }

  private generateTerrain(x: number, y: number, config: MapGenerationSettings): TerrainType {
    // Simple noise-based terrain generation
    const noise = simpleNoise(x * 0.1, y * 0.1);
    const distribution = config.terrainDistribution;

    let cumulative = 0;
    for (const [terrain, probability] of Object.entries(distribution)) {
      cumulative += probability;
      if (noise < cumulative) {
        return terrain as TerrainType;
      }
    }

    return TerrainType.GRASS; // fallback
  }

  private generateHeightMultiplier(x: number, y: number, config: MapGenerationSettings): number {
    // Generate base height using noise for natural variation
    const elevationNoise = simpleNoise(x * 0.05, y * 0.05, 1000);
    const variance = config.elevationVariance;

    // Map noise to height levels with elevation variance
    let baseHeight: number;
    if (elevationNoise < 0.2 * variance) {
      baseHeight = 0; // Very low
    } else if (elevationNoise < 0.4 * variance) {
      baseHeight = 0.5; // Low
    } else if (elevationNoise < 0.6) {
      baseHeight = 1; // Ground level
    } else if (elevationNoise < 0.8 + 0.2 * variance) {
      baseHeight = 2; // Elevated
    } else if (elevationNoise < 0.9 + 0.1 * variance) {
      baseHeight = 3; // High
    } else {
      baseHeight = 4; // Very high
    }

    // Apply the configurable elevation multiplier
    let finalHeight = baseHeight * config.elevationMultiplier;

    // Only add noise if requested
    if (config.addHeightNoise) {
      const heightVariance = config.heightVariance;
      const heightNoise = simpleNoise(x * 0.2, y * 0.2, 2000) * heightVariance;
      finalHeight += heightNoise > 0.5 ? Math.floor(heightNoise) : 0;
    }

    // Return height as a multiple of tile size
    return Math.max(0, finalHeight); // Ensure non-negative height
  }

  private generateInclination(
    x: number,
    y: number,
    config: MapGenerationSettings,
  ): TileInclination {
    // Determine if this tile should have inclination
    const shouldHaveInclination = simpleNoise(x * 0.3, y * 0.3, 3000) < config.inclinationChance;

    if (!shouldHaveInclination) {
      // Default flat inclination
      return { top: 0, right: 0, bottom: 0, left: 0 };
    }

    // Generate inclination based on noise
    const inclinationType = simpleNoise(x * 0.15, y * 0.15, 4000);

    // Simple ramp types
    if (inclinationType < 0.2) {
      return { top: 1, right: 0, bottom: 0, left: 0 }; // North ramp
    } else if (inclinationType < 0.4) {
      return { top: 0, right: 1, bottom: 0, left: 0 }; // East ramp
    } else if (inclinationType < 0.6) {
      return { top: 0, right: 0, bottom: 1, left: 0 }; // South ramp
    } else if (inclinationType < 0.8) {
      return { top: 0, right: 0, bottom: 0, left: 1 }; // West ramp
    } else {
      // Corner or valley types for remaining 20%
      const cornerType = Math.floor(simpleNoise(x * 0.25, y * 0.25, 5000) * 4);

      switch (cornerType) {
        case 0:
          return { top: 1, right: 1, bottom: 0, left: 0 }; // NE corner
        case 1:
          return { top: 0, right: 1, bottom: 1, left: 0 }; // SE corner
        case 2:
          return { top: 0, right: 0, bottom: 1, left: 1 }; // SW corner
        case 3:
          return { top: 1, right: 0, bottom: 0, left: 1 }; // NW corner
        default:
          return { top: 0, right: 0, bottom: 0, left: 0 }; // Fallback
      }
    }
  }

  private applyFeaturesToTiles(
    tiles: MapTile[][],
    features: MapFeature[],
    mapDimensions: any,
    settings: MapGenerationSettings,
  ): void {
    // If mixing is disabled, use the old method
    if (!settings.featureSettings.enableFeatureMixing) {
      this.applyFeaturesWithoutMixing(tiles, features, mapDimensions);
      return;
    }

    // Create a map to track which features affect each tile position
    const tileFeatureMap: Map<string, MapFeature[]> = new Map();

    // First pass: collect all features that affect each tile
    for (const feature of features) {
      const intersection = getFeatureMapIntersection(feature, mapDimensions);

      if (!intersection) {
        continue; // Feature doesn't intersect with map
      }

      // For each tile in the intersection area
      for (let y = intersection.y; y < intersection.y + intersection.height; y++) {
        for (let x = intersection.x; x < intersection.x + intersection.width; x++) {
          if (y >= 0 && y < tiles.length && x >= 0 && x < tiles[y].length) {
            const tileKey = `${x},${y}`;
            if (!tileFeatureMap.has(tileKey)) {
              tileFeatureMap.set(tileKey, []);
            }
            tileFeatureMap.get(tileKey)!.push(feature);
          }
        }
      }
    }

    // Second pass: apply features to tiles with mixing
    for (const [tileKey, tileFeatures] of tileFeatureMap.entries()) {
      const [x, y] = tileKey.split(',').map(Number);
      const tile = tiles[y][x];

      if (tileFeatures.length === 1) {
        // Single feature - apply normally
        const feature = tileFeatures[0];
        this.applyFeatureToTile(tile, feature, x - feature.area.x, y - feature.area.y);
      } else if (tileFeatures.length > 1) {
        // Multiple features - apply mixing if within depth limit
        const maxDepth = settings.featureSettings.maxMixingDepth;
        const featuresToMix = tileFeatures.slice(0, maxDepth);

        // Apply base feature first
        const primaryFeature = featuresToMix[0];
        this.applyFeatureToTile(
          tile,
          primaryFeature,
          x - primaryFeature.area.x,
          y - primaryFeature.area.y,
        );

        // Then apply mixing
        const mixedTile = applyFeatureMixing(
          tile,
          featuresToMix,
          settings.featureSettings.mixingProbability,
        );

        // Update the tile with mixed results
        tiles[y][x] = mixedTile;
      }
    }
  }

  private applyFeaturesWithoutMixing(
    tiles: MapTile[][],
    features: MapFeature[],
    mapDimensions: any,
  ): void {
    // Sort features by priority (higher priority applies last, overriding lower priority)
    const sortedFeatures = sortFeaturesByPriority(features);

    for (const feature of sortedFeatures) {
      // Get the intersection of the feature with the map bounds
      const intersection = getFeatureMapIntersection(feature, mapDimensions);

      if (!intersection) {
        continue; // Feature doesn't intersect with map
      }

      // Apply feature effects to tiles in the intersection area
      for (let y = intersection.y; y < intersection.y + intersection.height; y++) {
        for (let x = intersection.x; x < intersection.x + intersection.width; x++) {
          if (y >= 0 && y < tiles.length && x >= 0 && x < tiles[y].length) {
            this.applyFeatureToTile(tiles[y][x], feature, x - feature.area.x, y - feature.area.y);
          }
        }
      }
    }
  }

  private applyFeatureToTile(
    tile: MapTile,
    feature: MapFeature,
    relativeX: number,
    relativeY: number,
  ): void {
    const { category, type, properties } = feature;

    switch (category) {
      case 'relief':
        this.applyReliefFeature(tile, type as any, properties, relativeX, relativeY);
        break;
      case 'natural':
        this.applyNaturalFeature(tile, type as any, properties, relativeX, relativeY);
        break;
      case 'artificial':
        this.applyArtificialFeature(tile, type as any, properties, relativeX, relativeY);
        break;
      case 'cultural':
        this.applyCulturalFeature(tile, type as any, properties, relativeX, relativeY);
        break;
    }
  }

  private applyReliefFeature(
    tile: MapTile,
    type: string,
    properties: any,
    _relativeX: number,
    _relativeY: number,
  ): void {
    // Apply height modifier from relief feature
    if (properties.heightModifier) {
      tile.heightMultiplier += properties.heightModifier;
      tile.heightMultiplier = Math.max(0, tile.heightMultiplier); // Ensure non-negative
    }

    // Set appropriate terrain for different relief types
    switch (type) {
      case 'mountain':
      case 'cliff':
        tile.terrainType = TerrainType.MOUNTAIN;
        break;
      case 'valley':
      case 'basin':
      case 'canyon':
        // Keep existing terrain but might be grass in valleys
        if (tile.terrainType === TerrainType.MOUNTAIN) {
          tile.terrainType = TerrainType.GRASS;
        }
        break;
      case 'ridge':
        tile.terrainType = TerrainType.ROCK;
        break;
    }
  }

  private applyNaturalFeature(
    tile: MapTile,
    type: string,
    _properties: any,
    relativeX: number,
    relativeY: number,
  ): void {
    switch (type) {
      case 'river':
      case 'stream':
      case 'lake':
      case 'pond':
        tile.terrainType = TerrainType.WATER;
        tile.isBlocked = true;
        tile.movementCost = 999;
        break;
      case 'forest_grove':
        tile.terrainType = TerrainType.FOREST;
        tile.movementCost = 2;
        break;
      case 'clearing':
        tile.terrainType = TerrainType.GRASS;
        tile.movementCost = 1;
        break;
      case 'wetland':
        tile.terrainType = TerrainType.SWAMP;
        tile.movementCost = 3;
        break;
      case 'oasis':
        // Center might be water, edges might be grass
        const centerDistance = Math.sqrt(relativeX * relativeX + relativeY * relativeY);
        tile.terrainType = centerDistance < 2 ? TerrainType.WATER : TerrainType.GRASS;
        break;
      case 'cave_system':
        tile.terrainType = TerrainType.CAVE;
        break;
    }
  }

  private applyArtificialFeature(
    tile: MapTile,
    type: string,
    _properties: any,
    _relativeX: number,
    _relativeY: number,
  ): void {
    switch (type) {
      case 'road_network':
      case 'trade_route':
        tile.terrainType = TerrainType.ROAD;
        tile.movementCost = 0.5;
        break;
      case 'building_complex':
      case 'tower':
      case 'fortification':
        tile.terrainType = TerrainType.BUILDING;
        tile.isBlocked = true;
        tile.movementCost = 999;
        break;
      case 'wall_system':
        tile.terrainType = TerrainType.WALL;
        tile.isBlocked = true;
        tile.movementCost = 999;
        break;
      case 'bridge':
        tile.terrainType = TerrainType.ROAD;
        tile.heightMultiplier += 1; // Bridges are elevated
        tile.movementCost = 0.5;
        break;
      case 'quarry':
      case 'mine':
        tile.terrainType = TerrainType.ROCK;
        tile.heightMultiplier -= 0.5; // Excavated areas
        break;
      case 'canal':
        tile.terrainType = TerrainType.WATER;
        tile.isBlocked = true;
        tile.movementCost = 999;
        break;
    }
  }

  private applyCulturalFeature(
    tile: MapTile,
    type: string,
    _properties: any,
    _relativeX: number,
    _relativeY: number,
  ): void {
    // Cultural features mostly affect metadata, not terrain
    switch (type) {
      case 'territory_boundary':
        // Could add visual markers but don't change terrain
        tile.customProperties = { ...tile.customProperties, boundary: true };
        break;
      case 'settlement_area':
        // More likely to have buildings or roads
        if (Math.random() < 0.3) {
          tile.terrainType = TerrainType.BUILDING;
          tile.isBlocked = true;
        } else if (Math.random() < 0.5) {
          tile.terrainType = TerrainType.ROAD;
          tile.movementCost = 0.5;
        }
        break;
      case 'sacred_site':
        // Special building or cleared area
        tile.terrainType = Math.random() < 0.5 ? TerrainType.BUILDING : TerrainType.GRASS;
        tile.customProperties = { ...tile.customProperties, sacred: true };
        break;
      case 'battlefield':
        // Might have rough terrain
        tile.customProperties = { ...tile.customProperties, historical: true };
        break;
      case 'border_crossing':
        tile.terrainType = TerrainType.ROAD;
        tile.movementCost = 0.5;
        tile.customProperties = { ...tile.customProperties, crossing: true };
        break;
    }
  }
}
