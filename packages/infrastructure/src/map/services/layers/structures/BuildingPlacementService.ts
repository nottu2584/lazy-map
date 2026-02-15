import { Injectable, Optional, Inject } from '@nestjs/common';
import {
  Seed,
  NoiseGenerator,
  Building,
  BuildingType,
  BuildingContext,
  BuildingSite,
  SpaceRequirements,
  Position,
  DevelopmentLevel,
  TacticalMapContext,
  IBuildingGenerationService,
  type ILogger
} from '@lazy-map/domain';
import { BuildingGenerationService } from '../../../../contexts/artificial/services/BuildingGenerationService';

/**
 * Places buildings using the BuildingGenerationService
 * Handles building type selection, site allocation, and interior generation
 */
@Injectable()
export class BuildingPlacementService {
  constructor(
    @Inject(BuildingGenerationService)
    private readonly buildingGenerator: IBuildingGenerationService,

    @Optional() @Inject('ILogger')
    private readonly logger?: ILogger
  ) {}

  /**
   * Place buildings based on development level
   * Uses the building generation system with interiors
   */
  async placeBuildings(
    sites: { x: number; y: number; quality: number }[],
    developmentLevel: DevelopmentLevel,
    context: TacticalMapContext,
    seed: Seed
  ): Promise<Building[]> {
    const buildings: Building[] = [];
    const buildingNoise = NoiseGenerator.create(seed.getValue() * 10);

    // Determine number of buildings based on development level
    const buildingCount = this.getBuildingCount(developmentLevel, sites.length);

    // Create building context from tactical map context
    const buildingContext: BuildingContext = {
      biome: context.biome || 'temperate',
      wealthLevel: this.getWealthFromDevelopment(developmentLevel),
      developmentLevel: developmentLevel,
      historicalPeriod: 'high_medieval',
      climate: context.season === 'winter' ? 'cold' : 'temperate',
      purpose: undefined
    };

    // Place buildings at best sites
    const usedSites = new Set<string>();
    for (let i = 0; i < buildingCount && i < sites.length; i++) {
      const site = sites[i];

      // Skip if too close to existing building
      if (this.isTooCloseToExistingBuilding(site, buildings)) {
        continue;
      }

      // Determine building type based on development level
      const buildingRandom = buildingNoise.generateAt(site.x * 0.1, site.y * 0.1);
      const { buildingType, width, height } = this.selectBuildingType(
        developmentLevel,
        buildingRandom
      );

      // Create building site
      const buildingSite: BuildingSite = {
        position: new Position(site.x * 5, site.y * 5), // Convert to feet
        width: width,
        height: height,
        slope: 0, // Will be calculated from topography
        adjacentBuildings: buildings,
        availableSpace: { width, height },
        constraints: { maxHeight: 50 }
      };

      // Generate the building with new system
      try {
        const buildingSeed = Seed.fromNumber(seed.getValue() + i * 1000);
        const building = await this.buildingGenerator.generateBuilding(
          buildingType,
          buildingSite,
          buildingContext,
          buildingSeed
        );

        // Optionally generate interior for important buildings
        const shouldHaveInterior =
          buildingType === BuildingType.TAVERN ||
          buildingType === BuildingType.CHURCH ||
          buildingType === BuildingType.MANOR ||
          (buildingType === BuildingType.HOUSE && buildingRandom > 0.7);

        if (shouldHaveInterior) {
          const requirements = this.getDefaultRequirements(buildingType);
          const interiorSeed = Seed.fromNumber(buildingSeed.getValue() + 500);
          const buildingWithInterior = await this.buildingGenerator.generateInteriorLayout(
            building,
            requirements,
            interiorSeed
          );
          buildings.push(buildingWithInterior);
        } else {
          buildings.push(building);
        }

        // Mark site as used
        const footprint = building.getFootprint();
        for (let dy = 0; dy < Math.ceil(footprint.getHeight() / 5); dy++) {
          for (let dx = 0; dx < Math.ceil(footprint.getWidth() / 5); dx++) {
            usedSites.add(`${site.x + dx},${site.y + dy}`);
          }
        }
      } catch (error) {
        this.logger?.warn('Failed to generate building', {
          metadata: { site, type: buildingType, error: error instanceof Error ? error.message : 'Unknown error' }
        });
      }
    }

    return buildings;
  }

  /**
   * Determine number of buildings based on development level
   */
  private getBuildingCount(developmentLevel: DevelopmentLevel, siteCount: number): number {
    switch (developmentLevel) {
      case DevelopmentLevel.WILDERNESS:
        return 0;
      case DevelopmentLevel.FRONTIER:
        return Math.min(1, siteCount);
      case DevelopmentLevel.RURAL:
        return Math.min(3, siteCount);
      case DevelopmentLevel.SETTLED:
        return Math.min(8, siteCount);
      case DevelopmentLevel.URBAN:
        return Math.min(15, siteCount);
      case DevelopmentLevel.RUINS:
        return Math.min(3, siteCount);
      default:
        return 0;
    }
  }

  /**
   * Check if site is too close to existing buildings
   */
  private isTooCloseToExistingBuilding(
    site: { x: number; y: number },
    buildings: Building[]
  ): boolean {
    for (const existing of buildings) {
      const dist = Math.sqrt(
        Math.pow(site.x - existing.getPosition().x, 2) +
        Math.pow(site.y - existing.getPosition().y, 2)
      );
      if (dist < 5) {
        return true;
      }
    }
    return false;
  }

  /**
   * Select building type and dimensions based on development level
   */
  private selectBuildingType(
    developmentLevel: DevelopmentLevel,
    random: number
  ): { buildingType: BuildingType; width: number; height: number } {
    if (developmentLevel === DevelopmentLevel.FRONTIER) {
      return { buildingType: BuildingType.HUT, width: 10, height: 10 };
    }

    if (developmentLevel === DevelopmentLevel.RURAL) {
      return random < 0.5
        ? { buildingType: BuildingType.COTTAGE, width: 20, height: 20 }
        : { buildingType: BuildingType.BARN, width: 25, height: 20 };
    }

    if (developmentLevel === DevelopmentLevel.SETTLED) {
      if (random < 0.5) {
        return { buildingType: BuildingType.HOUSE, width: 20, height: 25 };
      } else if (random < 0.8) {
        return { buildingType: BuildingType.FARMHOUSE, width: 30, height: 25 };
      } else if (random < 0.95) {
        return { buildingType: BuildingType.TAVERN, width: 35, height: 30 };
      } else {
        return { buildingType: BuildingType.CHURCH, width: 40, height: 35 };
      }
    }

    if (developmentLevel === DevelopmentLevel.URBAN) {
      if (random < 0.4) {
        return {
          buildingType: BuildingType.TOWNHOUSE,
          width: 15 + Math.floor(random * 10),
          height: 20 + Math.floor(random * 10)
        };
      } else if (random < 0.7) {
        return { buildingType: BuildingType.HOUSE, width: 25, height: 25 };
      } else if (random < 0.9) {
        return { buildingType: BuildingType.MANOR, width: 45, height: 40 };
      } else {
        return { buildingType: BuildingType.TOWER, width: 15, height: 15 };
      }
    }

    // Default or ruins
    return { buildingType: BuildingType.COTTAGE, width: 20, height: 20 };
  }

  /**
   * Get wealth level from development level
   */
  private getWealthFromDevelopment(development: DevelopmentLevel): number {
    switch (development) {
      case DevelopmentLevel.WILDERNESS: return 0.1;
      case DevelopmentLevel.FRONTIER: return 0.2;
      case DevelopmentLevel.RURAL: return 0.3;
      case DevelopmentLevel.SETTLED: return 0.5;
      case DevelopmentLevel.URBAN: return 0.7;
      case DevelopmentLevel.RUINS: return 0.2;
      default: return 0.3;
    }
  }

  /**
   * Get default space requirements for building type
   */
  private getDefaultRequirements(type: BuildingType): SpaceRequirements {
    switch (type) {
      case BuildingType.TAVERN:
        return {
          requiredRooms: [
            { type: 'common_room', count: 1, minSize: 150 },
            { type: 'kitchen', count: 1, minSize: 60 },
            { type: 'storage', count: 1, minSize: 40 }
          ],
          optionalRooms: [
            { type: 'private_room', count: 3, minSize: 50 }
          ]
        };
      case BuildingType.CHURCH:
        return {
          requiredRooms: [
            { type: 'sanctuary', count: 1, minSize: 200 },
            { type: 'vestry', count: 1, minSize: 40 }
          ],
          optionalRooms: []
        };
      case BuildingType.MANOR:
        return {
          requiredRooms: [
            { type: 'hall', count: 1, minSize: 200 },
            { type: 'kitchen', count: 1, minSize: 80 },
            { type: 'bedroom', count: 4, minSize: 60 }
          ],
          optionalRooms: [
            { type: 'study', count: 1, minSize: 50 }
          ]
        };
      case BuildingType.HOUSE:
        return {
          requiredRooms: [
            { type: 'hall', count: 1, minSize: 60 },
            { type: 'bedroom', count: 2, minSize: 50 }
          ],
          optionalRooms: []
        };
      default:
        return { requiredRooms: [], optionalRooms: [] };
    }
  }
}
