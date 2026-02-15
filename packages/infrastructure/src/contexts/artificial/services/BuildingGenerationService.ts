import { Injectable, Inject, Optional } from '@nestjs/common';
import {
  IBuildingGenerationService,
  BuildingSite,
  BuildingContext,
  SpaceRequirements,
  Building,
  BuildingType,
  BuildingMaterial,
  Seed,
  type ILogger
} from '@lazy-map/domain';

import { ConfigurationCalculationService } from './building/ConfigurationCalculationService';
import { RoomAllocationService } from './building/RoomAllocationService';
import { LayoutGenerationService } from './building/LayoutGenerationService';

/**
 * Building Generation Service - Orchestrates building creation with interiors
 * Delegates to specialized services for each generation phase
 *
 * Refactored from 497-line implementation into lightweight orchestrator pattern
 * Services handle: configuration calculation, room allocation, and layout generation
 */
@Injectable()
export class BuildingGenerationService implements IBuildingGenerationService {
  constructor(
    @Inject(ConfigurationCalculationService)
    private readonly configService: ConfigurationCalculationService,

    @Inject(RoomAllocationService)
    private readonly allocationService: RoomAllocationService,

    @Inject(LayoutGenerationService)
    private readonly layoutService: LayoutGenerationService,

    @Optional() @Inject('ILogger')
    private readonly logger?: ILogger
  ) {}

  /**
   * Generate a complete building with exterior
   * Orchestrates configuration and floor creation
   */
  async generateBuilding(
    type: BuildingType,
    site: BuildingSite,
    context: BuildingContext,
    seed: Seed
  ): Promise<Building> {
    this.logger?.debug('Generating building', {
      metadata: { type, position: site.position, seed: seed.getValue() }
    });

    // Create deterministic random generator from seed
    const random = this.createSeededRandom(seed.getValue());

    // 1. Determine building dimensions
    const dimensions = this.configService.determineBuildingDimensions(type, site, random);

    // 2. Select material based on context and wealth
    const material = BuildingMaterial.selectMaterial(
      context.wealthLevel,
      context.biome,
      random()
    );

    // 3. Determine foundation type based on slope
    const foundation = this.configService.selectFoundation(site.slope, material);

    // 4. Select roof style
    const roof = this.configService.selectRoofStyle(type, context, random);

    // 5. Calculate orientation for optimal sun/wind
    const orientation = this.configService.calculateOrientation(site, context, random);

    // 6. Create the building
    const building = Building.create({
      type,
      position: site.position,
      width: dimensions.width,
      height: dimensions.height,
      material,
      seed,
      orientation,
      foundation,
      roof
    });

    // 7. Add additional floors if appropriate
    const floorCount = this.configService.determineFloorCount(type, material, context, random);
    let result = building;
    for (let i = 1; i < floorCount; i++) {
      if (result.canAddFloor()) {
        result = result.addFloor(true); // Add above
      }
    }

    // 8. Add basement if appropriate
    if (this.configService.shouldHaveBasement(type, foundation, context, random)) {
      result = result.addFloor(false); // Add below
    }

    this.logger?.debug('Building generated', {
      metadata: {
        id: result.getId(),
        floors: result.getFloorCount(),
        material: material.getType()
      }
    });

    return result;
  }

  /**
   * Generate interior layout for a building
   * Orchestrates room allocation and layout generation
   */
  async generateInteriorLayout(
    building: Building,
    requirements: SpaceRequirements,
    seed: Seed
  ): Promise<Building> {
    this.logger?.debug('Generating interior layout', {
      metadata: {
        buildingId: building.getId(),
        requiredRooms: requirements.requiredRooms.length
      }
    });

    const random = this.createSeededRandom(seed.getValue());
    let result = building;

    // Process each floor
    const floors = building.getFloors();
    for (const floor of floors) {
      // Determine which rooms go on this floor
      const floorRequirements = this.allocationService.allocateRoomsToFloor(
        floor.getLevel(),
        requirements,
        building.getType(),
        random
      );

      if (floorRequirements.length > 0) {
        // Generate room layout for this floor
        const rooms = await this.layoutService.generateRoomLayout(
          floor.getTotalArea(),
          floorRequirements,
          Seed.fromNumber(seed.getValue() + floor.getLevel())
        );

        // Add rooms to building
        result = result.addRoomsToFloor(floor.getLevel(), rooms);
      }
    }

    return result;
  }

  /**
   * Create deterministic random number generator
   */
  private createSeededRandom(seed: number): () => number {
    let value = seed;
    return () => {
      value = (value * 1664525 + 1013904223) % 2147483647;
      return value / 2147483647;
    };
  }
}