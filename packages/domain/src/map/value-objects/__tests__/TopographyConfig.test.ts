import { describe, it, expect } from 'vitest';
import { TopographyConfig, TopographyConstants } from '../TopographyConfig';
import { ValidationError } from '../../../common/errors';

describe('TopographyConfig', () => {
  describe('create', () => {
    it('should create config with valid ruggedness and variance', () => {
      const config = TopographyConfig.create(1.0, 1.0);
      expect(config.terrainRuggedness).toBe(1.0);
      expect(config.elevationVariance).toBe(1.0);
    });

    it('should create config with default values', () => {
      const config = TopographyConfig.create();
      expect(config.terrainRuggedness).toBe(TopographyConstants.DEFAULT_RUGGEDNESS);
      expect(config.elevationVariance).toBe(TopographyConstants.DEFAULT_VARIANCE);
    });

    it('should create config with minimum ruggedness', () => {
      const config = TopographyConfig.create(0.5, 1.0);
      expect(config.terrainRuggedness).toBe(0.5);
    });

    it('should create config with maximum ruggedness', () => {
      const config = TopographyConfig.create(2.0, 1.0);
      expect(config.terrainRuggedness).toBe(2.0);
    });

    it('should create config with minimum variance', () => {
      const config = TopographyConfig.create(1.0, 0.5);
      expect(config.elevationVariance).toBe(0.5);
    });

    it('should create config with maximum variance', () => {
      const config = TopographyConfig.create(1.0, 2.0);
      expect(config.elevationVariance).toBe(2.0);
    });

    it('should throw ValidationError for ruggedness below minimum', () => {
      expect(() => TopographyConfig.create(0.3, 1.0)).toThrow(ValidationError);

      try {
        TopographyConfig.create(0.2, 1.0);
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        const validationError = error as ValidationError;
        expect(validationError.code).toBe('TOPOGRAPHY_CONFIG_INVALID_RUGGEDNESS_MIN');
        expect(validationError.details.context?.component).toBe('TopographyConfig');
        expect(validationError.details.context?.metadata).toHaveProperty('providedValue', 0.2);
        expect(validationError.details.suggestions).toHaveLength(2);
      }
    });

    it('should throw ValidationError for ruggedness above maximum', () => {
      expect(() => TopographyConfig.create(2.5, 1.0)).toThrow(ValidationError);

      try {
        TopographyConfig.create(3.0, 1.0);
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        const validationError = error as ValidationError;
        expect(validationError.code).toBe('TOPOGRAPHY_CONFIG_INVALID_RUGGEDNESS_MAX');
        expect(validationError.details.context?.component).toBe('TopographyConfig');
        expect(validationError.details.context?.metadata).toHaveProperty('providedValue', 3.0);
        expect(validationError.details.suggestions).toHaveLength(2);
      }
    });

    it('should throw ValidationError for variance below minimum', () => {
      expect(() => TopographyConfig.create(1.0, 0.3)).toThrow(ValidationError);

      try {
        TopographyConfig.create(1.0, 0.2);
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        const validationError = error as ValidationError;
        expect(validationError.code).toBe('TOPOGRAPHY_CONFIG_INVALID_VARIANCE_MIN');
        expect(validationError.details.context?.component).toBe('TopographyConfig');
        expect(validationError.details.context?.metadata).toHaveProperty('providedValue', 0.2);
        expect(validationError.details.suggestions).toHaveLength(2);
      }
    });

    it('should throw ValidationError for variance above maximum', () => {
      expect(() => TopographyConfig.create(1.0, 2.5)).toThrow(ValidationError);

      try {
        TopographyConfig.create(1.0, 3.0);
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        const validationError = error as ValidationError;
        expect(validationError.code).toBe('TOPOGRAPHY_CONFIG_INVALID_VARIANCE_MAX');
        expect(validationError.details.context?.component).toBe('TopographyConfig');
        expect(validationError.details.context?.metadata).toHaveProperty('providedValue', 3.0);
        expect(validationError.details.suggestions).toHaveLength(2);
      }
    });
  });

  describe('default', () => {
    it('should create config with default values', () => {
      const config = TopographyConfig.default();
      expect(config.terrainRuggedness).toBe(TopographyConstants.DEFAULT_RUGGEDNESS);
      expect(config.elevationVariance).toBe(TopographyConstants.DEFAULT_VARIANCE);
    });
  });

  describe('calculations', () => {
    describe('getNoiseOctaves', () => {
      it('should return 2 octaves for minimum ruggedness (0.5)', () => {
        const config = TopographyConfig.create(0.5, 1.0);
        expect(config.getNoiseOctaves()).toBe(2);
      });

      it('should return 4 octaves for default ruggedness (1.0)', () => {
        const config = TopographyConfig.create(1.0, 1.0);
        expect(config.getNoiseOctaves()).toBe(4);
      });

      it('should return 6 octaves for maximum ruggedness (2.0)', () => {
        const config = TopographyConfig.create(2.0, 1.0);
        expect(config.getNoiseOctaves()).toBe(6);
      });

      it('should return integer values for intermediate ruggedness', () => {
        const config = TopographyConfig.create(1.5, 1.0);
        const octaves = config.getNoiseOctaves();
        expect(Number.isInteger(octaves)).toBe(true);
        expect(octaves).toBeGreaterThanOrEqual(TopographyConstants.MIN_OCTAVES);
        expect(octaves).toBeLessThanOrEqual(TopographyConstants.MAX_OCTAVES);
      });
    });

    describe('getNoisePersistence', () => {
      it('should return 0.4 persistence for minimum ruggedness (0.5)', () => {
        const config = TopographyConfig.create(0.5, 1.0);
        expect(config.getNoisePersistence()).toBeCloseTo(0.4, 2);
      });

      it('should return 0.6 persistence for default ruggedness (1.0)', () => {
        const config = TopographyConfig.create(1.0, 1.0);
        expect(config.getNoisePersistence()).toBeCloseTo(0.6, 2);
      });

      it('should return 0.8 persistence for maximum ruggedness (2.0)', () => {
        const config = TopographyConfig.create(2.0, 1.0);
        expect(config.getNoisePersistence()).toBeCloseTo(0.8, 2);
      });

      it('should return values between min and max for intermediate ruggedness', () => {
        const config = TopographyConfig.create(1.5, 1.0);
        const persistence = config.getNoisePersistence();
        expect(persistence).toBeGreaterThanOrEqual(TopographyConstants.MIN_PERSISTENCE);
        expect(persistence).toBeLessThanOrEqual(TopographyConstants.MAX_PERSISTENCE);
      });
    });

    describe('getNoiseScale', () => {
      it('should return fixed noise scale', () => {
        const config1 = TopographyConfig.create(0.5, 1.0);
        const config2 = TopographyConfig.create(2.0, 1.0);
        expect(config1.getNoiseScale()).toBe(TopographyConstants.NOISE_SCALE);
        expect(config2.getNoiseScale()).toBe(TopographyConstants.NOISE_SCALE);
      });
    });

    describe('getReliefMultiplier', () => {
      it('should return 0.2 relief for minimum variance (0.5)', () => {
        const config = TopographyConfig.create(1.0, 0.5);
        expect(config.getReliefMultiplier()).toBeCloseTo(0.2, 2);
      });

      it('should return 0.4 relief for default variance (1.0)', () => {
        const config = TopographyConfig.create(1.0, 1.0);
        expect(config.getReliefMultiplier()).toBeCloseTo(0.4, 2);
      });

      it('should return 0.8 relief for maximum variance (2.0)', () => {
        const config = TopographyConfig.create(1.0, 2.0);
        expect(config.getReliefMultiplier()).toBeCloseTo(0.8, 2);
      });

      it('should return values between min and max for intermediate variance', () => {
        const config = TopographyConfig.create(1.0, 1.5);
        const relief = config.getReliefMultiplier();
        expect(relief).toBeGreaterThanOrEqual(TopographyConstants.MIN_RELIEF);
        expect(relief).toBeLessThanOrEqual(TopographyConstants.MAX_RELIEF);
      });
    });

    describe('getZoneMultiplierAdjustment', () => {
      it('should return variance value as zone multiplier adjustment', () => {
        const config1 = TopographyConfig.create(1.0, 0.5);
        expect(config1.getZoneMultiplierAdjustment()).toBe(0.5);

        const config2 = TopographyConfig.create(1.0, 1.5);
        expect(config2.getZoneMultiplierAdjustment()).toBe(1.5);

        const config3 = TopographyConfig.create(1.0, 2.0);
        expect(config3.getZoneMultiplierAdjustment()).toBe(2.0);
      });
    });

    it('should scale terrain detail with ruggedness multiplier', () => {
      const smooth = TopographyConfig.create(0.5, 1.0);
      const normal = TopographyConfig.create(1.0, 1.0);
      const rough = TopographyConfig.create(2.0, 1.0);

      expect(smooth.getNoiseOctaves()).toBeLessThan(normal.getNoiseOctaves());
      expect(rough.getNoiseOctaves()).toBeGreaterThan(normal.getNoiseOctaves());

      expect(smooth.getNoisePersistence()).toBeLessThan(normal.getNoisePersistence());
      expect(rough.getNoisePersistence()).toBeGreaterThan(normal.getNoisePersistence());
    });

    it('should scale elevation range with variance multiplier', () => {
      const flat = TopographyConfig.create(1.0, 0.5);
      const normal = TopographyConfig.create(1.0, 1.0);
      const mountainous = TopographyConfig.create(1.0, 2.0);

      expect(flat.getReliefMultiplier()).toBeLessThan(normal.getReliefMultiplier());
      expect(mountainous.getReliefMultiplier()).toBeGreaterThan(normal.getReliefMultiplier());

      expect(flat.getZoneMultiplierAdjustment()).toBeLessThan(normal.getZoneMultiplierAdjustment());
      expect(mountainous.getZoneMultiplierAdjustment()).toBeGreaterThan(normal.getZoneMultiplierAdjustment());
    });
  });

  describe('immutability', () => {
    it('should be immutable', () => {
      const config = TopographyConfig.create(1.0, 1.0);
      expect(() => {
        (config as any).terrainRuggedness = 2.0;
      }).toThrow();
    });

    it('should not allow modification of elevationVariance', () => {
      const config = TopographyConfig.create(1.0, 1.0);
      expect(() => {
        (config as any).elevationVariance = 2.0;
      }).toThrow();
    });
  });

  describe('equals', () => {
    it('should return true for identical configs', () => {
      const config1 = TopographyConfig.create(1.5, 1.8);
      const config2 = TopographyConfig.create(1.5, 1.8);
      expect(config1.equals(config2)).toBe(true);
    });

    it('should return false for different ruggedness', () => {
      const config1 = TopographyConfig.create(1.0, 1.5);
      const config2 = TopographyConfig.create(1.5, 1.5);
      expect(config1.equals(config2)).toBe(false);
    });

    it('should return false for different variance', () => {
      const config1 = TopographyConfig.create(1.5, 1.0);
      const config2 = TopographyConfig.create(1.5, 1.5);
      expect(config1.equals(config2)).toBe(false);
    });

    it('should return false for both different', () => {
      const config1 = TopographyConfig.create(1.0, 1.0);
      const config2 = TopographyConfig.create(2.0, 2.0);
      expect(config1.equals(config2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should provide readable string representation', () => {
      const config = TopographyConfig.create(1.5, 1.8);
      const str = config.toString();
      expect(str).toContain('TopographyConfig');
      expect(str).toContain('ruggedness=1.5');
      expect(str).toContain('variance=1.8');
      expect(str).toContain('octaves=');
      expect(str).toContain('persistence=');
      expect(str).toContain('relief=');
    });

    it('should include calculated values', () => {
      const config = TopographyConfig.create(2.0, 2.0);
      const str = config.toString();
      expect(str).toContain('octaves=6');
      expect(str).toContain('persistence=0.80');
      expect(str).toContain('relief=0.80');
    });
  });
});
