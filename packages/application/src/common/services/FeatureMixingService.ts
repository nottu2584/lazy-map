import { Injectable } from '@nestjs/common';
import { MapFeature, FeatureCategory } from '@lazy-map/domain';
import { MapTile } from '@lazy-map/domain';
import { TerrainType } from '@lazy-map/domain';
import { ReliefFeatureType } from '@lazy-map/domain';
import { NaturalFeatureType } from '@lazy-map/domain';
import { ArtificialFeatureType } from '@lazy-map/domain';
import { CulturalFeatureType } from '@lazy-map/domain';

/**
 * Feature compatibility levels
 */
export enum CompatibilityLevel {
  INCOMPATIBLE = 0, // Features cannot coexist
  NEUTRAL = 1, // Features can coexist but don't enhance each other
  COMPATIBLE = 2, // Features blend well together
  SYNERGISTIC = 3, // Features enhance each other
}

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
 * Application service for handling feature mixing and interactions
 * Determines how different map features can combine and interact
 */
@Injectable()
export class FeatureMixingService {
  /**
   * Get compatibility between two feature types
   */
  getFeatureCompatibility(
    feature1: MapFeature,
    feature2: MapFeature
  ): CompatibilityLevel {
    // Relief + Natural combinations
    if (this.isReliefAndNatural(feature1, feature2)) {
      return this.getReliefNaturalCompatibility(feature1, feature2);
    }

    // Relief + Artificial combinations
    if (this.isReliefAndArtificial(feature1, feature2)) {
      return this.getReliefArtificialCompatibility(feature1, feature2);
    }

    // Natural + Artificial combinations
    if (this.isNaturalAndArtificial(feature1, feature2)) {
      return this.getNaturalArtificialCompatibility(feature1, feature2);
    }

    // Cultural features are generally compatible with most others
    if (
      feature1.category === FeatureCategory.CULTURAL ||
      feature2.category === FeatureCategory.CULTURAL
    ) {
      return CompatibilityLevel.NEUTRAL;
    }

    // Same category features - usually neutral
    if (feature1.category === feature2.category) {
      return CompatibilityLevel.NEUTRAL;
    }

    return CompatibilityLevel.NEUTRAL;
  }

  /**
   * Calculate how features should interact when they overlap
   */
  calculateFeatureInteraction(
    primaryFeature: MapFeature,
    secondaryFeature: MapFeature
  ): FeatureInteraction {
    const compatibility = this.getFeatureCompatibility(primaryFeature, secondaryFeature);

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

  /**
   * Apply mixed features to a tile
   */
  applyFeatureMixing(
    tile: MapTile,
    features: MapFeature[],
    mixingProbability: number = 0.7
  ): MapTile {
    if (features.length === 0) return tile;

    // Sort features by priority (higher priority first)
    const sortedFeatures = [...features].sort((a, b) => b.priority - a.priority);

    // Apply features in order of priority
    let modifiedTile = tile;
    for (let i = 0; i < sortedFeatures.length - 1; i++) {
      const primaryFeature = sortedFeatures[i];
      const secondaryFeature = sortedFeatures[i + 1];

      // Calculate interaction
      const interaction = this.calculateFeatureInteraction(primaryFeature, secondaryFeature);

      // Apply interaction if compatible
      if (interaction.compatibility !== CompatibilityLevel.INCOMPATIBLE) {
        if (Math.random() < mixingProbability) {
          modifiedTile = this.applyInteractionToTile(
            modifiedTile,
            interaction,
            primaryFeature,
            secondaryFeature
          );
        }
      }
    }

    return modifiedTile;
  }

  /**
   * Apply a specific feature interaction to a tile
   */
  private applyInteractionToTile(
    tile: MapTile,
    interaction: FeatureInteraction,
    primaryFeature: MapFeature,
    secondaryFeature: MapFeature
  ): MapTile {
    // Since MapTile properties are read-only, we need to create a new tile
    // with the modified properties. This is a placeholder implementation
    // that would need to be adjusted based on MapTile's actual construction API

    // For now, just return the original tile unchanged
    // A proper implementation would create a new MapTile with updated properties
    // based on the interaction rules

    return tile;
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

  // Specific compatibility rules for Relief + Natural features
  private getReliefNaturalCompatibility(f1: MapFeature, f2: MapFeature): CompatibilityLevel {
    const reliefFeature = f1.category === FeatureCategory.RELIEF ? f1 : f2;
    const naturalFeature = f1.category === FeatureCategory.NATURAL ? f1 : f2;

    const reliefType = reliefFeature.getType() as ReliefFeatureType;
    const naturalType = naturalFeature.getType() as NaturalFeatureType;

    // Highly compatible combinations
    if (reliefType === ReliefFeatureType.MOUNTAIN && naturalType === NaturalFeatureType.FOREST) {
      return CompatibilityLevel.SYNERGISTIC; // Forested mountains
    }
    if (reliefType === ReliefFeatureType.VALLEY && naturalType === NaturalFeatureType.RIVER) {
      return CompatibilityLevel.SYNERGISTIC; // Rivers flow through valleys
    }
    if (reliefType === ReliefFeatureType.BASIN && naturalType === NaturalFeatureType.LAKE) {
      return CompatibilityLevel.SYNERGISTIC; // Lakes form in basins
    }

    // Compatible combinations
    if (reliefType === ReliefFeatureType.HILL && naturalType === NaturalFeatureType.FOREST) {
      return CompatibilityLevel.COMPATIBLE; // Forested hills
    }
    if (reliefType === ReliefFeatureType.PLATEAU && naturalType === NaturalFeatureType.CLEARING) {
      return CompatibilityLevel.COMPATIBLE; // Plateau meadows
    }

    // Incompatible combinations
    if (
      naturalType === NaturalFeatureType.CAVE_SYSTEM &&
      [ReliefFeatureType.VALLEY, ReliefFeatureType.BASIN].includes(reliefType)
    ) {
      return CompatibilityLevel.INCOMPATIBLE; // Caves don't form in valleys/basins
    }

    return CompatibilityLevel.NEUTRAL;
  }

  // Specific compatibility rules for Relief + Artificial features
  private getReliefArtificialCompatibility(f1: MapFeature, f2: MapFeature): CompatibilityLevel {
    const reliefFeature = f1.category === FeatureCategory.RELIEF ? f1 : f2;
    const artificialFeature = f1.category === FeatureCategory.ARTIFICIAL ? f1 : f2;

    const reliefType = reliefFeature.getType() as ReliefFeatureType;
    const artificialType = artificialFeature.getType() as ArtificialFeatureType;

    // Highly compatible combinations
    if (
      reliefType === ReliefFeatureType.MOUNTAIN &&
      artificialType === ArtificialFeatureType.FORTIFICATION
    ) {
      return CompatibilityLevel.SYNERGISTIC; // Mountain fortresses
    }
    if (reliefType === ReliefFeatureType.HILL && artificialType === ArtificialFeatureType.TOWER) {
      return CompatibilityLevel.SYNERGISTIC; // Hilltop towers
    }

    // Compatible combinations
    if (
      reliefType === ReliefFeatureType.PLATEAU &&
      artificialType === ArtificialFeatureType.BUILDING_COMPLEX
    ) {
      return CompatibilityLevel.COMPATIBLE; // Plateau settlements
    }

    // Incompatible combinations
    if (
      reliefType === ReliefFeatureType.CLIFF &&
      [ArtificialFeatureType.ROAD_NETWORK, ArtificialFeatureType.BUILDING_COMPLEX].includes(
        artificialType
      )
    ) {
      return CompatibilityLevel.INCOMPATIBLE; // Can't build on cliffs easily
    }

    return CompatibilityLevel.NEUTRAL;
  }

  // Specific compatibility rules for Natural + Artificial features
  private getNaturalArtificialCompatibility(f1: MapFeature, f2: MapFeature): CompatibilityLevel {
    const naturalFeature = f1.category === FeatureCategory.NATURAL ? f1 : f2;
    const artificialFeature = f1.category === FeatureCategory.ARTIFICIAL ? f1 : f2;

    const naturalType = naturalFeature.getType() as NaturalFeatureType;
    const artificialType = artificialFeature.getType() as ArtificialFeatureType;

    // Highly compatible combinations
    if (naturalType === NaturalFeatureType.RIVER && artificialType === ArtificialFeatureType.BRIDGE) {
      return CompatibilityLevel.SYNERGISTIC; // Bridges cross rivers
    }
    if (
      naturalType === NaturalFeatureType.CLEARING &&
      artificialType === ArtificialFeatureType.BUILDING_COMPLEX
    ) {
      return CompatibilityLevel.SYNERGISTIC; // Buildings in clearings
    }

    // Incompatible combinations
    if (
      [NaturalFeatureType.LAKE, NaturalFeatureType.POND, NaturalFeatureType.RIVER].includes(
        naturalType
      ) &&
      [ArtificialFeatureType.BUILDING_COMPLEX, ArtificialFeatureType.WALL_SYSTEM].includes(
        artificialType
      )
    ) {
      return CompatibilityLevel.INCOMPATIBLE; // Can't build in water
    }

    return CompatibilityLevel.NEUTRAL;
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