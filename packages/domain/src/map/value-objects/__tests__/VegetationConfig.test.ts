import { describe, it, expect } from 'vitest';
import { VegetationConfig, ForestryConstants } from '../VegetationConfig';
import { ValidationError } from '../../../common/errors';

describe('VegetationConfig', () => {
  describe('create', () => {
    it('should create config with valid density multiplier', () => {
      const config = VegetationConfig.create(1.0);
      expect(config.densityMultiplier).toBe(1.0);
    });

    it('should create config with minimum density', () => {
      const config = VegetationConfig.create(0.0);
      expect(config.densityMultiplier).toBe(0.0);
    });

    it('should create config with maximum density', () => {
      const config = VegetationConfig.create(2.0);
      expect(config.densityMultiplier).toBe(2.0);
    });

    it('should throw ValidationError for density below minimum', () => {
      expect(() => VegetationConfig.create(-0.1)).toThrow(ValidationError);

      try {
        VegetationConfig.create(-0.5);
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        const validationError = error as ValidationError;
        expect(validationError.code).toBe('VEGETATION_CONFIG_INVALID_DENSITY_MIN');
        expect(validationError.details.context?.component).toBe('VegetationConfig');
        expect(validationError.details.context?.metadata).toHaveProperty('providedValue', -0.5);
        expect(validationError.details.suggestions).toHaveLength(2);
      }
    });

    it('should throw ValidationError for density above maximum', () => {
      expect(() => VegetationConfig.create(2.1)).toThrow(ValidationError);

      try {
        VegetationConfig.create(3.0);
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        const validationError = error as ValidationError;
        expect(validationError.code).toBe('VEGETATION_CONFIG_INVALID_DENSITY_MAX');
        expect(validationError.details.context?.component).toBe('VegetationConfig');
        expect(validationError.details.context?.metadata).toHaveProperty('providedValue', 3.0);
        expect(validationError.details.suggestions).toHaveLength(2);
      }
    });

    it('should throw ValidationError for negative basal area', () => {
      expect(() =>
        VegetationConfig.create(1.0, { targetBasalArea: -10 })
      ).toThrow(ValidationError);

      try {
        VegetationConfig.create(1.0, { targetBasalArea: -50 });
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        const validationError = error as ValidationError;
        expect(validationError.code).toBe('VEGETATION_CONFIG_INVALID_BASAL_AREA');
      }
    });

    it('should throw ValidationError for invalid tree diameter', () => {
      expect(() =>
        VegetationConfig.create(1.0, { avgTreeDiameter: 0 })
      ).toThrow(ValidationError);

      try {
        VegetationConfig.create(1.0, { avgTreeDiameter: -1 });
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        const validationError = error as ValidationError;
        expect(validationError.code).toBe('VEGETATION_CONFIG_INVALID_TREE_DIAMETER');
      }
    });

    it('should throw ValidationError for invalid survey radius', () => {
      expect(() =>
        VegetationConfig.create(1.0, { forestSurveyRadius: 0 })
      ).toThrow(ValidationError);

      try {
        VegetationConfig.create(1.0, { forestSurveyRadius: 0.5 });
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        const validationError = error as ValidationError;
        expect(validationError.code).toBe('VEGETATION_CONFIG_INVALID_SURVEY_RADIUS');
      }
    });
  });

  describe('default', () => {
    it('should create config with default density', () => {
      const config = VegetationConfig.default();
      expect(config.densityMultiplier).toBe(ForestryConstants.DEFAULT_DENSITY);
    });
  });

  describe('calculations', () => {
    it('should calculate target basal area correctly', () => {
      const config = VegetationConfig.create(1.0);
      const basalArea = config.getTargetBasalArea();
      expect(basalArea).toBeGreaterThan(0);
      expect(basalArea).toBeLessThanOrEqual(ForestryConstants.BASAL_AREA_MAXIMUM);
    });

    it('should calculate tree probability correctly', () => {
      const config = VegetationConfig.create(1.0);
      const probability = config.getTreeProbability();
      expect(probability).toBeGreaterThan(0);
      expect(probability).toBeLessThan(1);
    });

    it('should calculate forest coverage correctly', () => {
      const config = VegetationConfig.create(1.0);
      const coverage = config.getForestCoverage();
      expect(coverage).toBeGreaterThanOrEqual(0);
      expect(coverage).toBeLessThanOrEqual(1);
    });

    it('should scale values with density multiplier', () => {
      const sparse = VegetationConfig.create(0.5);
      const normal = VegetationConfig.create(1.0);
      const dense = VegetationConfig.create(2.0);

      expect(sparse.getTargetBasalArea()).toBeLessThan(normal.getTargetBasalArea());
      expect(dense.getTargetBasalArea()).toBeGreaterThan(normal.getTargetBasalArea());

      expect(sparse.getForestCoverage()).toBeLessThan(normal.getForestCoverage());
      expect(dense.getForestCoverage()).toBeGreaterThan(normal.getForestCoverage());
    });
  });

  describe('classifyDensity', () => {
    it('should classify none correctly', () => {
      expect(VegetationConfig.classifyDensity(0)).toBe('none');
      expect(VegetationConfig.classifyDensity(30)).toBe('none');
    });

    it('should classify sparse correctly', () => {
      expect(VegetationConfig.classifyDensity(50)).toBe('sparse');
      expect(VegetationConfig.classifyDensity(75)).toBe('sparse');
    });

    it('should classify moderate correctly', () => {
      expect(VegetationConfig.classifyDensity(100)).toBe('moderate');
      expect(VegetationConfig.classifyDensity(125)).toBe('moderate');
    });

    it('should classify dense correctly', () => {
      expect(VegetationConfig.classifyDensity(150)).toBe('dense');
      expect(VegetationConfig.classifyDensity(200)).toBe('dense');
    });
  });

  describe('immutability', () => {
    it('should be immutable', () => {
      const config = VegetationConfig.create(1.0);
      expect(() => {
        (config as any).densityMultiplier = 2.0;
      }).toThrow();
    });
  });

  describe('equals', () => {
    it('should return true for identical configs', () => {
      const config1 = VegetationConfig.create(1.0);
      const config2 = VegetationConfig.create(1.0);
      expect(config1.equals(config2)).toBe(true);
    });

    it('should return false for different configs', () => {
      const config1 = VegetationConfig.create(1.0);
      const config2 = VegetationConfig.create(1.5);
      expect(config1.equals(config2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should provide readable string representation', () => {
      const config = VegetationConfig.create(1.0);
      const str = config.toString();
      expect(str).toContain('VegetationConfig');
      expect(str).toContain('density=1');
      expect(str).toContain('basalArea');
      expect(str).toContain('treeProbability');
    });
  });
});
