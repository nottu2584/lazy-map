import { BuildingFootprint } from './BuildingFootprint';
import { Room } from './Room';
import { Position } from '../../../common/value-objects/Position';

/**
 * Represents a single floor/level in a building
 * Immutable value object
 */
export class Floor {
  private constructor(
    private readonly level: number, // 0 = ground, positive = up, negative = down
    private readonly elevation: number, // actual height in feet above ground
    private readonly footprint: BuildingFootprint,
    private readonly rooms: Room[],
    private readonly accessible: boolean, // can be entered from outside
    private readonly ceilingHeight: number // in feet
  ) {
    Object.freeze(this);
    Object.freeze(this.rooms);
  }

  /**
   * Create a ground floor
   */
  static ground(footprint: BuildingFootprint, ceilingHeight: number = 8): Floor {
    return new Floor(
      0, // ground level
      0, // no elevation
      footprint,
      [], // no rooms yet
      true, // accessible from outside
      ceilingHeight
    );
  }

  /**
   * Create an upper floor
   */
  static upper(
    level: number,
    footprint: BuildingFootprint,
    baseElevation: number,
    ceilingHeight: number = 8
  ): Floor {
    if (level <= 0) {
      throw new Error('Upper floor level must be positive');
    }

    return new Floor(
      level,
      baseElevation + (level * ceilingHeight),
      footprint,
      [],
      false, // not directly accessible from outside
      ceilingHeight
    );
  }

  /**
   * Create a basement/cellar floor
   */
  static basement(
    level: number,
    footprint: BuildingFootprint,
    depth: number,
    ceilingHeight: number = 7
  ): Floor {
    if (level >= 0) {
      throw new Error('Basement level must be negative');
    }

    return new Floor(
      level,
      -depth, // below ground
      footprint,
      [],
      false, // not directly accessible
      ceilingHeight
    );
  }

  /**
   * Add a room to this floor (returns new Floor instance)
   */
  withRoom(room: Room): Floor {
    // Validate room fits within floor footprint
    if (!this.canAccommodateRoom(room)) {
      throw new Error('Room does not fit within floor footprint');
    }

    return new Floor(
      this.level,
      this.elevation,
      this.footprint,
      [...this.rooms, room],
      this.accessible,
      this.ceilingHeight
    );
  }

  /**
   * Add multiple rooms
   */
  withRooms(rooms: Room[]): Floor {
    let result: Floor = this;
    for (const room of rooms) {
      result = result.withRoom(room);
    }
    return result;
  }

  /**
   * Set accessibility (e.g., after adding external stairs)
   */
  withAccessibility(accessible: boolean): Floor {
    return new Floor(
      this.level,
      this.elevation,
      this.footprint,
      this.rooms,
      accessible,
      this.ceilingHeight
    );
  }

  /**
   * Check if a room can fit on this floor
   */
  private canAccommodateRoom(room: Room): boolean {
    // Check if room boundary is within floor footprint
    const roomBounds = room.getBounds();
    const floorArea = this.footprint.getArea();
    const roomArea = room.getArea();

    // Simple check: room area must be less than remaining floor area
    const usedArea = this.rooms.reduce((sum, r) => sum + r.getArea(), 0);
    return (usedArea + roomArea) <= floorArea;
  }

  /**
   * Get total floor area
   */
  getTotalArea(): number {
    return this.footprint.getArea();
  }

  /**
   * Get used area (sum of all rooms)
   */
  getUsedArea(): number {
    return this.rooms.reduce((sum, room) => sum + room.getArea(), 0);
  }

  /**
   * Get remaining unallocated space
   */
  getRemainingArea(): number {
    return this.getTotalArea() - this.getUsedArea();
  }

  /**
   * Get utilization percentage
   */
  getUtilization(): number {
    const total = this.getTotalArea();
    if (total === 0) return 0;
    return (this.getUsedArea() / total) * 100;
  }

  /**
   * Find room at a specific position
   */
  getRoomAt(position: Position): Room | null {
    for (const room of this.rooms) {
      if (room.containsPosition(position)) {
        return room;
      }
    }
    return null;
  }

  /**
   * Get rooms by type
   */
  getRoomsByType(type: string): Room[] {
    return this.rooms.filter(room => room.getType() === type);
  }

  /**
   * Check if floor has a specific room type
   */
  hasRoomType(type: string): boolean {
    return this.rooms.some(room => room.getType() === type);
  }

  // Getters
  getLevel(): number { return this.level; }
  getElevation(): number { return this.elevation; }
  getFootprint(): BuildingFootprint { return this.footprint; }
  getRooms(): ReadonlyArray<Room> { return this.rooms; }
  isAccessible(): boolean { return this.accessible; }
  getCeilingHeight(): number { return this.ceilingHeight; }
  isGroundFloor(): boolean { return this.level === 0; }
  isBasement(): boolean { return this.level < 0; }
  isUpperFloor(): boolean { return this.level > 0; }

  /**
   * Get a description of this floor
   */
  getDescription(): string {
    if (this.level === 0) return 'Ground Floor';
    if (this.level > 0) return `Floor ${this.level}`;
    return `Basement ${Math.abs(this.level)}`;
  }
}