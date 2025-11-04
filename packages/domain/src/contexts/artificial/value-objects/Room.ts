import { Position } from '../../../common/value-objects/Position';
import { Seed } from '../../../common/value-objects/Seed';

/**
 * Represents a room within a building floor
 * Immutable value object
 */
export class Room {
  private constructor(
    private readonly id: string,
    private readonly type: RoomType,
    private readonly bounds: RoomBounds,
    private readonly connectedTo: string[], // Other room IDs
    private readonly features: RoomFeature[]
  ) {
    Object.freeze(this);
    Object.freeze(this.connectedTo);
    Object.freeze(this.features);
  }

  /**
   * Create a room with deterministic ID from seed
   */
  static create(
    type: RoomType,
    bounds: RoomBounds,
    seed: Seed
  ): Room {
    const id = `room_${seed.getValue()}_${bounds.origin.getX()}_${bounds.origin.getY()}`;
    return new Room(id, type, bounds, [], []);
  }

  /**
   * Create a room with specific properties
   */
  static createWithFeatures(
    type: RoomType,
    bounds: RoomBounds,
    features: RoomFeature[],
    seed: Seed
  ): Room {
    const id = `room_${seed.getValue()}_${bounds.origin.getX()}_${bounds.origin.getY()}`;
    return new Room(id, type, bounds, [], features);
  }

  /**
   * Connect this room to another (returns new Room instance)
   */
  connectTo(roomId: string): Room {
    if (this.connectedTo.includes(roomId)) {
      return this; // Already connected
    }
    return new Room(
      this.id,
      this.type,
      this.bounds,
      [...this.connectedTo, roomId],
      this.features
    );
  }

  /**
   * Add a feature to this room
   */
  withFeature(feature: RoomFeature): Room {
    return new Room(
      this.id,
      this.type,
      this.bounds,
      this.connectedTo,
      [...this.features, feature]
    );
  }

  /**
   * Check if position is within this room
   */
  containsPosition(position: Position): boolean {
    return this.bounds.contains(position);
  }

  /**
   * Get room area in square feet
   */
  getArea(): number {
    return this.bounds.getArea();
  }

  /**
   * Check if room can accommodate a specific activity
   */
  canAccommodate(activity: string): boolean {
    switch (activity) {
      case 'sleeping':
        return this.type === RoomType.BEDROOM ||
               this.type === RoomType.DORMITORY ||
               this.type === RoomType.PRIVATE_ROOM;

      case 'cooking':
        return this.type === RoomType.KITCHEN ||
               this.type === RoomType.HEARTH_ROOM;

      case 'eating':
        return this.type === RoomType.HALL ||
               this.type === RoomType.COMMON_ROOM ||
               this.type === RoomType.KITCHEN;

      case 'working':
        return this.type === RoomType.WORKSHOP ||
               this.type === RoomType.STUDY;

      case 'storage':
        return this.type === RoomType.STORAGE ||
               this.type === RoomType.CELLAR ||
               this.type === RoomType.PANTRY;

      default:
        return false;
    }
  }

  /**
   * Get minimum size requirements for room type
   */
  static getMinimumSize(type: RoomType): number {
    switch (type) {
      // Tiny rooms (25-50 sq ft)
      case RoomType.CLOSET:
      case RoomType.PRIVY:
        return 25;

      // Small rooms (50-80 sq ft)
      case RoomType.PANTRY:
      case RoomType.LANDING:
      case RoomType.ALCOVE:
        return 50;

      // Medium rooms (80-120 sq ft)
      case RoomType.BEDROOM:
      case RoomType.STUDY:
      case RoomType.CHAPEL:
        return 80;

      // Large rooms (120-200 sq ft)
      case RoomType.KITCHEN:
      case RoomType.WORKSHOP:
      case RoomType.PRIVATE_ROOM:
        return 120;

      // Very large rooms (200+ sq ft)
      case RoomType.HALL:
      case RoomType.COMMON_ROOM:
      case RoomType.GREAT_HALL:
        return 200;

      // Storage can be any size
      case RoomType.STORAGE:
      case RoomType.CELLAR:
        return 40;

      default:
        return 60; // Default medium size
    }
  }

  // Getters
  getId(): string { return this.id; }
  getType(): string { return this.type; }
  getBounds(): RoomBounds { return this.bounds; }
  getConnectedRooms(): ReadonlyArray<string> { return this.connectedTo; }
  getFeatures(): ReadonlyArray<RoomFeature> { return this.features; }
  isConnected(): boolean { return this.connectedTo.length > 0; }
}

/**
 * Room boundary definition
 */
export class RoomBounds {
  constructor(
    public readonly origin: Position,
    public readonly width: number,
    public readonly height: number
  ) {
    if (width <= 0 || height <= 0) {
      throw new Error('Room dimensions must be positive');
    }
    Object.freeze(this);
  }

  contains(position: Position): boolean {
    return position.getX() >= this.origin.getX() &&
           position.getX() < this.origin.getX() + this.width &&
           position.getY() >= this.origin.getY() &&
           position.getY() < this.origin.getY() + this.height;
  }

  getArea(): number {
    return this.width * this.height;
  }

  getCenter(): Position {
    return Position.create(
      this.origin.getX() + this.width / 2,
      this.origin.getY() + this.height / 2
    );
  }
}

/**
 * Types of rooms in medieval buildings
 */
export enum RoomType {
  // Living spaces
  HALL = 'hall',
  GREAT_HALL = 'great_hall',
  BEDROOM = 'bedroom',
  SOLAR = 'solar', // Private living room
  CHAMBER = 'chamber',

  // Service spaces
  KITCHEN = 'kitchen',
  PANTRY = 'pantry',
  BUTTERY = 'buttery', // Storage for drinks
  CELLAR = 'cellar',
  STORAGE = 'storage',

  // Work spaces
  WORKSHOP = 'workshop',
  FORGE = 'forge',
  STUDY = 'study',
  COUNTING_HOUSE = 'counting_house',

  // Public spaces
  COMMON_ROOM = 'common_room',
  TAVERN_HALL = 'tavern_hall',
  SHOP = 'shop',
  MARKET_STALL = 'market_stall',

  // Religious spaces
  CHAPEL = 'chapel',
  SANCTUARY = 'sanctuary',
  VESTRY = 'vestry',

  // Utility spaces
  PRIVY = 'privy',
  CLOSET = 'closet',
  LANDING = 'landing',
  ALCOVE = 'alcove',
  HEARTH_ROOM = 'hearth_room',

  // Inn/Tavern specific
  PRIVATE_ROOM = 'private_room',
  DORMITORY = 'dormitory',
  STABLE = 'stable'
}

/**
 * Features that can be present in rooms
 */
export enum RoomFeature {
  // Heating
  FIREPLACE = 'fireplace',
  HEARTH = 'hearth',
  BRAZIER = 'brazier',

  // Furniture
  BED = 'bed',
  TABLE = 'table',
  BENCH = 'bench',
  CHEST = 'chest',
  SHELF = 'shelf',

  // Architectural
  WINDOW = 'window',
  DOOR = 'door',
  STAIRS_UP = 'stairs_up',
  STAIRS_DOWN = 'stairs_down',
  LADDER = 'ladder',
  TRAPDOOR = 'trapdoor',

  // Utilities
  WELL = 'well',
  DRAIN = 'drain',
  CHIMNEY = 'chimney',

  // Work features
  WORKBENCH = 'workbench',
  ANVIL = 'anvil',
  LOOM = 'loom',
  OVEN = 'oven',

  // Storage
  BARREL = 'barrel',
  CRATE = 'crate',
  SACK = 'sack'
}