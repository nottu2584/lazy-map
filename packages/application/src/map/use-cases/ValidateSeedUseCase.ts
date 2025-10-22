import { SeedService, Seed } from '@lazy-map/domain';

export interface ValidateSeedResult {
  valid: boolean;
  normalizedSeed?: number;
  error?: string;
  warnings?: string[];
  metadata: {
    originalValue: string | number;
    inputType: 'string' | 'number';
    wasNormalized: boolean;
    algorithmVersion: string;
    timestamp: string;
  };
}

/**
 * Use case for validating and normalizing seed values for map generation
 * Following Clean Architecture principles - this is an application layer use case
 */
export class ValidateSeedUseCase {
  private readonly seedService: SeedService;

  constructor() {
    this.seedService = new SeedService();
  }

  execute(seedInput: string | number): ValidateSeedResult {
    const validation = this.seedService.validateSeedInput(seedInput);
    const inputType = typeof seedInput === 'string' ? 'string' : 'number';

    return {
      valid: validation.isValid,
      normalizedSeed: validation.seed?.getValue(),
      error: validation.errors?.[0],
      warnings: validation.warnings,
      metadata: {
        originalValue: seedInput,
        inputType: inputType,
        wasNormalized: validation.seed !== undefined &&
                      ((typeof seedInput === 'number' && validation.seed.getValue() !== seedInput) ||
                       (typeof seedInput === 'string')),
        algorithmVersion: '1.0.0',
        timestamp: new Date().toISOString()
      }
    };
  }
}

export class ValidateSeedCommand {
  constructor(public readonly seed: string | number) {}
}