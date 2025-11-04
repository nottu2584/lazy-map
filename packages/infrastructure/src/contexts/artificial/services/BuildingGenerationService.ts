import {
  IBuildingGenerationService,
  BuildingSite,
  BuildingContext,
  SpaceRequirements,
  RoomRequirements,
  Building,
  BuildingType,
  BuildingMaterial,
  BuildingFootprint,
  Floor,
  Room,
  RoomType,
  RoomBounds,
  Foundation,
  RoofStyle,
  Position,
  Seed,
  type ILogger
} from '@lazy-map/domain';

/**
 * Concrete implementation of building generation service
 * Uses deterministic algorithms to generate buildings with interiors
 */
export class BuildingGenerationService implements IBuildingGenerationService {
  constructor(
    private readonly logger?: ILogger
  ) {}

  /**
   * Generate a complete building with exterior
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
    const dimensions = this.determineBuildingDimensions(type, site, random);

    // 2. Select material based on context and wealth
    const material = BuildingMaterial.selectMaterial(
      context.wealthLevel,
      context.biome,
      random()
    );

    // 3. Determine foundation type based on slope
    const foundation = this.selectFoundation(site.slope, material);

    // 4. Select roof style
    const roof = this.selectRoofStyle(type, context, random);

    // 5. Calculate orientation for optimal sun/wind
    const orientation = this.calculateOrientation(site, context, random);

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
    const floorCount = this.determineFloorCount(type, material, context, random);
    let result = building;
    for (let i = 1; i < floorCount; i++) {
      if (result.canAddFloor()) {
        result = result.addFloor(true); // Add above
      }
    }

    // 8. Add basement if appropriate
    if (this.shouldHaveBasement(type, foundation, context, random)) {
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
      const floorRequirements = this.allocateRoomsToFloor(
        floor.getLevel(),
        requirements,
        building.getType(),
        random
      );

      if (floorRequirements.length > 0) {
        // Generate room layout for this floor
        const rooms = await this.generateRoomLayout(
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
   * Generate room layout for a floor
   */
  async generateRoomLayout(
    floorArea: number,
    requirements: RoomRequirements[],
    seed: Seed
  ): Promise<Room[]> {
    const random = this.createSeededRandom(seed.getValue());
    const rooms: Room[] = [];

    // Sort requirements by priority (larger rooms first)
    const sorted = [...requirements].sort((a, b) => b.minSize - a.minSize);

    // Simple grid-based subdivision
    const gridSize = Math.sqrt(floorArea);
    let currentX = 0;
    let currentY = 0;
    let rowHeight = 0;

    for (const requirement of sorted) {
      for (let i = 0; i < requirement.count; i++) {
        // Calculate room dimensions
        const roomWidth = Math.sqrt(requirement.minSize);
        const roomHeight = requirement.minSize / roomWidth;

        // Check if room fits in current row
        if (currentX + roomWidth > gridSize) {
          // Move to next row
          currentX = 0;
          currentY += rowHeight;
          rowHeight = 0;
        }

        // Create room bounds
        const bounds = new RoomBounds(
          Position.create(currentX, currentY),
          roomWidth,
          roomHeight
        );

        // Create room with deterministic sub-seed
        const roomSeed = Seed.fromNumber(seed.getValue() + rooms.length);
        const room = Room.create(
          requirement.type as RoomType,
          bounds,
          roomSeed
        );

        rooms.push(room);

        // Update position for next room
        currentX += roomWidth;
        rowHeight = Math.max(rowHeight, roomHeight);
      }
    }

    // Connect adjacent rooms
    for (let i = 0; i < rooms.length - 1; i++) {
      if (this.areRoomsAdjacent(rooms[i], rooms[i + 1])) {
        rooms[i] = rooms[i].connectTo(rooms[i + 1].getId());
        rooms[i + 1] = rooms[i + 1].connectTo(rooms[i].getId());
      }
    }

    return rooms;
  }

  /**
   * Determine building dimensions based on type and site
   */
  private determineBuildingDimensions(
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
      [BuildingType.TAVERN]: { min: 30, max: 45 },
      [BuildingType.CHURCH]: { min: 35, max: 50 },
      [BuildingType.TOWER]: { min: 10, max: 15 },
      [BuildingType.CASTLE]: { min: 60, max: 100 }
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
  private selectFoundation(slope: number, material: BuildingMaterial): Foundation {
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
  private selectRoofStyle(
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
  private calculateOrientation(
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
  private determineFloorCount(
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
      [BuildingType.TOWNHOUSE]: 2 + (random() > 0.5 ? 1 : 0),
      [BuildingType.MANOR]: 2 + Math.floor(random() * 2),
      [BuildingType.TOWER]: 3 + Math.floor(random() * 2),
      [BuildingType.CASTLE]: 3 + Math.floor(random() * 3)
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
  private shouldHaveBasement(
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

  /**
   * Allocate rooms to specific floor
   */
  private allocateRoomsToFloor(
    floorLevel: number,
    requirements: SpaceRequirements,
    buildingType: BuildingType,
    random: () => number
  ): RoomRequirements[] {
    const floorRooms: RoomRequirements[] = [];

    // Ground floor gets public rooms
    if (floorLevel === 0) {
      for (const req of requirements.requiredRooms) {
        if (this.isPublicRoom(req.type)) {
          floorRooms.push(req);
        }
      }
    }
    // Upper floors get private rooms
    else if (floorLevel > 0) {
      for (const req of requirements.requiredRooms) {
        if (this.isPrivateRoom(req.type)) {
          floorRooms.push(req);
        }
      }
    }
    // Basement gets storage
    else {
      floorRooms.push({
        type: 'cellar',
        count: 1,
        minSize: 100
      });
    }

    return floorRooms;
  }

  /**
   * Check if room type is public
   */
  private isPublicRoom(type: string): boolean {
    return ['hall', 'common_room', 'kitchen', 'shop', 'tavern_hall', 'sanctuary']
      .includes(type);
  }

  /**
   * Check if room type is private
   */
  private isPrivateRoom(type: string): boolean {
    return ['bedroom', 'study', 'solar', 'private_room', 'chamber']
      .includes(type);
  }

  /**
   * Check if two rooms are adjacent
   */
  private areRoomsAdjacent(room1: Room, room2: Room): boolean {
    const bounds1 = room1.getBounds();
    const bounds2 = room2.getBounds();

    // Check if rooms share an edge
    const gap = 1; // Allow 1 foot gap for walls

    // Check horizontal adjacency
    if (Math.abs(bounds1.origin.getX() + bounds1.width - bounds2.origin.getX()) < gap ||
        Math.abs(bounds2.origin.getX() + bounds2.width - bounds1.origin.getX()) < gap) {
      // Check vertical overlap
      return !(bounds1.origin.getY() + bounds1.height < bounds2.origin.getY() ||
               bounds2.origin.getY() + bounds2.height < bounds1.origin.getY());
    }

    // Check vertical adjacency
    if (Math.abs(bounds1.origin.getY() + bounds1.height - bounds2.origin.getY()) < gap ||
        Math.abs(bounds2.origin.getY() + bounds2.height - bounds1.origin.getY()) < gap) {
      // Check horizontal overlap
      return !(bounds1.origin.getX() + bounds1.width < bounds2.origin.getX() ||
               bounds2.origin.getX() + bounds2.width < bounds1.origin.getX());
    }

    return false;
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