import {
  IFeatureMixingService,
  CompatibilityLevel,
  FeatureInteraction,
  InteractionAspect,
  FeatureMixingSettings,
  MapFeature,
  MapTile,
  FeatureCategory
} from '@lazy-map/domain';

/**
 * Simple implementation of feature mixing service
 */
export class FeatureMixingService implements IFeatureMixingService {
  getFeatureCompatibility(feature1: MapFeature, feature2: MapFeature): CompatibilityLevel {
    // Simple compatibility logic based on categories
    if (feature1.category === feature2.category) {
      return CompatibilityLevel.COMPATIBLE;
    }
    
    // Relief features can mix with natural features
    if (
      (feature1.category === FeatureCategory.RELIEF && feature2.category === FeatureCategory.NATURAL) ||
      (feature1.category === FeatureCategory.NATURAL && feature2.category === FeatureCategory.RELIEF)
    ) {
      return CompatibilityLevel.SYNERGISTIC;
    }
    
    // Cultural and artificial features are neutral with most others
    if (
      feature1.category === FeatureCategory.CULTURAL || 
      feature2.category === FeatureCategory.CULTURAL ||
      feature1.category === FeatureCategory.ARTIFICIAL || 
      feature2.category === FeatureCategory.ARTIFICIAL
    ) {
      return CompatibilityLevel.NEUTRAL;
    }
    
    return CompatibilityLevel.NEUTRAL;
  }

  calculateFeatureInteraction(
    primaryFeature: MapFeature,
    secondaryFeature: MapFeature
  ): FeatureInteraction {
    const compatibility = this.getFeatureCompatibility(primaryFeature, secondaryFeature);
    
    return {
      compatibility,
      dominantFeature: {
        [InteractionAspect.TERRAIN]: primaryFeature.id.value,
        [InteractionAspect.HEIGHT]: primaryFeature.priority > secondaryFeature.priority ? primaryFeature.id.value : secondaryFeature.id.value,
        [InteractionAspect.MOVEMENT]: primaryFeature.id.value,
        [InteractionAspect.BLOCKING]: primaryFeature.id.value,
        [InteractionAspect.VISUAL]: primaryFeature.priority > secondaryFeature.priority ? primaryFeature.id.value : secondaryFeature.id.value,
      },
      heightBlending: compatibility === CompatibilityLevel.SYNERGISTIC ? 'average' : 'dominant'
    };
  }

  applyFeatureMixing(
    tile: MapTile,
    features: MapFeature[],
    _settings: FeatureMixingSettings
  ): MapTile {
    // Simple implementation - just return the original tile
    // In a more complex implementation, this would modify tile properties
    if (features.length === 0) {
      return tile;
    }
    
    // Set primary feature if not already set
    if (!tile.primaryFeatureId && features.length > 0) {
      const primaryFeature = features.reduce((prev, current) => 
        prev.priority > current.priority ? prev : current
      );
      tile.setPrimaryFeature(primaryFeature.id.value);
    }
    
    return tile;
  }

  getCompatibleFeatures(
    primaryFeature: MapFeature,
    candidateFeatures: MapFeature[]
  ): MapFeature[] {
    return candidateFeatures.filter(feature => 
      this.getFeatureCompatibility(primaryFeature, feature) >= CompatibilityLevel.NEUTRAL
    );
  }

  validateMixingSettings(settings: FeatureMixingSettings): string[] {
    const errors: string[] = [];
    
    if (settings.mixingProbability < 0 || settings.mixingProbability > 1) {
      errors.push('Mixing probability must be between 0 and 1');
    }
    
    if (settings.maxMixingDepth < 1) {
      errors.push('Max mixing depth must be at least 1');
    }
    
    return errors;
  }
}