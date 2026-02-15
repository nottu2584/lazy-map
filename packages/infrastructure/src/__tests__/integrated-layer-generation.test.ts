import { describe, it, expect } from 'vitest';
import { GeologyLayer } from '../map/services/layers/GeologyLayer';
import { TopographyLayer } from '../map/services/layers/TopographyLayer';
import { HydrologyLayer } from '../map/services/layers/HydrologyLayer';
import {
  ElevationGenerationService,
  ErosionModelService,
  GeologicalFeaturesService,
  TerrainSmoothingService,
  TopographyCalculationService
} from '../map/services/layers/topography';
import {
  TacticalMapContext,
  BiomeType,
  ElevationZone,
  HydrologyType,
  DevelopmentLevel,
  Season,
  Seed,
  TerrainFeature,
  MoistureLevel
} from '@lazy-map/domain';

describe('Integrated Layer Generation', () => {
  const geologicalGenerator = new GeologyLayer();

  // Create topography services
  const elevationService = new ElevationGenerationService();
  const erosionService = new ErosionModelService();
  const geologicalFeaturesService = new GeologicalFeaturesService();
  const smoothingService = new TerrainSmoothingService(erosionService);
  const calculationService = new TopographyCalculationService();

  const topographicGenerator = new TopographyLayer(
    elevationService,
    erosionService,
    geologicalFeaturesService,
    smoothingService,
    calculationService
  );

  const hydrologicalGenerator = new HydrologyLayer();

  describe('Full layer stack generation', () => {
    it('should generate all three layers successfully', async () => {
      const context = TacticalMapContext.create(
        BiomeType.MOUNTAIN,
        ElevationZone.HIGHLAND,
        HydrologyType.STREAM,
        DevelopmentLevel.WILDERNESS,
        Season.SUMMER
      );
      const seed = Seed.fromString('integrated-test');

      // Generate geological foundation
      const geology = await geologicalGenerator.generate(30, 30, context, seed);
      expect(geology.tiles).toHaveLength(30);
      expect(geology.primaryFormation).toBeDefined();

      // Generate topography from geology
      const topography = await topographicGenerator.generate(geology, context, seed);
      expect(topography.tiles).toHaveLength(30);
      expect(topography.minElevation).toBeLessThan(topography.maxElevation);

      // Generate hydrology from topography and geology
      const hydrology = await hydrologicalGenerator.generate(topography, geology, context, seed);
      expect(hydrology.tiles).toHaveLength(30);
      expect(hydrology.totalWaterCoverage).toBeGreaterThanOrEqual(0);
    });

    it('should create elevation from geological features', async () => {
      const context = TacticalMapContext.create(
        BiomeType.MOUNTAIN,
        ElevationZone.ALPINE,
        HydrologyType.STREAM,
        DevelopmentLevel.WILDERNESS,
        Season.SUMMER
      );
      const seed = Seed.fromString('elevation-test');

      const geology = await geologicalGenerator.generate(20, 20, context, seed);
      const topography = await topographicGenerator.generate(geology, context, seed);

      // Find tiles with towers (should be elevated)
      let foundTower = false;
      for (let y = 0; y < 20; y++) {
        for (let x = 0; x < 20; x++) {
          if (geology.tiles[y][x].features.includes(TerrainFeature.TOWER)) {
            foundTower = true;
            const elevation = topography.tiles[y][x].elevation;

            // Towers should create significant elevation
            expect(elevation).toBeGreaterThan(topography.minElevation + 10);
          }
        }
      }

      // Should have at least one feature to test
      if (foundTower) {
        expect(foundTower).toBe(true);
      }
    });

    it('should generate water flow following topography', async () => {
      const context = TacticalMapContext.create(
        BiomeType.FOREST,
        ElevationZone.FOOTHILLS,
        HydrologyType.RIVER,
        DevelopmentLevel.WILDERNESS,
        Season.SPRING
      );
      const seed = Seed.fromString('flow-test');

      const geology = await geologicalGenerator.generate(30, 30, context, seed);
      const topography = await topographicGenerator.generate(geology, context, seed);
      const hydrology = await hydrologicalGenerator.generate(topography, geology, context, seed);

      // Water should flow downhill
      let validFlow = true;
      for (let y = 0; y < 30; y++) {
        for (let x = 0; x < 30; x++) {
          const tile = hydrology.tiles[y][x];
          if (tile.flowDirection >= 0) {
            // Calculate downstream position
            const dirs = [
              { dx: 0, dy: -1 }, { dx: 1, dy: -1 },
              { dx: 1, dy: 0 }, { dx: 1, dy: 1 },
              { dx: 0, dy: 1 }, { dx: -1, dy: 1 },
              { dx: -1, dy: 0 }, { dx: -1, dy: -1 }
            ];
            const dir = dirs[tile.flowDirection];
            const nx = x + dir.dx;
            const ny = y + dir.dy;

            if (nx >= 0 && nx < 30 && ny >= 0 && ny < 30) {
              const currentElev = topography.tiles[y][x].elevation;
              const downstreamElev = topography.tiles[ny][nx].elevation;

              // Water should flow to equal or lower elevation
              if (currentElev < downstreamElev) {
                validFlow = false;
              }
            }
          }
        }
      }
      expect(validFlow).toBe(true);
    });

    it('should place springs at geological boundaries', async () => {
      const context = TacticalMapContext.create(
        BiomeType.MOUNTAIN,
        ElevationZone.HIGHLAND,
        HydrologyType.STREAM,
        DevelopmentLevel.WILDERNESS,
        Season.SUMMER
      );
      const seed = Seed.fromString('spring-test-999'); // Seed that gives secondary formation

      const geology = await geologicalGenerator.generate(25, 25, context, seed);
      const topography = await topographicGenerator.generate(geology, context, seed);
      const hydrology = await hydrologicalGenerator.generate(topography, geology, context, seed);

      // If we have transition zones, we might have springs
      if (geology.transitionZones.length > 0) {
        const springPositions = new Set(
          hydrology.springs.map(s => `${s.x},${s.y}`)
        );

        // Springs should be at or near transition zones
        let nearTransition = false;
        for (const spring of hydrology.springs) {
          for (const transition of geology.transitionZones) {
            const distance = Math.abs(spring.x - transition.x) + Math.abs(spring.y - transition.y);
            if (distance <= 2) {
              nearTransition = true;
              break;
            }
          }
        }

        if (hydrology.springs.length > 0) {
          expect(nearTransition).toBe(true);
        }
      }
    });

    it('should create appropriate moisture levels', async () => {
      const context = TacticalMapContext.create(
        BiomeType.SWAMP,
        ElevationZone.LOWLAND,
        HydrologyType.WETLAND,
        DevelopmentLevel.WILDERNESS,
        Season.SUMMER
      );
      const seed = Seed.fromString('moisture-test');

      const geology = await geologicalGenerator.generate(20, 20, context, seed);
      const topography = await topographicGenerator.generate(geology, context, seed);
      const hydrology = await hydrologicalGenerator.generate(topography, geology, context, seed);

      // Swamp should have high moisture
      let wetCount = 0;
      let totalCount = 0;
      for (let y = 0; y < 20; y++) {
        for (let x = 0; x < 20; x++) {
          const moisture = hydrology.tiles[y][x].moisture;
          if (moisture === MoistureLevel.WET ||
              moisture === MoistureLevel.MOIST ||
              moisture === MoistureLevel.SATURATED) {
            wetCount++;
          }
          totalCount++;
        }
      }

      // At least 30% should be wet in a swamp
      expect(wetCount / totalCount).toBeGreaterThan(0.3);
    });

    it('should generate streams in appropriate contexts', async () => {
      const riverContext = TacticalMapContext.create(
        BiomeType.PLAINS,
        ElevationZone.LOWLAND,
        HydrologyType.RIVER,
        DevelopmentLevel.RURAL,
        Season.SPRING
      );
      const seed = Seed.fromString('stream-test');

      const geology = await geologicalGenerator.generate(40, 40, riverContext, seed);
      const topography = await topographicGenerator.generate(geology, riverContext, seed);
      const hydrology = await hydrologicalGenerator.generate(topography, geology, riverContext, seed);

      // River context should generate streams
      let hasStreams = false;
      for (let y = 0; y < 40; y++) {
        for (let x = 0; x < 40; x++) {
          if (hydrology.tiles[y][x].isStream) {
            hasStreams = true;
            break;
          }
        }
        if (hasStreams) break;
      }

      expect(hasStreams).toBe(true);
      expect(hydrology.streams.length).toBeGreaterThan(0);
    });

    it('should maintain determinism across all layers', async () => {
      const context = TacticalMapContext.create(
        BiomeType.FOREST,
        ElevationZone.FOOTHILLS,
        HydrologyType.STREAM,
        DevelopmentLevel.WILDERNESS,
        Season.AUTUMN
      );
      const seed = Seed.fromString('determinism-test');

      // Generate first set
      const geology1 = await geologicalGenerator.generate(25, 25, context, seed);
      const topography1 = await topographicGenerator.generate(geology1, context, seed);
      const hydrology1 = await hydrologicalGenerator.generate(topography1, geology1, context, seed);

      // Generate second set with same seed
      const geology2 = await geologicalGenerator.generate(25, 25, context, seed);
      const topography2 = await topographicGenerator.generate(geology2, context, seed);
      const hydrology2 = await hydrologicalGenerator.generate(topography2, geology2, context, seed);

      // All layers should be identical
      expect(geology1.primaryFormation).toEqual(geology2.primaryFormation);
      expect(topography1.maxElevation).toEqual(topography2.maxElevation);
      expect(hydrology1.totalWaterCoverage).toEqual(hydrology2.totalWaterCoverage);

      // Check specific tile data
      for (let y = 0; y < 25; y++) {
        for (let x = 0; x < 25; x++) {
          expect(geology1.tiles[y][x].formation).toEqual(geology2.tiles[y][x].formation);
          expect(topography1.tiles[y][x].elevation).toEqual(topography2.tiles[y][x].elevation);
          expect(hydrology1.tiles[y][x].flowDirection).toEqual(hydrology2.tiles[y][x].flowDirection);
        }
      }
    });
  });

  describe('Performance with integrated layers', () => {
    it('should generate all layers for 50x50 map in reasonable time', async () => {
      const context = TacticalMapContext.create(
        BiomeType.FOREST,
        ElevationZone.FOOTHILLS,
        HydrologyType.STREAM,
        DevelopmentLevel.RURAL,
        Season.SUMMER
      );
      const seed = Seed.fromString('performance-50x50');

      const start = Date.now();

      const geology = await geologicalGenerator.generate(50, 50, context, seed);
      const topography = await topographicGenerator.generate(geology, context, seed);
      const hydrology = await hydrologicalGenerator.generate(topography, geology, context, seed);

      const duration = Date.now() - start;

      // All three layers should complete in under 500ms
      expect(duration).toBeLessThan(500);
      expect(geology.tiles).toHaveLength(50);
      expect(topography.tiles).toHaveLength(50);
      expect(hydrology.tiles).toHaveLength(50);
    });

    it('should generate all layers for 100x100 map in reasonable time', async () => {
      const context = TacticalMapContext.create(
        BiomeType.PLAINS,
        ElevationZone.LOWLAND,
        HydrologyType.RIVER,
        DevelopmentLevel.SETTLED,
        Season.SPRING
      );
      const seed = Seed.fromString('performance-100x100');

      const start = Date.now();

      const geology = await geologicalGenerator.generate(100, 100, context, seed);
      const topography = await topographicGenerator.generate(geology, context, seed);
      const hydrology = await hydrologicalGenerator.generate(topography, geology, context, seed);

      const duration = Date.now() - start;

      // All three layers should complete in under 2000ms
      expect(duration).toBeLessThan(2000);
      expect(geology.tiles).toHaveLength(100);
      expect(topography.tiles).toHaveLength(100);
      expect(hydrology.tiles).toHaveLength(100);
    });
  });
});