import { SubTilePosition } from '../../../../common/value-objects/SubTilePosition';
import {
  PlantCategory,
  PlantGrowthForm,
  PlantSize,
  PlantSpecies,
  PlantProperties
} from './value-objects';

/**
 * Base plant entity for all vegetation types
 */
export abstract class Plant {
  constructor(
    public readonly id: string,
    public readonly species: PlantSpecies,
    public readonly category: PlantCategory,
    public readonly growthForm: PlantGrowthForm,
    public readonly position: SubTilePosition,
    public readonly size: PlantSize,
    public readonly health: number = 1.0,
    public readonly age: number = 1,
    public readonly properties: PlantProperties,
    public readonly customProperties: Record<string, any> = {}
  ) {
    this.validatePlant();
  }

  private validatePlant(): void {
    if (this.health < 0 || this.health > 1) {
      throw new Error('Plant health must be between 0 and 1');
    }
    if (this.age < 0) {
      throw new Error('Plant age cannot be negative');
    }
  }

  /**
   * Get current height based on age and growth properties
   */
  getCurrentHeight(): number {
    const maturityFactor = Math.min(1, this.age / this.getMaturityAge());
    return this.properties.maxHeight * maturityFactor * this.health;
  }

  /**
   * Get current width/spread based on age and growth properties
   */
  getCurrentWidth(): number {
    const maturityFactor = Math.min(1, this.age / this.getMaturityAge());
    return this.properties.maxWidth * maturityFactor * this.health;
  }

  /**
   * Get visual coverage area in tile units
   */
  getCoverageRadius(): number {
    return this.getCurrentWidth() / 2;
  }

  /**
   * Check if plant is flowering (if applicable)
   */
  isFlowering(currentSeason?: string): boolean {
    if (!this.properties.flowerColor || !this.properties.bloomingSeason) {
      return false;
    }
    if (!currentSeason) return true;
    return this.properties.bloomingSeason.includes(currentSeason);
  }

  /**
   * Get age at which plant reaches maturity
   */
  abstract getMaturityAge(): number;

  /**
   * Check if two plants can coexist in the same area
   */
  abstract canCoexistWith(other: Plant): boolean;
}