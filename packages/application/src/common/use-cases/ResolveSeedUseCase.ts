import { SeedService, ILogger } from '@lazy-map/domain';
import { GenerateSeedUseCase } from './GenerateSeedUseCase';

/**
 * Command for resolving a seed value
 */
export interface ResolveSeedCommand {
  userSeed?: string | number;
  fallbackParameters: Record<string, any>;
  logger?: ILogger;
}

/**
 * Use case for resolving a deterministic seed
 * Validates user-provided seed or generates one from parameters
 */
export class ResolveSeedUseCase {
  private readonly seedService = new SeedService();
  private readonly generateSeedUseCase = new GenerateSeedUseCase();

  /**
   * Execute the use case
   */
  execute(command: ResolveSeedCommand): number {
    const { userSeed, fallbackParameters, logger } = command;

    // First try to use user-provided seed
    if (userSeed !== undefined && userSeed !== null) {
      const validation = this.seedService.validateSeedInput(userSeed);
      if (validation.isValid && validation.seed) {
        return validation.seed.getValue();
      }
    }

    // Fallback to deterministic parameter-based seed
    return this.generateSeedUseCase.execute({
      parameters: fallbackParameters,
      logger
    });
  }
}