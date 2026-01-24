import { describe, it, expect } from 'vitest';
import { HydrologyConfig, HydrologyConstants } from '../HydrologyConfig';
import { ValidationError } from '../../../common/errors';

describe('HydrologyConfig', () => {
  describe('create', () => {
    it('should create config with valid water abundance', () => {
      const config = HydrologyConfig.create(1.0);
      expect(config.waterAbundance).toBe(1.0);
    });

    it('should create config with default values', () => {
      const config = HydrologyConfig.create();
      expect(config.waterAbundance).toBe(HydrologyConstants.DEFAULT_ABUNDANCE);
    });

    it('should create config with minimum abundance', () => {
      const config = HydrologyConfig.create(0.5);
      expect(config.waterAbundance).toBe(0.5);
    });

    it('should create config with maximum abundance', () => {
      const config = HydrologyConfig.create(2.0);
      expect(config.waterAbundance).toBe(2.0);
    });

    it('should throw ValidationError for abundance below minimum', () => {
      expect(() => HydrologyConfig.create(0.3)).toThrow(ValidationError);

      try {
        HydrologyConfig.create(0.2);
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        const validationError = error as ValidationError;
        expect(validationError.code).toBe('HYDROLOGY_CONFIG_INVALID_ABUNDANCE_MIN');
        expect(validationError.details.context?.component).toBe('HydrologyConfig');
        expect(validationError.details.context?.metadata).toHaveProperty('providedValue', 0.2);
        expect(validationError.details.suggestions).toHaveLength(2);
      }
    });

    it('should throw ValidationError for abundance above maximum', () => {
      expect(() => HydrologyConfig.create(2.5)).toThrow(ValidationError);

      try {
        HydrologyConfig.create(3.0);
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        const validationError = error as ValidationError;
        expect(validationError.code).toBe('HYDROLOGY_CONFIG_INVALID_ABUNDANCE_MAX');
        expect(validationError.details.context?.component).toBe('HydrologyConfig');
        expect(validationError.details.context?.metadata).toHaveProperty('providedValue', 3.0);
        expect(validationError.details.suggestions).toHaveLength(2);
      }
    });
  });

  describe('default', () => {
    it('should create config with default abundance', () => {
      const config = HydrologyConfig.default();
      expect(config.waterAbundance).toBe(HydrologyConstants.DEFAULT_ABUNDANCE);
    });
  });

  describe('calculations', () => {
    describe('getStreamThresholdMultiplier', () => {
      it('should return 1.5× multiplier for minimum abundance (0.5)', () => {
        const config = HydrologyConfig.create(0.5);
        expect(config.getStreamThresholdMultiplier()).toBeCloseTo(1.5, 2);
      });

      it('should return 1.0× multiplier for default abundance (1.0)', () => {
        const config = HydrologyConfig.create(1.0);
        expect(config.getStreamThresholdMultiplier()).toBeCloseTo(1.0, 2);
      });

      it('should return 0.5× multiplier for maximum abundance (2.0) - clamped', () => {
        const config = HydrologyConfig.create(2.0);
        expect(config.getStreamThresholdMultiplier()).toBeCloseTo(0.5, 2);
      });

      it('should use inverse relationship (lower abundance = higher threshold)', () => {
        const dry = HydrologyConfig.create(0.5);
        const normal = HydrologyConfig.create(1.0);
        const wet = HydrologyConfig.create(2.0);

        expect(dry.getStreamThresholdMultiplier()).toBeGreaterThan(normal.getStreamThresholdMultiplier());
        expect(normal.getStreamThresholdMultiplier()).toBeGreaterThan(wet.getStreamThresholdMultiplier());
      });

      it('should clamp at minimum 0.5× to prevent too many streams', () => {
        const config = HydrologyConfig.create(2.0);
        expect(config.getStreamThresholdMultiplier()).toBeGreaterThanOrEqual(0.5);
      });
    });

    describe('getSpringThreshold', () => {
      it('should return 0.95 threshold for minimum abundance (0.5) - few springs', () => {
        const config = HydrologyConfig.create(0.5);
        expect(config.getSpringThreshold()).toBeCloseTo(0.95, 2);
      });

      it('should return 0.80 threshold for default abundance (1.0)', () => {
        const config = HydrologyConfig.create(1.0);
        expect(config.getSpringThreshold()).toBeCloseTo(0.80, 2);
      });

      it('should return 0.65 threshold for maximum abundance (2.0) - many springs', () => {
        const config = HydrologyConfig.create(2.0);
        expect(config.getSpringThreshold()).toBeCloseTo(0.65, 2);
      });

      it('should decrease threshold with increasing abundance (more springs)', () => {
        const dry = HydrologyConfig.create(0.5);
        const normal = HydrologyConfig.create(1.0);
        const wet = HydrologyConfig.create(2.0);

        expect(dry.getSpringThreshold()).toBeGreaterThan(normal.getSpringThreshold());
        expect(normal.getSpringThreshold()).toBeGreaterThan(wet.getSpringThreshold());
      });

      it('should interpolate smoothly for intermediate values', () => {
        const config = HydrologyConfig.create(1.5);
        const threshold = config.getSpringThreshold();
        expect(threshold).toBeGreaterThan(0.65);
        expect(threshold).toBeLessThan(0.80);
      });
    });

    describe('getPoolThreshold', () => {
      it('should return 0.85 threshold for minimum abundance (0.5) - few pools', () => {
        const config = HydrologyConfig.create(0.5);
        expect(config.getPoolThreshold()).toBeCloseTo(0.85, 2);
      });

      it('should return 0.70 threshold for default abundance (1.0)', () => {
        const config = HydrologyConfig.create(1.0);
        expect(config.getPoolThreshold()).toBeCloseTo(0.70, 2);
      });

      it('should return 0.55 threshold for maximum abundance (2.0) - many pools', () => {
        const config = HydrologyConfig.create(2.0);
        expect(config.getPoolThreshold()).toBeCloseTo(0.55, 2);
      });

      it('should decrease threshold with increasing abundance (more pools)', () => {
        const dry = HydrologyConfig.create(0.5);
        const normal = HydrologyConfig.create(1.0);
        const wet = HydrologyConfig.create(2.0);

        expect(dry.getPoolThreshold()).toBeGreaterThan(normal.getPoolThreshold());
        expect(normal.getPoolThreshold()).toBeGreaterThan(wet.getPoolThreshold());
      });

      it('should interpolate smoothly for intermediate values', () => {
        const config = HydrologyConfig.create(1.5);
        const threshold = config.getPoolThreshold();
        expect(threshold).toBeGreaterThan(0.55);
        expect(threshold).toBeLessThan(0.70);
      });
    });

    describe('getSlopeSpringBonus', () => {
      it('should return 0.15 bonus for minimum abundance (0.5)', () => {
        const config = HydrologyConfig.create(0.5);
        expect(config.getSlopeSpringBonus()).toBeCloseTo(0.15, 2);
      });

      it('should return 0.30 bonus for default abundance (1.0)', () => {
        const config = HydrologyConfig.create(1.0);
        expect(config.getSlopeSpringBonus()).toBeCloseTo(0.30, 2);
      });

      it('should return 0.60 bonus for maximum abundance (2.0)', () => {
        const config = HydrologyConfig.create(2.0);
        expect(config.getSlopeSpringBonus()).toBeCloseTo(0.60, 2);
      });

      it('should scale linearly with abundance', () => {
        const dry = HydrologyConfig.create(0.5);
        const normal = HydrologyConfig.create(1.0);
        const wet = HydrologyConfig.create(2.0);

        expect(dry.getSlopeSpringBonus()).toBeLessThan(normal.getSlopeSpringBonus());
        expect(normal.getSlopeSpringBonus()).toBeLessThan(wet.getSlopeSpringBonus());
      });
    });

    it('should scale all water features with abundance multiplier', () => {
      const dry = HydrologyConfig.create(0.5);
      const normal = HydrologyConfig.create(1.0);
      const wet = HydrologyConfig.create(2.0);

      // Stream thresholds (inverse relationship)
      expect(dry.getStreamThresholdMultiplier()).toBeGreaterThan(normal.getStreamThresholdMultiplier());
      expect(normal.getStreamThresholdMultiplier()).toBeGreaterThan(wet.getStreamThresholdMultiplier());

      // Spring thresholds (lower = more springs)
      expect(dry.getSpringThreshold()).toBeGreaterThan(normal.getSpringThreshold());
      expect(normal.getSpringThreshold()).toBeGreaterThan(wet.getSpringThreshold());

      // Pool thresholds (lower = more pools)
      expect(dry.getPoolThreshold()).toBeGreaterThan(normal.getPoolThreshold());
      expect(normal.getPoolThreshold()).toBeGreaterThan(wet.getPoolThreshold());

      // Slope bonus (direct relationship)
      expect(dry.getSlopeSpringBonus()).toBeLessThan(normal.getSlopeSpringBonus());
      expect(normal.getSlopeSpringBonus()).toBeLessThan(wet.getSlopeSpringBonus());
    });
  });

  describe('immutability', () => {
    it('should be immutable', () => {
      const config = HydrologyConfig.create(1.0);
      expect(() => {
        (config as any).waterAbundance = 2.0;
      }).toThrow();
    });
  });

  describe('equals', () => {
    it('should return true for identical configs', () => {
      const config1 = HydrologyConfig.create(1.5);
      const config2 = HydrologyConfig.create(1.5);
      expect(config1.equals(config2)).toBe(true);
    });

    it('should return false for different configs', () => {
      const config1 = HydrologyConfig.create(1.0);
      const config2 = HydrologyConfig.create(1.5);
      expect(config1.equals(config2)).toBe(false);
    });

    it('should return false for different abundance values', () => {
      const config1 = HydrologyConfig.create(0.5);
      const config2 = HydrologyConfig.create(2.0);
      expect(config1.equals(config2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should provide readable string representation', () => {
      const config = HydrologyConfig.create(1.5);
      const str = config.toString();
      expect(str).toContain('HydrologyConfig');
      expect(str).toContain('abundance=1.5');
      expect(str).toContain('streamThresholdMult=');
      expect(str).toContain('springThreshold=');
      expect(str).toContain('poolThreshold=');
    });

    it('should include calculated values', () => {
      const config = HydrologyConfig.create(2.0);
      const str = config.toString();
      expect(str).toContain('streamThresholdMult=0.50');
      expect(str).toContain('springThreshold=0.65');
      expect(str).toContain('poolThreshold=0.55');
    });
  });
});
