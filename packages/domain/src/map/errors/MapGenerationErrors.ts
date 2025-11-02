import {
  ErrorCategory,
  ErrorSeverity,
  ValidationError,
  DomainRuleError,
  InfrastructureError
} from '../../common/errors';

/**
 * Map generation specific errors
 */
export class MapGenerationErrors {

  static invalidDimensions(width: number, height: number): ValidationError {
    return new ValidationError(
      'MAP_INVALID_DIMENSIONS',
      `Invalid map dimensions: ${width}x${height}. Dimensions must be between 10x10 and 200x200`,
      'Map dimensions must be between 10x10 and 200x200',
      { metadata: { width, height } },
      ['Use dimensions between 10x10 and 200x200'],
      { canRetry: false }
    );
  }

  static layerGenerationFailed(layerName: string, error: Error): InfrastructureError {
    return new InfrastructureError(
      'LAYER_GENERATION_FAILED',
      `Failed to generate ${layerName} layer: ${error.message}`,
      `Failed to generate ${layerName} layer`,
      { metadata: { layerName, originalError: error.message } },
      [`Retry ${layerName} layer generation`, 'Check seed value'],
      { canRetry: true }
    );
  }

  static invalidSeed(seed: any): ValidationError {
    return new ValidationError(
      'MAP_INVALID_SEED',
      `Invalid seed value: ${seed}. Seed must be a string or number`,
      'Invalid seed value provided',
      { metadata: { seed, seedType: typeof seed } },
      ['Provide a valid string or number as seed'],
      { canRetry: false }
    );
  }

  static contextGenerationFailed(reason: string): DomainRuleError {
    return new DomainRuleError(
      'CONTEXT_GENERATION_FAILED',
      `Failed to generate tactical map context: ${reason}`,
      'Failed to generate map context',
      { metadata: { reason } },
      ['Try with different seed', 'Specify context explicitly'],
      { canRetry: true }
    );
  }

  static invalidLayerDependency(
    currentLayer: string,
    requiredLayer: string
  ): DomainRuleError {
    return new DomainRuleError(
      'INVALID_LAYER_DEPENDENCY',
      `${currentLayer} layer requires ${requiredLayer} layer data`,
      `Missing required ${requiredLayer} layer`,
      { metadata: { currentLayer, requiredLayer } },
      [`Generate ${requiredLayer} layer first`],
      { canRetry: false }
    );
  }

  static featurePlacementFailed(
    featureType: string,
    reason: string
  ): DomainRuleError {
    return new DomainRuleError(
      'FEATURE_PLACEMENT_FAILED',
      `Failed to place ${featureType}: ${reason}`,
      `Could not place ${featureType}`,
      { metadata: { featureType, reason } },
      ['Adjust placement parameters', 'Check terrain constraints'],
      { canRetry: true }
    );
  }

  static waterFlowCalculationFailed(x: number, y: number): InfrastructureError {
    return new InfrastructureError(
      'WATER_FLOW_CALCULATION_FAILED',
      `Failed to calculate water flow at position (${x}, ${y})`,
      'Water flow calculation error',
      { metadata: { x, y } },
      ['Check elevation data', 'Verify flow algorithm'],
      { canRetry: true }
    );
  }

  static vegetationDistributionFailed(reason: string): DomainRuleError {
    return new DomainRuleError(
      'VEGETATION_DISTRIBUTION_FAILED',
      `Failed to distribute vegetation: ${reason}`,
      'Vegetation placement failed',
      { metadata: { reason } },
      ['Check moisture levels', 'Verify biome settings'],
      { canRetry: true }
    );
  }

  static structurePlacementConflict(
    structureType: string,
    x: number,
    y: number,
    reason: string
  ): DomainRuleError {
    return new DomainRuleError(
      'STRUCTURE_PLACEMENT_CONFLICT',
      `Cannot place ${structureType} at (${x}, ${y}): ${reason}`,
      `Cannot place ${structureType} here`,
      { metadata: { structureType, x, y, reason } },
      ['Find alternative location', 'Adjust terrain'],
      { canRetry: true }
    );
  }

  static insufficientMemory(layerName: string, mapSize: number): InfrastructureError {
    return new InfrastructureError(
      'INSUFFICIENT_MEMORY',
      `Insufficient memory to generate ${layerName} layer for ${mapSize} tiles`,
      'Not enough memory available',
      { metadata: { layerName, mapSize } },
      ['Reduce map size', 'Free up system memory'],
      { canRetry: true, maxRetries: 3 }
    );
  }
}