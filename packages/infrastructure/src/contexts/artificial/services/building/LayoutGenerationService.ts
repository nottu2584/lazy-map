import { Injectable, Optional, Inject } from '@nestjs/common';
import {
  RoomRequirements,
  Room,
  RoomType,
  RoomBounds,
  Position,
  Seed,
  type ILogger
} from '@lazy-map/domain';

/**
 * Generates room layouts using grid-based subdivision
 * Places rooms and connects adjacent rooms with doorways
 */
@Injectable()
export class LayoutGenerationService {
  constructor(
    @Optional() @Inject('ILogger')
    private readonly logger?: ILogger
  ) {}

  /**
   * Generate room layout for a floor using grid subdivision
   */
  async generateRoomLayout(
    floorArea: number,
    requirements: RoomRequirements[],
    seed: Seed
  ): Promise<Room[]> {
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
          new Position(currentX, currentY),
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
   * Check if two rooms are adjacent (share an edge)
   */
  areRoomsAdjacent(room1: Room, room2: Room): boolean {
    const bounds1 = room1.getBounds();
    const bounds2 = room2.getBounds();

    // Check if rooms share an edge
    const gap = 1; // Allow 1 foot gap for walls

    // Check horizontal adjacency
    if (Math.abs(bounds1.origin.x + bounds1.width - bounds2.origin.x) < gap ||
        Math.abs(bounds2.origin.x + bounds2.width - bounds1.origin.x) < gap) {
      // Check vertical overlap
      return !(bounds1.origin.y + bounds1.height < bounds2.origin.y ||
               bounds2.origin.y + bounds2.height < bounds1.origin.y);
    }

    // Check vertical adjacency
    if (Math.abs(bounds1.origin.y + bounds1.height - bounds2.origin.y) < gap ||
        Math.abs(bounds2.origin.y + bounds2.height - bounds1.origin.y) < gap) {
      // Check horizontal overlap
      return !(bounds1.origin.x + bounds1.width < bounds2.origin.x ||
               bounds2.origin.x + bounds2.width < bounds1.origin.x);
    }

    return false;
  }
}
