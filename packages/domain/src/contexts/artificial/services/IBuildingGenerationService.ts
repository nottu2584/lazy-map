import { Building } from '../entities/Building';
import { BuildingType } from '../value-objects/BuildingMaterial';
import { Position } from '../../../common/value-objects/Position';
import { Seed } from '../../../common/value-objects/Seed';
import { Room } from '../value-objects/Room';

/**
 * Building site information for generation
 */
export interface BuildingSite {
  position: Position;
  width: number;
  height: number;
  slope: number; // degrees
  adjacentBuildings: Building[];
  availableSpace: { width: number; height: number };
  constraints: SiteConstraints;
}

/**
 * Site constraints that affect building generation
 */
export interface SiteConstraints {
  maxHeight: number;
  mustShareWall?: 'north' | 'south' | 'east' | 'west';
  prohibitedMaterials?: string[];
  requiredFeatures?: string[];
}

/**
 * Building context for generation
 */
export interface BuildingContext {
  biome: string;
  wealthLevel: number; // 0-1
  developmentLevel: string;
  historicalPeriod: string;
  climate: string;
  purpose?: string; // specific building purpose if known
}

/**
 * Space requirements for interior generation
 */
export interface SpaceRequirements {
  requiredRooms: RoomRequirements[];
  optionalRooms: RoomRequirements[];
  minTotalArea?: number;
  maxTotalArea?: number;
}

/**
 * Room requirements specification
 */
export interface RoomRequirements {
  type: string;
  count: number;
  minSize: number;
  maxSize?: number;
  floor?: number; // specific floor requirement
  adjacentTo?: string[]; // other room types
}

/**
 * Service interface for building generation
 * This is a domain interface (port) that will be implemented in infrastructure
 */
export interface IBuildingGenerationService {
  /**
   * Generate a complete building with exterior
   * @param type Building type to generate
   * @param site Site information and constraints
   * @param context Building context (biome, wealth, etc.)
   * @param seed Seed for deterministic generation
   * @returns Generated building
   */
  generateBuilding(
    type: BuildingType,
    site: BuildingSite,
    context: BuildingContext,
    seed: Seed
  ): Promise<Building>;

  /**
   * Generate interior layout for a building
   * @param building Building to add interior to
   * @param requirements Space requirements
   * @param seed Seed for deterministic generation
   * @returns Building with interior rooms
   */
  generateInteriorLayout(
    building: Building,
    requirements: SpaceRequirements,
    seed: Seed
  ): Promise<Building>;

  /**
   * Generate room layout for a floor
   * @param floorArea Total floor area
   * @param requirements Room requirements
   * @param seed Seed for deterministic generation
   * @returns Array of rooms
   */
  generateRoomLayout(
    floorArea: number,
    requirements: RoomRequirements[],
    seed: Seed
  ): Promise<Room[]>;
}