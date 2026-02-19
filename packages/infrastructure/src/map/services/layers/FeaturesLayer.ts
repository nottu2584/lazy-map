import {
  TacticalMapContext,
  Seed,
  NoiseGenerator,
  TerrainFeature,
  Position,
  MapGenerationErrors,
  type ILogger,
  BuildingType,
  VegetationType,
  // Import from domain layer service interfaces
  IFeaturesLayerService,
  FeaturesLayerData,
  FeatureTileData,
  FeatureType,
  HazardLevel,
  VisibilityLevel,
  InteractionType,
  HazardLocation,
  ResourceLocation,
  LandmarkLocation,
  TacticalFeatureLocation,
  GeologyLayerData,
  TopographyLayerData,
  HydrologyLayerData,
  VegetationLayerData,
  StructuresLayerData
} from '@lazy-map/domain';

/**
 * Generates interesting features, hazards, and resources
 * Adds the final layer of detail for tactical gameplay
 */
export class FeaturesLayer implements IFeaturesLayerService {
  private width: number = 0;
  private height: number = 0;
  private logger?: ILogger;

  constructor(logger?: ILogger) {
    this.logger = logger;
  }

  /**
   * Generate features layer from all previous layers
   */
  async generate(
    layers: {
      geology: GeologyLayerData;
      topography: TopographyLayerData;
      hydrology: HydrologyLayerData;
      vegetation: VegetationLayerData;
      structures: StructuresLayerData;
    },
    context: TacticalMapContext,
    seed: Seed
  ): Promise<FeaturesLayerData> {
    if (!layers.geology || !layers.geology.tiles) {
      throw MapGenerationErrors.invalidLayerDependency('features', 'geology');
    }

    this.width = layers.geology.tiles[0].length;
    this.height = layers.geology.tiles.length;

    this.logger?.info('Starting features layer generation', {
      metadata: {
        width: this.width,
        height: this.height,
        seed: seed.getValue()
      }
    });

    try {
      // 1. Place hazards based on terrain conditions
      const hazards = this.placeHazards(layers, context, seed);
      this.logger?.debug('Placed hazards', { metadata: { count: hazards.length } });

      // 2. Place resources in appropriate locations
      const resources = this.placeResources(layers, context, seed);
      this.logger?.debug('Placed resources', { metadata: { count: resources.length } });

      // 3. Place landmarks at interesting locations
      const landmarks = this.placeLandmarks(layers, context, seed);
      this.logger?.debug('Placed landmarks', { metadata: { count: landmarks.length } });

      // 4. Identify tactical features
      const tacticalFeatures = this.identifyTacticalFeatures(layers, context, seed);
      this.logger?.debug('Identified tactical features', { metadata: { count: tacticalFeatures.length } });

      // 5. Create tile data
      const tiles = this.createTileData(
        hazards,
        resources,
        landmarks,
        tacticalFeatures,
        layers
      );

      // 6. Calculate statistics
      const totalFeatureCount = hazards.length + resources.length +
                               landmarks.length + tacticalFeatures.length;

      this.logger?.info('Features layer generation complete', {
        metadata: {
          hazards: hazards.length,
          resources: resources.length,
          landmarks: landmarks.length,
          tacticalFeatures: tacticalFeatures.length,
          totalFeatures: totalFeatureCount
        }
      });

      return {
        tiles,
        hazards,
        resources,
        landmarks,
        tacticalFeatures,
        totalFeatureCount
      };
    } catch (error) {
      this.logger?.error('Failed to generate features layer', { metadata: { error: (error as Error).message } });
      throw MapGenerationErrors.layerGenerationFailed('features', error as Error);
    }
  }

  /**
   * Place hazards based on terrain conditions
   */
  private placeHazards(
    layers: {
      geology: GeologyLayerData;
      topography: TopographyLayerData;
      hydrology: HydrologyLayerData;
      vegetation: VegetationLayerData;
      structures: StructuresLayerData;
    },
    context: TacticalMapContext,
    seed: Seed
  ): HazardLocation[] {
    const hazards: HazardLocation[] = [];
    const hazardNoise = NoiseGenerator.create(seed.getValue() * 13);

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        // Skip areas with structures
        if (layers.structures.tiles[y][x].hasStructure) continue;

        const random = hazardNoise.generateAt(x * 0.15, y * 0.15);

        // Quicksand in wetlands
        if (layers.hydrology.tiles[y][x].moisture === 'saturated' &&
            layers.topography.tiles[y][x].slope < 5 &&
            random > 0.9) {
          hazards.push({
            position: new Position(x, y),
            type: FeatureType.QUICKSAND,
            level: HazardLevel.SEVERE,
            radius: 1
          });
        }

        // Unstable ground on steep slopes
        if (layers.topography.tiles[y][x].slope > 50 &&
            layers.geology.tiles[y][x].features.includes(TerrainFeature.TALUS) &&
            random > 0.85) {
          hazards.push({
            position: new Position(x, y),
            type: FeatureType.UNSTABLE_GROUND,
            level: HazardLevel.MODERATE,
            radius: 2
          });
        }

        // Poison plants in dense vegetation
        if (layers.vegetation.tiles[y][x].vegetationType === VegetationType.DENSE_TREES &&
            random > 0.95) {
          hazards.push({
            position: new Position(x, y),
            type: FeatureType.POISON_PLANTS,
            level: HazardLevel.MINOR,
            radius: 1
          });
        }

        // Animal dens in suitable locations
        if (layers.geology.tiles[y][x].features.includes(TerrainFeature.CAVE) &&
            layers.vegetation.tiles[y][x].vegetationType !== 'none' &&
            random > 0.8) {
          hazards.push({
            position: new Position(x, y),
            type: FeatureType.ANIMAL_DEN,
            level: HazardLevel.MODERATE,
            radius: 3
          });
        }
      }
    }

    return hazards;
  }

  /**
   * Place resources in appropriate locations
   */
  private placeResources(
    layers: {
      geology: GeologyLayerData;
      topography: TopographyLayerData;
      hydrology: HydrologyLayerData;
      vegetation: VegetationLayerData;
      structures: StructuresLayerData;
    },
    context: TacticalMapContext,
    seed: Seed
  ): ResourceLocation[] {
    const resources: ResourceLocation[] = [];
    const resourceNoise = NoiseGenerator.create(seed.getValue() * 14);

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const random = resourceNoise.generateAt(x * 0.2, y * 0.2);

        // Medicinal herbs in forest clearings
        const isClearing = layers.vegetation.clearings.some(c =>
          Math.sqrt(Math.pow(c.x - x, 2) + Math.pow(c.y - y, 2)) <= c.radius
        );
        if (isClearing && random > 0.8) {
          resources.push({
            position: new Position(x, y),
            type: FeatureType.MEDICINAL_HERBS,
            quantity: Math.ceil(random * 5),
            quality: random
          });
        }

        // Berries at forest edges
        if (layers.vegetation.tiles[y][x].vegetationType === VegetationType.SPARSE_TREES &&
            random > 0.85) {
          resources.push({
            position: new Position(x, y),
            type: FeatureType.BERRIES,
            quantity: Math.ceil(random * 3),
            quality: random * 0.8
          });
        }

        // Fresh water at springs
        if (layers.hydrology.tiles[y][x].isSpring && random > 0.5) {
          resources.push({
            position: new Position(x, y),
            type: FeatureType.FRESH_WATER,
            quantity: 10,
            quality: 1.0
          });
        }

        // Mineral deposits in exposed rock
        if (layers.geology.tiles[y][x].soilDepth < 0.5 &&
            layers.geology.tiles[y][x].features.length > 0 &&
            random > 0.9) {
          resources.push({
            position: new Position(x, y),
            type: FeatureType.MINERAL_DEPOSIT,
            quantity: Math.ceil(random * 7),
            quality: random * 0.7
          });
        }
      }
    }

    return resources;
  }

  /**
   * Place landmarks at interesting locations
   */
  private placeLandmarks(
    layers: {
      geology: GeologyLayerData;
      topography: TopographyLayerData;
      hydrology: HydrologyLayerData;
      vegetation: VegetationLayerData;
      structures: StructuresLayerData;
    },
    context: TacticalMapContext,
    seed: Seed
  ): LandmarkLocation[] {
    const landmarks: LandmarkLocation[] = [];
    const landmarkNoise = NoiseGenerator.create(seed.getValue() * 15);

    // Ancient trees in old forests
    for (let y = 2; y < this.height - 2; y++) {
      for (let x = 2; x < this.width - 2; x++) {
        if (layers.vegetation.tiles[y][x].vegetationType === VegetationType.DENSE_TREES &&
            layers.vegetation.tiles[y][x].canopyHeight > 30 &&
            landmarkNoise.generateAt(x * 0.1, y * 0.1) > 0.95) {
          landmarks.push({
            position: new Position(x, y),
            type: FeatureType.ANCIENT_TREE,
            significance: 0.7,
            lore: "An ancient tree, centuries old, its gnarled roots tell stories of ages past"
          });
        }
      }
    }

    // Standing stones on high ground
    for (const ridge of this.findRidges(layers.topography)) {
      if (landmarkNoise.generateAt(ridge.x * 0.15, ridge.y * 0.15) > 0.9) {
        landmarks.push({
          position: new Position(ridge.x, ridge.y),
          type: FeatureType.STANDING_STONES,
          significance: 0.8,
          lore: "Weathered stones arranged in an ancient pattern, their purpose lost to time"
        });
      }
    }

    // Cave entrances
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (layers.geology.tiles[y][x].features.includes(TerrainFeature.CAVE) &&
            landmarkNoise.generateAt(x * 0.2, y * 0.2) > 0.85) {
          landmarks.push({
            position: new Position(x, y),
            type: FeatureType.CAVE_ENTRANCE,
            significance: 0.6,
            lore: "A dark opening in the rock face beckons the brave or foolish"
          });
        }
      }
    }

    // Battlefield remains near ruins
    for (const building of layers.structures.buildings) {
      const pos = building.getPosition();
      if (building.isRuin() &&
          landmarkNoise.generateAt(pos.x * 0.1, pos.y * 0.1) > 0.7) {
        landmarks.push({
          position: new Position(pos.x, pos.y),
          type: FeatureType.BATTLEFIELD_REMAINS,
          significance: 0.5,
          lore: "Rusted weapons and broken shields tell of a forgotten battle"
        });
      }
    }

    return landmarks;
  }

  /**
   * Identify tactical features from terrain
   */
  private identifyTacticalFeatures(
    layers: {
      geology: GeologyLayerData;
      topography: TopographyLayerData;
      hydrology: HydrologyLayerData;
      vegetation: VegetationLayerData;
      structures: StructuresLayerData;
    },
    context: TacticalMapContext,
    seed: Seed
  ): TacticalFeatureLocation[] {
    const features: TacticalFeatureLocation[] = [];
    const tacticalNoise = NoiseGenerator.create(seed.getValue() * 16);

    // High ground positions
    const highPoints = this.findHighPoints(layers.topography);
    for (const point of highPoints) {
      if (layers.vegetation.tiles[point.y][point.x].isPassable &&
          tacticalNoise.generateAt(point.x * 0.1, point.y * 0.1) > 0.7) {
        features.push({
          position: new Position(point.x, point.y),
          type: FeatureType.HIGH_GROUND,
          controlRadius: 5
        });
      }
    }

    // Choke points in valleys
    const chokePoints = this.findChokePoints(layers.topography, layers.vegetation);
    for (const choke of chokePoints) {
      features.push({
        position: new Position(choke.x, choke.y),
        type: FeatureType.CHOKE_POINT,
        controlRadius: 3
      });
    }

    // Ambush sites in dense vegetation near roads
    for (const segment of layers.structures.roads.segments) {
      for (const point of segment.points) {
        // Check adjacent tiles for dense vegetation
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            if (dx === 0 && dy === 0) continue;
            const x = point.x + dx;
            const y = point.y + dy;

            if (x >= 0 && x < this.width && y >= 0 && y < this.height &&
                layers.vegetation.tiles[y][x].providesConcealment &&
                tacticalNoise.generateAt(x * 0.2, y * 0.2) > 0.85) {
              features.push({
                position: new Position(x, y),
                type: FeatureType.AMBUSH_SITE,
                controlRadius: 2
              });
            }
          }
        }
      }
    }

    // Vantage points on elevated structures
    for (const building of layers.structures.buildings) {
      if (building.getType() === BuildingType.TOWER) {
        const pos = building.getPosition();
        features.push({
          position: new Position(pos.x, pos.y),
          type: FeatureType.VANTAGE_POINT,
          controlRadius: 8
        });
      }
    }

    return features;
  }

  /**
   * Find ridge positions
   */
  private findRidges(topography: TopographyLayerData): { x: number; y: number }[] {
    const ridges: { x: number; y: number }[] = [];

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (topography.tiles[y][x].isRidge) {
          ridges.push({ x, y });
        }
      }
    }

    return ridges;
  }

  /**
   * Find high elevation points
   */
  private findHighPoints(topography: TopographyLayerData): { x: number; y: number }[] {
    const points: { x: number; y: number }[] = [];
    const threshold = topography.maxElevation * 0.8;

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (topography.tiles[y][x].elevation >= threshold) {
          points.push({ x, y });
        }
      }
    }

    return points;
  }

  /**
   * Find natural choke points
   */
  private findChokePoints(
    topography: TopographyLayerData,
    vegetation: VegetationLayerData
  ): { x: number; y: number }[] {
    const chokePoints: { x: number; y: number }[] = [];

    for (let y = 1; y < this.height - 1; y++) {
      for (let x = 1; x < this.width - 1; x++) {
        // Look for narrow passages
        if (topography.tiles[y][x].isValley && vegetation.tiles[y][x].isPassable) {
          // Check if surrounded by impassable terrain
          let blockedSides = 0;
          if (!vegetation.tiles[y-1][x].isPassable) blockedSides++;
          if (!vegetation.tiles[y+1][x].isPassable) blockedSides++;
          if (!vegetation.tiles[y][x-1].isPassable) blockedSides++;
          if (!vegetation.tiles[y][x+1].isPassable) blockedSides++;

          if (blockedSides >= 2) {
            chokePoints.push({ x, y });
          }
        }
      }
    }

    return chokePoints;
  }

  /**
   * Create tile data combining all feature properties
   */
  private createTileData(
    hazards: HazardLocation[],
    resources: ResourceLocation[],
    landmarks: LandmarkLocation[],
    tacticalFeatures: TacticalFeatureLocation[],
    _layers: {
      geology: GeologyLayerData;
      topography: TopographyLayerData;
      hydrology: HydrologyLayerData;
      vegetation: VegetationLayerData;
      structures: StructuresLayerData;
    }
  ): FeatureTileData[][] {
    const tiles: FeatureTileData[][] = [];

    // Initialize empty tiles
    for (let y = 0; y < this.height; y++) {
      tiles[y] = [];
      for (let x = 0; x < this.width; x++) {
        tiles[y][x] = {
          hasFeature: false,
          featureType: null,
          hazardLevel: HazardLevel.NONE,
          resourceValue: 0,
          visibility: VisibilityLevel.OBVIOUS,
          interactionType: null,
          description: null
        };
      }
    }

    // Add hazards
    for (const hazard of hazards) {
      const x = hazard.position.x;
      const y = hazard.position.y;

      tiles[y][x] = {
        hasFeature: true,
        featureType: hazard.type,
        hazardLevel: hazard.level,
        resourceValue: 0,
        visibility: hazard.type === FeatureType.QUICKSAND ?
                   VisibilityLevel.HIDDEN : VisibilityLevel.NOTICEABLE,
        interactionType: InteractionType.AVOID,
        description: this.getHazardDescription(hazard.type)
      };
    }

    // Add resources (don't overwrite hazards)
    for (const resource of resources) {
      const x = resource.position.x;
      const y = resource.position.y;

      if (!tiles[y][x].hasFeature) {
        tiles[y][x] = {
          hasFeature: true,
          featureType: resource.type,
          hazardLevel: HazardLevel.NONE,
          resourceValue: resource.quality,
          visibility: resource.type === FeatureType.MEDICINAL_HERBS ?
                     VisibilityLevel.HIDDEN : VisibilityLevel.NOTICEABLE,
          interactionType: InteractionType.HARVEST,
          description: this.getResourceDescription(resource.type, resource.quantity)
        };
      }
    }

    // Add landmarks (highest priority)
    for (const landmark of landmarks) {
      const x = landmark.position.x;
      const y = landmark.position.y;

      tiles[y][x] = {
        hasFeature: true,
        featureType: landmark.type,
        hazardLevel: HazardLevel.NONE,
        resourceValue: 0,
        visibility: VisibilityLevel.OBVIOUS,
        interactionType: InteractionType.INVESTIGATE,
        description: landmark.lore
      };
    }

    // Add tactical features (overlay, don't replace)
    for (const feature of tacticalFeatures) {
      const x = feature.position.x;
      const y = feature.position.y;

      if (!tiles[y][x].hasFeature) {
        tiles[y][x] = {
          hasFeature: true,
          featureType: feature.type,
          hazardLevel: HazardLevel.NONE,
          resourceValue: 0,
          visibility: VisibilityLevel.OBVIOUS,
          interactionType: InteractionType.PASSIVE,
          description: this.getTacticalDescription(feature.type)
        };
      }
    }

    return tiles;
  }

  /**
   * Get hazard description
   */
  private getHazardDescription(type: FeatureType): string {
    switch (type) {
      case FeatureType.QUICKSAND:
        return "Treacherous quicksand that can trap the unwary";
      case FeatureType.UNSTABLE_GROUND:
        return "Loose rocks and debris make footing treacherous";
      case FeatureType.POISON_PLANTS:
        return "Toxic vegetation that causes harm on contact";
      case FeatureType.ANIMAL_DEN:
        return "Signs of dangerous wildlife nearby";
      default:
        return "A potential hazard";
    }
  }

  /**
   * Get resource description
   */
  private getResourceDescription(type: FeatureType, quantity: number): string {
    switch (type) {
      case FeatureType.MEDICINAL_HERBS:
        return `${quantity} doses of healing herbs grow here`;
      case FeatureType.BERRIES:
        return `A bush heavy with ${quantity} servings of berries`;
      case FeatureType.FRESH_WATER:
        return "A source of clean, fresh water";
      case FeatureType.MINERAL_DEPOSIT:
        return `Exposed minerals worth ${quantity} gold pieces`;
      default:
        return "A valuable resource";
    }
  }

  /**
   * Get tactical feature description
   */
  private getTacticalDescription(type: FeatureType): string {
    switch (type) {
      case FeatureType.HIGH_GROUND:
        return "Elevated position providing tactical advantage";
      case FeatureType.CHOKE_POINT:
        return "Narrow passage that forces movement in single file";
      case FeatureType.AMBUSH_SITE:
        return "Natural concealment perfect for surprise attacks";
      case FeatureType.VANTAGE_POINT:
        return "Excellent visibility over the surrounding area";
      default:
        return "A tactically significant location";
    }
  }
}