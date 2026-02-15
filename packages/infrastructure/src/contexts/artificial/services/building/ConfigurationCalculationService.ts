import { Injectable, Optional, Inject } from '@nestjs/common';
import {
  BuildingType,
  BuildingSite,
  BuildingContext,
  BuildingMaterial,
  Foundation,
  RoofStyle,
  type ILogger
} from '@lazy-map/domain';

/**
 * Calculates building configuration properties
 * Determines dimensions, foundation, roof, orientation, and floors
 */
@Injectable()
export class ConfigurationCalculationService {
  constructor(
    @Optional() @Inject('ILogger')
    private readonly logger?: ILogger
  ) {}

  /**
   * Determine building dimensions based on type and site
   */
  determineBuildingDimensions(
    type: BuildingType,
    site: BuildingSite,
    random: () => number
  ): { width: number; height: number } {
    // Base dimensions by building type
    const baseDimensions = {
      [BuildingType.HUT]: { min: 10, max: 15 },
      [BuildingType.HOUSE]: { min: 15, max: 25 },
      [BuildingType.COTTAGE]: { min: 20, max: 30 },
      [BuildingType.FARMHOUSE]: { min: 25, max: 35 },
      [BuildingType.TOWNHOUSE]: { min: 15, max: 20 },
      [BuildingType.MANOR]: { min: 40, max: 60 },
      [BuildingType.BARN]: { min: 20, max: 40 },
      [BuildingType.STABLE]: { min: 15, max: 30 },
      [BuildingType.WORKSHOP]: { min: 15, max: 25 },
      [BuildingType.TAVERN]: { min: 30, max: 45 },
      [BuildingType.INN]: { min: 35, max: 50 },
      [BuildingType.CHURCH]: { min: 35, max: 50 },
      [BuildingType.CHAPEL]: { min: 15, max: 25 },
      [BuildingType.MILL]: { min: 20, max: 30 },
      [BuildingType.TOWER]: { min: 10, max: 15 },
      [BuildingType.GATEHOUSE]: { min: 20, max: 30 },
      [BuildingType.CASTLE]: { min: 60, max: 100 },
      [BuildingType.FORTIFICATION]: { min: 30, max: 50 }
    };

    const dims = baseDimensions[type] || { min: 15, max: 30 };

    // Calculate dimensions within site constraints
    const width = Math.min(
      site.availableSpace.width,
      dims.min + random() * (dims.max - dims.min)
    );

    const height = Math.min(
      site.availableSpace.height,
      dims.min + random() * (dims.max - dims.min)
    );

    return { width, height };
  }

  /**
   * Select foundation type based on slope
   */
  selectFoundation(slope: number, material: BuildingMaterial): Foundation {
    if (slope < 5) {
      return Foundation.FLAT;
    } else if (slope < 15) {
      return Foundation.TERRACED;
    } else if (slope < 25) {
      return Foundation.STEPPED;
    } else if (slope < 35) {
      return Foundation.CARVED;
    } else {
      return Foundation.RAISED; // On stilts for very steep slopes
    }
  }

  /**
   * Select roof style based on building type and context
   */
  selectRoofStyle(
    type: BuildingType,
    context: BuildingContext,
    random: () => number
  ): RoofStyle {
    // Churches often have special roofs
    if (type === BuildingType.CHURCH) {
      return random() > 0.5 ? RoofStyle.GABLED : RoofStyle.DOME;
    }

    // Towers have conical roofs
    if (type === BuildingType.TOWER) {
      return RoofStyle.CONICAL;
    }

    // Climate affects roof style
    if (context.climate === 'wet' || context.climate === 'cold') {
      // Steep roofs for rain/snow
      return random() > 0.5 ? RoofStyle.PITCHED_SLATE : RoofStyle.GABLED;
    }

    // Default based on wealth
    if (context.wealthLevel < 0.3) {
      return RoofStyle.PITCHED_THATCH;
    } else if (context.wealthLevel < 0.6) {
      return RoofStyle.PITCHED_WOOD;
    } else {
      return RoofStyle.PITCHED_TILE;
    }
  }

  /**
   * Calculate building orientation
   */
  calculateOrientation(
    site: BuildingSite,
    context: BuildingContext,
    random: () => number
  ): number {
    // Face away from prevailing wind (simplified)
    let orientation = 180; // South-facing default

    // Adjust for adjacent buildings
    if (site.adjacentBuildings.length > 0) {
      // Align with neighbors
      const avgOrientation = site.adjacentBuildings.reduce(
        (sum, b) => sum + b.getOrientation(),
        0
      ) / site.adjacentBuildings.length;

      orientation = avgOrientation + (random() - 0.5) * 30; // ±15 degrees
    }

    return orientation % 360;
  }

  /**
   * Determine number of floors
   */
  determineFloorCount(
    type: BuildingType,
    material: BuildingMaterial,
    context: BuildingContext,
    random: () => number
  ): number {
    // Base floor count by type
    const baseFloors = {
      [BuildingType.HUT]: 1,
      [BuildingType.HOUSE]: 1 + (random() > 0.5 ? 1 : 0),
      [BuildingType.COTTAGE]: 1 + (random() > 0.7 ? 1 : 0),
      [BuildingType.FARMHOUSE]: 1 + (random() > 0.6 ? 1 : 0),
      [BuildingType.TOWNHOUSE]: 2 + (random() > 0.5 ? 1 : 0),
      [BuildingType.MANOR]: 2 + Math.floor(random() * 2),
      [BuildingType.BARN]: 1,
      [BuildingType.STABLE]: 1,
      [BuildingType.WORKSHOP]: 1,
      [BuildingType.TAVERN]: 1 + (random() > 0.4 ? 1 : 0),
      [BuildingType.INN]: 2 + (random() > 0.6 ? 1 : 0),
      [BuildingType.CHURCH]: 1,
      [BuildingType.CHAPEL]: 1,
      [BuildingType.MILL]: 2 + (random() > 0.7 ? 1 : 0),
      [BuildingType.TOWER]: 3 + Math.floor(random() * 2),
      [BuildingType.GATEHOUSE]: 2,
      [BuildingType.CASTLE]: 3 + Math.floor(random() * 3),
      [BuildingType.FORTIFICATION]: 1
    };

    const floors = baseFloors[type] || 1;

    // Limit by material capability
    const maxFloors = material.canSupportFloors(10) ? 10 :
                     material.canSupportFloors(3) ? 3 :
                     material.canSupportFloors(2) ? 2 : 1;

    return Math.min(floors, maxFloors);
  }

  /**
   * Determine if building should have basement
   */
  shouldHaveBasement(
    type: BuildingType,
    foundation: Foundation,
    context: BuildingContext,
    random: () => number
  ): boolean {
    // Cellars are common in some buildings
    if (type === BuildingType.TAVERN || type === BuildingType.MANOR) {
      return random() > 0.3;
    }

    // Foundation type affects basement likelihood
    if (foundation === Foundation.CELLAR) {
      return true;
    }

    if (foundation === Foundation.RAISED || foundation === Foundation.CARVED) {
      return false; // Can't have basement
    }

    // Wealth affects basement likelihood
    return context.wealthLevel > 0.6 && random() > 0.5;
  }
}
