import { ValidationError } from '../../../common/errors/types/ValidationError';
import { DomainRuleError } from '../../../common/errors/types/DomainRuleError';
import { ErrorContext } from '../../../common/errors/interfaces/ErrorContext';

/**
 * Cultural element error codes
 */
export const CulturalErrorCodes = {
  // Validation errors
  SETTLEMENT_INVALID_SIZE: 'SETTLEMENT_INVALID_SIZE',
  SETTLEMENT_INVALID_POPULATION: 'SETTLEMENT_INVALID_POPULATION',
  TERRITORY_INVALID_BOUNDARIES: 'TERRITORY_INVALID_BOUNDARIES',
  CULTURE_INVALID_TYPE: 'CULTURE_INVALID_TYPE',

  // Generation errors
  SETTLEMENT_GENERATION_FAILED: 'SETTLEMENT_GENERATION_FAILED',
  TERRITORY_GENERATION_FAILED: 'TERRITORY_GENERATION_FAILED',
  CULTURE_DISTRIBUTION_FAILED: 'CULTURE_DISTRIBUTION_FAILED',

  // Domain rule violations
  SETTLEMENT_RESOURCE_INSUFFICIENT: 'SETTLEMENT_RESOURCE_INSUFFICIENT',
  TERRITORY_OVERLAP: 'TERRITORY_OVERLAP',
  CULTURE_CONFLICT: 'CULTURE_CONFLICT',
  SETTLEMENT_LOCATION_UNSUITABLE: 'SETTLEMENT_LOCATION_UNSUITABLE'
} as const;

/**
 * Factory for cultural element errors
 */
export class CulturalErrors {
  /**
   * Error for invalid settlement size
   */
  static invalidSettlementSize(
    settlementType: string,
    size: number,
    minSize: number,
    maxSize: number,
    context?: ErrorContext
  ): ValidationError {
    return new ValidationError(
      CulturalErrorCodes.SETTLEMENT_INVALID_SIZE,
      `${settlementType} size ${size} is outside valid range [${minSize}, ${maxSize}]`,
      `Settlement size must be between ${minSize} and ${maxSize} units.`,
      {
        ...context,
        component: 'SettlementValidator',
        metadata: { settlementType, size, minSize, maxSize }
      },
      [
        `Adjust size to be between ${minSize} and ${maxSize}`,
        'Check settlement type requirements',
        'Consider population and resources'
      ],
      {
        canRetry: true,
        fallbackValue: Math.max(minSize, Math.min(maxSize, size))
      }
    );
  }

  /**
   * Error for invalid settlement population
   */
  static invalidPopulation(
    population: number,
    settlementType: string,
    minPop: number,
    maxPop: number,
    context?: ErrorContext
  ): ValidationError {
    return new ValidationError(
      CulturalErrorCodes.SETTLEMENT_INVALID_POPULATION,
      `Population ${population} invalid for ${settlementType}. Range: ${minPop}-${maxPop}`,
      `${settlementType} population must be ${minPop}-${maxPop}.`,
      {
        ...context,
        component: 'PopulationValidator',
        metadata: { population, settlementType, minPop, maxPop }
      },
      [
        `Set population between ${minPop} and ${maxPop}`,
        'Consider settlement type capacity',
        'Check resource availability'
      ],
      {
        canRetry: true,
        fallbackValue: Math.max(minPop, Math.min(maxPop, population))
      }
    );
  }

  /**
   * Error for insufficient resources
   */
  static insufficientResources(
    settlementName: string,
    resourceType: string,
    required: number,
    available: number,
    context?: ErrorContext
  ): DomainRuleError {
    return new DomainRuleError(
      CulturalErrorCodes.SETTLEMENT_RESOURCE_INSUFFICIENT,
      `${settlementName} requires ${required} ${resourceType} but only ${available} available`,
      `Not enough ${resourceType} for this settlement.`,
      {
        ...context,
        component: 'ResourceValidator',
        metadata: { settlementName, resourceType, required, available }
      },
      [
        'Reduce settlement size',
        'Find additional resource sources',
        'Adjust resource consumption'
      ],
      {
        canRetry: false
      }
    );
  }

  /**
   * Error for unsuitable settlement location
   */
  static unsuitableLocation(
    settlementType: string,
    location: { x: number; y: number },
    reasons: string[],
    context?: ErrorContext
  ): DomainRuleError {
    return new DomainRuleError(
      CulturalErrorCodes.SETTLEMENT_LOCATION_UNSUITABLE,
      `Cannot place ${settlementType} at (${location.x}, ${location.y}): ${reasons.join(', ')}`,
      `This location is not suitable for a ${settlementType}.`,
      {
        ...context,
        component: 'SettlementPlacer',
        metadata: { settlementType, location, reasons }
      },
      [
        'Find location near water source',
        'Check for flat terrain',
        'Ensure resource accessibility',
        'Verify defensive position if needed'
      ]
    );
  }

  /**
   * Error for territory boundary issues
   */
  static invalidBoundaries(
    territoryName: string,
    issue: string,
    context?: ErrorContext
  ): ValidationError {
    return new ValidationError(
      CulturalErrorCodes.TERRITORY_INVALID_BOUNDARIES,
      `Territory '${territoryName}' has invalid boundaries: ${issue}`,
      'Territory boundaries are not valid.',
      {
        ...context,
        component: 'TerritoryValidator',
        metadata: { territoryName, issue }
      },
      [
        'Ensure boundaries form a closed polygon',
        'Check for self-intersections',
        'Verify boundary points are within map'
      ],
      {
        canRetry: true
      }
    );
  }

  /**
   * Error for overlapping territories
   */
  static territoryOverlap(
    territory1: { name: string; id: string },
    territory2: { name: string; id: string },
    overlapArea: number,
    context?: ErrorContext
  ): DomainRuleError {
    return new DomainRuleError(
      CulturalErrorCodes.TERRITORY_OVERLAP,
      `Territory '${territory1.name}' overlaps with '${territory2.name}' by ${overlapArea} units`,
      'Territories cannot overlap.',
      {
        ...context,
        component: 'TerritoryManager',
        metadata: { territory1, territory2, overlapArea }
      },
      [
        'Adjust territory boundaries',
        'Create buffer zones between territories',
        'Establish diplomatic agreements'
      ],
      {
        canRetry: true,
        compensationAction: async () => {
          // Placeholder for automatic boundary adjustment
          // TODO: Implement territory boundary adjustment algorithm
        }
      }
    );
  }

  /**
   * Error for settlement generation failures
   */
  static settlementGenerationFailed(
    settlementType: string,
    reason: string,
    attemptedLocation?: { x: number; y: number },
    context?: ErrorContext
  ): DomainRuleError {
    return new DomainRuleError(
      CulturalErrorCodes.SETTLEMENT_GENERATION_FAILED,
      `Failed to generate ${settlementType}: ${reason}`,
      `Unable to create ${settlementType}.`,
      {
        ...context,
        component: 'SettlementGenerator',
        metadata: { settlementType, reason, attemptedLocation }
      },
      [
        'Check terrain suitability',
        'Verify resource availability',
        'Ensure minimum spacing between settlements'
      ],
      {
        canRetry: true,
        maxRetries: 3
      }
    );
  }

  /**
   * Error for cultural conflicts
   */
  static cultureConflict(
    culture1: string,
    culture2: string,
    conflictType: string,
    location?: { x: number; y: number },
    context?: ErrorContext
  ): DomainRuleError {
    return new DomainRuleError(
      CulturalErrorCodes.CULTURE_CONFLICT,
      `Cultural conflict between ${culture1} and ${culture2}: ${conflictType}`,
      'Incompatible cultural elements detected.',
      {
        ...context,
        component: 'CultureValidator',
        metadata: { culture1, culture2, conflictType, location }
      },
      [
        'Separate conflicting cultures',
        'Create buffer zones',
        'Adjust cultural influence areas',
        'Consider historical context'
      ],
      {
        canRetry: false
      }
    );
  }

  /**
   * Error for invalid culture type
   */
  static invalidCultureType(
    providedType: string,
    validTypes: string[],
    context?: ErrorContext
  ): ValidationError {
    return new ValidationError(
      CulturalErrorCodes.CULTURE_INVALID_TYPE,
      `Invalid culture type '${providedType}'. Valid types: ${validTypes.join(', ')}`,
      `'${providedType}' is not a recognized culture type.`,
      {
        ...context,
        component: 'CultureValidator',
        metadata: { providedType, validTypes }
      },
      [
        `Choose from: ${validTypes.join(', ')}`,
        'Check culture configuration',
        'Use default culture type'
      ]
    );
  }

  /**
   * Error for culture distribution failures
   */
  static cultureDistributionFailed(
    reason: string,
    affectedArea: { x: number; y: number; width: number; height: number },
    context?: ErrorContext
  ): DomainRuleError {
    return new DomainRuleError(
      CulturalErrorCodes.CULTURE_DISTRIBUTION_FAILED,
      `Failed to distribute cultures: ${reason}`,
      'Unable to assign cultural regions.',
      {
        ...context,
        component: 'CultureDistributor',
        metadata: { reason, affectedArea }
      },
      [
        'Reduce number of cultures',
        'Increase map size',
        'Adjust distribution algorithm parameters',
        'Check seed determinism'
      ],
      {
        canRetry: true,
        maxRetries: 2,
        retryAfterMs: 500
      }
    );
  }

  /**
   * Error for territory generation failures
   */
  static territoryGenerationFailed(
    territoryName: string,
    reason: string,
    seedPoint?: { x: number; y: number },
    context?: ErrorContext
  ): DomainRuleError {
    return new DomainRuleError(
      CulturalErrorCodes.TERRITORY_GENERATION_FAILED,
      `Failed to generate territory '${territoryName}': ${reason}`,
      'Unable to establish territory boundaries.',
      {
        ...context,
        component: 'TerritoryGenerator',
        metadata: { territoryName, reason, seedPoint }
      },
      [
        'Check available space on map',
        'Verify no overlapping territories',
        'Adjust territory growth parameters'
      ],
      {
        canRetry: true,
        maxRetries: 3
      }
    );
  }
}