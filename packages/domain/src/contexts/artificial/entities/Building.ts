import { Position } from '../../../common/value-objects/Position';
import { Seed } from '../../../common/value-objects/Seed';
import { BuildingFootprint } from '../value-objects/BuildingFootprint';
import { BuildingMaterial, BuildingType } from '../value-objects/BuildingMaterial';
import { Floor } from '../value-objects/Floor';
import { Room } from '../value-objects/Room';

/**
 * Building entity - represents a complete structure with floors, walls, and rooms
 * This is an entity (not value object) because buildings have identity and lifecycle
 */
export class Building {
  private constructor(
    private readonly id: string,
    private readonly type: BuildingType,
    private readonly position: Position,
    private readonly orientation: number, // degrees rotation
    private readonly footprint: BuildingFootprint,
    private readonly floors: Floor[],
    private readonly material: BuildingMaterial,
    private readonly foundation: Foundation,
    private readonly roof: RoofStyle,
    private readonly age: number, // years since construction
    private readonly condition: number, // 0-1, 1 = perfect
    private readonly additions: BuildingAddition[]
  ) {}

  /**
   * Create a new building with deterministic ID from seed
   */
  static create(params: {
    type: BuildingType;
    position: Position;
    width: number;
    height: number;
    material: BuildingMaterial;
    seed: Seed;
    orientation?: number;
    foundation?: Foundation;
    roof?: RoofStyle;
  }): Building {
    const id = `building_${params.seed.getValue()}_${params.position.x}_${params.position.y}`;

    const footprint = BuildingFootprint.fromRectangle(
      params.position,
      params.width,
      params.height
    );

    const groundFloor = Floor.ground(footprint);

    return new Building(
      id,
      params.type,
      params.position,
      params.orientation || 0,
      footprint,
      [groundFloor],
      params.material,
      params.foundation || Foundation.FLAT,
      params.roof || RoofStyle.PITCHED_THATCH,
      0, // new building
      1.0, // perfect condition
      []
    );
  }

  /**
   * Add a floor to the building
   */
  addFloor(above: boolean = true): Building {
    if (!this.canAddFloor()) {
      throw new Error('Building cannot support additional floors');
    }

    const newLevel = above
      ? this.getTopFloor().getLevel() + 1
      : this.getBottomFloor().getLevel() - 1;

    const newFloor = above
      ? Floor.upper(newLevel, this.footprint, this.getTopFloor().getElevation())
      : Floor.basement(newLevel, this.footprint, Math.abs(newLevel) * 7);

    const newFloors = [...this.floors, newFloor].sort((a, b) => a.getLevel() - b.getLevel());

    return new Building(
      this.id,
      this.type,
      this.position,
      this.orientation,
      this.footprint,
      newFloors,
      this.material,
      this.foundation,
      this.roof,
      this.age,
      this.condition,
      this.additions
    );
  }

  /**
   * Add rooms to a specific floor
   */
  addRoomsToFloor(floorLevel: number, rooms: Room[]): Building {
    const floor = this.floors.find(f => f.getLevel() === floorLevel);
    if (!floor) {
      throw new Error(`Floor level ${floorLevel} does not exist`);
    }

    const updatedFloor = floor.withRooms(rooms);
    const newFloors = this.floors.map(f =>
      f.getLevel() === floorLevel ? updatedFloor : f
    );

    return new Building(
      this.id,
      this.type,
      this.position,
      this.orientation,
      this.footprint,
      newFloors,
      this.material,
      this.foundation,
      this.roof,
      this.age,
      this.condition,
      this.additions
    );
  }

  /**
   * Add an addition/extension to the building
   */
  addAddition(addition: BuildingAddition): Building {
    // Validate addition can be attached
    if (!this.canAttachAddition(addition)) {
      throw new Error('Cannot attach addition at specified location');
    }

    return new Building(
      this.id,
      this.type,
      this.position,
      this.orientation,
      this.footprint,
      this.floors,
      this.material,
      this.foundation,
      this.roof,
      this.age,
      this.condition,
      [...this.additions, addition]
    );
  }

  /**
   * Age the building (deteriorate condition)
   */
  ageBuilding(years: number): Building {
    const newAge = this.age + years;
    const degradation = this.material.getDegradation(newAge, 0.5);
    const newCondition = Math.max(0, this.condition - degradation);

    return new Building(
      this.id,
      this.type,
      this.position,
      this.orientation,
      this.footprint,
      this.floors,
      this.material,
      this.foundation,
      this.roof,
      newAge,
      newCondition,
      this.additions
    );
  }

  /**
   * Check if building can support another floor
   */
  canAddFloor(): boolean {
    const currentFloors = this.floors.filter(f => f.getLevel() > 0).length + 1;
    return this.material.canSupportFloors(currentFloors + 1);
  }

  /**
   * Check if building can attach an addition
   */
  private canAttachAddition(addition: BuildingAddition): boolean {
    // Check if addition footprint overlaps with existing
    for (const existing of this.additions) {
      if (addition.footprint.overlaps(existing.footprint)) {
        return false;
      }
    }

    // Check if addition shares a wall with main building
    return addition.footprint.findSharedWall(this.footprint) !== null;
  }

  /**
   * Check if building can share a wall with another
   */
  canShareWallWith(other: Building): boolean {
    return this.footprint.findSharedWall(other.footprint) !== null;
  }

  /**
   * Get total building height
   */
  getTotalHeight(): number {
    const topFloor = this.getTopFloor();
    return topFloor.getElevation() + topFloor.getCeilingHeight() + 2; // +2 for roof
  }

  /**
   * Get total floor area (all floors)
   */
  getTotalFloorArea(): number {
    return this.floors.reduce((sum, floor) => sum + floor.getTotalArea(), 0);
  }

  /**
   * Get total number of rooms
   */
  getTotalRoomCount(): number {
    return this.floors.reduce((sum, floor) => sum + floor.getRooms().length, 0);
  }

  /**
   * Check if building is a ruin (based on condition only)
   */
  isRuin(): boolean {
    return this.condition < 0.2; // Less than 20% integrity = ruins
  }

  /**
   * Check if building has a specific room type
   */
  hasRoomType(roomType: string): boolean {
    return this.floors.some(floor => floor.hasRoomType(roomType));
  }

  // Private helpers
  private getTopFloor(): Floor {
    return this.floors.reduce((top, floor) =>
      floor.getLevel() > top.getLevel() ? floor : top
    );
  }

  private getBottomFloor(): Floor {
    return this.floors.reduce((bottom, floor) =>
      floor.getLevel() < bottom.getLevel() ? floor : bottom
    );
  }

  // Getters
  getId(): string { return this.id; }
  getType(): BuildingType { return this.type; }
  getPosition(): Position { return this.position; }
  getOrientation(): number { return this.orientation; }
  getFootprint(): BuildingFootprint { return this.footprint; }
  getFloors(): ReadonlyArray<Floor> { return this.floors; }
  getMaterial(): BuildingMaterial { return this.material; }
  getFoundation(): Foundation { return this.foundation; }
  getRoof(): RoofStyle { return this.roof; }
  getAge(): number { return this.age; }
  getCondition(): number { return this.condition; }
  getAdditions(): ReadonlyArray<BuildingAddition> { return this.additions; }
  getFloorCount(): number { return this.floors.length; }
}

/**
 * Building addition/extension
 */
export class BuildingAddition {
  constructor(
    public readonly type: AdditionType,
    public readonly footprint: BuildingFootprint,
    public readonly material: BuildingMaterial,
    public readonly connectionType: ConnectionType,
    public readonly floors: number = 1
  ) {}
}

/**
 * Foundation types for different terrains
 */
export enum Foundation {
  FLAT = 'flat',               // Normal foundation
  RAISED = 'raised',           // On stilts/posts
  CARVED = 'carved',           // Cut into hillside
  STEPPED = 'stepped',         // Multiple levels
  TERRACED = 'terraced',       // With retaining walls
  CELLAR = 'cellar'           // With basement
}

/**
 * Roof styles
 */
export enum RoofStyle {
  FLAT = 'flat',
  PITCHED_THATCH = 'pitched_thatch',
  PITCHED_TILE = 'pitched_tile',
  PITCHED_SLATE = 'pitched_slate',
  PITCHED_WOOD = 'pitched_wood',
  HIPPED = 'hipped',
  GABLED = 'gabled',
  GAMBREL = 'gambrel',
  MANSARD = 'mansard',
  DOME = 'dome',
  CONICAL = 'conical'
}

/**
 * Types of building additions
 */
export enum AdditionType {
  LEAN_TO = 'lean_to',
  WING = 'wing',
  TOWER = 'tower',
  PORCH = 'porch',
  SHED = 'shed',
  ANNEX = 'annex'
}

/**
 * How additions connect to main building
 */
export enum ConnectionType {
  SHARED_WALL = 'shared_wall',
  DOOR = 'door',
  COVERED_WALKWAY = 'covered_walkway',
  UNDERGROUND = 'underground',
  NONE = 'none'
}