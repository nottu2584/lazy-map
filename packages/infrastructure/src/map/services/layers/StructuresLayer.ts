import {
  TacticalMapContext,
  Seed,
  NoiseGenerator,
  DevelopmentLevel,
  Building,
  BuildingType,
  BuildingContext,
  BuildingSite,
  SpaceRequirements,
  IBuildingGenerationService,
  ISettlementPlanningService,
  SettlementSize,
  HistoricalPeriod,
  SuitabilityMap,
  SettlementPlan,
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
  VegetationType,
  VegetationLayerData,
  HydrologyLayerData,
  TopographyLayerData
} from '@lazy-map/domain';
import { BuildingGenerationService } from '../../../contexts/artificial/services/BuildingGenerationService';

/**
 * Bridge location information
 */
interface BridgeLocation {
  position: { x: number; y: number };
  material: MaterialType;
  length: number;
  direction: 'horizontal' | 'vertical';
}

/**
 * Generates artificial structures based on development level and terrain
 * Creates buildings, roads, bridges, and other human-made features
 * Now uses the new building generation system with interiors
 */
export class StructuresLayer implements IStructuresLayerService {
  private width: number = 0;
  private height: number = 0;
  private logger?: ILogger;
  private buildingGenerator: IBuildingGenerationService;

  constructor(logger?: ILogger) {
    this.logger = logger;
    this.buildingGenerator = new BuildingGenerationService(logger);
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
    const buildings = await this.placeBuildings(
      buildingSites,
      context.development,
      context,
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

    // 4. Bridge generation - not yet implemented as entities
    // See: docs/features/planned/bridge-generation-system.md
    // For now, bridges exist only in tile data
    const bridges: Bridge[] = [];
    // Generate bridge locations for tile placement
    const bridgeLocations = this.placeBridges(
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
      bridgeLocations,
      decorativeStructures,
      context
    );

    // 7. Calculate statistics
    const totalStructureCount = buildings.length + bridgeLocations.length + decorativeStructures.length;

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
        if (vegetation.tiles[y][x].vegetationType === VegetationType.DENSE_TREES) continue;

        // Calculate site quality
        let quality = 1.0;

        // Prefer clearings
        if (vegetation.tiles[y][x].vegetationType === VegetationType.NONE ||
            vegetation.tiles[y][x].vegetationType === VegetationType.GRASS) {
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
        if (vegetation.tiles[ny][nx].vegetationType === VegetationType.DENSE_TREES) return false;
      }
    }
    return true;
  }

  /**
   * Place buildings based on development level
   * Now uses the new building generation system with interiors
   */
  private async placeBuildings(
    sites: { x: number; y: number; quality: number }[],
    developmentLevel: DevelopmentLevel,
    context: TacticalMapContext,
    seed: Seed
  ): Promise<Building[]> {
    const buildings: Building[] = [];
    const buildingNoise = NoiseGenerator.create(seed.getValue() * 10);

    // Determine number of buildings based on development level
    let buildingCount = 0;
    switch (developmentLevel) {
      case DevelopmentLevel.WILDERNESS:
        buildingCount = 0;
        break;
      case DevelopmentLevel.FRONTIER:
        buildingCount = Math.min(1, sites.length);
        break;
      case DevelopmentLevel.RURAL:
        buildingCount = Math.min(3, sites.length);
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

    // Create building context from tactical map context
    const buildingContext: BuildingContext = {
      biome: context.biome || 'temperate',
      wealthLevel: this.getWealthFromDevelopment(developmentLevel),
      developmentLevel: developmentLevel,
      historicalPeriod: 'high_medieval',
      climate: context.season === 'winter' ? 'cold' : 'temperate',
      purpose: undefined
    };

    // Place buildings at best sites
    const usedSites = new Set<string>();
    for (let i = 0; i < buildingCount && i < sites.length; i++) {
      const site = sites[i];

      // Skip if too close to existing building
      let tooClose = false;
      for (const existing of buildings) {
        const dist = Math.sqrt(
          Math.pow(site.x - existing.getPosition().x, 2) +
          Math.pow(site.y - existing.getPosition().y, 2)
        );
        if (dist < 5) {
          tooClose = true;
          break;
        }
      }
      if (tooClose) continue;

      // Determine building type based on development level
      const buildingRandom = buildingNoise.generateAt(site.x * 0.1, site.y * 0.1);
      let buildingType: BuildingType;
      let width: number;
      let height: number;

      if (developmentLevel === DevelopmentLevel.FRONTIER) {
        buildingType = BuildingType.HUT;
        width = 10;
        height = 10;
      } else if (developmentLevel === DevelopmentLevel.RURAL) {
        buildingType = buildingRandom < 0.5 ? BuildingType.COTTAGE : BuildingType.BARN;
        width = buildingRandom < 0.5 ? 20 : 25;
        height = buildingRandom < 0.5 ? 20 : 20;
      } else if (developmentLevel === DevelopmentLevel.SETTLED) {
        if (buildingRandom < 0.5) {
          buildingType = BuildingType.HOUSE;
          width = 20;
          height = 25;
        } else if (buildingRandom < 0.8) {
          buildingType = BuildingType.FARMHOUSE;
          width = 30;
          height = 25;
        } else if (buildingRandom < 0.95) {
          buildingType = BuildingType.TAVERN;
          width = 35;
          height = 30;
        } else {
          buildingType = BuildingType.CHURCH;
          width = 40;
          height = 35;
        }
      } else if (developmentLevel === DevelopmentLevel.URBAN) {
        if (buildingRandom < 0.4) {
          buildingType = BuildingType.TOWNHOUSE;
          width = 15 + Math.floor(buildingRandom * 10);
          height = 20 + Math.floor(buildingRandom * 10);
        } else if (buildingRandom < 0.7) {
          buildingType = BuildingType.HOUSE;
          width = 25;
          height = 25;
        } else if (buildingRandom < 0.9) {
          buildingType = BuildingType.MANOR;
          width = 45;
          height = 40;
        } else {
          buildingType = BuildingType.TOWER;
          width = 15;
          height = 15;
        }
      } else {
        // Default or ruins
        buildingType = BuildingType.COTTAGE;
        width = 20;
        height = 20;
      }

      // Create building site
      const buildingSite: BuildingSite = {
        position: new Position(site.x * 5, site.y * 5), // Convert to feet
        width: width,
        height: height,
        slope: 0, // Will be calculated from topography
        adjacentBuildings: buildings,
        availableSpace: { width, height },
        constraints: { maxHeight: 50 } // Add required maxHeight constraint
      };

      // Generate the building with new system
      try {
        const buildingSeed = Seed.fromNumber(seed.getValue() + i * 1000);
        const building = await this.buildingGenerator.generateBuilding(
          buildingType,
          buildingSite,
          buildingContext,
          buildingSeed
        );

        // Optionally generate interior for important buildings
        const shouldHaveInterior =
          buildingType === BuildingType.TAVERN ||
          buildingType === BuildingType.CHURCH ||
          buildingType === BuildingType.MANOR ||
          (buildingType === BuildingType.HOUSE && buildingRandom > 0.7);

        if (shouldHaveInterior) {
          const requirements = this.getDefaultRequirements(buildingType);
          const interiorSeed = Seed.fromNumber(buildingSeed.getValue() + 500);
          const buildingWithInterior = await this.buildingGenerator.generateInteriorLayout(
            building,
            requirements,
            interiorSeed
          );
          buildings.push(buildingWithInterior);
        } else {
          buildings.push(building);
        }

        // Mark site as used
        const footprint = building.getFootprint();
        for (let dy = 0; dy < Math.ceil(footprint.getHeight() / 5); dy++) {
          for (let dx = 0; dx < Math.ceil(footprint.getWidth() / 5); dx++) {
            usedSites.add(`${site.x + dx},${site.y + dy}`);
          }
        }
      } catch (error) {
        this.logger?.warn('Failed to generate building', {
          metadata: { site, type: buildingType, error: error instanceof Error ? error.message : 'Unknown error' }
        });
      }
    }

    return buildings;
  }

  /**
   * Get wealth level from development level
   */
  private getWealthFromDevelopment(development: DevelopmentLevel): number {
    switch (development) {
      case DevelopmentLevel.WILDERNESS: return 0.1;
      case DevelopmentLevel.FRONTIER: return 0.2;
      case DevelopmentLevel.RURAL: return 0.3;
      case DevelopmentLevel.SETTLED: return 0.5;
      case DevelopmentLevel.URBAN: return 0.7;
      case DevelopmentLevel.RUINS: return 0.2;
      default: return 0.3;
    }
  }

  /**
   * Get default space requirements for building type
   */
  private getDefaultRequirements(type: BuildingType): SpaceRequirements {
    switch (type) {
      case BuildingType.TAVERN:
        return {
          requiredRooms: [
            { type: 'common_room', count: 1, minSize: 150 },
            { type: 'kitchen', count: 1, minSize: 60 },
            { type: 'storage', count: 1, minSize: 40 }
          ],
          optionalRooms: [
            { type: 'private_room', count: 3, minSize: 50 }
          ]
        };
      case BuildingType.CHURCH:
        return {
          requiredRooms: [
            { type: 'sanctuary', count: 1, minSize: 200 },
            { type: 'vestry', count: 1, minSize: 40 }
          ],
          optionalRooms: []
        };
      case BuildingType.MANOR:
        return {
          requiredRooms: [
            { type: 'hall', count: 1, minSize: 200 },
            { type: 'kitchen', count: 1, minSize: 80 },
            { type: 'bedroom', count: 4, minSize: 60 }
          ],
          optionalRooms: [
            { type: 'study', count: 1, minSize: 50 }
          ]
        };
      case BuildingType.HOUSE:
        return {
          requiredRooms: [
            { type: 'hall', count: 1, minSize: 60 },
            { type: 'bedroom', count: 2, minSize: 50 }
          ],
          optionalRooms: []
        };
      default:
        return { requiredRooms: [], optionalRooms: [] };
    }
  }

  /**
   * Generate road network using pathfinding
   */
  private generateRoadNetwork(
    buildings: Building[],
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
            const fromPos = from.getPosition();
            const toPos = to.getPosition();
            const dist = Math.sqrt(
              Math.pow(toPos.x - fromPos.x, 2) +
              Math.pow(toPos.y - fromPos.y, 2)
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
          const fromPos = from.getPosition();
          const toPos = to.getPosition();
          const path = this.findRoadPath(
            { x: Math.floor(fromPos.x / 5), y: Math.floor(fromPos.y / 5) },
            { x: Math.floor(toPos.x / 5), y: Math.floor(toPos.y / 5) },
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
              direction: orientation,
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
    buildings: Building[],
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

          if (x >= 0 && x < this.width && y >= 0 && y < this.height &&
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

  /**
   * Create tile data combining all structure properties
   */
  private createTileData(
    buildings: Building[],
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

          if (x < this.width && y < this.height) {
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
        if (point.x < this.width && point.y < this.height) {
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

      if (x < this.width && y < this.height) {
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
      if (structure.x < this.width && structure.y < this.height) {
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