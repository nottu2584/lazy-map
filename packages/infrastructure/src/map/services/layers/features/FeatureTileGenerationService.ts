import { Injectable, Inject, Optional } from '@nestjs/common';
import {
  type ILogger,
  FeatureType,
  HazardLevel,
  VisibilityLevel,
  InteractionType,
  FeatureTileData,
  HazardLocation,
  ResourceLocation,
  LandmarkLocation,
  TacticalFeatureLocation
} from '@lazy-map/domain';

@Injectable()
export class FeatureTileGenerationService {
  constructor(
    @Optional() @Inject('ILogger')
    private readonly logger?: ILogger
  ) {}

  createTiles(
    width: number,
    height: number,
    hazards: HazardLocation[],
    resources: ResourceLocation[],
    landmarks: LandmarkLocation[],
    tacticalFeatures: TacticalFeatureLocation[]
  ): FeatureTileData[][] {
    const tiles: FeatureTileData[][] = [];

    // Initialize empty tiles
    for (let y = 0; y < height; y++) {
      tiles[y] = [];
      for (let x = 0; x < width; x++) {
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
      const { x, y } = hazard.position;
      tiles[y][x] = {
        hasFeature: true,
        featureType: hazard.type,
        hazardLevel: hazard.level,
        resourceValue: 0,
        visibility:
          hazard.type === FeatureType.QUICKSAND
            ? VisibilityLevel.HIDDEN
            : VisibilityLevel.NOTICEABLE,
        interactionType: InteractionType.AVOID,
        description: this.getHazardDescription(hazard.type)
      };
    }

    // Add resources (don't overwrite hazards)
    for (const resource of resources) {
      const { x, y } = resource.position;
      if (!tiles[y][x].hasFeature) {
        tiles[y][x] = {
          hasFeature: true,
          featureType: resource.type,
          hazardLevel: HazardLevel.NONE,
          resourceValue: resource.quality,
          visibility:
            resource.type === FeatureType.MEDICINAL_HERBS
              ? VisibilityLevel.HIDDEN
              : VisibilityLevel.NOTICEABLE,
          interactionType: InteractionType.HARVEST,
          description: this.getResourceDescription(resource.type, resource.quantity)
        };
      }
    }

    // Add landmarks (highest priority — always overwrites)
    for (const landmark of landmarks) {
      const { x, y } = landmark.position;
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

    // Add tactical features (don't overwrite existing features)
    for (const feature of tacticalFeatures) {
      const { x, y } = feature.position;
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

    this.logger?.debug('Created feature tile data', { metadata: { width, height } });

    return tiles;
  }

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
