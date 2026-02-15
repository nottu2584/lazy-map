import { describe, it, expect, beforeEach } from 'vitest';
import { GenerateTacticalMapUseCase } from '../GenerateTacticalMapUseCase';
import {
  TacticalMapContext,
  BiomeType,
  ElevationZone,
  HydrologyType,
  DevelopmentLevel,
  Season,
  Seed,
  TopographyConfig,
  HydrologyConfig,
  VegetationConfig
} from '@lazy-map/domain';
import {
  GeologyLayer,
  TopographyLayer,
  HydrologyLayer,
  VegetationLayer,
  StructuresLayer,
  FeaturesLayer,
  ElevationGenerationService,
  ErosionModelService,
  GeologicalFeaturesService,
  TerrainSmoothingService,
  TopographyCalculationService
} from '@lazy-map/infrastructure';

describe('GenerateTacticalMapUseCase - Determinism with Configs', () => {
  let useCase: GenerateTacticalMapUseCase;

  beforeEach(() => {
    // Create topography services
    const elevationService = new ElevationGenerationService();
    const erosionService = new ErosionModelService();
    const geologicalFeaturesService = new GeologicalFeaturesService();
    const smoothingService = new TerrainSmoothingService(erosionService);
    const calculationService = new TopographyCalculationService();

    // Create topography layer with services
    const topographyLayer = new TopographyLayer(
      elevationService,
      erosionService,
      geologicalFeaturesService,
      smoothingService,
      calculationService
    );

    // Create use case with actual layer implementations
    useCase = new GenerateTacticalMapUseCase(
      new GeologyLayer(),
      topographyLayer,
      new HydrologyLayer(),
      new VegetationLayer(),
      new StructuresLayer(),
      new FeaturesLayer()
    );
  });

  const testContext = TacticalMapContext.create(
    BiomeType.FOREST,
    ElevationZone.FOOTHILLS,
    HydrologyType.STREAM,
    DevelopmentLevel.WILDERNESS,
    Season.SUMMER
  );

  describe('Basic Determinism', () => {
    it('should generate identical maps with same seed and no configs', async () => {
      const seed = Seed.fromString('determinism-test-1');

      const result1 = await useCase.execute(30, 30, testContext, seed);
      const result2 = await useCase.execute(30, 30, testContext, seed);

      // Verify identical generation
      expect(result1.width).toBe(result2.width);
      expect(result1.height).toBe(result2.height);
      expect(result1.seed.getValue()).toBe(result2.seed.getValue());

      // Check geology
      expect(result1.layers.geology.primaryFormation.rockType)
        .toBe(result2.layers.geology.primaryFormation.rockType);

      // Check topography
      expect(result1.layers.topography.minElevation).toBe(result2.layers.topography.minElevation);
      expect(result1.layers.topography.maxElevation).toBe(result2.layers.topography.maxElevation);
      expect(result1.layers.topography.averageSlope).toBe(result2.layers.topography.averageSlope);

      // Check hydrology
      expect(result1.layers.hydrology.springs.length).toBe(result2.layers.hydrology.springs.length);
      expect(result1.layers.hydrology.streams.length).toBe(result2.layers.hydrology.streams.length);
      expect(result1.layers.hydrology.totalWaterCoverage).toBe(result2.layers.hydrology.totalWaterCoverage);

      // Check vegetation
      expect(result1.layers.vegetation.totalTreeCount).toBe(result2.layers.vegetation.totalTreeCount);
      expect(result1.layers.vegetation.forestPatches.length).toBe(result2.layers.vegetation.forestPatches.length);
    });

    it('should generate different maps with different seeds', async () => {
      const seed1 = Seed.fromString('determinism-test-2a');
      const seed2 = Seed.fromString('determinism-test-2b');

      const result1 = await useCase.execute(30, 30, testContext, seed1);
      const result2 = await useCase.execute(30, 30, testContext, seed2);

      // Should be different
      const elevation1 = result1.layers.topography.tiles[10][10].elevation;
      const elevation2 = result2.layers.topography.tiles[10][10].elevation;
      expect(elevation1).not.toBe(elevation2);
    });
  });

  describe('Determinism with TopographyConfig', () => {
    it('should generate identical maps with same seed and topography config', async () => {
      const seed = Seed.fromString('topo-determinism-1');
      const config = TopographyConfig.create(1.5, 1.3);

      const result1 = await useCase.execute(30, 30, testContext, seed, config);
      const result2 = await useCase.execute(30, 30, testContext, seed, config);

      // Topography should be identical
      expect(result1.layers.topography.minElevation).toBe(result2.layers.topography.minElevation);
      expect(result1.layers.topography.maxElevation).toBe(result2.layers.topography.maxElevation);
      expect(result1.layers.topography.averageSlope).toBe(result2.layers.topography.averageSlope);

      // Sample tiles should be identical
      for (let y = 0; y < 10; y++) {
        for (let x = 0; x < 10; x++) {
          expect(result1.layers.topography.tiles[y][x].elevation)
            .toBe(result2.layers.topography.tiles[y][x].elevation);
          expect(result1.layers.topography.tiles[y][x].slope)
            .toBe(result2.layers.topography.tiles[y][x].slope);
        }
      }
    });

    it('should generate different maps with different topography configs', async () => {
      const seed = Seed.fromString('topo-determinism-2');
      const smoothConfig = TopographyConfig.create(0.5, 0.5);
      const ruggedConfig = TopographyConfig.create(2.0, 2.0);

      const smoothResult = await useCase.execute(30, 30, testContext, seed, smoothConfig);
      const ruggedResult = await useCase.execute(30, 30, testContext, seed, ruggedConfig);

      // Elevation ranges should be different
      const smoothRange = smoothResult.layers.topography.maxElevation -
                          smoothResult.layers.topography.minElevation;
      const ruggedRange = ruggedResult.layers.topography.maxElevation -
                          ruggedResult.layers.topography.minElevation;

      expect(ruggedRange).toBeGreaterThan(smoothRange);
    });

    it('should maintain determinism across multiple ruggedness levels', async () => {
      const seed = Seed.fromString('topo-determinism-3');
      const ruggednesses = [0.5, 1.0, 1.5, 2.0];

      for (const ruggedness of ruggednesses) {
        const config = TopographyConfig.create(ruggedness, 1.0);

        const result1 = await useCase.execute(25, 25, testContext, seed, config);
        const result2 = await useCase.execute(25, 25, testContext, seed, config);

        expect(result1.layers.topography.minElevation).toBe(result2.layers.topography.minElevation);
        expect(result1.layers.topography.maxElevation).toBe(result2.layers.topography.maxElevation);
      }
    });
  });

  describe('Determinism with HydrologyConfig', () => {
    it('should generate identical maps with same seed and hydrology config', async () => {
      const seed = Seed.fromString('hydro-determinism-1');
      const config = HydrologyConfig.create(1.6);

      const result1 = await useCase.execute(30, 30, testContext, seed, undefined, config);
      const result2 = await useCase.execute(30, 30, testContext, seed, undefined, config);

      // Hydrology should be identical
      expect(result1.layers.hydrology.springs.length).toBe(result2.layers.hydrology.springs.length);
      expect(result1.layers.hydrology.streams.length).toBe(result2.layers.hydrology.streams.length);
      expect(result1.layers.hydrology.totalWaterCoverage).toBe(result2.layers.hydrology.totalWaterCoverage);

      // Sample tiles should be identical
      for (let y = 0; y < 10; y++) {
        for (let x = 0; x < 10; x++) {
          expect(result1.layers.hydrology.tiles[y][x].isStream)
            .toBe(result2.layers.hydrology.tiles[y][x].isStream);
          expect(result1.layers.hydrology.tiles[y][x].waterDepth)
            .toBe(result2.layers.hydrology.tiles[y][x].waterDepth);
        }
      }
    });

    it('should generate different maps with different hydrology configs', async () => {
      const seed = Seed.fromString('hydro-determinism-2');
      const dryConfig = HydrologyConfig.create(0.5);
      const wetConfig = HydrologyConfig.create(2.0);

      const dryResult = await useCase.execute(40, 40, testContext, seed, undefined, dryConfig);
      const wetResult = await useCase.execute(40, 40, testContext, seed, undefined, wetConfig);

      // Count stream tiles
      let dryStreamCount = 0;
      let wetStreamCount = 0;

      for (let y = 0; y < 40; y++) {
        for (let x = 0; x < 40; x++) {
          if (dryResult.layers.hydrology.tiles[y][x].isStream) dryStreamCount++;
          if (wetResult.layers.hydrology.tiles[y][x].isStream) wetStreamCount++;
        }
      }

      // Wet should have more streams
      expect(wetStreamCount).toBeGreaterThanOrEqual(dryStreamCount);
    });

    it('should maintain determinism across multiple water abundance levels', async () => {
      const seed = Seed.fromString('hydro-determinism-3');
      const abundances = [0.5, 1.0, 1.5, 2.0];

      for (const abundance of abundances) {
        const config = HydrologyConfig.create(abundance);

        const result1 = await useCase.execute(25, 25, testContext, seed, undefined, config);
        const result2 = await useCase.execute(25, 25, testContext, seed, undefined, config);

        expect(result1.layers.hydrology.springs.length).toBe(result2.layers.hydrology.springs.length);
        expect(result1.layers.hydrology.streams.length).toBe(result2.layers.hydrology.streams.length);
        expect(result1.layers.hydrology.totalWaterCoverage).toBe(result2.layers.hydrology.totalWaterCoverage);
      }
    });
  });

  describe('Determinism with VegetationConfig', () => {
    it('should generate identical maps with same seed and vegetation config', async () => {
      const seed = Seed.fromString('veg-determinism-1');
      const config = VegetationConfig.create(1.4);

      const result1 = await useCase.execute(30, 30, testContext, seed, undefined, undefined, config);
      const result2 = await useCase.execute(30, 30, testContext, seed, undefined, undefined, config);

      // Vegetation should be identical
      expect(result1.layers.vegetation.totalTreeCount).toBe(result2.layers.vegetation.totalTreeCount);
      expect(result1.layers.vegetation.forestPatches.length).toBe(result2.layers.vegetation.forestPatches.length);
      expect(result1.layers.vegetation.averageCanopyCoverage).toBe(result2.layers.vegetation.averageCanopyCoverage);
    });
  });

  describe('Determinism with Combined Configs', () => {
    it('should generate identical maps with all three configs', async () => {
      const seed = Seed.fromString('combined-determinism-1');
      const topoConfig = TopographyConfig.create(1.3, 1.2);
      const hydroConfig = HydrologyConfig.create(1.5);
      const vegConfig = VegetationConfig.create(1.4);

      const result1 = await useCase.execute(30, 30, testContext, seed, topoConfig, hydroConfig, vegConfig);
      const result2 = await useCase.execute(30, 30, testContext, seed, topoConfig, hydroConfig, vegConfig);

      // All layers should be identical
      expect(result1.layers.topography.minElevation).toBe(result2.layers.topography.minElevation);
      expect(result1.layers.topography.maxElevation).toBe(result2.layers.topography.maxElevation);
      expect(result1.layers.hydrology.springs.length).toBe(result2.layers.hydrology.springs.length);
      expect(result1.layers.hydrology.streams.length).toBe(result2.layers.hydrology.streams.length);
      expect(result1.layers.vegetation.totalTreeCount).toBe(result2.layers.vegetation.totalTreeCount);
    });

    it('should generate different maps if any config changes', async () => {
      const seed = Seed.fromString('combined-determinism-2');
      const topoConfig1 = TopographyConfig.create(1.0, 1.0);
      const topoConfig2 = TopographyConfig.create(1.5, 1.0);
      const hydroConfig = HydrologyConfig.create(1.0);
      const vegConfig = VegetationConfig.create(1.0);

      const result1 = await useCase.execute(30, 30, testContext, seed, topoConfig1, hydroConfig, vegConfig);
      const result2 = await useCase.execute(30, 30, testContext, seed, topoConfig2, hydroConfig, vegConfig);

      // Topography should be different
      const range1 = result1.layers.topography.maxElevation - result1.layers.topography.minElevation;
      const range2 = result2.layers.topography.maxElevation - result2.layers.topography.minElevation;
      expect(range2).toBeGreaterThan(range1);
    });

    it('should maintain determinism with extreme config combinations', async () => {
      const seed = Seed.fromString('combined-determinism-3');
      const topoConfig = TopographyConfig.create(2.0, 0.5); // Max ruggedness, min variance
      const hydroConfig = HydrologyConfig.create(0.5); // Min water
      const vegConfig = VegetationConfig.create(2.0); // Max vegetation

      const result1 = await useCase.execute(30, 30, testContext, seed, topoConfig, hydroConfig, vegConfig);
      const result2 = await useCase.execute(30, 30, testContext, seed, topoConfig, hydroConfig, vegConfig);

      // All aspects should match
      expect(result1.layers.topography.averageSlope).toBe(result2.layers.topography.averageSlope);
      expect(result1.layers.hydrology.totalWaterCoverage).toBe(result2.layers.hydrology.totalWaterCoverage);
      expect(result1.layers.vegetation.totalTreeCount).toBe(result2.layers.vegetation.totalTreeCount);
    });
  });

  describe('Cascading Effects Determinism', () => {
    it('should maintain determinism when topography affects downstream layers', async () => {
      const seed = Seed.fromString('cascade-determinism-1');
      const ruggedConfig = TopographyConfig.create(2.0, 2.0);

      const result1 = await useCase.execute(30, 30, testContext, seed, ruggedConfig);
      const result2 = await useCase.execute(30, 30, testContext, seed, ruggedConfig);

      // Topography changes should deterministically affect hydrology
      expect(result1.layers.hydrology.streams.length).toBe(result2.layers.hydrology.streams.length);

      // And vegetation
      expect(result1.layers.vegetation.forestPatches.length)
        .toBe(result2.layers.vegetation.forestPatches.length);
    });

    it('should maintain determinism when hydrology affects downstream layers', async () => {
      const seed = Seed.fromString('cascade-determinism-2');
      const wetConfig = HydrologyConfig.create(2.0);

      const result1 = await useCase.execute(30, 30, testContext, seed, undefined, wetConfig);
      const result2 = await useCase.execute(30, 30, testContext, seed, undefined, wetConfig);

      // Hydrology changes should deterministically affect vegetation
      expect(result1.layers.vegetation.totalTreeCount).toBe(result2.layers.vegetation.totalTreeCount);
      expect(result1.layers.vegetation.averageCanopyCoverage)
        .toBe(result2.layers.vegetation.averageCanopyCoverage);
    });
  });

  describe('Tile-Level Determinism', () => {
    it('should produce identical tile data across all layers', async () => {
      const seed = Seed.fromString('tile-determinism-1');
      const topoConfig = TopographyConfig.create(1.5, 1.5);
      const hydroConfig = HydrologyConfig.create(1.5);

      const result1 = await useCase.execute(20, 20, testContext, seed, topoConfig, hydroConfig);
      const result2 = await useCase.execute(20, 20, testContext, seed, topoConfig, hydroConfig);

      // Check every tile across all layers
      for (let y = 0; y < 20; y++) {
        for (let x = 0; x < 20; x++) {
          // Geology
          expect(result1.layers.geology.tiles[y][x].formation.rockType)
            .toBe(result2.layers.geology.tiles[y][x].formation.rockType);

          // Topography
          expect(result1.layers.topography.tiles[y][x].elevation)
            .toBe(result2.layers.topography.tiles[y][x].elevation);

          // Hydrology
          expect(result1.layers.hydrology.tiles[y][x].waterDepth)
            .toBe(result2.layers.hydrology.tiles[y][x].waterDepth);
        }
      }
    });
  });
});
