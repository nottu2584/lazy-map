import { ValidationError } from '../../../common/errors/types/ValidationError';
import { DomainRuleError } from '../../../common/errors/types/DomainRuleError';
import { ErrorContext } from '../../../common/errors/interfaces/ErrorContext';

/**
 * Terrain-specific error codes
 */
export const TerrainErrorCodes = {
  // Validation errors
  TERRAIN_INVALID_ELEVATION: 'TERRAIN_INVALID_ELEVATION',
  TERRAIN_INVALID_TYPE: 'TERRAIN_INVALID_TYPE',
  TERRAIN_INVALID_SLOPE: 'TERRAIN_INVALID_SLOPE',
  TERRAIN_INVALID_DIMENSIONS: 'TERRAIN_INVALID_DIMENSIONS',

  // Generation errors
  TERRAIN_GENERATION_FAILED: 'TERRAIN_GENERATION_FAILED',
  TERRAIN_HEIGHTMAP_INVALID: 'TERRAIN_HEIGHTMAP_INVALID',
  TERRAIN_NOISE_GENERATION_FAILED: 'TERRAIN_NOISE_GENERATION_FAILED',

  // Domain rule violations
  TERRAIN_TYPE_MISMATCH: 'TERRAIN_TYPE_MISMATCH',
  TERRAIN_BOUNDARY_VIOLATION: 'TERRAIN_BOUNDARY_VIOLATION',
  TERRAIN_CONTINUITY_ERROR: 'TERRAIN_CONTINUITY_ERROR'
} as const;

/**
 * Factory for terrain and relief-related errors
 */
export class TerrainErrors {
  /**
   * Error for invalid elevation values
   */
  static invalidElevation(
    value: number,
    min: number,
    max: number,
    context?: ErrorContext
  ): ValidationError {
    return new ValidationError(
      TerrainErrorCodes.TERRAIN_INVALID_ELEVATION,
      `Elevation ${value} is outside valid range [${min}, ${max}]`,
      `Elevation must be between ${min} and ${max} meters.`,
      {
        ...context,
        component: 'TerrainGenerator',
        metadata: { providedValue: value, minElevation: min, maxElevation: max }
      },
      [
        `Use an elevation value between ${min} and ${max}`,
        'Check terrain generation parameters',
        'Verify heightmap calculations'
      ],
      {
        canRetry: true,
        fallbackValue: Math.max(min, Math.min(max, value))
      }
    );
  }

  /**
   * Error for invalid terrain type
   */
  static invalidTerrainType(
    providedType: string,
    validTypes: string[],
    context?: ErrorContext
  ): ValidationError {
    return new ValidationError(
      TerrainErrorCodes.TERRAIN_INVALID_TYPE,
      `Invalid terrain type '${providedType}'. Valid types: ${validTypes.join(', ')}`,
      `'${providedType}' is not a valid terrain type.`,
      {
        ...context,
        component: 'TerrainValidator',
        metadata: { providedType, validTypes }
      },
      [
        `Use one of the valid terrain types: ${validTypes.join(', ')}`,
        'Check terrain configuration',
        'Review biome settings'
      ]
    );
  }

  /**
   * Error for terrain type mismatch with biome
   */
  static terrainTypeMismatch(
    expectedType: string,
    actualType: string,
    biome: string,
    context?: ErrorContext
  ): DomainRuleError {
    return new DomainRuleError(
      TerrainErrorCodes.TERRAIN_TYPE_MISMATCH,
      `Terrain type '${actualType}' is incompatible with '${biome}' biome. Expected '${expectedType}'.`,
      `The selected terrain doesn't match the biome requirements.`,
      {
        ...context,
        component: 'TerrainBiomeValidator',
        metadata: { expectedType, actualType, biome }
      },
      [
        `Change terrain type to '${expectedType}'`,
        `Select a different biome compatible with '${actualType}'`,
        'Review biome-terrain compatibility rules'
      ],
      {
        canRetry: false
      }
    );
  }

  /**
   * Error for invalid slope values
   */
  static invalidSlope(
    slope: number,
    maxSlope: number,
    context?: ErrorContext
  ): ValidationError {
    return new ValidationError(
      TerrainErrorCodes.TERRAIN_INVALID_SLOPE,
      `Slope ${slope}° exceeds maximum allowed slope of ${maxSlope}°`,
      `Terrain slope is too steep (${slope}°).`,
      {
        ...context,
        component: 'SlopeCalculator',
        metadata: { slope, maxSlope }
      },
      [
        'Reduce elevation variance',
        'Apply terrain smoothing',
        'Increase map resolution for gentler slopes'
      ],
      {
        canRetry: true,
        fallbackValue: maxSlope
      }
    );
  }

  /**
   * Error for terrain generation failures
   */
  static generationFailed(
    reason: string,
    phase: string,
    context?: ErrorContext
  ): DomainRuleError {
    return new DomainRuleError(
      TerrainErrorCodes.TERRAIN_GENERATION_FAILED,
      `Terrain generation failed during ${phase}: ${reason}`,
      'Unable to generate terrain for the map.',
      {
        ...context,
        component: 'TerrainGenerator',
        operation: `generate${phase}`,
        metadata: { reason, phase }
      },
      [
        'Check seed value for deterministic generation',
        'Verify terrain parameters are within valid ranges',
        'Reduce map size if generation is timing out'
      ],
      {
        canRetry: true,
        maxRetries: 3,
        retryAfterMs: 1000
      }
    );
  }

  /**
   * Error for heightmap validation failures
   */
  static invalidHeightmap(
    issue: string,
    dimensions: { width: number; height: number },
    context?: ErrorContext
  ): ValidationError {
    return new ValidationError(
      TerrainErrorCodes.TERRAIN_HEIGHTMAP_INVALID,
      `Heightmap validation failed: ${issue}`,
      'The generated terrain heightmap contains invalid data.',
      {
        ...context,
        component: 'HeightmapValidator',
        metadata: { issue, dimensions }
      },
      [
        'Regenerate heightmap with different parameters',
        'Check noise generation algorithm',
        'Verify dimension calculations'
      ],
      {
        canRetry: true
      }
    );
  }

  /**
   * Error for terrain boundary violations
   */
  static boundaryViolation(
    position: { x: number; y: number },
    mapBounds: { width: number; height: number },
    context?: ErrorContext
  ): DomainRuleError {
    return new DomainRuleError(
      TerrainErrorCodes.TERRAIN_BOUNDARY_VIOLATION,
      `Terrain position (${position.x}, ${position.y}) exceeds map boundaries (${mapBounds.width}x${mapBounds.height})`,
      'Terrain placement is outside the map boundaries.',
      {
        ...context,
        component: 'TerrainPlacer',
        metadata: { position, mapBounds }
      },
      [
        'Adjust terrain position to fit within map',
        'Increase map size to accommodate terrain',
        'Use boundary clamping for terrain features'
      ]
    );
  }

  /**
   * Error for terrain continuity issues
   */
  static continuityError(
    location: { x: number; y: number },
    discontinuityType: string,
    context?: ErrorContext
  ): DomainRuleError {
    return new DomainRuleError(
      TerrainErrorCodes.TERRAIN_CONTINUITY_ERROR,
      `Terrain continuity error at (${location.x}, ${location.y}): ${discontinuityType}`,
      'Terrain has unrealistic discontinuities.',
      {
        ...context,
        component: 'TerrainContinuityChecker',
        metadata: { location, discontinuityType }
      },
      [
        'Apply terrain smoothing filter',
        'Reduce elevation variance',
        'Check neighboring tile transitions'
      ],
      {
        canRetry: true,
        compensationAction: async () => {
          // Placeholder for terrain smoothing compensation
          // TODO: Implement terrain smoothing algorithm
        }
      }
    );
  }
}