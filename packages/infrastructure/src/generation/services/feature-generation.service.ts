import { Dimensions } from '@lazy-map/domain';
import {
  MapFeature,
  FeatureCategory,
  ReliefFeatureType,
  NaturalFeatureType,
  ArtificialFeatureType,
  CulturalFeatureType,
  FeatureGenerationSettings,
  createFeature,
  generateRandomFeatureArea,
  createForest,
  ForestFeature,
} from '@lazy-map/domain';

export class FeatureGenerationService {
  generateFeatures(mapDimensions: Dimensions, settings: FeatureGenerationSettings): MapFeature[] {
    const features: MapFeature[] = [];

    // Generate relief features (landforms)
    if (settings.generateRelief) {
      features.push(...this.generateReliefFeatures(mapDimensions, settings));
    }

    // Generate natural features (water, vegetation)
    if (settings.generateNatural) {
      features.push(...this.generateNaturalFeatures(mapDimensions, settings));
    }

    // Generate artificial features (buildings, roads)
    if (settings.generateArtificial) {
      features.push(...this.generateArtificialFeatures(mapDimensions, settings));
    }

    // Generate cultural features (boundaries, territories)
    if (settings.generateCultural) {
      features.push(...this.generateCulturalFeatures(mapDimensions, settings));
    }

    return features;
  }

  private generateReliefFeatures(
    mapDimensions: Dimensions,
    settings: FeatureGenerationSettings,
  ): MapFeature[] {
    const features: MapFeature[] = [];
    const numFeatures = this.calculateFeatureCount(mapDimensions, settings.reliefDensity);

    for (let i = 0; i < numFeatures; i++) {
      const featureType = this.selectRandomReliefType();
      const area = generateRandomFeatureArea(
        mapDimensions,
        settings.allowOutOfBounds ? settings.outOfBoundsExtension : 0,
        settings.minFeatureSize,
        settings.maxFeatureSize,
      );

      const feature = this.createReliefFeature(featureType, area);

      // Feature is guaranteed to intersect with map bounds due to generateRandomFeatureArea logic
      features.push(feature);
    }

    return features;
  }

  private generateNaturalFeatures(
    mapDimensions: Dimensions,
    settings: FeatureGenerationSettings,
  ): MapFeature[] {
    const features: MapFeature[] = [];
    
    // Generate forests separately with their own algorithm
    if (settings.forestSettings.enabled) {
      features.push(...this.generateForests(mapDimensions, settings));
    }
    
    // Generate other natural features (excluding forests)
    const numFeatures = this.calculateFeatureCount(mapDimensions, settings.naturalDensity);

    for (let i = 0; i < numFeatures; i++) {
      const featureType = this.selectRandomNonForestNaturalType();
      const area = generateRandomFeatureArea(
        mapDimensions,
        settings.allowOutOfBounds ? settings.outOfBoundsExtension : 0,
        settings.minFeatureSize,
        settings.maxFeatureSize,
      );

      const feature = this.createNaturalFeature(featureType, area);

      // Feature is guaranteed to intersect with map bounds due to generateRandomFeatureArea logic
      features.push(feature);
    }

    return features;
  }

  private generateArtificialFeatures(
    mapDimensions: Dimensions,
    settings: FeatureGenerationSettings,
  ): MapFeature[] {
    const features: MapFeature[] = [];
    const numFeatures = this.calculateFeatureCount(mapDimensions, settings.artificialDensity);

    for (let i = 0; i < numFeatures; i++) {
      const featureType = this.selectRandomArtificialType();
      const area = generateRandomFeatureArea(
        mapDimensions,
        settings.allowOutOfBounds ? settings.outOfBoundsExtension : 0,
        settings.minFeatureSize,
        settings.maxFeatureSize,
      );

      const feature = this.createArtificialFeature(featureType, area);

      // Feature is guaranteed to intersect with map bounds due to generateRandomFeatureArea logic
      features.push(feature);
    }

    return features;
  }

  private generateCulturalFeatures(
    mapDimensions: Dimensions,
    settings: FeatureGenerationSettings,
  ): MapFeature[] {
    const features: MapFeature[] = [];
    const numFeatures = this.calculateFeatureCount(mapDimensions, settings.culturalDensity);

    for (let i = 0; i < numFeatures; i++) {
      const featureType = this.selectRandomCulturalType();
      const area = generateRandomFeatureArea(
        mapDimensions,
        settings.allowOutOfBounds ? settings.outOfBoundsExtension : 0,
        settings.minFeatureSize,
        settings.maxFeatureSize,
      );

      const feature = this.createCulturalFeature(featureType, area);

      // Feature is guaranteed to intersect with map bounds due to generateRandomFeatureArea logic
      features.push(feature);
    }

    return features;
  }

  // Relief feature creation
  private createReliefFeature(type: ReliefFeatureType, area: any): MapFeature {
    const reliefConfigs = {
      [ReliefFeatureType.MOUNTAIN]: { priority: 5, heightModifier: 3.0 },
      [ReliefFeatureType.HILL]: { priority: 3, heightModifier: 1.5 },
      [ReliefFeatureType.VALLEY]: { priority: 4, heightModifier: -1.0 },
      [ReliefFeatureType.BASIN]: { priority: 4, heightModifier: -0.5 },
      [ReliefFeatureType.RIDGE]: { priority: 3, heightModifier: 2.0 },
      [ReliefFeatureType.PLATEAU]: { priority: 4, heightModifier: 2.5 },
      [ReliefFeatureType.CLIFF]: { priority: 5, heightModifier: 4.0 },
      [ReliefFeatureType.CANYON]: { priority: 5, heightModifier: -2.0 },
      [ReliefFeatureType.DEPRESSION]: { priority: 2, heightModifier: -0.3 },
    };

    const config = reliefConfigs[type];

    return createFeature(
      this.generateFeatureName(type),
      FeatureCategory.RELIEF,
      type,
      area,
      config.priority,
      { heightModifier: config.heightModifier, reliefType: type },
    );
  }

  // Natural feature creation
  private createNaturalFeature(type: NaturalFeatureType, area: any): MapFeature {
    const naturalConfigs = {
      [NaturalFeatureType.RIVER]: { priority: 6, linear: true },
      [NaturalFeatureType.LAKE]: { priority: 5, waterFeature: true },
      [NaturalFeatureType.POND]: { priority: 3, waterFeature: true },
      [NaturalFeatureType.STREAM]: { priority: 4, linear: true, waterFeature: true },
      [NaturalFeatureType.FOREST]: { priority: 2, vegetation: true },
      [NaturalFeatureType.CLEARING]: { priority: 1, vegetation: false },
      [NaturalFeatureType.WETLAND]: { priority: 4, waterFeature: true, vegetation: true },
      [NaturalFeatureType.OASIS]: { priority: 5, waterFeature: true, vegetation: true },
      [NaturalFeatureType.CAVE_SYSTEM]: { priority: 4, underground: true },
    };

    const config = naturalConfigs[type];

    return createFeature(
      this.generateFeatureName(type),
      FeatureCategory.NATURAL,
      type,
      area,
      config.priority,
      { ...config, naturalType: type },
    );
  }

  // Artificial feature creation
  private createArtificialFeature(type: ArtificialFeatureType, area: any): MapFeature {
    const artificialConfigs = {
      [ArtificialFeatureType.ROAD_NETWORK]: { priority: 3, linear: true },
      [ArtificialFeatureType.BRIDGE]: { priority: 6, structural: true },
      [ArtificialFeatureType.WALL_SYSTEM]: { priority: 4, defensive: true },
      [ArtificialFeatureType.BUILDING_COMPLEX]: { priority: 5, structural: true },
      [ArtificialFeatureType.TOWER]: { priority: 6, structural: true, tall: true },
      [ArtificialFeatureType.FORTIFICATION]: { priority: 7, defensive: true, strategic: true },
      [ArtificialFeatureType.QUARRY]: { priority: 3, industrial: true },
      [ArtificialFeatureType.MINE]: { priority: 4, industrial: true, underground: true },
      [ArtificialFeatureType.CANAL]: { priority: 5, linear: true, waterFeature: true },
    };

    const config = artificialConfigs[type];

    return createFeature(
      this.generateFeatureName(type),
      FeatureCategory.ARTIFICIAL,
      type,
      area,
      config.priority,
      { ...config, artificialType: type },
    );
  }

  // Cultural feature creation
  private createCulturalFeature(type: CulturalFeatureType, area: any): MapFeature {
    const culturalConfigs = {
      [CulturalFeatureType.TERRITORY_BOUNDARY]: { priority: 2, boundary: true },
      [CulturalFeatureType.TRADE_ROUTE]: { priority: 4, linear: true, economic: true },
      [CulturalFeatureType.SETTLEMENT_AREA]: { priority: 5, inhabited: true },
      [CulturalFeatureType.SACRED_SITE]: { priority: 6, religious: true },
      [CulturalFeatureType.BATTLEFIELD]: { priority: 4, historical: true },
      [CulturalFeatureType.BORDER_CROSSING]: { priority: 5, boundary: true, strategic: true },
    };

    const config = culturalConfigs[type];

    return createFeature(
      this.generateFeatureName(type),
      FeatureCategory.CULTURAL,
      type,
      area,
      config.priority,
      { ...config, culturalType: type },
    );
  }

  // Helper methods
  private calculateFeatureCount(mapDimensions: Dimensions, density: number): number {
    const mapArea = mapDimensions.width * mapDimensions.height;
    // More flexible scaling: minimum 1 feature for any map when density > 0
    const baseCount = Math.max(1, Math.floor(mapArea / 50)); // 1 feature per 50 tiles
    return Math.max(density > 0 ? 1 : 0, Math.floor(baseCount * density));
  }

  private selectRandomReliefType(): ReliefFeatureType {
    const types = Object.values(ReliefFeatureType);
    return types[Math.floor(Math.random() * types.length)];
  }

  private selectRandomNaturalType(): NaturalFeatureType {
    const types = Object.values(NaturalFeatureType);
    return types[Math.floor(Math.random() * types.length)];
  }
  
  private selectRandomNonForestNaturalType(): NaturalFeatureType {
    const types = Object.values(NaturalFeatureType).filter(type => type !== NaturalFeatureType.FOREST);
    return types[Math.floor(Math.random() * types.length)];
  }

  private selectRandomArtificialType(): ArtificialFeatureType {
    const types = Object.values(ArtificialFeatureType);
    return types[Math.floor(Math.random() * types.length)];
  }

  private selectRandomCulturalType(): CulturalFeatureType {
    const types = Object.values(CulturalFeatureType);
    return types[Math.floor(Math.random() * types.length)];
  }

  private generateFeatureName(type: string): string {
    const adjectives = [
      'Ancient',
      'Great',
      'Old',
      'New',
      'Hidden',
      'Lost',
      'Sacred',
      'Deep',
      'High',
      'Vast',
    ];
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const formattedType = type
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');

    return `${adjective} ${formattedType}`;
  }
  
  // Forest generation with detailed tree placement
  private generateForests(
    mapDimensions: Dimensions,
    settings: FeatureGenerationSettings,
  ): ForestFeature[] {
    const forests: ForestFeature[] = [];
    const forestSettings = settings.forestSettings;
    
    // Calculate number of forest patches based on forest density
    const totalArea = mapDimensions.width * mapDimensions.height;
    const baseForestCount = Math.max(1, Math.floor(totalArea / 100)); // 1 forest per 100 tiles
    const numForests = Math.max(
      forestSettings.forestDensity > 0 ? 1 : 0,
      Math.floor(baseForestCount * forestSettings.forestDensity)
    );
    
    for (let i = 0; i < numForests; i++) {
      // Respect general feature size limits if they are more restrictive
      const minSize = Math.max(forestSettings.minForestSize, settings.minFeatureSize);
      const maxSize = Math.min(forestSettings.maxForestSize, settings.maxFeatureSize);
      
      const area = generateRandomFeatureArea(
        mapDimensions,
        settings.allowOutOfBounds ? settings.outOfBoundsExtension : 0,
        minSize,
        maxSize,
      );
      
      const forestName = this.generateForestName();
      const seed = Math.floor(Math.random() * 1000000); // Random seed for reproducible forests
      
      const forest = createForest(forestName, area, forestSettings, seed);
      forests.push(forest);
    }
    
    return forests;
  }
  
  private generateForestName(): string {
    const forestAdjectives = [
      'Ancient', 'Whispering', 'Dark', 'Enchanted', 'Silent',
      'Deep', 'Misty', 'Twilight', 'Emerald', 'Golden',
      'Wild', 'Sacred', 'Forgotten', 'Shadowed', 'Verdant'
    ];
    
    const forestNouns = [
      'Wood', 'Forest', 'Grove', 'Thicket', 'Woodland',
      'Copse', 'Weald', 'Timberland', 'Greenwood', 'Wildwood'
    ];
    
    const adjective = forestAdjectives[Math.floor(Math.random() * forestAdjectives.length)];
    const noun = forestNouns[Math.floor(Math.random() * forestNouns.length)];
    
    return `${adjective} ${noun}`;
  }
}
