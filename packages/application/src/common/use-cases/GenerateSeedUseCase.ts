import { SeedService, ILogger, ErrorContext } from '@lazy-map/domain';

/**
 * Command for generating a deterministic seed
 */
export interface GenerateSeedCommand {
  parameters: Record<string, any>;
  logger?: ILogger;
}

/**
 * Use case for generating a deterministic seed based on parameters
 * This ensures reproducibility in map generation
 */
export class GenerateSeedUseCase {
  private readonly seedService = new SeedService();

  /**
   * Execute the use case
   */
  execute(command: GenerateSeedCommand): number {
    const { parameters, logger } = command;

    const seedInput = this.createParameterHash(parameters);
    const seed = this.seedService.generateSeed(seedInput);

    // Log for debugging/audit trail
    this.logSeedGeneration(seedInput, seed.getValue(), logger);

    return seed.getValue();
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

  private logSeedGeneration(input: string, seed: number, logger?: ILogger): void {
    // In development, log seed generation for debugging
    if (process.env.NODE_ENV === 'development') {
      if (logger) {
        const context: ErrorContext = {
          component: 'GenerateSeedUseCase',
          operation: 'logSeedGeneration',
          metadata: {
            generatedSeed: seed,
            inputPreview: input.substring(0, 100) + '...'
          }
        };
        logger.debug('Deterministic seed generated', context);
      } else {
        console.debug(`[DeterministicSeed] Generated seed ${seed} from: ${input.substring(0, 100)}...`);
      }
    }
  }
}