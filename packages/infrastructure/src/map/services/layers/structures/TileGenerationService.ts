import { Injectable, Optional, Inject } from '@nestjs/common';
import {
  Building,
  BuildingType,
  TacticalMapContext,
  DevelopmentLevel,
  RoadNetwork,
  MaterialType,
  StructureTileData,
  StructureType,
  StructureCondition,
  type ILogger
} from '@lazy-map/domain';
import { BridgeLocation } from './BridgeGenerationService';

/**
 * Generates structure tile data combining buildings, roads, and decorations
 * Handles material conversion and tile property assignment
 */
@Injectable()
export class TileGenerationService {
  constructor(
    @Optional() @Inject('ILogger')
    private readonly logger?: ILogger
  ) {}

  /**
   * Create tile data combining all structure properties
   */
  createTileData(
    buildings: Building[],
    roadNetwork: RoadNetwork,
    bridges: BridgeLocation[],
    decorativeStructures: { x: number; y: number; type: StructureType }[],
    context: TacticalMapContext,
    width: number,
    height: number
  ): StructureTileData[][] {
    const tiles: StructureTileData[][] = [];

    // Initialize empty tiles
    for (let y = 0; y < height; y++) {
      tiles[y] = [];
      for (let x = 0; x < width; x++) {
        tiles[y][x] = {
          hasStructure: false,
          structureType: null,
          material: null,
          height: 0,
          isRoad: false,
          isPath: false,
          condition: StructureCondition.GOOD
        };
      }
    }

    // Add buildings
    for (const building of buildings) {
      const footprint = building.getFootprint();
      const pos = building.getPosition();
      const tileX = Math.floor(pos.x / 5);
      const tileY = Math.floor(pos.y / 5);
      const widthInTiles = Math.ceil(footprint.getWidth() / 5);
      const heightInTiles = Math.ceil(footprint.getHeight() / 5);

      for (let dy = 0; dy < heightInTiles; dy++) {
        for (let dx = 0; dx < widthInTiles; dx++) {
          const x = tileX + dx;
          const y = tileY + dy;

          if (x < width && y < height) {
            const material = building.getMaterial();
            const isRuin = context.development === DevelopmentLevel.RUINS;
            const isTower = building.getType() === BuildingType.TOWER;

            tiles[y][x] = {
              hasStructure: true,
              structureType: StructureType.HOUSE,
              material: this.convertBuildingMaterialToMaterialType(material),
              height: isTower ? 30 : building.getFloorCount() * 10,
              isRoad: false,
              isPath: false,
              condition: isRuin ? StructureCondition.RUINED : StructureCondition.GOOD
            };
          }
        }
      }
    }

    // Add roads
    for (const segment of roadNetwork.segments) {
      for (const point of segment.points) {
        if (point.x < width && point.y < height) {
          // Don't overwrite buildings
          if (!tiles[point.y][point.x].hasStructure) {
            tiles[point.y][point.x] = {
              hasStructure: true,
              structureType: StructureType.ROAD,
              material: segment.material,
              height: 0,
              isRoad: true,
              isPath: false,
              condition: StructureCondition.GOOD
            };
          }
        }
      }
    }

    // Add bridges
    for (const bridge of bridges) {
      const x = bridge.position.x;
      const y = bridge.position.y;

      if (x < width && y < height) {
        tiles[y][x] = {
          hasStructure: true,
          structureType: StructureType.BRIDGE,
          material: bridge.material,
          height: 5,
          isRoad: true,  // Bridges are part of the road network
          isPath: false,
          condition: StructureCondition.GOOD
        };
      }
    }

    // Add decorative structures
    for (const structure of decorativeStructures) {
      if (structure.x < width && structure.y < height) {
        tiles[structure.y][structure.x] = {
          hasStructure: true,
          structureType: structure.type,
          material: structure.type === StructureType.WELL ?
                   MaterialType.STONE : MaterialType.WOOD,
          height: structure.type === StructureType.WELL ? 3 : 8,
          isRoad: false,
          isPath: false,
          condition: StructureCondition.GOOD
        };
      }
    }

    return tiles;
  }

  /**
   * Convert domain BuildingMaterial to infrastructure MaterialType
   */
  private convertBuildingMaterialToMaterialType(material: any): MaterialType {
    const materialType = material.getType();
    switch (materialType) {
      case 'wood_rough':
      case 'wood_planked':
        return MaterialType.WOOD;
      case 'stone_rough':
      case 'stone_cut':
      case 'stone_fortified':
        return MaterialType.STONE;
      case 'brick':
        return MaterialType.STONE; // Map brick to stone for simplicity
      case 'wattle_daub':
      case 'adobe':
        return MaterialType.DIRT; // Map these to dirt for simplicity
      default:
        return MaterialType.WOOD;
    }
  }
}
