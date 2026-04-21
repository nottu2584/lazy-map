import { GeologyLayer } from '../../map/services/layers/GeologyLayer';
import {
  FormationSelectionService,
  BedrockPatternService,
  WeatheringService,
  SoilCalculationService,
  GeologyTileGenerationService
} from '../../map/services/layers/geology';
import { ILogger } from '@lazy-map/domain';

/**
 * Simple test logger that discards all log messages
 * Used to satisfy ILogger requirement in tests without console noise
 */
class TestLogger implements ILogger {
  debug(): void {}
  info(): void {}
  warn(): void {}
  error(): void {}
  logError(): void {}
  child(): ILogger { return this; }
}

/**
 * Factory for creating GeologyLayer with all required dependencies
 * for testing purposes.
 *
 * Provides ILogger to all services since they have logging statements.
 */
export function createGeologyLayerForTesting(): GeologyLayer {
  const logger = new TestLogger();

  // Create real service instances with logger
  const formationSelectionService = new FormationSelectionService(logger);
  const bedrockPatternService = new BedrockPatternService(logger);
  const weatheringService = new WeatheringService(logger);
  const soilCalculationService = new SoilCalculationService(logger);
  const geologyTileGenerationService = new GeologyTileGenerationService(logger);

  // Create GeologyLayer with all dependencies
  return new GeologyLayer(
    formationSelectionService,
    bedrockPatternService,
    weatheringService,
    soilCalculationService,
    geologyTileGenerationService,
    logger
  );
}
