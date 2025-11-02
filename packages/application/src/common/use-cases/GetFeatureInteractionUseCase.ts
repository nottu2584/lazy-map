import { MapFeature, FeatureCategory, TerrainType } from '@lazy-map/domain';
import { ReliefFeatureType } from '@lazy-map/domain';
import { NaturalFeatureType } from '@lazy-map/domain';
import { ArtificialFeatureType } from '@lazy-map/domain';
import { GetFeatureCompatibilityUseCase, CompatibilityLevel } from './GetFeatureCompatibilityUseCase';

/**
 * Interaction priorities for different aspects
 */
export enum InteractionAspect {
  TERRAIN = 'terrain',
  HEIGHT = 'height',
  MOVEMENT = 'movement',
  BLOCKING = 'blocking',
  VISUAL = 'visual',
}

/**
 * Feature interaction result
 */
export interface FeatureInteraction {
  compatibility: CompatibilityLevel;
  dominantFeature: {
    [InteractionAspect.TERRAIN]: string;
    [InteractionAspect.HEIGHT]: string;
    [InteractionAspect.MOVEMENT]: string;
    [InteractionAspect.BLOCKING]: string;
    [InteractionAspect.VISUAL]: string;
  };
  heightBlending: 'add' | 'average' | 'max' | 'dominant';
  terrainModification?: TerrainType;
  movementModification?: number;
  specialProperties?: Record<string, any>;
}

/**
 * Use case for determining how features should interact when they overlap
 */
export class GetFeatureInteractionUseCase {
  private getFeatureCompatibilityUseCase: GetFeatureCompatibilityUseCase;

  constructor() {
    this.getFeatureCompatibilityUseCase = new GetFeatureCompatibilityUseCase();
  }

  /**
   * Execute the use case
   */
  execute(primaryFeature: MapFeature, secondaryFeature: MapFeature): FeatureInteraction {
    const compatibility = this.getFeatureCompatibilityUseCase.execute(
      primaryFeature,
      secondaryFeature
    );

    // Default interaction - primary feature dominates most aspects
    let interaction: FeatureInteraction = {
      compatibility,
      dominantFeature: {
        [InteractionAspect.TERRAIN]: primaryFeature.id.value,
        [InteractionAspect.HEIGHT]: primaryFeature.id.value,
        [InteractionAspect.MOVEMENT]: primaryFeature.id.value,
        [InteractionAspect.BLOCKING]: primaryFeature.id.value,
        [InteractionAspect.VISUAL]: primaryFeature.id.value,
      },
      heightBlending: 'dominant',
    };

    // Customize interaction based on specific feature combinations
    if (this.isReliefAndNatural(primaryFeature, secondaryFeature)) {
      interaction = this.customizeReliefNaturalInteraction(
        primaryFeature,
        secondaryFeature,
        interaction
      );
    } else if (this.isReliefAndArtificial(primaryFeature, secondaryFeature)) {
      interaction = this.customizeReliefArtificialInteraction(
        primaryFeature,
        secondaryFeature,
        interaction
      );
    } else if (this.isNaturalAndArtificial(primaryFeature, secondaryFeature)) {
      interaction = this.customizeNaturalArtificialInteraction(
        primaryFeature,
        secondaryFeature,
        interaction
      );
    }

    return interaction;
  }

  // Helper methods for feature type checking
  private isReliefAndNatural(f1: MapFeature, f2: MapFeature): boolean {
    return (
      (f1.category === FeatureCategory.RELIEF && f2.category === FeatureCategory.NATURAL) ||
      (f1.category === FeatureCategory.NATURAL && f2.category === FeatureCategory.RELIEF)
    );
  }

  private isReliefAndArtificial(f1: MapFeature, f2: MapFeature): boolean {
    return (
      (f1.category === FeatureCategory.RELIEF && f2.category === FeatureCategory.ARTIFICIAL) ||
      (f1.category === FeatureCategory.ARTIFICIAL && f2.category === FeatureCategory.RELIEF)
    );
  }

  private isNaturalAndArtificial(f1: MapFeature, f2: MapFeature): boolean {
    return (
      (f1.category === FeatureCategory.NATURAL && f2.category === FeatureCategory.ARTIFICIAL) ||
      (f1.category === FeatureCategory.ARTIFICIAL && f2.category === FeatureCategory.NATURAL)
    );
  }

  // Customize Relief + Natural interactions
  private customizeReliefNaturalInteraction(
    f1: MapFeature,
    f2: MapFeature,
    interaction: FeatureInteraction
  ): FeatureInteraction {
    const reliefFeature = f1.category === FeatureCategory.RELIEF ? f1 : f2;
    const naturalFeature = f1.category === FeatureCategory.NATURAL ? f1 : f2;

    const reliefType = reliefFeature.getType() as ReliefFeatureType;
    const naturalType = naturalFeature.getType() as NaturalFeatureType;

    // Forested mountains
    if (reliefType === ReliefFeatureType.MOUNTAIN && naturalType === NaturalFeatureType.FOREST) {
      interaction.dominantFeature[InteractionAspect.TERRAIN] = naturalFeature.id.value;
      interaction.dominantFeature[InteractionAspect.HEIGHT] = reliefFeature.id.value;
      interaction.heightBlending = 'add';
      interaction.terrainModification = TerrainType.FOREST;
      interaction.movementModification = 3;
    }

    // Rivers in valleys
    if (reliefType === ReliefFeatureType.VALLEY && naturalType === NaturalFeatureType.RIVER) {
      interaction.dominantFeature[InteractionAspect.TERRAIN] = naturalFeature.id.value;
      interaction.dominantFeature[InteractionAspect.HEIGHT] = reliefFeature.id.value;
      interaction.terrainModification = TerrainType.WATER;
      interaction.heightBlending = 'average';
    }

    return interaction;
  }

  // Customize Relief + Artificial interactions
  private customizeReliefArtificialInteraction(
    f1: MapFeature,
    f2: MapFeature,
    interaction: FeatureInteraction
  ): FeatureInteraction {
    const reliefFeature = f1.category === FeatureCategory.RELIEF ? f1 : f2;
    const artificialFeature = f1.category === FeatureCategory.ARTIFICIAL ? f1 : f2;

    const reliefType = reliefFeature.getType() as ReliefFeatureType;
    const artificialType = artificialFeature.getType() as ArtificialFeatureType;

    // Mountain fortresses
    if (
      reliefType === ReliefFeatureType.MOUNTAIN &&
      artificialType === ArtificialFeatureType.FORTIFICATION
    ) {
      interaction.dominantFeature[InteractionAspect.TERRAIN] = artificialFeature.id.value;
      interaction.dominantFeature[InteractionAspect.HEIGHT] = reliefFeature.id.value;
      interaction.heightBlending = 'add';
      interaction.terrainModification = TerrainType.WALL;
      interaction.specialProperties = { fortified: true, elevated: true };
    }

    return interaction;
  }

  // Customize Natural + Artificial interactions
  private customizeNaturalArtificialInteraction(
    f1: MapFeature,
    f2: MapFeature,
    interaction: FeatureInteraction
  ): FeatureInteraction {
    const naturalFeature = f1.category === FeatureCategory.NATURAL ? f1 : f2;
    const artificialFeature = f1.category === FeatureCategory.ARTIFICIAL ? f1 : f2;

    const naturalType = naturalFeature.getType() as NaturalFeatureType;
    const artificialType = artificialFeature.getType() as ArtificialFeatureType;

    // Bridges over rivers
    if (naturalType === NaturalFeatureType.RIVER && artificialType === ArtificialFeatureType.BRIDGE) {
      interaction.dominantFeature[InteractionAspect.TERRAIN] = artificialFeature.id.value;
      interaction.dominantFeature[InteractionAspect.MOVEMENT] = artificialFeature.id.value;
      interaction.terrainModification = TerrainType.ROAD;
      interaction.heightBlending = 'add';
      interaction.specialProperties = { bridge: true, crossesWater: true };
    }

    return interaction;
  }
}