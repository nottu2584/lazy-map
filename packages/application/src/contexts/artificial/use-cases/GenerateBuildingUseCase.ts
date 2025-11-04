import { Inject, Injectable } from '@nestjs/common';
import {
  Building,
  BuildingType,
  IBuildingGenerationService,
  BuildingSite,
  BuildingContext,
  SpaceRequirements
} from '@lazy-map/domain';
import { Position, Seed } from '@lazy-map/domain';

/**
 * Command for generating a building
 */
export class GenerateBuildingCommand {
  constructor(
    public readonly type: BuildingType,
    public readonly position: Position,
    public readonly width: number,
    public readonly height: number,
    public readonly context: BuildingContext,
    public readonly generateInterior: boolean,
    public readonly seed: Seed,
    public readonly adjacentBuildings?: Building[],
    public readonly spaceRequirements?: SpaceRequirements
  ) {}
}

/**
 * Result of building generation
 */
export class GenerateBuildingResult {
  constructor(
    public readonly building: Building,
    public readonly generationTime: number,
    public readonly roomCount: number,
    public readonly floorCount: number,
    public readonly totalArea: number
  ) {}
}

/**
 * Use case for generating a building
 * Follows Clean Architecture - orchestrates domain logic
 */
@Injectable()
export class GenerateBuildingUseCase {
  constructor(
    @Inject('IBuildingGenerationService')
    private readonly buildingGenerator: IBuildingGenerationService
  ) {}

  /**
   * Execute building generation
   */
  async execute(command: GenerateBuildingCommand): Promise<GenerateBuildingResult> {
    const startTime = Date.now();

    // 1. Create building site from command
    const site: BuildingSite = {
      position: command.position,
      width: command.width,
      height: command.height,
      slope: 0, // Will be determined from topography in full implementation
      adjacentBuildings: command.adjacentBuildings || [],
      availableSpace: { width: command.width, height: command.height },
      constraints: this.determineSiteConstraints(command)
    };

    // 2. Generate building exterior
    let building = await this.buildingGenerator.generateBuilding(
      command.type,
      site,
      command.context,
      command.seed
    );

    // 3. Generate interior if requested
    if (command.generateInterior) {
      const requirements = command.spaceRequirements ||
        this.getDefaultRequirements(command.type, command.context);

      // Use sub-seed for interior to maintain determinism
      const interiorSeed = Seed.fromNumber(command.seed.getValue() + 1000);

      building = await this.buildingGenerator.generateInteriorLayout(
        building,
        requirements,
        interiorSeed
      );
    }

    // 4. Validate generated building
    this.validateBuilding(building, command);

    // 5. Calculate metrics
    const generationTime = Date.now() - startTime;
    const roomCount = building.getTotalRoomCount();
    const floorCount = building.getFloorCount();
    const totalArea = building.getTotalFloorArea();

    return new GenerateBuildingResult(
      building,
      generationTime,
      roomCount,
      floorCount,
      totalArea
    );
  }

  /**
   * Determine site constraints from command
   */
  private determineSiteConstraints(command: GenerateBuildingCommand): any {
    const constraints: any = {
      maxHeight: 50 // Default max height in feet
    };

    // Check if building should share walls with adjacent buildings
    if (command.adjacentBuildings && command.adjacentBuildings.length > 0) {
      // Find closest building and determine shared wall
      const closest = this.findClosestBuilding(
        command.position,
        command.adjacentBuildings
      );

      if (closest && this.shouldShareWall(command.position, closest)) {
        constraints.mustShareWall = this.getSharedWallSide(
          command.position,
          closest
        );
      }
    }

    // Add material constraints based on context
    if (command.context.wealthLevel < 0.3) {
      constraints.prohibitedMaterials = ['stone_cut', 'stone_fortified'];
    }

    return constraints;
  }

  /**
   * Get default space requirements for building type
   */
  private getDefaultRequirements(
    type: BuildingType,
    _context: BuildingContext
  ): SpaceRequirements {
    switch (type) {
      case BuildingType.HOUSE:
        return {
          requiredRooms: [
            { type: 'hall', count: 1, minSize: 60 },
            { type: 'kitchen', count: 1, minSize: 40 },
            { type: 'bedroom', count: 2, minSize: 50 }
          ],
          optionalRooms: [
            { type: 'storage', count: 1, minSize: 30 },
            { type: 'workshop', count: 1, minSize: 40 }
          ]
        };

      case BuildingType.TAVERN:
        return {
          requiredRooms: [
            { type: 'common_room', count: 1, minSize: 150 },
            { type: 'kitchen', count: 1, minSize: 60 },
            { type: 'storage', count: 1, minSize: 40 }
          ],
          optionalRooms: [
            { type: 'private_room', count: 3, minSize: 50 },
            { type: 'stable', count: 1, minSize: 80 }
          ]
        };

      case BuildingType.CHURCH:
        return {
          requiredRooms: [
            { type: 'sanctuary', count: 1, minSize: 200 },
            { type: 'vestry', count: 1, minSize: 40 }
          ],
          optionalRooms: [
            { type: 'chapel', count: 1, minSize: 60 },
            { type: 'storage', count: 1, minSize: 30 }
          ]
        };

      default:
        return {
          requiredRooms: [
            { type: 'hall', count: 1, minSize: 50 }
          ],
          optionalRooms: []
        };
    }
  }

  /**
   * Validate generated building meets requirements
   */
  private validateBuilding(building: Building, command: GenerateBuildingCommand): void {
    // Check building is within site bounds
    const footprint = building.getFootprint();
    if (footprint.getWidth() > command.width ||
        footprint.getHeight() > command.height) {
      throw new Error('Generated building exceeds site boundaries');
    }

    // Check building type matches
    if (building.getType() !== command.type) {
      throw new Error('Generated building type does not match requested type');
    }

    // Validate interior if generated
    if (command.generateInterior && building.getTotalRoomCount() === 0) {
      throw new Error('Interior generation failed - no rooms created');
    }
  }

  /**
   * Find closest building to a position
   */
  private findClosestBuilding(
    position: Position,
    buildings: Building[]
  ): Building | null {
    if (buildings.length === 0) return null;

    let closest = buildings[0];
    let minDistance = this.getDistance(position, closest.getPosition());

    for (const building of buildings) {
      const distance = this.getDistance(position, building.getPosition());
      if (distance < minDistance) {
        minDistance = distance;
        closest = building;
      }
    }

    return closest;
  }

  /**
   * Determine if buildings should share a wall
   */
  private shouldShareWall(position: Position, building: Building): boolean {
    const distance = this.getDistance(position, building.getPosition());
    return distance < 30; // Within 30 feet
  }

  /**
   * Get which side should be shared wall
   */
  private getSharedWallSide(position: Position, building: Building): string {
    const dx = position.getX() - building.getPosition().getX();
    const dy = position.getY() - building.getPosition().getY();

    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? 'west' : 'east';
    } else {
      return dy > 0 ? 'north' : 'south';
    }
  }

  /**
   * Calculate distance between positions
   */
  private getDistance(p1: Position, p2: Position): number {
    const dx = p1.getX() - p2.getX();
    const dy = p1.getY() - p2.getY();
    return Math.sqrt(dx * dx + dy * dy);
  }
}