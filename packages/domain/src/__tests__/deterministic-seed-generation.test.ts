import { describe, it, expect } from 'vitest';
import { SeedService } from '../common/services/SeedService';
import { Seed } from '../common/value-objects/Seed';

/**
 * Tests to ensure deterministic seed generation prevents reproducibility issues
 */
describe('Deterministic Seed Generation', () => {
  const seedService = new SeedService();

  describe('String-based seed generation', () => {
    it('should generate identical seeds for identical parameters', () => {
      const params1 = 'map:Test Map:25x20:32:{}:0.3_1_false_0.2:true_false_false_false:temperate:none';
      const params2 = 'map:Test Map:25x20:32:{}:0.3_1_false_0.2:true_false_false_false:temperate:none';
      
      const seed1 = Seed.fromString(params1);
      const seed2 = Seed.fromString(params2);

      expect(seed1.getValue()).toBe(seed2.getValue());
      expect(seed1.getValue()).toBeGreaterThan(0);
    });

    it('should generate different seeds for different parameters', () => {
      const params1 = 'map:Test Map:25x20:32:{}:0.3_1_false_0.2:true_false_false_false:temperate:none';
      const params2 = 'map:Different Map:25x20:32:{}:0.3_1_false_0.2:true_false_false_false:temperate:none';
      
      const seed1 = Seed.fromString(params1);
      const seed2 = Seed.fromString(params2);

      expect(seed1.getValue()).not.toBe(seed2.getValue());
    });

    it('should be sensitive to all parameter changes', () => {
      const baseParams = 'map:Test:25x20:32:{}:0.3_1_false_0.2:true_false_false_false:temperate:none';
      const baseSeed = Seed.fromString(baseParams);

      // Different dimension variations should give different seeds
      const dimParams = 'myMap:150:120:forest:42:high:v1.0';
      expect(Seed.fromString(dimParams).getValue()).not.toBe(baseSeed.getValue());

      // Different cell count should give different seeds
      const cellParams = 'myMap:100:100:forest:42:high:v1.0';
      expect(Seed.fromString(cellParams).getValue()).not.toBe(baseSeed.getValue());

      // Different feature settings should give different seeds
      const featureParams = 'myMap:100:100:desert:42:high:v1.0';
      expect(Seed.fromString(featureParams).getValue()).not.toBe(baseSeed.getValue());
    });
  });

  describe('Seed validation and normalization', () => {
    it('should consistently normalize seeds', () => {
      const seed = 12345;
      const validation1 = seedService.validateSeedInput(seed);
      const validation2 = seedService.validateSeedInput(seed);
      
      expect(validation1.seed?.getValue()).toBe(validation2.seed?.getValue());
      expect(validation1.isValid).toBe(true);
      expect(validation2.isValid).toBe(true);
    });

    it('should handle string seeds deterministically', () => {
      const seedString = 'my-custom-map-seed';
      const validation1 = seedService.validateSeedInput(seedString);
      const validation2 = seedService.validateSeedInput(seedString);
      
      expect(validation1.seed?.getValue()).toBe(validation2.seed?.getValue());
      expect(validation1.isValid).toBe(true);
      expect(validation2.isValid).toBe(true);
    });

    it('should reject zero or negative seeds', () => {
      const validation1 = seedService.validateSeedInput(0);
      const validation2 = seedService.validateSeedInput(-100);
      
      expect(validation1.isValid).toBe(false);
      expect(validation2.isValid).toBe(false);
    });
  });

  describe('Anti-randomness safeguards', () => {
    it('should never use Math.random() in seed generation', () => {
      // Test that identical inputs produce identical outputs
      const input = 'test-deterministic-generation';
      
      const seeds = Array.from({ length: 100 }, () => 
        Seed.fromString(input).getValue()
      );
      
      // All seeds should be identical
      const uniqueSeeds = new Set(seeds);
      expect(uniqueSeeds.size).toBe(1);
    });

    it('should produce different seeds for slightly different inputs', () => {
      const seed1 = Seed.fromString('map-version-1');
      const seed2 = Seed.fromString('map-version-2');
      const seed3 = Seed.fromString('map-version-1a');
      
      expect(seed1.getValue()).not.toBe(seed2.getValue());
      expect(seed1.getValue()).not.toBe(seed3.getValue());
      expect(seed2).not.toBe(seed3);
    });
  });

  describe('Reproducibility guarantees', () => {
    it('should guarantee same maps for same parameters over time', () => {
      const mapParams = {
        name: 'Reproducible Test Map',
        width: 50,
        height: 40,
        cellSize: 32,
        terrainDistribution: { grassland: 0.4, forest: 0.3, mountain: 0.2, water: 0.1 },
        generateForests: true,
        generateRivers: false,
        biomeType: 'temperate'
      };

      const paramString = `map:${mapParams.name}:${mapParams.width}x${mapParams.height}:${mapParams.cellSize}:${JSON.stringify(mapParams.terrainDistribution)}:0.3_1_false_0.2:${mapParams.generateForests}_${mapParams.generateRivers}_false_false:${mapParams.biomeType}:none`;
      
      // Generate seed multiple times
      const seeds = Array.from({ length: 10 }, () => 
        Seed.fromString(paramString).getValue()
      );
      
      // All should be identical
      expect(new Set(seeds).size).toBe(1);
      
      // Verify it's a valid seed
      const validation = seedService.validateSeedInput(seeds[0]);
      expect(validation.isValid).toBe(true);
      expect(validation.seed?.getValue()).toBe(seeds[0]);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty and null inputs gracefully', () => {
      const emptyValidation = seedService.validateSeedInput('');
      const nullValidation = seedService.validateSeedInput(null as any);
      const undefinedValidation = seedService.validateSeedInput(undefined as any);
      
      expect(emptyValidation.isValid).toBe(false);
      expect(nullValidation.isValid).toBe(true); // null/undefined -> default seed
      expect(undefinedValidation.isValid).toBe(true); // null/undefined -> default seed
      
      // Should get valid seeds when they exist
      expect(nullValidation.seed?.getValue()).toBeGreaterThan(0);
      expect(undefinedValidation.seed?.getValue()).toBeGreaterThan(0);
    });

    it('should handle very large numbers', () => {
      const largeSeed = 999999999999;
      const validation = seedService.validateSeedInput(largeSeed);
      
      expect(validation.isValid).toBe(false); // Large seeds are rejected
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    it('should handle special string inputs', () => {
      const specialInputs = [
        'unicode-test-🗺️',
        'spaces in name',
        'special-chars!@#$%',
        'very-long-map-name-that-exceeds-normal-length-expectations-and-keeps-going',
        '12345', // numeric string
        'true', // boolean string
        'null' // null string
      ];

      const seeds = specialInputs.map(input => Seed.fromString(input));
      
      // All should be valid and different
      expect(new Set(seeds.map(s => s.getValue())).size).toBe(specialInputs.length);
      seeds.forEach(seed => {
        expect(seed.getValue()).toBeGreaterThan(0);
        expect(seed.getValue()).toBeLessThanOrEqual(Seed.MAX_VALUE);
      });
    });
  });
});