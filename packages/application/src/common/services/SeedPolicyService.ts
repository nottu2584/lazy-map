import { SeedService, ILogger } from '@lazy-map/domain';

/**
 * Service to enforce seed generation policies across the application
 * This prevents accidental use of random seeds that break reproducibility
 */
export class SeedPolicyService {
  private static instance: SeedPolicyService;
  private readonly seedService = new SeedService();

  private constructor(private readonly logger?: ILogger) {}

  public static getInstance(logger?: ILogger): SeedPolicyService {
    if (!SeedPolicyService.instance) {
      SeedPolicyService.instance = new SeedPolicyService(logger);
    }
    return SeedPolicyService.instance;
  }

  /**
   * Generate a seed that MUST be deterministic based on parameters
   * This is the ONLY acceptable way to generate seeds when no explicit seed is provided
   */
  generateSeed(parameters: Record<string, any>): number {
    const seedInput = this.createParameterHash(parameters);
    const seed = this.seedService.generateSeed(seedInput);
    
    // Log for debugging/audit trail
    this.logSeedGeneration(seedInput, seed.getValue());
    
    return seed.getValue();
  }

  /**
   * Validate and normalize a user-provided seed
   */
  validateSeed(seed: string | number) {
    return this.seedService.validateSeedInput(seed);
  }

  /**
   * Get a deterministic seed with fallback to parameter-based generation
   * This should be used everywhere instead of Math.random()
   */
  ensureSeed(
    userSeed: string | number | undefined, 
    fallbackParameters: Record<string, any>
  ): number {
    // First try to use user-provided seed
    if (userSeed !== undefined && userSeed !== null) {
      const validation = this.validateSeed(userSeed);
      if (validation.isValid && validation.seed) {
        return validation.seed.getValue();
      }
    }

    // Fallback to deterministic parameter-based seed
    return this.generateSeed(fallbackParameters);
  }

  /**
   * FORBIDDEN: This method will throw an error if called
   * Use this to prevent accidental random seed generation
   */
  static preventRandomSeedGeneration(): never {
    throw new Error(
      'FORBIDDEN: Random seed generation is not allowed! ' +
      'Use SeedPolicyService.ensureSeed() instead. ' +
      'Random seeds break reproducibility and deterministic map generation.'
    );
  }

  private createParameterHash(parameters: Record<string, any>): string {
    // Create a deterministic string from parameters
    const sortedKeys = Object.keys(parameters).sort();
    const paramString = sortedKeys
      .map(key => `${key}:${this.serializeValue(parameters[key])}`)
      .join('|');
    
    return `deterministic:${paramString}`;
  }

  private serializeValue(value: any): string {
    if (value === null || value === undefined) {
      return 'null';
    }
    
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    
    return String(value);
  }

  private logSeedGeneration(input: string, seed: number): void {
    // In development, log seed generation for debugging
    if (process.env.NODE_ENV === 'development') {
      if (this.logger) {
        this.logger.debug('Deterministic seed generated', {
          component: 'SeedPolicyService',
          operation: 'logSeedGeneration',
          metadata: {
            generatedSeed: seed,
            inputPreview: input.substring(0, 100) + '...'
          }
        });
      } else {
        console.debug(`[DeterministicSeed] Generated seed ${seed} from: ${input.substring(0, 100)}...`);
      }
    }
  }
}

/**
 * Convenience function to get the singleton instance
 */
export const seedPolicyService = SeedPolicyService.getInstance();

/**
 * Type guard to prevent accidental random seed usage
 * Use this in TypeScript strict mode to catch compile-time issues
 */
export type ForbiddenRandomSeed = never;

/**
 * Utility to replace Math.random() in seed generation contexts
 * This will throw an error to prevent accidental usage
 */
export const FORBIDDEN_RANDOM = (): ForbiddenRandomSeed => {
  return SeedPolicyService.preventRandomSeedGeneration();
};