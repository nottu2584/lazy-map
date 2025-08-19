import { describe, it, expect } from 'vitest';
import { createEmptyTile, TerrainType } from '@lazy-map/domain';
import {
  getFeatureCompatibility,
  calculateFeatureInteraction,
  applyFeatureMixing,
  CompatibilityLevel,
  InteractionAspect,
  MapFeature,
  FeatureCategory,
  ReliefFeatureType,
  NaturalFeatureType,
  ArtificialFeatureType,
} from '@lazy-map/domain';

describe('Feature Mixing System', () => {
  // Helper function to create test features
  function createTestFeature(
    category: FeatureCategory,
    type: string,
    priority: number = 5,
    properties: Record<string, any> = {},
  ): MapFeature {
    return {
      id: `test-${category}-${type}`,
      name: `Test ${type}`,
      category,
      type: type as any,
      area: { x: 0, y: 0, width: 5, height: 5 },
      priority,
      properties,
    };
  }

  describe('Feature Compatibility', () => {
    it('should identify synergistic mountain and forest combination', () => {
      const mountain = createTestFeature(FeatureCategory.RELIEF, ReliefFeatureType.MOUNTAIN);
      const forest = createTestFeature(FeatureCategory.NATURAL, NaturalFeatureType.FOREST);

      const compatibility = getFeatureCompatibility(mountain, forest);
      expect(compatibility).toBe(CompatibilityLevel.SYNERGISTIC);
    });

    it('should identify incompatible water and building combination', () => {
      const lake = createTestFeature(FeatureCategory.NATURAL, NaturalFeatureType.LAKE);
      const building = createTestFeature(
        FeatureCategory.ARTIFICIAL,
        ArtificialFeatureType.BUILDING_COMPLEX,
      );

      const compatibility = getFeatureCompatibility(lake, building);
      expect(compatibility).toBe(CompatibilityLevel.INCOMPATIBLE);
    });
  });

  describe('Feature Interaction Calculation', () => {
    it('should calculate forested mountain interaction correctly', () => {
      const mountain = createTestFeature(FeatureCategory.RELIEF, ReliefFeatureType.MOUNTAIN, 6);
      const forest = createTestFeature(FeatureCategory.NATURAL, NaturalFeatureType.FOREST, 4);

      const interaction = calculateFeatureInteraction(mountain, forest);

      expect(interaction.compatibility).toBe(CompatibilityLevel.SYNERGISTIC);
      expect(interaction.dominantFeature[InteractionAspect.HEIGHT]).toBe(mountain.id);
      expect(interaction.dominantFeature[InteractionAspect.TERRAIN]).toBe(forest.id);
      expect(interaction.heightBlending).toBe('add');
      expect(interaction.terrainModification).toBe(TerrainType.FOREST);
      expect(interaction.movementModification).toBe(3);
    });
  });

  describe('Feature Mixing Application', () => {
    it('should return unchanged tile for single feature', () => {
      const tile = createEmptyTile(5, 5);
      const mountain = createTestFeature(FeatureCategory.RELIEF, ReliefFeatureType.MOUNTAIN);

      const result = applyFeatureMixing(tile, [mountain]);

      expect(result).toBe(tile); // Should return the same tile object
    });

    it('should apply mixing for multiple compatible features', () => {
      const tile = createEmptyTile(5, 5);
      tile.terrainType = TerrainType.MOUNTAIN;
      tile.heightMultiplier = 3;

      const mountain = createTestFeature(FeatureCategory.RELIEF, ReliefFeatureType.MOUNTAIN, 8);
      const forest = createTestFeature(
        FeatureCategory.NATURAL,
        NaturalFeatureType.FOREST,
        6,
        { heightMultiplier: 1 },
      );

      const result = applyFeatureMixing(tile, [mountain, forest], 1.0); // 100% mixing probability

      expect(result.primaryFeature).toBe(mountain.id);
      expect(result.mixedFeatures).toContain(mountain.id);
      expect(result.mixedFeatures).toContain(forest.id);
      expect(result.terrainType).toBe(TerrainType.FOREST); // Forest terrain dominates
      expect(result.heightMultiplier).toBeGreaterThan(3); // Height should be increased due to 'add' blending
      expect(result.movementCost).toBe(3); // Difficult terrain from forested mountain
    });

    it('should skip incompatible features during mixing', () => {
      const tile = createEmptyTile(5, 5);
      tile.terrainType = TerrainType.WATER;

      const lake = createTestFeature(FeatureCategory.NATURAL, NaturalFeatureType.LAKE, 8);
      const building = createTestFeature(
        FeatureCategory.ARTIFICIAL,
        ArtificialFeatureType.BUILDING_COMPLEX,
        6,
      );

      const result = applyFeatureMixing(tile, [lake, building], 1.0);

      expect(result.primaryFeature).toBe(lake.id);
      expect(result.mixedFeatures).toHaveLength(1); // Only lake should be mixed
      expect(result.mixedFeatures).toContain(lake.id);
      expect(result.mixedFeatures).not.toContain(building.id);
    });

    it('should respect mixing probability', () => {
      const tile = createEmptyTile(5, 5);
      const mountain = createTestFeature(FeatureCategory.RELIEF, ReliefFeatureType.MOUNTAIN, 8);
      const forest = createTestFeature(FeatureCategory.NATURAL, NaturalFeatureType.FOREST, 6);

      // Run multiple times with 0% probability - should never mix
      for (let i = 0; i < 10; i++) {
        const result = applyFeatureMixing(tile, [mountain, forest], 0.0);
        expect(result.mixedFeatures).toHaveLength(1); // Only primary feature
        expect(result.mixedFeatures).toContain(mountain.id);
        expect(result.mixedFeatures).not.toContain(forest.id);
      }
    });

    it('should sort features by priority before mixing', () => {
      const tile = createEmptyTile(5, 5);
      const lowPriorityMountain = createTestFeature(
        FeatureCategory.RELIEF,
        ReliefFeatureType.MOUNTAIN,
        3,
      );
      const highPriorityForest = createTestFeature(
        FeatureCategory.NATURAL,
        NaturalFeatureType.FOREST,
        9,
      );

      const result = applyFeatureMixing(tile, [lowPriorityMountain, highPriorityForest], 1.0);

      // High priority forest should be the primary feature
      expect(result.primaryFeature).toBe(highPriorityForest.id);
      expect(result.mixedFeatures![0]).toBe(highPriorityForest.id); // First in the array
    });
  });
});
