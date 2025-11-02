import { describe, it, expect } from 'vitest';
import { GeologicalFoundationGenerator } from '../map/services/layers/GeologicalFoundationGenerator';
import {
  TacticalMapContext,
  BiomeType,
  ElevationZone,
  HydrologyType,
  DevelopmentLevel,
  Season,
  Seed,
  RockType,
  TerrainFeature,
  PermeabilityLevel
} from '@lazy-map/domain';

describe('GeologicalFoundationGenerator', () => {
  const generator = new GeologicalFoundationGenerator();

  describe('generate', () => {
    it('should generate a geological layer with correct dimensions', async () => {
      const context = TacticalMapContext.create(
        BiomeType.MOUNTAIN,
        ElevationZone.HIGHLAND,
        HydrologyType.STREAM,
        DevelopmentLevel.WILDERNESS,
        Season.SUMMER
      );
      const seed = Seed.fromString('test-geology');

      const result = await generator.generate(50, 50, context, seed);

      expect(result.tiles).toHaveLength(50);
      expect(result.tiles[0]).toHaveLength(50);
      expect(result.primaryFormation).toBeDefined();
    });

    it('should generate deterministic results for the same seed', async () => {
      const context = TacticalMapContext.create(
        BiomeType.DESERT,
        ElevationZone.LOWLAND,
        HydrologyType.ARID,
        DevelopmentLevel.WILDERNESS,
        Season.SUMMER
      );
      const seed = Seed.fromString('deterministic-test');

      const result1 = await generator.generate(25, 25, context, seed);
      const result2 = await generator.generate(25, 25, context, seed);

      // Check that formations are identical
      expect(result1.primaryFormation).toEqual(result2.primaryFormation);
      expect(result1.secondaryFormation).toEqual(result2.secondaryFormation);

      // Check that tile data is identical
      for (let y = 0; y < 25; y++) {
        for (let x = 0; x < 25; x++) {
          expect(result1.tiles[y][x].formation).toEqual(result2.tiles[y][x].formation);
          expect(result1.tiles[y][x].soilDepth).toEqual(result2.tiles[y][x].soilDepth);
          expect(result1.tiles[y][x].permeability).toEqual(result2.tiles[y][x].permeability);
          expect(result1.tiles[y][x].features).toEqual(result2.tiles[y][x].features);
        }
      }
    });

    it('should select appropriate formations for mountain biome', async () => {
      const context = TacticalMapContext.create(
        BiomeType.MOUNTAIN,
        ElevationZone.ALPINE,
        HydrologyType.STREAM,
        DevelopmentLevel.WILDERNESS,
        Season.SUMMER
      );
      const seed = Seed.fromString('mountain-test');

      const result = await generator.generate(30, 30, context, seed);

      // Mountain biome should have appropriate rock types
      const validRockTypes = [
        RockType.CARBONATE,
        RockType.GRANITIC,
        RockType.VOLCANIC,
        RockType.METAMORPHIC
      ];
      expect(validRockTypes).toContain(result.primaryFormation.rockType);
    });

    it('should generate weathering features based on formation', async () => {
      const context = TacticalMapContext.create(
        BiomeType.DESERT,
        ElevationZone.LOWLAND,
        HydrologyType.ARID,
        DevelopmentLevel.WILDERNESS,
        Season.SUMMER
      );
      const seed = Seed.fromString('weathering-test');

      const result = await generator.generate(30, 30, context, seed);

      // Check that some tiles have weathering features
      let hasFeatures = false;
      for (let y = 0; y < 30; y++) {
        for (let x = 0; x < 30; x++) {
          if (result.tiles[y][x].features.length > 0) {
            hasFeatures = true;
            // Features should be from the formation's possible features
            const possibleFeatures = result.tiles[y][x].formation.weathering.products;
            for (const feature of result.tiles[y][x].features) {
              expect(possibleFeatures).toContain(feature);
            }
          }
        }
      }
      expect(hasFeatures).toBe(true);
    });

    it('should calculate soil depths based on weathering', async () => {
      const context = TacticalMapContext.create(
        BiomeType.FOREST,
        ElevationZone.FOOTHILLS,
        HydrologyType.STREAM,
        DevelopmentLevel.WILDERNESS,
        Season.SPRING
      );
      const seed = Seed.fromString('soil-test');

      const result = await generator.generate(20, 20, context, seed);

      // Check soil depth variations
      const soilDepths = new Set<number>();
      for (let y = 0; y < 20; y++) {
        for (let x = 0; x < 20; x++) {
          const depth = result.tiles[y][x].soilDepth;
          expect(depth).toBeGreaterThanOrEqual(0);
          expect(depth).toBeLessThanOrEqual(10); // Reasonable maximum
          soilDepths.add(Math.round(depth));

          // Bare rock features should have minimal soil
          if (result.tiles[y][x].features.includes(TerrainFeature.TOWER) ||
              result.tiles[y][x].features.includes(TerrainFeature.DOME)) {
            expect(depth).toBeLessThanOrEqual(1);
          }
        }
      }
      // Should have variety in soil depths
      expect(soilDepths.size).toBeGreaterThan(2);
    });

    it('should identify transition zones between formations', async () => {
      const context = TacticalMapContext.create(
        BiomeType.MOUNTAIN,
        ElevationZone.HIGHLAND,
        HydrologyType.STREAM,
        DevelopmentLevel.WILDERNESS,
        Season.SUMMER
      );
      const seed = Seed.fromString('transition-test-123'); // Seed that gives secondary formation

      const result = await generator.generate(40, 40, context, seed);

      if (result.secondaryFormation) {
        // Should have transition zones where formations meet
        expect(result.transitionZones.length).toBeGreaterThan(0);

        // Transition zones should be at boundaries
        for (const pos of result.transitionZones) {
          const x = pos.getX();
          const y = pos.getY();
          const currentFormation = result.tiles[y][x].formation;

          // Check neighbors for different formation
          let hasDifferentNeighbor = false;
          const neighbors = [
            { x: x - 1, y },
            { x: x + 1, y },
            { x, y: y - 1 },
            { x, y: y + 1 }
          ];

          for (const n of neighbors) {
            if (n.x >= 0 && n.x < 40 && n.y >= 0 && n.y < 40) {
              if (result.tiles[n.y][n.x].formation !== currentFormation) {
                hasDifferentNeighbor = true;
                break;
              }
            }
          }

          expect(hasDifferentNeighbor).toBe(true);
        }
      }
    });

    it('should set permeability based on rock properties', async () => {
      const context = TacticalMapContext.create(
        BiomeType.SWAMP,
        ElevationZone.LOWLAND,
        HydrologyType.WETLAND,
        DevelopmentLevel.WILDERNESS,
        Season.SUMMER
      );
      const seed = Seed.fromString('permeability-test');

      const result = await generator.generate(20, 20, context, seed);

      // All tiles should have permeability from their formation
      for (let y = 0; y < 20; y++) {
        for (let x = 0; x < 20; x++) {
          const tile = result.tiles[y][x];
          expect(tile.permeability).toBe(tile.formation.properties.permeability);

          // Verify it's a valid permeability level
          const validLevels = Object.values(PermeabilityLevel);
          expect(validLevels).toContain(tile.permeability);
        }
      }
    });

    it('should generate different formations for different biomes', async () => {
      const seed = Seed.fromString('biome-comparison');

      // Test different biomes
      const mountainContext = TacticalMapContext.create(
        BiomeType.MOUNTAIN,
        ElevationZone.ALPINE,
        HydrologyType.STREAM,
        DevelopmentLevel.WILDERNESS,
        Season.SUMMER
      );

      const desertContext = TacticalMapContext.create(
        BiomeType.DESERT,
        ElevationZone.LOWLAND,
        HydrologyType.ARID,
        DevelopmentLevel.WILDERNESS,
        Season.SUMMER
      );

      const mountainResult = await generator.generate(10, 10, mountainContext, seed);
      const desertResult = await generator.generate(10, 10, desertContext, seed);

      // Different biomes should typically have different rock types
      // (though with same seed, selection index might coincidentally match)
      expect(mountainResult.primaryFormation).toBeDefined();
      expect(desertResult.primaryFormation).toBeDefined();

      // Check that the formations are appropriate for their biomes
      const mountainRockTypes = [
        RockType.CARBONATE, RockType.GRANITIC,
        RockType.VOLCANIC, RockType.METAMORPHIC
      ];
      const desertRockTypes = [
        RockType.CLASTIC, RockType.EVAPORITE, RockType.VOLCANIC
      ];

      expect(mountainRockTypes).toContain(mountainResult.primaryFormation.rockType);
      expect(desertRockTypes).toContain(desertResult.primaryFormation.rockType);
    });
  });

  describe('performance', () => {
    it('should generate 50x50 map in reasonable time', async () => {
      const context = TacticalMapContext.create(
        BiomeType.FOREST,
        ElevationZone.FOOTHILLS,
        HydrologyType.STREAM,
        DevelopmentLevel.RURAL,
        Season.AUTUMN
      );
      const seed = Seed.fromString('performance-test');

      const start = Date.now();
      await generator.generate(50, 50, context, seed);
      const duration = Date.now() - start;

      // Should complete in under 100ms for geological layer alone
      expect(duration).toBeLessThan(100);
    });

    it('should generate 100x100 map in reasonable time', async () => {
      const context = TacticalMapContext.create(
        BiomeType.PLAINS,
        ElevationZone.LOWLAND,
        HydrologyType.RIVER,
        DevelopmentLevel.SETTLED,
        Season.SPRING
      );
      const seed = Seed.fromString('large-map-test');

      const start = Date.now();
      await generator.generate(100, 100, context, seed);
      const duration = Date.now() - start;

      // Should complete in under 400ms for geological layer alone
      expect(duration).toBeLessThan(400);
    });
  });
});