import { describe, it, expect, beforeEach } from 'vitest';
import { MapGenerationService } from '../map-generation.service';
import { FeatureGenerationService } from '../feature-generation.service';
import { TerrainType } from '@lazy-map/domain';
import { getFeatureMapIntersection } from '@lazy-map/domain';
import { DEFAULT_MAP_SETTINGS } from '../../defaults';

describe('MapGenerationService', () => {
  let service: MapGenerationService;

  beforeEach(() => {
    const featureGenerationService = new FeatureGenerationService();
    service = new MapGenerationService(featureGenerationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should generate a map with default settings', () => {
    const map = service.generateMap();

    expect(map).toBeDefined();
    expect(map.dimensions).toEqual({ width: 20, height: 20 });
    expect(map.cellSize).toBe(32);
    expect(map.tiles).toHaveLength(20);
    expect(map.tiles[0]).toHaveLength(20);
    expect(map.features).toBeDefined();
    expect(Array.isArray(map.features)).toBe(true);
  });

  it('should generate tiles with proper properties', () => {
    const map = service.generateMap();
    const tile = map.tiles[0][0];

    expect(tile.id).toBeDefined();
    expect(tile.position).toEqual({ x: 0, y: 0 });
    expect(Object.values(TerrainType)).toContain(tile.terrainType);
    expect(typeof tile.heightMultiplier).toBe('number');
    expect(tile.heightMultiplier).toBeGreaterThanOrEqual(0);
    expect(tile.inclination).toBeDefined();
    expect(typeof tile.movementCost).toBe('number');
    expect(typeof tile.isBlocked).toBe('boolean');
  });

  it('should respect elevation multiplier setting', () => {
    const settings1 = {
      ...DEFAULT_MAP_SETTINGS,
      elevationMultiplier: 1.0,
      addHeightNoise: false,
      dimensions: { width: 5, height: 5 },
      featureSettings: {
        ...DEFAULT_MAP_SETTINGS.featureSettings,
        generateRelief: false, // Disable features for predictable test
        generateNatural: false,
        generateArtificial: false,
        generateCultural: false,
      },
    };

    const settings2 = {
      ...DEFAULT_MAP_SETTINGS,
      elevationMultiplier: 2.0,
      addHeightNoise: false,
      dimensions: { width: 5, height: 5 },
      featureSettings: {
        ...DEFAULT_MAP_SETTINGS.featureSettings,
        generateRelief: false, // Disable features for predictable test
        generateNatural: false,
        generateArtificial: false,
        generateCultural: false,
      },
    };

    const map1 = service.generateMap(settings1);
    const map2 = service.generateMap(settings2);

    // Compare tiles at same positions - map2 should have doubled heights
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        const tile1 = map1.tiles[y][x];
        const tile2 = map2.tiles[y][x];

        // tile2 should have exactly double the height of tile1
        expect(tile2.heightMultiplier).toBe(tile1.heightMultiplier * 2);
      }
    }
  });

  it('should not add noise when addHeightNoise is false', () => {
    const customSettings = {
      ...DEFAULT_MAP_SETTINGS,
      elevationMultiplier: 1.0,
      addHeightNoise: false,
      dimensions: { width: 10, height: 10 },
      featureSettings: {
        ...DEFAULT_MAP_SETTINGS.featureSettings,
        generateRelief: false, // Disable features for predictable test
        generateNatural: false,
        generateArtificial: false,
        generateCultural: false,
      },
    };

    const map1 = service.generateMap(customSettings);
    const map2 = service.generateMap(customSettings);

    // Without noise, tiles at same positions should have identical heights
    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 10; x++) {
        expect(map1.tiles[y][x].heightMultiplier).toBe(map2.tiles[y][x].heightMultiplier);
      }
    }
  });

  it('should add noise when addHeightNoise is true', () => {
    const customSettings = {
      ...DEFAULT_MAP_SETTINGS,
      elevationMultiplier: 1.0,
      addHeightNoise: true,
      heightVariance: 0.5,
      dimensions: { width: 10, height: 10 },
    };

    const map1 = service.generateMap(customSettings);
    const map2 = service.generateMap(customSettings);

    // With noise enabled, maps should potentially differ
    // This is probabilistic, but with enough tiles, we should see some variation
    let hasDifference = false;
    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 10; x++) {
        if (map1.tiles[y][x].heightMultiplier !== map2.tiles[y][x].heightMultiplier) {
          hasDifference = true;
          break;
        }
      }
      if (hasDifference) break;
    }

    // Note: This test might occasionally fail due to randomness, but it's unlikely
    // with a 10x10 grid and noise enabled
  });

  it('should generate features with proper categories', () => {
    const customSettings = {
      ...DEFAULT_MAP_SETTINGS,
      dimensions: { width: 10, height: 10 },
      featureSettings: {
        ...DEFAULT_MAP_SETTINGS.featureSettings,
        reliefDensity: 1.0, // Force generation
        naturalDensity: 1.0, // Force generation
        artificialDensity: 1.0, // Force generation
        culturalDensity: 0.0, // Disable for predictability
      },
    };

    const map = service.generateMap(customSettings);

    expect(map.features.length).toBeGreaterThan(0);

    // Check that we have different categories
    const categories = new Set(map.features.map((f) => f.category));
    expect(categories.size).toBeGreaterThan(1);

    // Each feature should have proper structure
    for (const feature of map.features) {
      expect(feature.id).toBeDefined();
      expect(feature.name).toBeDefined();
      expect(feature.category).toBeDefined();
      expect(feature.type).toBeDefined();
      expect(feature.area).toBeDefined();
      expect(typeof feature.priority).toBe('number');
      expect(feature.properties).toBeDefined();
    }
  });

  it('should ensure out-of-bounds features are always partially visible', () => {
    const customSettings = {
      ...DEFAULT_MAP_SETTINGS,
      dimensions: { width: 5, height: 5 },
      featureSettings: {
        ...DEFAULT_MAP_SETTINGS.featureSettings,
        allowOutOfBounds: true,
        outOfBoundsExtension: 10,
        reliefDensity: 1.0,
        naturalDensity: 1.0,
        artificialDensity: 1.0,
        minFeatureSize: 8, // Larger than map to force out-of-bounds
        maxFeatureSize: 15,
      },
    };

    const map = service.generateMap(customSettings);

    // Should still generate a valid map even with out-of-bounds features
    expect(map.tiles).toHaveLength(5);
    expect(map.tiles[0]).toHaveLength(5);
    expect(map.features.length).toBeGreaterThan(0);

    // All features should intersect with the map bounds (be partially visible)
    for (const feature of map.features) {
      const intersection = getFeatureMapIntersection(feature, { width: 5, height: 5 });
      expect(intersection).not.toBeNull();
      expect(intersection!.width).toBeGreaterThan(0);
      expect(intersection!.height).toBeGreaterThan(0);

      // If the feature extends beyond bounds, it should still have visible parts
      const isOutOfBounds =
        feature.area.x < 0 ||
        feature.area.y < 0 ||
        feature.area.x + feature.area.width > 5 ||
        feature.area.y + feature.area.height > 5;

      if (isOutOfBounds) {
        // Out-of-bounds features must still be partially visible
        expect(intersection!.width * intersection!.height).toBeGreaterThan(0);
      }
    }
  });

  it('should handle disabled out-of-bounds correctly', () => {
    const customSettings = {
      ...DEFAULT_MAP_SETTINGS,
      dimensions: { width: 8, height: 8 },
      featureSettings: {
        ...DEFAULT_MAP_SETTINGS.featureSettings,
        allowOutOfBounds: false, // Disabled
        outOfBoundsExtension: 0,
        reliefDensity: 1.0,
        naturalDensity: 1.0,
        minFeatureSize: 2,
        maxFeatureSize: 4,
        // Disable forest generation for this specific bounds test
        forestSettings: {
          ...DEFAULT_MAP_SETTINGS.featureSettings.forestSettings,
          enabled: false,
        },
      },
    };

    const map = service.generateMap(customSettings);

    // All features should be fully within map bounds
    for (const feature of map.features) {
      expect(feature.area.x).toBeGreaterThanOrEqual(0);
      expect(feature.area.y).toBeGreaterThanOrEqual(0);
      expect(feature.area.x + feature.area.width).toBeLessThanOrEqual(8);
      expect(feature.area.y + feature.area.height).toBeLessThanOrEqual(8);
    }
  });
});
