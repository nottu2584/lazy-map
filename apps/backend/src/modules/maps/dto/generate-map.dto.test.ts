import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { GenerateMapDto } from './generate-map.dto';

describe('GenerateMapDto Validation', () => {
  describe('terrainRuggedness parameter', () => {
    it('should accept valid terrainRuggedness value (1.0)', async () => {
      const dto = plainToClass(GenerateMapDto, {
        terrainRuggedness: 1.0,
      });

      const errors = await validate(dto);
      const ruggedErrors = errors.filter((e) => e.property === 'terrainRuggedness');
      expect(ruggedErrors).toHaveLength(0);
    });

    it('should accept minimum valid terrainRuggedness value (0.5)', async () => {
      const dto = plainToClass(GenerateMapDto, {
        terrainRuggedness: 0.5,
      });

      const errors = await validate(dto);
      const ruggedErrors = errors.filter((e) => e.property === 'terrainRuggedness');
      expect(ruggedErrors).toHaveLength(0);
    });

    it('should accept maximum valid terrainRuggedness value (2.0)', async () => {
      const dto = plainToClass(GenerateMapDto, {
        terrainRuggedness: 2.0,
      });

      const errors = await validate(dto);
      const ruggedErrors = errors.filter((e) => e.property === 'terrainRuggedness');
      expect(ruggedErrors).toHaveLength(0);
    });

    it('should accept valid intermediate terrainRuggedness values', async () => {
      const validValues = [0.7, 1.0, 1.25, 1.5, 1.8];

      for (const value of validValues) {
        const dto = plainToClass(GenerateMapDto, {
          terrainRuggedness: value,
        });

        const errors = await validate(dto);
        const ruggedErrors = errors.filter((e) => e.property === 'terrainRuggedness');
        expect(ruggedErrors).toHaveLength(0);
      }
    });

    it('should reject terrainRuggedness below minimum (0.4)', async () => {
      const dto = plainToClass(GenerateMapDto, {
        terrainRuggedness: 0.4,
      });

      const errors = await validate(dto);
      const ruggedErrors = errors.filter((e) => e.property === 'terrainRuggedness');
      expect(ruggedErrors.length).toBeGreaterThan(0);
      expect(ruggedErrors[0].constraints?.min).toBeDefined();
    });

    it('should reject terrainRuggedness above maximum (2.1)', async () => {
      const dto = plainToClass(GenerateMapDto, {
        terrainRuggedness: 2.1,
      });

      const errors = await validate(dto);
      const ruggedErrors = errors.filter((e) => e.property === 'terrainRuggedness');
      expect(ruggedErrors.length).toBeGreaterThan(0);
      expect(ruggedErrors[0].constraints?.max).toBeDefined();
    });

    it('should reject non-numeric terrainRuggedness', async () => {
      const dto = plainToClass(GenerateMapDto, {
        terrainRuggedness: 'not-a-number',
      });

      const errors = await validate(dto);
      const ruggedErrors = errors.filter((e) => e.property === 'terrainRuggedness');
      expect(ruggedErrors.length).toBeGreaterThan(0);
    });

    it('should allow undefined terrainRuggedness (optional)', async () => {
      const dto = plainToClass(GenerateMapDto, {
        // terrainRuggedness not provided
      });

      const errors = await validate(dto);
      const ruggedErrors = errors.filter((e) => e.property === 'terrainRuggedness');
      expect(ruggedErrors).toHaveLength(0);
    });
  });

  describe('waterAbundance parameter', () => {
    it('should accept valid waterAbundance value (1.0)', async () => {
      const dto = plainToClass(GenerateMapDto, {
        waterAbundance: 1.0,
      });

      const errors = await validate(dto);
      const waterErrors = errors.filter((e) => e.property === 'waterAbundance');
      expect(waterErrors).toHaveLength(0);
    });

    it('should accept minimum valid waterAbundance value (0.5)', async () => {
      const dto = plainToClass(GenerateMapDto, {
        waterAbundance: 0.5,
      });

      const errors = await validate(dto);
      const waterErrors = errors.filter((e) => e.property === 'waterAbundance');
      expect(waterErrors).toHaveLength(0);
    });

    it('should accept maximum valid waterAbundance value (2.0)', async () => {
      const dto = plainToClass(GenerateMapDto, {
        waterAbundance: 2.0,
      });

      const errors = await validate(dto);
      const waterErrors = errors.filter((e) => e.property === 'waterAbundance');
      expect(waterErrors).toHaveLength(0);
    });

    it('should accept valid intermediate waterAbundance values', async () => {
      const validValues = [0.6, 0.8, 1.0, 1.3, 1.7];

      for (const value of validValues) {
        const dto = plainToClass(GenerateMapDto, {
          waterAbundance: value,
        });

        const errors = await validate(dto);
        const waterErrors = errors.filter((e) => e.property === 'waterAbundance');
        expect(waterErrors).toHaveLength(0);
      }
    });

    it('should reject waterAbundance below minimum (0.4)', async () => {
      const dto = plainToClass(GenerateMapDto, {
        waterAbundance: 0.4,
      });

      const errors = await validate(dto);
      const waterErrors = errors.filter((e) => e.property === 'waterAbundance');
      expect(waterErrors.length).toBeGreaterThan(0);
      expect(waterErrors[0].constraints?.min).toBeDefined();
    });

    it('should reject waterAbundance above maximum (2.1)', async () => {
      const dto = plainToClass(GenerateMapDto, {
        waterAbundance: 2.1,
      });

      const errors = await validate(dto);
      const waterErrors = errors.filter((e) => e.property === 'waterAbundance');
      expect(waterErrors.length).toBeGreaterThan(0);
      expect(waterErrors[0].constraints?.max).toBeDefined();
    });

    it('should reject non-numeric waterAbundance', async () => {
      const dto = plainToClass(GenerateMapDto, {
        waterAbundance: 'invalid',
      });

      const errors = await validate(dto);
      const waterErrors = errors.filter((e) => e.property === 'waterAbundance');
      expect(waterErrors.length).toBeGreaterThan(0);
    });

    it('should allow undefined waterAbundance (optional)', async () => {
      const dto = plainToClass(GenerateMapDto, {
        // waterAbundance not provided
      });

      const errors = await validate(dto);
      const waterErrors = errors.filter((e) => e.property === 'waterAbundance');
      expect(waterErrors).toHaveLength(0);
    });
  });

  describe('Combined parameter validation', () => {
    it('should accept all valid parameters together', async () => {
      const dto = plainToClass(GenerateMapDto, {
        width: 50,
        height: 50,
        seed: 'test-seed',
        terrainRuggedness: 1.5,
        waterAbundance: 1.3,
        vegetationMultiplier: 1.2,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should accept only terrainRuggedness with other params omitted', async () => {
      const dto = plainToClass(GenerateMapDto, {
        terrainRuggedness: 1.8,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should accept only waterAbundance with other params omitted', async () => {
      const dto = plainToClass(GenerateMapDto, {
        waterAbundance: 0.7,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should accept both new params without vegetation', async () => {
      const dto = plainToClass(GenerateMapDto, {
        terrainRuggedness: 1.2,
        waterAbundance: 1.4,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should reject if multiple params are invalid', async () => {
      const dto = plainToClass(GenerateMapDto, {
        terrainRuggedness: 3.0, // Too high
        waterAbundance: 0.2, // Too low
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThanOrEqual(2);

      const ruggedErrors = errors.filter((e) => e.property === 'terrainRuggedness');
      const waterErrors = errors.filter((e) => e.property === 'waterAbundance');

      expect(ruggedErrors.length).toBeGreaterThan(0);
      expect(waterErrors.length).toBeGreaterThan(0);
    });
  });

  describe('Edge cases', () => {
    it('should handle terrainRuggedness at exact boundaries', async () => {
      const minDto = plainToClass(GenerateMapDto, {
        terrainRuggedness: 0.5,
      });
      const maxDto = plainToClass(GenerateMapDto, {
        terrainRuggedness: 2.0,
      });

      const minErrors = await validate(minDto);
      const maxErrors = await validate(maxDto);

      expect(minErrors.filter((e) => e.property === 'terrainRuggedness')).toHaveLength(0);
      expect(maxErrors.filter((e) => e.property === 'terrainRuggedness')).toHaveLength(0);
    });

    it('should handle waterAbundance at exact boundaries', async () => {
      const minDto = plainToClass(GenerateMapDto, {
        waterAbundance: 0.5,
      });
      const maxDto = plainToClass(GenerateMapDto, {
        waterAbundance: 2.0,
      });

      const minErrors = await validate(minDto);
      const maxErrors = await validate(maxDto);

      expect(minErrors.filter((e) => e.property === 'waterAbundance')).toHaveLength(0);
      expect(maxErrors.filter((e) => e.property === 'waterAbundance')).toHaveLength(0);
    });

    it('should handle terrainRuggedness just outside boundaries', async () => {
      const tooLow = plainToClass(GenerateMapDto, {
        terrainRuggedness: 0.49,
      });
      const tooHigh = plainToClass(GenerateMapDto, {
        terrainRuggedness: 2.01,
      });

      const lowErrors = await validate(tooLow);
      const highErrors = await validate(tooHigh);

      expect(lowErrors.filter((e) => e.property === 'terrainRuggedness').length).toBeGreaterThan(0);
      expect(highErrors.filter((e) => e.property === 'terrainRuggedness').length).toBeGreaterThan(
        0,
      );
    });

    it('should handle waterAbundance just outside boundaries', async () => {
      const tooLow = plainToClass(GenerateMapDto, {
        waterAbundance: 0.49,
      });
      const tooHigh = plainToClass(GenerateMapDto, {
        waterAbundance: 2.01,
      });

      const lowErrors = await validate(tooLow);
      const highErrors = await validate(tooHigh);

      expect(lowErrors.filter((e) => e.property === 'waterAbundance').length).toBeGreaterThan(0);
      expect(highErrors.filter((e) => e.property === 'waterAbundance').length).toBeGreaterThan(0);
    });

    it('should handle null values as optional', async () => {
      const dto = plainToClass(GenerateMapDto, {
        terrainRuggedness: null,
        waterAbundance: null,
      });

      const errors = await validate(dto);
      // Null is treated as optional/undefined by class-validator
      const ruggedErrors = errors.filter((e) => e.property === 'terrainRuggedness');
      const waterErrors = errors.filter((e) => e.property === 'waterAbundance');

      // Should not produce errors (null treated as optional)
      expect(ruggedErrors).toHaveLength(0);
      expect(waterErrors).toHaveLength(0);
    });

    it('should handle zero values (invalid for both params)', async () => {
      const dto = plainToClass(GenerateMapDto, {
        terrainRuggedness: 0,
        waterAbundance: 0,
      });

      const errors = await validate(dto);
      const ruggedErrors = errors.filter((e) => e.property === 'terrainRuggedness');
      const waterErrors = errors.filter((e) => e.property === 'waterAbundance');

      // Both should be invalid (below minimum)
      expect(ruggedErrors.length).toBeGreaterThan(0);
      expect(waterErrors.length).toBeGreaterThan(0);
    });
  });

  describe('Backwards compatibility', () => {
    it('should accept DTO without new parameters (legacy behavior)', async () => {
      const dto = plainToClass(GenerateMapDto, {
        width: 50,
        height: 50,
        seed: 'test',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should accept DTO with only vegetationMultiplier (existing param)', async () => {
      const dto = plainToClass(GenerateMapDto, {
        vegetationMultiplier: 1.5,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should work with dimensions DTO', async () => {
      const dto = plainToClass(GenerateMapDto, {
        dimensions: {
          width: 50,
          height: 50,
        },
        terrainRuggedness: 1.3,
        waterAbundance: 1.7,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });
});
