import { Injectable, Optional, Inject } from '@nestjs/common';
import {
  Seed,
  NoiseGenerator,
  Building,
  TacticalMapContext,
  DevelopmentLevel,
  VegetationLayerData,
  RoadNetwork,
  StructureType,
  VegetationType,
  type ILogger
} from '@lazy-map/domain';

/**
 * Generates decorative structures like wells and shrines
 * Placement based on proximity to buildings and suitable locations
 */
@Injectable()
export class DecorationGenerationService {
  constructor(
    @Optional() @Inject('ILogger')
    private readonly logger?: ILogger
  ) {}

  /**
   * Place decorative structures like wells and shrines
   */
  placeDecorativeStructures(
    buildings: Building[],
    roadNetwork: RoadNetwork,
    vegetation: VegetationLayerData,
    context: TacticalMapContext,
    seed: Seed,
    width: number,
    height: number
  ): { x: number; y: number; type: StructureType }[] {
    const structures: { x: number; y: number; type: StructureType }[] = [];
    const decorNoise = NoiseGenerator.create(seed.getValue() * 12);

    // No decorative structures in wilderness
    if (context.development === DevelopmentLevel.WILDERNESS) {
      return structures;
    }

    // Place wells near buildings
    for (const building of buildings) {
      const pos = building.getPosition();
      const tileX = Math.floor(pos.x / 5);
      const tileY = Math.floor(pos.y / 5);

      if (decorNoise.generateAt(tileX * 0.2, tileY * 0.2) > 0.7) {
        // Find spot near building
        const offsets = [
          { dx: -2, dy: 0 }, { dx: 2, dy: 0 },
          { dx: 0, dy: -2 }, { dx: 0, dy: 2 }
        ];

        for (const offset of offsets) {
          const x = tileX + offset.dx;
          const y = tileY + offset.dy;

          if (x >= 0 && x < width && y >= 0 && y < height &&
              vegetation.tiles[y][x].vegetationType !== VegetationType.DENSE_TREES) {
            structures.push({ x, y, type: StructureType.WELL });
            break;
          }
        }
      }
    }

    // Place shrines in nice locations
    if (context.development === DevelopmentLevel.SETTLED ||
        context.development === DevelopmentLevel.URBAN) {
      for (const clearing of vegetation.clearings) {
        if (decorNoise.generateAt(clearing.x * 0.15, clearing.y * 0.15) > 0.8) {
          structures.push({
            x: clearing.x,
            y: clearing.y,
            type: StructureType.SHRINE
          });
        }
      }
    }

    return structures;
  }
}
