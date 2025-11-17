import { ValidationError } from '../../../common/errors/types/ValidationError';
import { DomainRuleError } from '../../../common/errors/types/DomainRuleError';
import { ErrorContext } from '../../../common/errors/interfaces/ErrorContext';

/**
 * Vegetation and natural feature error codes
 */
export const VegetationErrorCodes = {
  // Validation errors
  VEGETATION_INVALID_DENSITY: 'VEGETATION_INVALID_DENSITY',
  VEGETATION_INVALID_SPECIES: 'VEGETATION_INVALID_SPECIES',
  VEGETATION_INVALID_AGE: 'VEGETATION_INVALID_AGE',
  VEGETATION_INVALID_SIZE: 'VEGETATION_INVALID_SIZE',

  // Generation errors
  FOREST_GENERATION_FAILED: 'FOREST_GENERATION_FAILED',
  RIVER_GENERATION_FAILED: 'RIVER_GENERATION_FAILED',
  BIOME_GENERATION_FAILED: 'BIOME_GENERATION_FAILED',

  // Domain rule violations
  VEGETATION_BIOME_CONFLICT: 'VEGETATION_BIOME_CONFLICT',
  VEGETATION_TERRAIN_INCOMPATIBLE: 'VEGETATION_TERRAIN_INCOMPATIBLE',
  VEGETATION_OVERLAP_VIOLATION: 'VEGETATION_OVERLAP_VIOLATION',
  HYDROGRAPHY_FLOW_ERROR: 'HYDROGRAPHY_FLOW_ERROR'
} as const;

/**
 * Factory for vegetation and natural feature errors
 */
export class VegetationErrors {
  /**
   * Error for invalid vegetation density
   */
  static invalidDensity(
    density: number,
    min: number = 0,
    max: number = 1,
    context?: ErrorContext
  ): ValidationError {
    return new ValidationError(
      VegetationErrorCodes.VEGETATION_INVALID_DENSITY,
      `Vegetation density ${density} is outside valid range [${min}, ${max}]`,
      `Density must be between ${min * 100}% and ${max * 100}%.`,
      {
        ...context,
        component: 'VegetationGenerator',
        metadata: { providedDensity: density, minDensity: min, maxDensity: max }
      },
      [
        `Set density between ${min} and ${max}`,
        'Use 0.3-0.7 for typical forest density',
        'Consider biome-appropriate density values'
      ],
      {
        canRetry: true,
        fallbackValue: Math.max(min, Math.min(max, density))
      }
    );
  }

  /**
   * Error for invalid species selection
   */
  static invalidSpecies(
    species: string,
    biome: string,
    validSpecies: string[],
    context?: ErrorContext
  ): ValidationError {
    return new ValidationError(
      VegetationErrorCodes.VEGETATION_INVALID_SPECIES,
      `Species '${species}' is not valid for '${biome}' biome. Valid species: ${validSpecies.join(', ')}`,
      `'${species}' cannot grow in this biome.`,
      {
        ...context,
        component: 'SpeciesValidator',
        metadata: { providedSpecies: species, biome, validSpecies }
      },
      [
        `Choose from: ${validSpecies.slice(0, 3).join(', ')}`,
        'Let the system auto-select appropriate species',
        'Check biome compatibility'
      ]
    );
  }

  /**
   * Error for vegetation-biome conflicts
   */
  static biomeConflict(
    vegetationType: string,
    currentBiome: string,
    compatibleBiomes: string[],
    context?: ErrorContext
  ): DomainRuleError {
    return new DomainRuleError(
      VegetationErrorCodes.VEGETATION_BIOME_CONFLICT,
      `${vegetationType} vegetation incompatible with '${currentBiome}' biome. Compatible biomes: ${compatibleBiomes.join(', ')}`,
      `This vegetation type doesn't grow in ${currentBiome} biomes.`,
      {
        ...context,
        component: 'BiomeCompatibilityChecker',
        metadata: { vegetationType, currentBiome, compatibleBiomes }
      },
      [
        'Select vegetation appropriate for the biome',
        `Change biome to one of: ${compatibleBiomes.join(', ')}`,
        'Use auto-vegetation selection'
      ]
    );
  }

  /**
   * Error for vegetation-terrain incompatibility
   */
  static terrainIncompatible(
    vegetationType: string,
    terrainType: string,
    reason: string,
    context?: ErrorContext
  ): DomainRuleError {
    return new DomainRuleError(
      VegetationErrorCodes.VEGETATION_TERRAIN_INCOMPATIBLE,
      `${vegetationType} cannot be placed on '${terrainType}' terrain: ${reason}`,
      `This vegetation cannot grow on ${terrainType}.`,
      {
        ...context,
        component: 'TerrainCompatibilityChecker',
        metadata: { vegetationType, terrainType, reason }
      },
      [
        'Choose different terrain for this vegetation',
        'Select vegetation suitable for this terrain',
        'Check elevation and moisture requirements'
      ],
      {
        canRetry: false
      }
    );
  }

  /**
   * Error for forest generation failures
   */
  static forestGenerationFailed(
    reason: string,
    area: { x: number; y: number; width: number; height: number },
    context?: ErrorContext
  ): DomainRuleError {
    return new DomainRuleError(
      VegetationErrorCodes.FOREST_GENERATION_FAILED,
      `Forest generation failed at area (${area.x}, ${area.y}, ${area.width}x${area.height}): ${reason}`,
      'Unable to generate forest in this area.',
      {
        ...context,
        component: 'ForestGenerator',
        metadata: { reason, area }
      },
      [
        'Check if area has suitable terrain',
        'Reduce forest density',
        'Verify seed determinism'
      ],
      {
        canRetry: true,
        maxRetries: 2
      }
    );
  }

  /**
   * Error for river generation failures
   */
  static riverGenerationFailed(
    reason: string,
    startPoint?: { x: number; y: number },
    context?: ErrorContext
  ): DomainRuleError {
    return new DomainRuleError(
      VegetationErrorCodes.RIVER_GENERATION_FAILED,
      `River generation failed${startPoint ? ` from (${startPoint.x}, ${startPoint.y})` : ''}: ${reason}`,
      'Unable to generate river path.',
      {
        ...context,
        component: 'RiverGenerator',
        metadata: { reason, startPoint }
      },
      [
        'Ensure terrain has elevation variance',
        'Check for valid water sources',
        'Verify pathfinding algorithm'
      ],
      {
        canRetry: true,
        maxRetries: 3,
        retryAfterMs: 500
      }
    );
  }

  /**
   * Error for vegetation overlap violations
   */
  static overlapViolation(
    feature1: { type: string; id: string },
    feature2: { type: string; id: string },
    context?: ErrorContext
  ): ValidationError {
    return new ValidationError(
      VegetationErrorCodes.VEGETATION_OVERLAP_VIOLATION,
      `${feature1.type} (${feature1.id}) overlaps with ${feature2.type} (${feature2.id})`,
      'Vegetation features are overlapping.',
      {
        ...context,
        component: 'VegetationPlacer',
        metadata: { feature1, feature2 }
      },
      [
        'Enable overlap checking',
        'Reduce vegetation density',
        'Use spatial indexing for placement'
      ],
      {
        canRetry: true
      }
    );
  }

  /**
   * Error for invalid tree age
   */
  static invalidAge(
    age: number,
    maxAge: number,
    species: string,
    context?: ErrorContext
  ): ValidationError {
    return new ValidationError(
      VegetationErrorCodes.VEGETATION_INVALID_AGE,
      `Age ${age} exceeds maximum age ${maxAge} for ${species}`,
      `Tree age must be realistic for this species.`,
      {
        ...context,
        component: 'TreeAgeValidator',
        metadata: { age, maxAge, species }
      },
      [
        `Use age between 0 and ${maxAge} years`,
        'Consider species lifespan',
        'Use age variation for natural appearance'
      ],
      {
        canRetry: true,
        fallbackValue: Math.min(age, maxAge)
      }
    );
  }

  /**
   * Error for hydrographic flow issues
   */
  static flowError(
    issue: string,
    location: { x: number; y: number },
    context?: ErrorContext
  ): DomainRuleError {
    return new DomainRuleError(
      VegetationErrorCodes.HYDROGRAPHY_FLOW_ERROR,
      `Water flow error at (${location.x}, ${location.y}): ${issue}`,
      'River flow is physically impossible.',
      {
        ...context,
        component: 'HydrographyValidator',
        metadata: { issue, location }
      },
      [
        'Check elevation data',
        'Ensure water flows downhill',
        'Verify river source and sink points'
      ],
      {
        canRetry: true,
        compensationAction: async () => {
          // Placeholder for flow correction
          // TODO: Implement water flow correction algorithm
        }
      }
    );
  }
}