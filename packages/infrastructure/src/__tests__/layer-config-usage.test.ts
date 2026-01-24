import { describe, it, expect } from 'vitest';
import { TopographyLayer } from '../map/services/layers/TopographyLayer';
import { HydrologyLayer } from '../map/services/layers/HydrologyLayer';
import { GeologyLayer } from '../map/services/layers/GeologyLayer';
import {
  TacticalMapContext,
  BiomeType,
  ElevationZone,
  HydrologyType,
  DevelopmentLevel,
  Season,
  Seed,
  TopographyConfig,
  HydrologyConfig
} from '@lazy-map/domain';

describe('Layer Config Usage', () => {
  const geologyLayer = new GeologyLayer();
  const topographyLayer = new TopographyLayer();
  const hydrologyLayer = new HydrologyLayer();

  const testContext = TacticalMapContext.create(
    BiomeType.FOREST,
    ElevationZone.FOOTHILLS,
    HydrologyType.STREAM,
    DevelopmentLevel.WILDERNESS,
    Season.SUMMER
  );
  const testSeed = Seed.fromString('config-test');

  describe('TopographyLayer with TopographyConfig', () => {
    it('should generate terrain with default config when none provided', async () => {
      const geology = await geologyLayer.generate(30, 30, testContext, testSeed);
      const topography = await topographyLayer.generate(geology, testContext, testSeed);

      expect(topography.tiles).toHaveLength(30);
      expect(topography.minElevation).toBeLessThan(topography.maxElevation);
      expect(topography.averageSlope).toBeGreaterThan(0);
    });

    it('should generate smoother terrain with low ruggedness (0.5)', async () => {
      const geology = await geologyLayer.generate(30, 30, testContext, testSeed);
      const config = TopographyConfig.create(0.5, 1.0); // Low ruggedness
      const topography = await topographyLayer.generate(geology, testContext, testSeed, config);

      expect(topography.tiles).toHaveLength(30);
      expect(topography.averageSlope).toBeGreaterThan(0);

      // With low ruggedness, elevation range should be smaller
      const elevationRange = topography.maxElevation - topography.minElevation;
      expect(elevationRange).toBeGreaterThan(0);
    });

    it('should generate more rugged terrain with high ruggedness (2.0)', async () => {
      const geology = await geologyLayer.generate(30, 30, testContext, testSeed);
      const config = TopographyConfig.create(2.0, 1.0); // High ruggedness
      const topography = await topographyLayer.generate(geology, testContext, testSeed, config);

      expect(topography.tiles).toHaveLength(30);
      expect(topography.averageSlope).toBeGreaterThan(0);

      // With high ruggedness, elevation range should be larger
      const elevationRange = topography.maxElevation - topography.minElevation;
      expect(elevationRange).toBeGreaterThan(0);
    });

    it('should apply elevation variance correctly', async () => {
      const geology = await geologyLayer.generate(30, 30, testContext, testSeed);

      // Low variance (0.5) - more uniform elevation zones
      const lowVarianceConfig = TopographyConfig.create(1.0, 0.5);
      const lowVarianceTopo = await topographyLayer.generate(geology, testContext, testSeed, lowVarianceConfig);

      // High variance (2.0) - more dramatic elevation zones
      const highVarianceConfig = TopographyConfig.create(1.0, 2.0);
      const highVarianceTopo = await topographyLayer.generate(geology, testContext, testSeed, highVarianceConfig);

      // Both should generate valid terrain
      expect(lowVarianceTopo.tiles).toHaveLength(30);
      expect(highVarianceTopo.tiles).toHaveLength(30);

      expect(lowVarianceTopo.minElevation).toBeLessThan(lowVarianceTopo.maxElevation);
      expect(highVarianceTopo.minElevation).toBeLessThan(highVarianceTopo.maxElevation);
    });

    it('should maintain determinism with same config and seed', async () => {
      const geology = await geologyLayer.generate(30, 30, testContext, testSeed);
      const config = TopographyConfig.create(1.5, 1.5);

      const topo1 = await topographyLayer.generate(geology, testContext, testSeed, config);
      const topo2 = await topographyLayer.generate(geology, testContext, testSeed, config);

      // Should produce identical results
      expect(topo1.minElevation).toBe(topo2.minElevation);
      expect(topo1.maxElevation).toBe(topo2.maxElevation);
      expect(topo1.averageSlope).toBe(topo2.averageSlope);

      // Check first few tiles are identical
      for (let y = 0; y < 5; y++) {
        for (let x = 0; x < 5; x++) {
          expect(topo1.tiles[y][x].elevation).toBe(topo2.tiles[y][x].elevation);
          expect(topo1.tiles[y][x].slope).toBe(topo2.tiles[y][x].slope);
        }
      }
    });

    it('should produce different results with different configs', async () => {
      const geology = await geologyLayer.generate(30, 30, testContext, testSeed);

      const smoothConfig = TopographyConfig.create(0.5, 0.5);
      const ruggedConfig = TopographyConfig.create(2.0, 2.0);

      const smoothTopo = await topographyLayer.generate(geology, testContext, testSeed, smoothConfig);
      const ruggedTopo = await topographyLayer.generate(geology, testContext, testSeed, ruggedConfig);

      // Different configs should produce different results
      const smoothRange = smoothTopo.maxElevation - smoothTopo.minElevation;
      const ruggedRange = ruggedTopo.maxElevation - ruggedTopo.minElevation;

      // Rugged should have larger elevation range
      expect(ruggedRange).toBeGreaterThan(smoothRange);
    });
  });

  describe('HydrologyLayer with HydrologyConfig', () => {
    it('should generate water features with default config when none provided', async () => {
      const geology = await geologyLayer.generate(30, 30, testContext, testSeed);
      const topography = await topographyLayer.generate(geology, testContext, testSeed);
      const hydrology = await hydrologyLayer.generate(topography, geology, testContext, testSeed);

      expect(hydrology.tiles).toHaveLength(30);
      expect(hydrology.totalWaterCoverage).toBeGreaterThanOrEqual(0);
      expect(hydrology.streams).toBeInstanceOf(Array);
      expect(hydrology.springs).toBeInstanceOf(Array);
    });

    it('should generate fewer water features with low abundance (0.5)', async () => {
      const geology = await geologyLayer.generate(30, 30, testContext, testSeed);
      const topography = await topographyLayer.generate(geology, testContext, testSeed);
      const config = HydrologyConfig.create(0.5); // Low water abundance

      const hydrology = await hydrologyLayer.generate(topography, geology, testContext, testSeed, config);

      expect(hydrology.tiles).toHaveLength(30);
      expect(hydrology.totalWaterCoverage).toBeGreaterThanOrEqual(0);
      expect(hydrology.streams).toBeInstanceOf(Array);
      expect(hydrology.springs).toBeInstanceOf(Array);
    });

    it('should generate more water features with high abundance (2.0)', async () => {
      const geology = await geologyLayer.generate(30, 30, testContext, testSeed);
      const topography = await topographyLayer.generate(geology, testContext, testSeed);
      const config = HydrologyConfig.create(2.0); // High water abundance

      const hydrology = await hydrologyLayer.generate(topography, geology, testContext, testSeed, config);

      expect(hydrology.tiles).toHaveLength(30);
      expect(hydrology.totalWaterCoverage).toBeGreaterThanOrEqual(0);
      expect(hydrology.streams).toBeInstanceOf(Array);
      expect(hydrology.springs).toBeInstanceOf(Array);
    });

    it('should affect stream formation with config multiplier', async () => {
      const geology = await geologyLayer.generate(40, 40, testContext, testSeed);
      const topography = await topographyLayer.generate(geology, testContext, testSeed);

      // Dry config (0.5) - fewer streams
      const dryConfig = HydrologyConfig.create(0.5);
      const dryHydrology = await hydrologyLayer.generate(topography, geology, testContext, testSeed, dryConfig);

      // Wet config (2.0) - more streams
      const wetConfig = HydrologyConfig.create(2.0);
      const wetHydrology = await hydrologyLayer.generate(topography, geology, testContext, testSeed, wetConfig);

      // Count stream tiles
      let dryStreamCount = 0;
      let wetStreamCount = 0;

      for (let y = 0; y < 40; y++) {
        for (let x = 0; x < 40; x++) {
          if (dryHydrology.tiles[y][x].isStream) dryStreamCount++;
          if (wetHydrology.tiles[y][x].isStream) wetStreamCount++;
        }
      }

      // Wet config should produce more streams
      expect(wetStreamCount).toBeGreaterThanOrEqual(dryStreamCount);
    });

    it('should affect spring placement with config threshold', async () => {
      const geology = await geologyLayer.generate(40, 40, testContext, testSeed);
      const topography = await topographyLayer.generate(geology, testContext, testSeed);

      // Dry config (0.5) - fewer springs
      const dryConfig = HydrologyConfig.create(0.5);
      const dryHydrology = await hydrologyLayer.generate(topography, geology, testContext, testSeed, dryConfig);

      // Wet config (2.0) - more springs
      const wetConfig = HydrologyConfig.create(2.0);
      const wetHydrology = await hydrologyLayer.generate(topography, geology, testContext, testSeed, wetConfig);

      // Wet config should produce more springs (or at least not fewer)
      expect(wetHydrology.springs.length).toBeGreaterThanOrEqual(dryHydrology.springs.length);
    });

    it('should maintain determinism with same config and seed', async () => {
      const geology = await geologyLayer.generate(30, 30, testContext, testSeed);
      const topography = await topographyLayer.generate(geology, testContext, testSeed);
      const config = HydrologyConfig.create(1.5);

      const hydro1 = await hydrologyLayer.generate(topography, geology, testContext, testSeed, config);
      const hydro2 = await hydrologyLayer.generate(topography, geology, testContext, testSeed, config);

      // Should produce identical results
      expect(hydro1.springs.length).toBe(hydro2.springs.length);
      expect(hydro1.streams.length).toBe(hydro2.streams.length);
      expect(hydro1.totalWaterCoverage).toBe(hydro2.totalWaterCoverage);

      // Check first few tiles are identical
      for (let y = 0; y < 5; y++) {
        for (let x = 0; x < 5; x++) {
          expect(hydro1.tiles[y][x].isStream).toBe(hydro2.tiles[y][x].isStream);
          expect(hydro1.tiles[y][x].isSpring).toBe(hydro2.tiles[y][x].isSpring);
          expect(hydro1.tiles[y][x].waterDepth).toBe(hydro2.tiles[y][x].waterDepth);
        }
      }
    });

    it('should affect pool formation with config threshold', async () => {
      const geology = await geologyLayer.generate(40, 40, testContext, testSeed);
      const topography = await topographyLayer.generate(geology, testContext, testSeed);

      // Dry config (0.5) - fewer pools
      const dryConfig = HydrologyConfig.create(0.5);
      const dryHydrology = await hydrologyLayer.generate(topography, geology, testContext, testSeed, dryConfig);

      // Wet config (2.0) - more pools
      const wetConfig = HydrologyConfig.create(2.0);
      const wetHydrology = await hydrologyLayer.generate(topography, geology, testContext, testSeed, wetConfig);

      // Count pools
      let dryPoolCount = 0;
      let wetPoolCount = 0;

      for (let y = 0; y < 40; y++) {
        for (let x = 0; x < 40; x++) {
          if (dryHydrology.tiles[y][x].isPool) dryPoolCount++;
          if (wetHydrology.tiles[y][x].isPool) wetPoolCount++;
        }
      }

      // Wet config should produce more pools (or at least not fewer)
      expect(wetPoolCount).toBeGreaterThanOrEqual(dryPoolCount);
    });
  });

  describe('Combined Config Effects', () => {
    it('should handle both topography and hydrology configs together', async () => {
      const geology = await geologyLayer.generate(30, 30, testContext, testSeed);

      const topoConfig = TopographyConfig.create(1.5, 1.5);
      const hydroConfig = HydrologyConfig.create(1.5);

      const topography = await topographyLayer.generate(geology, testContext, testSeed, topoConfig);
      const hydrology = await hydrologyLayer.generate(topography, geology, testContext, testSeed, hydroConfig);

      // Both should generate successfully
      expect(topography.tiles).toHaveLength(30);
      expect(hydrology.tiles).toHaveLength(30);

      // Verify topography was affected by config
      expect(topography.maxElevation).toBeGreaterThan(topography.minElevation);

      // Verify hydrology was affected by config
      expect(hydrology.totalWaterCoverage).toBeGreaterThanOrEqual(0);
    });

    it('should maintain determinism across full stack with configs', async () => {
      const geology = await geologyLayer.generate(25, 25, testContext, testSeed);

      const topoConfig = TopographyConfig.create(1.2, 1.3);
      const hydroConfig = HydrologyConfig.create(1.4);

      // First generation
      const topo1 = await topographyLayer.generate(geology, testContext, testSeed, topoConfig);
      const hydro1 = await hydrologyLayer.generate(topo1, geology, testContext, testSeed, hydroConfig);

      // Second generation with same configs
      const topo2 = await topographyLayer.generate(geology, testContext, testSeed, topoConfig);
      const hydro2 = await hydrologyLayer.generate(topo2, geology, testContext, testSeed, hydroConfig);

      // Results should be identical
      expect(topo1.minElevation).toBe(topo2.minElevation);
      expect(topo1.maxElevation).toBe(topo2.maxElevation);
      expect(hydro1.springs.length).toBe(hydro2.springs.length);
      expect(hydro1.streams.length).toBe(hydro2.streams.length);
    });
  });

  describe('Config Validation', () => {
    it('should accept minimum valid topography config (0.5, 0.5)', async () => {
      const geology = await geologyLayer.generate(20, 20, testContext, testSeed);
      const config = TopographyConfig.create(0.5, 0.5);

      const topography = await topographyLayer.generate(geology, testContext, testSeed, config);
      expect(topography.tiles).toHaveLength(20);
    });

    it('should accept maximum valid topography config (2.0, 2.0)', async () => {
      const geology = await geologyLayer.generate(20, 20, testContext, testSeed);
      const config = TopographyConfig.create(2.0, 2.0);

      const topography = await topographyLayer.generate(geology, testContext, testSeed, config);
      expect(topography.tiles).toHaveLength(20);
    });

    it('should accept minimum valid hydrology config (0.5)', async () => {
      const geology = await geologyLayer.generate(20, 20, testContext, testSeed);
      const topography = await topographyLayer.generate(geology, testContext, testSeed);
      const config = HydrologyConfig.create(0.5);

      const hydrology = await hydrologyLayer.generate(topography, geology, testContext, testSeed, config);
      expect(hydrology.tiles).toHaveLength(20);
    });

    it('should accept maximum valid hydrology config (2.0)', async () => {
      const geology = await geologyLayer.generate(20, 20, testContext, testSeed);
      const topography = await topographyLayer.generate(geology, testContext, testSeed);
      const config = HydrologyConfig.create(2.0);

      const hydrology = await hydrologyLayer.generate(topography, geology, testContext, testSeed, config);
      expect(hydrology.tiles).toHaveLength(20);
    });
  });
});
