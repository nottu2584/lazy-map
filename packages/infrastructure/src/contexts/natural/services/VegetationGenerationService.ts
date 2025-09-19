import {
  IVegetationService,
  ForestGenerationOptions,
  GrasslandGenerationSettings,
  BiomeType,
  IRandomGenerator,
  VegetationGenerationResult,
  Forest,
  Grassland,
  GrasslandType,
  Plant,
  PlantCategory,
  PlantSpecies,
  TreePlant,
  ShrubPlant,
  HerbaceousPlant,
  GroundCoverPlant,
  PlantSize,
  PlantProperties,
  SpatialBounds,
  SubTilePosition,
  FeatureId
} from '@lazy-map/domain';

/**
 * Implementation of vegetation generation service
 */
export class VegetationGenerationService implements IVegetationService {
  
  async generateEnhancedForest(
    area: SpatialBounds,
    settings: ForestGenerationOptions,
    biome: BiomeType,
    randomGenerator: IRandomGenerator
  ): Promise<{ forest: Forest; result: VegetationGenerationResult }> {
    try {
      const plants: Plant[] = [];
      let generatedTrees = 0;
      let _generatedUnderstory = 0;

      // Generate trees first (canopy layer)
      const trees = await this.generateCanopyTrees(area, settings, biome, randomGenerator);
      plants.push(...trees);
      generatedTrees = trees.length;

      // Generate understory vegetation if enabled
      if (settings.generateUnderstory) {
        const understory = await this.generateUnderstoryForArea(area, trees, settings, biome, randomGenerator);
        plants.push(...understory);
        _generatedUnderstory = understory.length;
      }

      // Calculate plant interactions
      this.calculatePlantInteractions(plants);

      // Create forest entity
      const forestId = new FeatureId(`forest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
      const forest = new Forest(
        forestId,
        `${biome.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} Forest`,
        area,
        trees.filter(p => p instanceof TreePlant) as TreePlant[],
        this.getDominantTreeSpecies(trees),
        settings.shrubDensity
      );

      // Add non-tree plants to forest if needed
      const nonTreePlants = plants.filter(p => !(p instanceof TreePlant));
      nonTreePlants.forEach(plant => {
        // Add method to store non-tree plants in forest - extending Forest entity would be needed
      });

      const result: VegetationGenerationResult = {
        success: true,
        generatedPlants: plants.length,
        speciesCount: new Set(plants.map(p => p.species)).size,
        coveragePercentage: this.calculateCoverage(plants, area),
        biodiversityIndex: this.calculateBiodiversityIndex(plants),
        warnings: []
      };

      if (generatedTrees === 0) {
        result.warnings?.push('No trees were generated - check density settings');
      }

      return { forest, result };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        forest: {} as Forest, // placeholder
        result: {
          success: false,
          generatedPlants: 0,
          speciesCount: 0,
          coveragePercentage: 0,
          biodiversityIndex: 0,
          error: errorMessage
        }
      };
    }
  }

  async generateGrassland(
    area: SpatialBounds,
    settings: GrasslandGenerationSettings,
    biome: BiomeType,
    randomGenerator: IRandomGenerator
  ): Promise<{ grassland: Grassland; result: VegetationGenerationResult }> {
    try {
      const plants: Plant[] = [];

      // Calculate target plant counts based on area and density
      const totalArea = area.dimensions.area;
      const targetPlantCount = Math.floor(totalArea * settings.grassDensity * (0.5 + randomGenerator.next()));

      // Generate plants by category
      const grassCount = Math.floor(targetPlantCount * settings.grassPercentage);
      const flowerCount = Math.floor(targetPlantCount * settings.wildflowerPercentage);
      const fernCount = Math.floor(targetPlantCount * settings.fernPercentage);
      const shrubCount = Math.floor(targetPlantCount * settings.shrubPercentage);
      const mossCount = Math.floor(targetPlantCount * settings.mossPercentage);

      // Generate each plant category
      plants.push(...this.generateGrassPlants(area, grassCount, settings, biome, randomGenerator));
      plants.push(...this.generateWildflowers(area, flowerCount, settings, biome, randomGenerator));
      plants.push(...this.generateFerns(area, fernCount, settings, biome, randomGenerator));
      plants.push(...this.generateGrasslandShrubs(area, shrubCount, settings, biome, randomGenerator));
      plants.push(...this.generateMossPatches(area, mossCount, settings, biome, randomGenerator));

      // Apply distribution patterns (clumping, patches)
      this.applyDistributionPatterns(plants, area, settings, randomGenerator);

      // Calculate plant interactions
      this.calculatePlantInteractions(plants);

      // Create grassland entity
      const grasslandId = new FeatureId(`grassland-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
      const grassland = new Grassland(
        grasslandId,
        `${settings.grasslandType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}`,
        area,
        settings.grasslandType,
        settings.soilMoisture,
        settings.soilFertility,
        settings.averageHeight,
        settings.plantDiversity,
        undefined, // seasonal characteristics could be generated
        plants
      );

      const result: VegetationGenerationResult = {
        success: true,
        generatedPlants: plants.length,
        speciesCount: new Set(plants.map(p => p.species)).size,
        coveragePercentage: this.calculateCoverage(plants, area),
        biodiversityIndex: this.calculateBiodiversityIndex(plants)
      };

      return { grassland, result };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        grassland: {} as Grassland, // placeholder
        result: {
          success: false,
          generatedPlants: 0,
          speciesCount: 0,
          coveragePercentage: 0,
          biodiversityIndex: 0,
          error: errorMessage
        }
      };
    }
  }

  async generateUnderstoryVegetation(
    forest: Forest,
    settings: Partial<ForestGenerationOptions>,
    randomGenerator: IRandomGenerator
  ): Promise<Plant[]> {
    const understoryPlants: Plant[] = [];
    const area = forest.area;
    const trees = forest.getTrees();

    // Calculate light levels under canopy
    const lightMap = this.calculateLightLevels(area, trees);

    // Generate understory based on light availability
    for (let x = area.x; x < area.x + area.dimensions.width; x++) {
      for (let y = area.y; y < area.y + area.dimensions.height; y++) {
        const lightLevel = lightMap.get(`${x},${y}`) || 1.0;
        
        if (lightLevel > 0.1) { // Some light available
          // Generate plants appropriate for this light level
          if (randomGenerator.next() < (settings.shrubDensity || 0.3) * lightLevel) {
            const shrub = this.generateUnderstoryShrub(x, y, lightLevel, randomGenerator);
            if (shrub) understoryPlants.push(shrub);
          }
          
          if (randomGenerator.next() < (settings.fernDensity || 0.2)) {
            const fern = this.generateUnderstoryFern(x, y, lightLevel, randomGenerator);
            if (fern) understoryPlants.push(fern);
          }
        }
      }
    }

    return understoryPlants;
  }

  async generateTransitionZone(
    area: SpatialBounds,
    fromBiome: BiomeType,
    toBiome: BiomeType,
    transitionWidth: number,
    randomGenerator: IRandomGenerator
  ): Promise<Plant[]> {
    const transitionPlants: Plant[] = [];
    const fromSpecies = this.getSpeciesForBiome(fromBiome);
    const toSpecies = this.getSpeciesForBiome(toBiome);
    
    // Create gradient across transition width
    for (let i = 0; i < transitionWidth; i++) {
      const gradientFactor = i / transitionWidth;
      
      // Mix species based on position in transition
      const speciesMix = gradientFactor < 0.5 ? fromSpecies : toSpecies;
      const otherMix = gradientFactor < 0.5 ? toSpecies : fromSpecies;
      
      // Add some species from other biome
      if (randomGenerator.next() < 0.3) {
        const species = randomGenerator.choice(otherMix);
        // Generate plant with this species
      }
    }
    
    return transitionPlants;
  }

  getSpeciesForBiome(biome: BiomeType, category?: PlantCategory): PlantSpecies[] {
    const biomeSpecies: Record<BiomeType, Record<PlantCategory, PlantSpecies[]>> = {
      [BiomeType.TEMPERATE_FOREST]: {
        [PlantCategory.TREE]: [PlantSpecies.OAK, PlantSpecies.MAPLE, PlantSpecies.BIRCH],
        [PlantCategory.SHRUB]: [PlantSpecies.BLUEBERRY_BUSH, PlantSpecies.HAZEL],
        [PlantCategory.HERBACEOUS]: [PlantSpecies.BRACKEN_FERN, PlantSpecies.WILDFLOWER_MIX],
        [PlantCategory.MOSS]: [PlantSpecies.MOSS],
        [PlantCategory.VINE]: [PlantSpecies.IVY],
        [PlantCategory.AQUATIC]: []
      },
      [BiomeType.TEMPERATE_GRASSLAND]: {
        [PlantCategory.TREE]: [],
        [PlantCategory.SHRUB]: [PlantSpecies.ROSE_BUSH, PlantSpecies.ELDERBERRY],
        [PlantCategory.HERBACEOUS]: [PlantSpecies.PRAIRIE_GRASS, PlantSpecies.WILDFLOWER_MIX, PlantSpecies.DAISY],
        [PlantCategory.MOSS]: [PlantSpecies.MOSS],
        [PlantCategory.VINE]: [],
        [PlantCategory.AQUATIC]: []
      },
      // Add other biomes...
      [BiomeType.BOREAL_FOREST]: {
        [PlantCategory.TREE]: [PlantSpecies.PINE, PlantSpecies.CEDAR],
        [PlantCategory.SHRUB]: [PlantSpecies.BLUEBERRY_BUSH],
        [PlantCategory.HERBACEOUS]: [PlantSpecies.BRACKEN_FERN],
        [PlantCategory.MOSS]: [PlantSpecies.MOSS, PlantSpecies.LICHEN],
        [PlantCategory.VINE]: [],
        [PlantCategory.AQUATIC]: []
      },
      // Simplified - add more biomes as needed
    } as any;

    const speciesMap = biomeSpecies[biome];
    if (!speciesMap) return [];

    if (category) {
      return speciesMap[category] || [];
    }

    // Return all species for biome
    return Object.values(speciesMap).flat();
  }

  // Implementation of other interface methods...
  getDefaultForestSettings(biome: BiomeType): ForestGenerationOptions {
    // Return appropriate defaults based on biome
    return {
      treeDensity: 0.6,
      treeClumping: 0.7,
      allowTreeOverlap: true,
      enableInosculation: true,
      preferredTreeSpecies: this.getSpeciesForBiome(biome, PlantCategory.TREE),
      generateUnderstory: true,
      understoryDensity: 0.4,
      shrubDensity: 0.3,
      fernDensity: 0.2,
      flowerDensity: 0.1,
      mossCoverage: 0.2,
      speciesDiversity: 0.7,
      ageVariation: 0.8,
      naturalDisturbance: 0.1,
      saplingChance: 0.2,
      youngChance: 0.3,
      matureChance: 0.4,
      ancientChance: 0.1,
      soilFertility: 0.7,
      moisture: 0.6,
      lightLevel: 1.0,
      hasVines: true,
      vineChance: 0.15,
      hasDeadFalls: true,
      clearingChance: 0.05
    };
  }

  getDefaultGrasslandSettings(biome: BiomeType): GrasslandGenerationSettings {
    return {
      grasslandType: biome === BiomeType.TROPICAL_GRASSLAND ? GrasslandType.SAVANNA : GrasslandType.PRAIRIE,
      grassDensity: 0.8,
      averageHeight: 0.5,
      plantDiversity: 0.6,
      grassPercentage: 0.6,
      wildflowerPercentage: 0.2,
      fernPercentage: 0.05,
      shrubPercentage: 0.1,
      mossPercentage: 0.05,
      preferredGrassSpecies: [PlantSpecies.PRAIRIE_GRASS, PlantSpecies.MEADOW_GRASS],
      preferredFlowerSpecies: [PlantSpecies.WILDFLOWER_MIX, PlantSpecies.DAISY],
      preferredShrubSpecies: [PlantSpecies.ROSE_BUSH],
      soilMoisture: 0.4,
      soilFertility: 0.6,
      drainageQuality: 0.7,
      windExposure: 0.8,
      enableSeasonalChanges: true,
      bloomingSeasons: ['spring', 'summer'],
      dormantSeason: 'winter',
      clumpingFactor: 0.3,
      patchVariation: 0.4,
      edgeVariation: 0.5,
      hasRareSpecies: true,
      rareSpeciesChance: 0.05,
      hasInsectPaths: false,
      pathDensity: 0.0
    };
  }

  validateForestSettings(settings: ForestGenerationOptions): string[] {
    const errors: string[] = [];
    
    if (settings.treeDensity < 0 || settings.treeDensity > 1) {
      errors.push('Tree density must be between 0 and 1');
    }
    if (settings.speciesDiversity < 0 || settings.speciesDiversity > 1) {
      errors.push('Species diversity must be between 0 and 1');
    }
    
    const totalChance = settings.saplingChance + settings.youngChance + settings.matureChance + settings.ancientChance;
    if (Math.abs(totalChance - 1.0) > 0.01) {
      errors.push('Tree size chances must sum to 1.0');
    }
    
    return errors;
  }

  validateGrasslandSettings(settings: GrasslandGenerationSettings): string[] {
    const errors: string[] = [];
    
    if (settings.grassDensity < 0 || settings.grassDensity > 1) {
      errors.push('Grass density must be between 0 and 1');
    }
    
    const totalPercentage = settings.grassPercentage + settings.wildflowerPercentage + 
                           settings.fernPercentage + settings.shrubPercentage + settings.mossPercentage;
    if (totalPercentage > 1.2 || totalPercentage < 0.8) {
      errors.push('Plant percentages should sum to approximately 1.0');
    }
    
    return errors;
  }

  calculatePlantInteractions(plants: Plant[]): void {
    // Calculate competition for resources, symbiotic relationships, etc.
    for (let i = 0; i < plants.length; i++) {
      for (let j = i + 1; j < plants.length; j++) {
        const plant1 = plants[i];
        const plant2 = plants[j];
        
        if (this.plantsInteract(plant1, plant2)) {
          this.applyInteraction(plant1, plant2);
        }
      }
    }
  }

  applySeasonalChanges(
    plants: Plant[],
    season: 'spring' | 'summer' | 'autumn' | 'winter',
    biome: BiomeType
  ): void {
    // Apply seasonal effects to plants
    plants.forEach(plant => {
      // Modify plant properties based on season
      // This would affect visual representation, not stored properties
    });
  }

  generatePlantProperties(
    species: PlantSpecies,
    environmentalFactors: {
      soilFertility: number;
      moisture: number;
      lightLevel: number;
      temperature: number;
    }
  ): PlantProperties {
    // Generate species-specific properties modified by environment
    const baseProperties = this.getBasePropertiesForSpecies(species);
    
    // Modify based on environmental factors
    return {
      ...baseProperties,
      maxHeight: baseProperties.maxHeight * (0.5 + 0.5 * environmentalFactors.soilFertility),
      growthRate: baseProperties.growthRate * environmentalFactors.moisture,
      // ... other modifications
    };
  }

  calculateOptimalPlantDensity(
    area: SpatialBounds,
    vegetationType: 'forest' | 'grassland',
    biome: BiomeType
  ): number {
    const baseValues = {
      forest: { temperate: 0.6, tropical: 0.8, boreal: 0.4 },
      grassland: { temperate: 1.2, tropical: 1.0, prairie: 0.8 }
    };
    
    // Simplified calculation
    return baseValues[vegetationType]?.temperate || 0.5;
  }

  // Private helper methods
  private async generateCanopyTrees(
    area: SpatialBounds,
    settings: ForestGenerationOptions,
    biome: BiomeType,
    randomGenerator: IRandomGenerator
  ): Promise<TreePlant[]> {
    const trees: TreePlant[] = [];
    const targetTreeCount = Math.floor(area.dimensions.area * settings.treeDensity);
    
    for (let i = 0; i < targetTreeCount; i++) {
      const position = this.generateRandomPosition(area, randomGenerator);
      const species = randomGenerator.choice(settings.preferredTreeSpecies);
      const size = this.selectTreeSize(settings, randomGenerator);
      
      const tree = new TreePlant(
        `tree-${i}`,
        species,
        position,
        size,
        0.7 + randomGenerator.next() * 0.3, // health
        this.generateAgeForSize(size, randomGenerator),
        this.generatePlantProperties(species, {
          soilFertility: settings.soilFertility,
          moisture: settings.moisture,
          lightLevel: settings.lightLevel,
          temperature: 15 // default temp
        }),
        0.3 + randomGenerator.next() * 0.4, // trunk diameter
        0.6 + randomGenerator.next() * 0.3  // canopy density
      );
      
      trees.push(tree);
    }
    
    return trees;
  }

  private async generateUnderstoryForArea(
    area: SpatialBounds,
    trees: TreePlant[],
    settings: ForestGenerationOptions,
    biome: BiomeType,
    randomGenerator: IRandomGenerator
  ): Promise<Plant[]> {
    // Generate various understory plants
    return this.generateUnderstoryVegetation(
      { area, getTrees: () => trees } as Forest,
      settings,
      randomGenerator
    );
  }

  // Add more helper methods for specific plant generation...
  
  private generateGrassPlants(
    area: SpatialBounds,
    count: number,
    settings: GrasslandGenerationSettings,
    biome: BiomeType,
    randomGenerator: IRandomGenerator
  ): HerbaceousPlant[] {
    // Implementation for grass generation
    return [];
  }

  private generateWildflowers(
    area: SpatialBounds,
    count: number,
    settings: GrasslandGenerationSettings,
    biome: BiomeType,
    randomGenerator: IRandomGenerator
  ): HerbaceousPlant[] {
    // Implementation for wildflower generation
    return [];
  }

  // ... implement other plant generation methods

  private plantsInteract(plant1: Plant, plant2: Plant): boolean {
    const distance = this.calculateDistance(plant1, plant2);
    const interactionRadius = plant1.getCoverageRadius() + plant2.getCoverageRadius();
    return distance < interactionRadius;
  }

  private applyInteraction(plant1: Plant, plant2: Plant): void {
    // Apply competition or symbiotic effects
  }

  private calculateDistance(plant1: Plant, plant2: Plant): number {
    const dx = plant1.position.tileX - plant2.position.tileX;
    const dy = plant1.position.tileY - plant2.position.tileY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private calculateCoverage(plants: Plant[], area: SpatialBounds): number {
    let totalCoverage = 0;
    plants.forEach(plant => {
      totalCoverage += Math.PI * Math.pow(plant.getCoverageRadius(), 2);
    });
    return Math.min(1.0, totalCoverage / area.dimensions.area);
  }

  private calculateBiodiversityIndex(plants: Plant[]): number {
    const speciesCounts = new Map<PlantSpecies, number>();
    plants.forEach(plant => {
      speciesCounts.set(plant.species, (speciesCounts.get(plant.species) || 0) + 1);
    });

    let shannonIndex = 0;
    const totalPlants = plants.length;

    for (const count of speciesCounts.values()) {
      const proportion = count / totalPlants;
      if (proportion > 0) {
        shannonIndex -= proportion * Math.log(proportion);
      }
    }

    return shannonIndex;
  }

  // Add more helper methods as needed...
  private getDominantTreeSpecies(trees: Plant[]): PlantSpecies[] {
    return [PlantSpecies.OAK]; // Simplified
  }

  private calculateLightLevels(area: SpatialBounds, trees: TreePlant[]): Map<string, number> {
    const lightMap = new Map<string, number>();
    // Calculate light penetration through canopy
    return lightMap;
  }

  private generateRandomPosition(area: SpatialBounds, rng: IRandomGenerator): SubTilePosition {
    return new SubTilePosition(
      area.x + Math.floor(rng.next() * area.dimensions.width),
      area.y + Math.floor(rng.next() * area.dimensions.height),
      rng.next(),
      rng.next()
    );
  }

  private selectTreeSize(settings: ForestGenerationOptions, rng: IRandomGenerator): PlantSize {
    const roll = rng.next();
    if (roll < settings.saplingChance) return PlantSize.SMALL;
    if (roll < settings.saplingChance + settings.youngChance) return PlantSize.MEDIUM;
    if (roll < settings.saplingChance + settings.youngChance + settings.matureChance) return PlantSize.LARGE;
    return PlantSize.HUGE;
  }

  private generateAgeForSize(size: PlantSize, rng: IRandomGenerator): number {
    const ageRanges = {
      [PlantSize.TINY]: { min: 1, max: 5 },
      [PlantSize.SMALL]: { min: 1, max: 10 },
      [PlantSize.MEDIUM]: { min: 10, max: 30 },
      [PlantSize.LARGE]: { min: 30, max: 100 },
      [PlantSize.HUGE]: { min: 100, max: 500 },
      [PlantSize.MASSIVE]: { min: 500, max: 2000 }
    };

    const range = ageRanges[size] || { min: 10, max: 50 };
    return range.min + rng.next() * (range.max - range.min);
  }

  private getBasePropertiesForSpecies(species: PlantSpecies): PlantProperties {
    // Return base properties for each species
    return {
      maxHeight: 25,
      maxWidth: 15,
      growthRate: 0.5,
      foliageColor: ['#4CAF50'],
      soilPreference: ['loam'],
      lightRequirement: 'full_sun',
      waterRequirement: 'medium',
      hardiness: 5
    };
  }

  private generateUnderstoryShrub(x: number, y: number, lightLevel: number, rng: IRandomGenerator): ShrubPlant | null {
    // Generate shrub appropriate for light level
    return null;
  }

  private generateUnderstoryFern(x: number, y: number, lightLevel: number, rng: IRandomGenerator): HerbaceousPlant | null {
    // Generate fern appropriate for light level
    return null;
  }

  private generateFerns(area: SpatialBounds, count: number, settings: GrasslandGenerationSettings, biome: BiomeType, rng: IRandomGenerator): HerbaceousPlant[] {
    return [];
  }

  private generateGrasslandShrubs(area: SpatialBounds, count: number, settings: GrasslandGenerationSettings, biome: BiomeType, rng: IRandomGenerator): ShrubPlant[] {
    return [];
  }

  private generateMossPatches(area: SpatialBounds, count: number, settings: GrasslandGenerationSettings, biome: BiomeType, rng: IRandomGenerator): GroundCoverPlant[] {
    return [];
  }

  private applyDistributionPatterns(plants: Plant[], area: SpatialBounds, settings: GrasslandGenerationSettings, rng: IRandomGenerator): void {
    // Apply clumping and patching patterns
  }
}