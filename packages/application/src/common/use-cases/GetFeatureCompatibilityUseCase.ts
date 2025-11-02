import { MapFeature, FeatureCategory } from '@lazy-map/domain';
import { ReliefFeatureType } from '@lazy-map/domain';
import { NaturalFeatureType } from '@lazy-map/domain';
import { ArtificialFeatureType } from '@lazy-map/domain';

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
 * Use case for determining compatibility between two map features
 */
export class GetFeatureCompatibilityUseCase {
  /**
   * Execute the use case
   */
  execute(feature1: MapFeature, feature2: MapFeature): CompatibilityLevel {
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
}