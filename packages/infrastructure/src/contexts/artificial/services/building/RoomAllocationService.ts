import { Injectable, Optional, Inject } from '@nestjs/common';
import {
  SpaceRequirements,
  RoomRequirements,
  BuildingType,
  type ILogger
} from '@lazy-map/domain';

/**
 * Allocates rooms to building floors based on function and privacy
 * Determines which rooms go on ground floor, upper floors, or basement
 */
@Injectable()
export class RoomAllocationService {
  constructor(
    @Optional() @Inject('ILogger')
    private readonly logger?: ILogger
  ) {}

  /**
   * Allocate rooms to specific floor
   * Ground floor: public rooms (hall, common room, kitchen, etc.)
   * Upper floors: private rooms (bedrooms, studies, etc.)
   * Basement: storage and cellars
   */
  allocateRoomsToFloor(
    floorLevel: number,
    requirements: SpaceRequirements,
    _buildingType: BuildingType,
    _random: () => number
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
  isPublicRoom(type: string): boolean {
    return ['hall', 'common_room', 'kitchen', 'shop', 'tavern_hall', 'sanctuary']
      .includes(type);
  }

  /**
   * Check if room type is private
   */
  isPrivateRoom(type: string): boolean {
    return ['bedroom', 'study', 'solar', 'private_room', 'chamber']
      .includes(type);
  }
}
