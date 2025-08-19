import { MapFeature, FeatureId, FeatureCategory } from '../../../common/entities/MapFeature';
import { FeatureArea } from '../../../common/value-objects/FeatureArea';
import { Plant, PlantCategory, PlantSpecies, HerbaceousPlant, ShrubPlant, GroundCoverPlant } from './Plant';

/**
 * Grassland-specific feature type
 */
export const GRASSLAND_FEATURE_TYPE = 'grassland';

/**
 * Grassland types based on climate and plant composition
 */
export enum GrasslandType {
  PRAIRIE = 'prairie',           // Temperate grassland with tall grasses
  MEADOW = 'meadow',             // Mixed grasses and wildflowers
  STEPPE = 'steppe',             // Dry grassland with sparse vegetation  
  SAVANNA = 'savanna',           // Tropical grassland with scattered trees
  MARSH = 'marsh',               // Wetland grassland
  ALPINE_MEADOW = 'alpine_meadow', // High-altitude grassland
  HEATHLAND = 'heathland'        // Shrubland with heather and low shrubs
}

/**
 * Seasonal characteristics of grassland
 */
export interface SeasonalCharacteristics {
  spring: {
    dominantColors: string[];
    bloomingSpecies: PlantSpecies[];
    averageHeight: number;
  };
  summer: {
    dominantColors: string[];
    bloomingSpecies: PlantSpecies[];
    averageHeight: number;
  };
  autumn: {
    dominantColors: string[];
    bloomingSpecies: PlantSpecies[];
    averageHeight: number;
  };
  winter: {
    dominantColors: string[];
    bloomingSpecies: PlantSpecies[];
    averageHeight: number;
  };
}

/**
 * Grassland entity representing areas of predominantly herbaceous vegetation
 */
export class Grassland extends MapFeature {
  private _plants: Map<string, Plant> = new Map();
  private _speciesComposition: Map<PlantSpecies, number> = new Map();
  
  constructor(
    id: FeatureId,
    name: string,
    area: FeatureArea,
    public readonly grasslandType: GrasslandType,
    public readonly soilMoisture: number = 0.5,
    public readonly fertility: number = 0.5,
    public readonly averageHeight: number = 0.5, // meters
    public readonly plantDiversity: number = 0.6,
    public readonly seasonalCharacteristics?: SeasonalCharacteristics,
    plants: Plant[] = [],
    priority: number = 1
  ) {
    super(id, name, FeatureCategory.NATURAL, area, priority);
    this.validateGrasslandProperties();
    this.addPlants(plants);
  }

  getType(): string {
    return GRASSLAND_FEATURE_TYPE;
  }

  canMixWith(other: MapFeature): boolean {
    // Grasslands can mix with various other features
    if (other.category === FeatureCategory.NATURAL) {
      const otherType = other.getType();
      // Can transition into forests, water features
      return ['forest', 'river', 'lake', 'wetland'].includes(otherType);
    }
    
    if (other.category === FeatureCategory.RELIEF) {
      // Can exist on hills, valleys
      return true;
    }
    
    if (other.category === FeatureCategory.ARTIFICIAL) {
      const otherType = other.getType();
      // Can coexist with roads and some buildings
      return ['road', 'farm', 'pasture'].includes(otherType);
    }
    
    if (other.category === FeatureCategory.CULTURAL) {
      // Can exist within territories and regions
      return true;
    }
    
    return false;
  }

  /**
   * Add a plant to the grassland
   */
  addPlant(plant: Plant): void {
    if (!this.area.contains(plant.position.toPosition())) {
      throw new Error('Plant position must be within grassland area');
    }
    
    this._plants.set(plant.id, plant);
    this.updateSpeciesComposition(plant.species, 1);
  }

  /**
   * Add multiple plants to the grassland
   */
  addPlants(plants: Plant[]): void {
    plants.forEach(plant => this.addPlant(plant));
  }

  /**
   * Remove a plant from the grassland
   */
  removePlant(plantId: string): void {
    const plant = this._plants.get(plantId);
    if (plant) {
      this._plants.delete(plantId);
      this.updateSpeciesComposition(plant.species, -1);
    }
  }

  /**
   * Get all plants in the grassland
   */
  getPlants(): Plant[] {
    return Array.from(this._plants.values());
  }

  /**
   * Get plants by category
   */
  getPlantsByCategory(category: PlantCategory): Plant[] {
    return this.getPlants().filter(plant => plant.category === category);
  }

  /**
   * Get plants by species
   */
  getPlantsBySpecies(species: PlantSpecies): Plant[] {
    return this.getPlants().filter(plant => plant.species === species);
  }

  /**
   * Get the dominant plant species (those making up >10% of total)
   */
  getDominantSpecies(): PlantSpecies[] {
    const totalPlants = this._plants.size;
    const dominantThreshold = totalPlants * 0.1;
    
    return Array.from(this._speciesComposition.entries())
      .filter(([_, count]) => count >= dominantThreshold)
      .sort(([_, a], [__, b]) => b - a)
      .map(([species, _]) => species);
  }

  /**
   * Get plant density (plants per unit area)
   */
  getPlantDensity(): number {
    return this._plants.size / this.area.dimensions.area;
  }

  /**
   * Calculate total coverage of the grassland
   */
  getTotalCoverage(): number {
    let totalCoverage = 0;
    
    for (const plant of this._plants.values()) {
      const coverage = Math.PI * Math.pow(plant.getCoverageRadius(), 2);
      totalCoverage += coverage;
    }
    
    // Return as percentage of total area, capped at 1.0
    return Math.min(1.0, totalCoverage / this.area.dimensions.area);
  }

  /**
   * Get coverage by plant category
   */
  getCoverageByCategory(): Record<PlantCategory, number> {
    const coverage: Record<PlantCategory, number> = {} as any;
    
    for (const category of Object.values(PlantCategory)) {
      const plantsInCategory = this.getPlantsByCategory(category);
      let categoryCoverage = 0;
      
      for (const plant of plantsInCategory) {
        categoryCoverage += Math.PI * Math.pow(plant.getCoverageRadius(), 2);
      }
      
      coverage[category] = Math.min(1.0, categoryCoverage / this.area.dimensions.area);
    }
    
    return coverage;
  }

  /**
   * Get seasonal appearance based on current season
   */
  getSeasonalAppearance(season: 'spring' | 'summer' | 'autumn' | 'winter'): {
    dominantColors: string[];
    bloomingSpecies: PlantSpecies[];
    averageHeight: number;
  } {
    if (this.seasonalCharacteristics) {
      return this.seasonalCharacteristics[season];
    }
    
    // Default seasonal behavior
    const currentlyBlooming = this.getPlants()
      .filter(plant => plant.isFlowering(season))
      .map(plant => plant.species);
    
    const avgHeight = this.getPlants()
      .reduce((sum, plant) => sum + plant.getCurrentHeight(), 0) / this._plants.size || 0;
    
    const seasonalColors = this.getSeasonalColors(season);
    
    return {
      dominantColors: seasonalColors,
      bloomingSpecies: currentlyBlooming,
      averageHeight: avgHeight
    };
  }

  /**
   * Calculate biodiversity index (Shannon diversity)
   */
  getBiodiversityIndex(): number {
    const totalPlants = this._plants.size;
    if (totalPlants <= 1) return 0;
    
    let shannonIndex = 0;
    
    for (const count of this._speciesComposition.values()) {
      const proportion = count / totalPlants;
      if (proportion > 0) {
        shannonIndex -= proportion * Math.log(proportion);
      }
    }
    
    return shannonIndex;
  }

  /**
   * Check if grassland is suitable for specific activities
   */
  isSuitableFor(activity: 'grazing' | 'agriculture' | 'recreation' | 'wildlife'): boolean {
    switch (activity) {
      case 'grazing':
        return this.grasslandType !== GrasslandType.MARSH && 
               this.getPlantsByCategory(PlantCategory.HERBACEOUS).length > 0;
      
      case 'agriculture':
        return this.fertility > 0.6 && 
               this.soilMoisture > 0.3 && 
               this.soilMoisture < 0.8;
      
      case 'recreation':
        return this.averageHeight < 1.0 && 
               this.getTotalCoverage() > 0.5;
      
      case 'wildlife':
        return this.getBiodiversityIndex() > 1.0 && 
               this.plantDiversity > 0.4;
      
      default:
        return false;
    }
  }

  /**
   * Get plants that would be visible in a specific tile
   */
  getPlantsInTile(tileX: number, tileY: number): Plant[] {
    return this.getPlants().filter(plant => {
      const plantLeft = plant.position.tileX + plant.position.offsetX - plant.getCoverageRadius();
      const plantRight = plant.position.tileX + plant.position.offsetX + plant.getCoverageRadius();
      const plantTop = plant.position.tileY + plant.position.offsetY - plant.getCoverageRadius();
      const plantBottom = plant.position.tileY + plant.position.offsetY + plant.getCoverageRadius();

      return !(
        plantRight <= tileX ||
        plantLeft >= tileX + 1 ||
        plantBottom <= tileY ||
        plantTop >= tileY + 1
      );
    });
  }

  /**
   * Get the visual coverage in a specific tile
   */
  getTileCoverage(tileX: number, tileY: number): number {
    const plantsInTile = this.getPlantsInTile(tileX, tileY);
    
    if (plantsInTile.length === 0) return 0;
    
    let totalCoverage = 0;
    
    for (const plant of plantsInTile) {
      const plantLeft = plant.position.tileX + plant.position.offsetX - plant.getCoverageRadius();
      const plantRight = plant.position.tileX + plant.position.offsetX + plant.getCoverageRadius();
      const plantTop = plant.position.tileY + plant.position.offsetY - plant.getCoverageRadius();
      const plantBottom = plant.position.tileY + plant.position.offsetY + plant.getCoverageRadius();

      const intersectLeft = Math.max(tileX, plantLeft);
      const intersectRight = Math.min(tileX + 1, plantRight);
      const intersectTop = Math.max(tileY, plantTop);
      const intersectBottom = Math.min(tileY + 1, plantBottom);

      const intersectArea = (intersectRight - intersectLeft) * (intersectBottom - intersectTop);
      totalCoverage += intersectArea * plant.health;
    }

    return Math.min(1.0, totalCoverage);
  }

  private updateSpeciesComposition(species: PlantSpecies, delta: number): void {
    const current = this._speciesComposition.get(species) || 0;
    const newCount = current + delta;
    
    if (newCount <= 0) {
      this._speciesComposition.delete(species);
    } else {
      this._speciesComposition.set(species, newCount);
    }
  }

  private validateGrasslandProperties(): void {
    if (this.soilMoisture < 0 || this.soilMoisture > 1) {
      throw new Error('Soil moisture must be between 0 and 1');
    }
    if (this.fertility < 0 || this.fertility > 1) {
      throw new Error('Fertility must be between 0 and 1');
    }
    if (this.plantDiversity < 0 || this.plantDiversity > 1) {
      throw new Error('Plant diversity must be between 0 and 1');
    }
    if (this.averageHeight < 0) {
      throw new Error('Average height cannot be negative');
    }
  }

  private getSeasonalColors(season: string): string[] {
    // Default color scheme based on season
    switch (season) {
      case 'spring':
        return ['#7CB342', '#8BC34A', '#CDDC39', '#FFEB3B'];
      case 'summer':
        return ['#4CAF50', '#689F38', '#33691E'];
      case 'autumn':
        return ['#FF8F00', '#FF6F00', '#E65100', '#8BC34A'];
      case 'winter':
        return ['#795548', '#8D6E63', '#A1887F'];
      default:
        return ['#4CAF50'];
    }
  }
}