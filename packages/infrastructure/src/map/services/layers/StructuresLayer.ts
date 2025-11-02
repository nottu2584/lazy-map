import {
  TacticalMapContext,
  Seed,
  NoiseGenerator,
  DevelopmentLevel,
  Building,
  Bridge,
  Road,
  Position,
  MaterialType,
  MapGenerationErrors,
  type ILogger,
  // Import from domain layer service interfaces
  IStructuresLayerService,
  StructuresLayerData,
  StructureTileData,
  StructureType,
  StructureCondition,
  BuildingFootprint,
  RoadNetwork,
  RoadSegment,
  BridgeLocation,
  VegetationType,
  VegetationLayerData,
  HydrologyLayerData,
  TopographyLayerData
} from '@lazy-map/domain';

/**
 * Generates artificial structures based on development level and terrain
 * Creates buildings, roads, bridges, and other human-made features
 */
export class StructuresLayer implements IStructuresLayerService {
  private width: number = 0;
  private height: number = 0;
  private logger?: ILogger;

  constructor(logger?: ILogger) {
    this.logger = logger;
  }

  /**
   * Generate structures layer from environmental conditions
   */
  async generate(
    vegetation: VegetationLayerData,
    hydrology: HydrologyLayerData,
    topography: TopographyLayerData,
    context: TacticalMapContext,
    seed: Seed
  ): Promise<StructuresLayerData> {
    this.width = vegetation.tiles[0].length;
    this.height = vegetation.tiles.length;

    // 1. Identify suitable building sites
    const buildingSites = this.identifyBuildingSites(
      vegetation,
      hydrology,
      topography,
      context
    );

    // 2. Place buildings based on development level
    const buildings = this.placeBuildings(
      buildingSites,
      context.development,
      seed
    );

    // 3. Generate road network connecting buildings
    const roadNetwork = this.generateRoadNetwork(
      buildings,
      vegetation,
      hydrology,
      topography,
      context,
      seed
    );

    // 4. Place bridges where roads cross water
    const bridges = this.placeBridges(
      roadNetwork,
      hydrology,
      topography,
      seed
    );

    // 5. Add decorative structures
    const decorativeStructures = this.placeDecorativeStructures(
      buildings,
      roadNetwork,
      vegetation,
      context,
      seed
    );

    // 6. Create tile data
    const tiles = this.createTileData(
      buildings,
      roadNetwork,
      bridges,
      decorativeStructures,
      context
    );

    // 7. Calculate statistics
    const totalStructureCount = buildings.length + bridges.length + decorativeStructures.length;

    return {
      tiles,
      buildings,
      roads: roadNetwork,
      bridges,
      totalStructureCount
    };
  }

  /**
   * Identify suitable sites for building placement
   */
  private identifyBuildingSites(
    vegetation: VegetationLayerData,
    hydrology: HydrologyLayerData,
    topography: TopographyLayerData,
    context: TacticalMapContext
  ): { x: number; y: number; quality: number }[] {
    const sites: { x: number; y: number; quality: number }[] = [];

    for (let y = 2; y < this.height - 2; y++) {
      for (let x = 2; x < this.width - 2; x++) {
        // Check basic suitability
        if (hydrology.tiles[y][x].waterDepth > 0) continue;
        if (topography.tiles[y][x].slope > 20) continue;
        if (vegetation.tiles[y][x].vegetationType === VegetationType.DENSE_FOREST) continue;

        // Calculate site quality
        let quality = 1.0;

        // Prefer clearings
        if (vegetation.tiles[y][x].vegetationType === VegetationType.NONE ||
            vegetation.tiles[y][x].vegetationType === VegetationType.GRASSLAND) {
          quality += 0.3;
        }

        // Prefer flat areas
        if (topography.tiles[y][x].slope < 5) {
          quality += 0.2;
        }

        // Near water is good
        let nearWater = false;
        for (let dy = -3; dy <= 3; dy++) {
          for (let dx = -3; dx <= 3; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height) {
              if (hydrology.tiles[ny][nx].waterDepth > 0) {
                nearWater = true;
                break;
              }
            }
          }
        }
        if (nearWater) quality += 0.2;

        // Check if area is clear enough for building
        if (this.checkBuildingFootprint(x, y, 2, 2, vegetation, hydrology, topography)) {
          sites.push({ x, y, quality });
        }
      }
    }

    // Sort by quality
    sites.sort((a, b) => b.quality - a.quality);
    return sites;
  }

  /**
   * Check if area is suitable for building footprint
   */
  private checkBuildingFootprint(
    x: number,
    y: number,
    width: number,
    height: number,
    vegetation: VegetationLayerData,
    hydrology: HydrologyLayerData,
    topography: TopographyLayerData
  ): boolean {
    for (let dy = 0; dy < height; dy++) {
      for (let dx = 0; dx < width; dx++) {
        const nx = x + dx;
        const ny = y + dy;

        if (nx >= this.width || ny >= this.height) return false;
        if (hydrology.tiles[ny][nx].waterDepth > 0) return false;
        if (topography.tiles[ny][nx].slope > 30) return false;
        if (vegetation.tiles[ny][nx].vegetationType === VegetationType.DENSE_FOREST) return false;
      }
    }
    return true;
  }

  /**
   * Place buildings based on development level
   */
  private placeBuildings(
    sites: { x: number; y: number; quality: number }[],
    developmentLevel: DevelopmentLevel,
    seed: Seed
  ): BuildingFootprint[] {
    const buildings: BuildingFootprint[] = [];
    const buildingNoise = NoiseGenerator.create(seed.getValue() * 10);

    // Determine number of buildings
    let buildingCount = 0;
    switch (developmentLevel) {
      case DevelopmentLevel.WILDERNESS:
        buildingCount = 0;
        break;
      case DevelopmentLevel.FRONTIER:
        buildingCount = Math.min(1, sites.length);
        break;
      case DevelopmentLevel.RURAL:
        buildingCount = Math.min(2, sites.length);
        break;
      case DevelopmentLevel.SETTLED:
        buildingCount = Math.min(8, sites.length);
        break;
      case DevelopmentLevel.URBAN:
        buildingCount = Math.min(15, sites.length);
        break;
      case DevelopmentLevel.RUINS:
        buildingCount = Math.min(3, sites.length);
        break;
      default:
        buildingCount = 0;
        break;
    }

    // Place buildings at best sites
    const usedSites = new Set<string>();
    for (let i = 0; i < buildingCount && i < sites.length; i++) {
      const site = sites[i];

      // Skip if too close to existing building
      let tooClose = false;
      for (const existing of buildings) {
        const dist = Math.sqrt(
          Math.pow(site.x - existing.origin.x, 2) +
          Math.pow(site.y - existing.origin.y, 2)
        );
        if (dist < 5) {
          tooClose = true;
          break;
        }
      }
      if (tooClose) continue;

      // Determine building type and size
      const buildingRandom = buildingNoise.generateAt(site.x * 0.1, site.y * 0.1);
      let type: 'house' | 'barn' | 'tower' | 'ruin';
      let width: number;
      let height: number;

      if (developmentLevel === DevelopmentLevel.FRONTIER) {
        type = 'house';
        width = 1;
        height = 1;
      } else if (developmentLevel === DevelopmentLevel.RURAL) {
        type = buildingRandom < 0.5 ? 'house' : 'barn';
        width = 2;
        height = 2;
      } else if (developmentLevel === DevelopmentLevel.SETTLED) {
        if (buildingRandom < 0.6) {
          type = 'house';
          width = 2;
          height = 2;
        } else if (buildingRandom < 0.9) {
          type = 'barn';
          width = 3;
          height = 2;
        } else {
          type = 'tower';
          width = 1;
          height = 1;
        }
      } else if (developmentLevel === DevelopmentLevel.URBAN) {
        if (buildingRandom < 0.5) {
          type = 'house';
          width = 2 + Math.floor(buildingRandom * 2);
          height = 2 + Math.floor(buildingRandom * 2);
        } else if (buildingRandom < 0.8) {
          type = 'barn';
          width = 3;
          height = 3;
        } else {
          type = 'tower';
          width = 2;
          height = 2;
        }
      } else if (developmentLevel === DevelopmentLevel.RUINS) {
        type = 'ruin';
        width = 2;
        height = 2;
      } else {
        // Default fallback
        type = 'house';
        width = 2;
        height = 2;
      }

      // Add some ruins for atmosphere
      if (buildingNoise.generateAt(site.x * 0.2, site.y * 0.2) > 0.85) {
        type = 'ruin';
      }

      buildings.push({
        origin: { x: site.x, y: site.y },
        width,
        height,
        type,
        material: this.selectBuildingMaterial(type, seed.getValue() + i)
      });

      // Mark site as used
      for (let dy = 0; dy < height; dy++) {
        for (let dx = 0; dx < width; dx++) {
          usedSites.add(`${site.x + dx},${site.y + dy}`);
        }
      }
    }

    return buildings;
  }

  /**
   * Select appropriate building material
   */
  private selectBuildingMaterial(type: string, seed: number): MaterialType {
    const random = (seed % 100) / 100;

    if (type === 'tower') {
      return MaterialType.STONE;
    } else if (type === 'ruin') {
      return random < 0.7 ? MaterialType.STONE : MaterialType.WOOD;
    } else if (type === 'barn') {
      return MaterialType.WOOD;
    } else {
      // House
      return random < 0.5 ? MaterialType.WOOD : MaterialType.STONE;
    }
  }

  /**
   * Generate road network using pathfinding
   */
  private generateRoadNetwork(
    buildings: BuildingFootprint[],
    vegetation: VegetationLayerData,
    hydrology: HydrologyLayerData,
    topography: TopographyLayerData,
    context: TacticalMapContext,
    seed: Seed
  ): RoadNetwork {
    const segments: RoadSegment[] = [];
    const intersections: { x: number; y: number }[] = [];

    // No roads in wilderness
    if (context.development === DevelopmentLevel.WILDERNESS) {
      return { segments, intersections, totalLength: 0 };
    }

    // Connect buildings with roads
    if (buildings.length >= 2) {
      // Simple approach: connect nearest neighbors
      const connected = new Set<number>();
      connected.add(0);

      while (connected.size < buildings.length) {
        let minDist = Infinity;
        let bestFrom = -1;
        let bestTo = -1;

        // Find nearest unconnected building
        for (const fromIdx of connected) {
          for (let toIdx = 0; toIdx < buildings.length; toIdx++) {
            if (connected.has(toIdx)) continue;

            const from = buildings[fromIdx];
            const to = buildings[toIdx];
            const dist = Math.sqrt(
              Math.pow(to.origin.x - from.origin.x, 2) +
              Math.pow(to.origin.y - from.origin.y, 2)
            );

            if (dist < minDist) {
              minDist = dist;
              bestFrom = fromIdx;
              bestTo = toIdx;
            }
          }
        }

        if (bestTo !== -1) {
          // Create road segment
          const from = buildings[bestFrom];
          const to = buildings[bestTo];
          const path = this.findRoadPath(
            from.origin,
            to.origin,
            vegetation,
            hydrology,
            topography
          );

          if (path.length > 0) {
            segments.push({
              points: path,
              material: MaterialType.DIRT,
              width: 1
            });
          }

          connected.add(bestTo);
        } else {
          break;
        }
      }
    }

    // Calculate total length
    let totalLength = 0;
    for (const segment of segments) {
      totalLength += segment.points.length;
    }

    // Find intersections
    const roadTiles = new Map<string, number>();
    for (const segment of segments) {
      for (const point of segment.points) {
        const key = `${point.x},${point.y}`;
        const count = (roadTiles.get(key) || 0) + 1;
        roadTiles.set(key, count);
        if (count > 1) {
          intersections.push(point);
        }
      }
    }

    return { segments, intersections, totalLength };
  }

  /**
   * Find path for road using simple pathfinding
   */
  private findRoadPath(
    from: { x: number; y: number },
    to: { x: number; y: number },
    vegetation: VegetationLayerData,
    hydrology: HydrologyLayerData,
    topography: TopographyLayerData
  ): { x: number; y: number }[] {
    // Simple straight line with obstacle avoidance
    const path: { x: number; y: number }[] = [];

    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const steps = Math.max(Math.abs(dx), Math.abs(dy));

    if (steps === 0) return path;

    const xStep = dx / steps;
    const yStep = dy / steps;

    for (let i = 0; i <= steps; i++) {
      const x = Math.round(from.x + xStep * i);
      const y = Math.round(from.y + yStep * i);

      // Check if position is valid for road
      if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
        // Avoid water (will need bridges)
        if (hydrology.tiles[y][x].waterDepth === 0) {
          path.push({ x, y });
        }
      }
    }

    return path;
  }

  /**
   * Place bridges where roads cross water
   */
  private placeBridges(
    roadNetwork: RoadNetwork,
    hydrology: HydrologyLayerData,
    topography: TopographyLayerData,
    seed: Seed
  ): BridgeLocation[] {
    const bridges: BridgeLocation[] = [];
    const bridgeNoise = NoiseGenerator.create(seed.getValue() * 11);

    // Check each road segment for water crossings
    for (const segment of roadNetwork.segments) {
      for (let i = 1; i < segment.points.length; i++) {
        const prev = segment.points[i - 1];
        const curr = segment.points[i];

        // Check if we're entering water
        if (hydrology.tiles[prev.y][prev.x].waterDepth === 0 &&
            hydrology.tiles[curr.y][curr.x].waterDepth > 0) {
          // Find extent of water crossing
          let endIdx = i;
          while (endIdx < segment.points.length &&
                 hydrology.tiles[segment.points[endIdx].y][segment.points[endIdx].x].waterDepth > 0) {
            endIdx++;
          }

          if (endIdx < segment.points.length) {
            // Create bridge
            const bridgeStart = prev;
            const bridgeEnd = segment.points[endIdx];
            const orientation = Math.abs(bridgeEnd.x - bridgeStart.x) >
                              Math.abs(bridgeEnd.y - bridgeStart.y) ?
                              'horizontal' : 'vertical';
            const length = Math.max(
              Math.abs(bridgeEnd.x - bridgeStart.x),
              Math.abs(bridgeEnd.y - bridgeStart.y)
            );

            bridges.push({
              position: bridgeStart,
              orientation,
              length,
              material: bridgeNoise.generateAt(bridgeStart.x * 0.1, bridgeStart.y * 0.1) > 0.5 ?
                       MaterialType.STONE : MaterialType.WOOD
            });

            // Skip past this bridge
            i = endIdx;
          }
        }
      }
    }

    return bridges;
  }

  /**
   * Place decorative structures like wells and shrines
   */
  private placeDecorativeStructures(
    buildings: BuildingFootprint[],
    roadNetwork: RoadNetwork,
    vegetation: VegetationLayerData,
    context: TacticalMapContext,
    seed: Seed
  ): { x: number; y: number; type: StructureType }[] {
    const structures: { x: number; y: number; type: StructureType }[] = [];
    const decorNoise = NoiseGenerator.create(seed.getValue() * 12);

    // No decorative structures in wilderness
    if (context.development === DevelopmentLevel.WILDERNESS) {
      return structures;
    }

    // Place wells near buildings
    for (const building of buildings) {
      if (decorNoise.generateAt(building.origin.x * 0.2, building.origin.y * 0.2) > 0.7) {
        // Find spot near building
        const offsets = [
          { dx: -2, dy: 0 }, { dx: 2, dy: 0 },
          { dx: 0, dy: -2 }, { dx: 0, dy: 2 }
        ];

        for (const offset of offsets) {
          const x = building.origin.x + offset.dx;
          const y = building.origin.y + offset.dy;

          if (x >= 0 && x < this.width && y >= 0 && y < this.height &&
              vegetation.tiles[y][x].vegetationType !== VegetationType.DENSE_FOREST) {
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

  /**
   * Create tile data combining all structure properties
   */
  private createTileData(
    buildings: BuildingFootprint[],
    roadNetwork: RoadNetwork,
    bridges: BridgeLocation[],
    decorativeStructures: { x: number; y: number; type: StructureType }[],
    context: TacticalMapContext
  ): StructureTileData[][] {
    const tiles: StructureTileData[][] = [];

    // Initialize empty tiles
    for (let y = 0; y < this.height; y++) {
      tiles[y] = [];
      for (let x = 0; x < this.width; x++) {
        tiles[y][x] = {
          hasStructure: false,
          structureType: null,
          material: null,
          height: 0,
          condition: StructureCondition.GOOD,
          isPassable: true,
          providesCover: false,
          providesElevation: false,
          roadConnectivity: 0
        };
      }
    }

    // Add buildings
    for (const building of buildings) {
      for (let dy = 0; dy < building.height; dy++) {
        for (let dx = 0; dx < building.width; dx++) {
          const x = building.origin.x + dx;
          const y = building.origin.y + dy;

          if (x < this.width && y < this.height) {
            tiles[y][x] = {
              hasStructure: true,
              structureType: StructureType.BUILDING,
              material: building.material,
              height: building.type === 'tower' ? 30 : 15,
              condition: building.type === 'ruin' ?
                        StructureCondition.RUINED : StructureCondition.GOOD,
              isPassable: building.type === 'ruin',
              providesCover: true,
              providesElevation: building.type === 'tower',
              roadConnectivity: 0
            };
          }
        }
      }
    }

    // Add roads
    for (const segment of roadNetwork.segments) {
      for (const point of segment.points) {
        if (point.x < this.width && point.y < this.height) {
          // Don't overwrite buildings
          if (!tiles[point.y][point.x].hasStructure) {
            tiles[point.y][point.x] = {
              hasStructure: true,
              structureType: StructureType.ROAD,
              material: segment.material,
              height: 0,
              condition: StructureCondition.GOOD,
              isPassable: true,
              providesCover: false,
              providesElevation: false,
              roadConnectivity: this.calculateRoadConnectivity(point, roadNetwork)
            };
          }
        }
      }
    }

    // Add bridges
    for (const bridge of bridges) {
      const x = bridge.position.x;
      const y = bridge.position.y;

      if (x < this.width && y < this.height) {
        tiles[y][x] = {
          hasStructure: true,
          structureType: StructureType.BRIDGE,
          material: bridge.material,
          height: 5,
          condition: StructureCondition.GOOD,
          isPassable: true,
          providesCover: false,
          providesElevation: false,
          roadConnectivity: 2 // Bridges connect two directions
        };
      }
    }

    // Add decorative structures
    for (const structure of decorativeStructures) {
      if (structure.x < this.width && structure.y < this.height) {
        tiles[structure.y][structure.x] = {
          hasStructure: true,
          structureType: structure.type,
          material: structure.type === StructureType.WELL ?
                   MaterialType.STONE : MaterialType.WOOD,
          height: structure.type === StructureType.WELL ? 3 : 8,
          condition: StructureCondition.GOOD,
          isPassable: false,
          providesCover: structure.type === StructureType.WELL,
          providesElevation: false,
          roadConnectivity: 0
        };
      }
    }

    return tiles;
  }

  /**
   * Calculate how many directions this road tile connects
   */
  private calculateRoadConnectivity(
    point: { x: number; y: number },
    roadNetwork: RoadNetwork
  ): number {
    let connectivity = 0;
    const directions = [
      { dx: 0, dy: -1 }, // N
      { dx: 1, dy: 0 },  // E
      { dx: 0, dy: 1 },  // S
      { dx: -1, dy: 0 }  // W
    ];

    for (const dir of directions) {
      const nx = point.x + dir.dx;
      const ny = point.y + dir.dy;

      // Check if neighbor is also a road
      for (const segment of roadNetwork.segments) {
        if (segment.points.some(p => p.x === nx && p.y === ny)) {
          connectivity++;
          break;
        }
      }
    }

    return connectivity;
  }
}