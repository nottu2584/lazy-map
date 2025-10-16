import {
  ValidationError,
  DomainRuleError,
  ErrorContext,
  ErrorCategory
} from '../../../common/errors/DomainError';

/**
 * Artificial structure error codes
 */
export const StructureErrorCodes = {
  // Validation errors
  STRUCTURE_INVALID_DIMENSIONS: 'STRUCTURE_INVALID_DIMENSIONS',
  STRUCTURE_INVALID_PLACEMENT: 'STRUCTURE_INVALID_PLACEMENT',
  STRUCTURE_INVALID_TYPE: 'STRUCTURE_INVALID_TYPE',
  ROAD_INVALID_WIDTH: 'ROAD_INVALID_WIDTH',

  // Generation errors
  BUILDING_GENERATION_FAILED: 'BUILDING_GENERATION_FAILED',
  ROAD_GENERATION_FAILED: 'ROAD_GENERATION_FAILED',
  BRIDGE_GENERATION_FAILED: 'BRIDGE_GENERATION_FAILED',

  // Domain rule violations
  STRUCTURE_COLLISION: 'STRUCTURE_COLLISION',
  STRUCTURE_TERRAIN_UNSUITABLE: 'STRUCTURE_TERRAIN_UNSUITABLE',
  ROAD_CONNECTIVITY_ERROR: 'ROAD_CONNECTIVITY_ERROR',
  BUILDING_ZONING_VIOLATION: 'BUILDING_ZONING_VIOLATION'
} as const;

/**
 * Factory for artificial structure errors
 */
export class StructureErrors {
  /**
   * Error for invalid structure dimensions
   */
  static invalidDimensions(
    structureType: string,
    dimensions: { width: number; height: number },
    constraints: { minWidth: number; maxWidth: number; minHeight: number; maxHeight: number },
    context?: ErrorContext
  ): ValidationError {
    return new ValidationError(
      StructureErrorCodes.STRUCTURE_INVALID_DIMENSIONS,
      `${structureType} dimensions (${dimensions.width}x${dimensions.height}) violate constraints`,
      `Structure size must be between ${constraints.minWidth}x${constraints.minHeight} and ${constraints.maxWidth}x${constraints.maxHeight}.`,
      {
        ...context,
        component: 'StructureValidator',
        metadata: { structureType, dimensions, constraints }
      },
      [
        'Adjust structure dimensions to fit constraints',
        'Check building code requirements',
        'Consider lot size limitations'
      ],
      {
        canRetry: true,
        fallbackValue: {
          width: Math.max(constraints.minWidth, Math.min(constraints.maxWidth, dimensions.width)),
          height: Math.max(constraints.minHeight, Math.min(constraints.maxHeight, dimensions.height))
        }
      }
    );
  }

  /**
   * Error for invalid structure placement
   */
  static invalidPlacement(
    structureType: string,
    position: { x: number; y: number },
    reason: string,
    context?: ErrorContext
  ): ValidationError {
    return new ValidationError(
      StructureErrorCodes.STRUCTURE_INVALID_PLACEMENT,
      `Cannot place ${structureType} at (${position.x}, ${position.y}): ${reason}`,
      `This location is not suitable for ${structureType}.`,
      {
        ...context,
        component: 'StructurePlacer',
        metadata: { structureType, position, reason }
      },
      [
        'Choose a different location',
        'Check terrain suitability',
        'Verify no existing structures at location'
      ]
    );
  }

  /**
   * Error for structure collisions
   */
  static collision(
    structure1: { type: string; id: string; bounds: any },
    structure2: { type: string; id: string; bounds: any },
    context?: ErrorContext
  ): DomainRuleError {
    return new DomainRuleError(
      StructureErrorCodes.STRUCTURE_COLLISION,
      `${structure1.type} (${structure1.id}) collides with ${structure2.type} (${structure2.id})`,
      'Structures cannot overlap.',
      {
        ...context,
        component: 'CollisionDetector',
        metadata: { structure1, structure2 }
      },
      [
        'Adjust structure positions',
        'Reduce structure sizes',
        'Enable automatic collision avoidance'
      ],
      {
        canRetry: true
      }
    );
  }

  /**
   * Error for unsuitable terrain
   */
  static terrainUnsuitable(
    structureType: string,
    terrainType: string,
    requirements: string[],
    context?: ErrorContext
  ): DomainRuleError {
    return new DomainRuleError(
      StructureErrorCodes.STRUCTURE_TERRAIN_UNSUITABLE,
      `${structureType} cannot be built on ${terrainType} terrain. Requires: ${requirements.join(', ')}`,
      `This terrain is not suitable for ${structureType}.`,
      {
        ...context,
        component: 'TerrainSuitabilityChecker',
        metadata: { structureType, terrainType, requirements }
      },
      [
        'Find suitable terrain for the structure',
        'Modify terrain to meet requirements',
        'Choose a different structure type'
      ]
    );
  }

  /**
   * Error for road generation failures
   */
  static roadGenerationFailed(
    startPoint: { x: number; y: number },
    endPoint: { x: number; y: number },
    reason: string,
    context?: ErrorContext
  ): DomainRuleError {
    return new DomainRuleError(
      StructureErrorCodes.ROAD_GENERATION_FAILED,
      `Road generation failed from (${startPoint.x}, ${startPoint.y}) to (${endPoint.x}, ${endPoint.y}): ${reason}`,
      'Unable to create road between these points.',
      {
        ...context,
        component: 'RoadGenerator',
        metadata: { startPoint, endPoint, reason }
      },
      [
        'Check if path is obstructed',
        'Verify terrain allows road construction',
        'Consider using bridges for water crossings'
      ],
      {
        canRetry: true,
        maxRetries: 3
      }
    );
  }

  /**
   * Error for invalid road width
   */
  static invalidRoadWidth(
    width: number,
    roadType: string,
    minWidth: number,
    maxWidth: number,
    context?: ErrorContext
  ): ValidationError {
    return new ValidationError(
      StructureErrorCodes.ROAD_INVALID_WIDTH,
      `Road width ${width} invalid for ${roadType}. Must be between ${minWidth} and ${maxWidth}`,
      `${roadType} roads must be ${minWidth}-${maxWidth} units wide.`,
      {
        ...context,
        component: 'RoadValidator',
        metadata: { width, roadType, minWidth, maxWidth }
      },
      [
        `Set width between ${minWidth} and ${maxWidth}`,
        'Check road type specifications',
        'Consider traffic requirements'
      ],
      {
        canRetry: true,
        fallbackValue: Math.max(minWidth, Math.min(maxWidth, width))
      }
    );
  }

  /**
   * Error for road connectivity issues
   */
  static connectivityError(
    roadSegment: { id: string; start: any; end: any },
    issue: string,
    context?: ErrorContext
  ): DomainRuleError {
    return new DomainRuleError(
      StructureErrorCodes.ROAD_CONNECTIVITY_ERROR,
      `Road segment ${roadSegment.id} has connectivity issue: ${issue}`,
      'Road network is not properly connected.',
      {
        ...context,
        component: 'RoadNetworkValidator',
        metadata: { roadSegment, issue }
      },
      [
        'Connect road segments properly',
        'Add intersections where needed',
        'Verify road network topology'
      ],
      {
        canRetry: true,
        compensationAction: async () => {
          // Placeholder for auto-connect logic
          console.log('Attempting to auto-connect road segments...');
        }
      }
    );
  }

  /**
   * Error for building generation failures
   */
  static buildingGenerationFailed(
    buildingType: string,
    location: { x: number; y: number },
    reason: string,
    context?: ErrorContext
  ): DomainRuleError {
    return new DomainRuleError(
      StructureErrorCodes.BUILDING_GENERATION_FAILED,
      `Failed to generate ${buildingType} at (${location.x}, ${location.y}): ${reason}`,
      `Unable to place ${buildingType} at this location.`,
      {
        ...context,
        component: 'BuildingGenerator',
        metadata: { buildingType, location, reason }
      },
      [
        'Check available space',
        'Verify zoning requirements',
        'Ensure foundation requirements are met'
      ],
      {
        canRetry: true,
        maxRetries: 2
      }
    );
  }

  /**
   * Error for zoning violations
   */
  static zoningViolation(
    buildingType: string,
    zone: string,
    allowedZones: string[],
    context?: ErrorContext
  ): DomainRuleError {
    return new DomainRuleError(
      StructureErrorCodes.BUILDING_ZONING_VIOLATION,
      `${buildingType} cannot be placed in ${zone} zone. Allowed zones: ${allowedZones.join(', ')}`,
      `This building type is not allowed in ${zone} zones.`,
      {
        ...context,
        component: 'ZoningValidator',
        metadata: { buildingType, zone, allowedZones }
      },
      [
        `Place in one of: ${allowedZones.join(', ')}`,
        'Check zoning regulations',
        'Request zoning variance if needed'
      ]
    );
  }

  /**
   * Error for bridge generation failures
   */
  static bridgeGenerationFailed(
    span: { start: any; end: any },
    obstacleType: string,
    reason: string,
    context?: ErrorContext
  ): DomainRuleError {
    return new DomainRuleError(
      StructureErrorCodes.BRIDGE_GENERATION_FAILED,
      `Failed to generate bridge over ${obstacleType}: ${reason}`,
      'Unable to construct bridge at this location.',
      {
        ...context,
        component: 'BridgeGenerator',
        metadata: { span, obstacleType, reason }
      },
      [
        'Check span requirements',
        'Verify anchor points on both sides',
        'Consider alternative crossing methods'
      ],
      {
        canRetry: true,
        maxRetries: 2,
        retryAfterMs: 1000
      }
    );
  }
}