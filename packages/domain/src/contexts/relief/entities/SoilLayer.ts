import { MapFeature, FeatureCategory } from '../../../common/entities/MapFeature';
import { FeatureId } from '../../../common/value-objects/FeatureId';
import { SpatialBounds } from '../../../common/value-objects/SpatialBounds';

/**
 * Soil types
 */
export enum SoilType {
  CLAY = 'clay',
  SILT = 'silt',
  SAND = 'sand',
  LOAM = 'loam',
  PEAT = 'peat',
  CHALK = 'chalk',
  GRAVEL = 'gravel',
  ROCKY = 'rocky'
}

/**
 * Soil fertility levels
 */
export enum SoilFertility {
  BARREN = 'barren',
  POOR = 'poor',
  MODERATE = 'moderate',
  FERTILE = 'fertile',
  VERY_FERTILE = 'very_fertile'
}

/**
 * Properties of soil layers
 */
export interface SoilProperties {
  primaryType: SoilType;
  secondaryTypes: SoilType[];
  fertility: SoilFertility;
  pH: number; // 0-14 scale
  organicContent: number; // 0-1 scale
  moisture: number; // 0-1 scale
  drainage: 'poor' | 'moderate' | 'good' | 'excessive';
  depth: number; // meters
}

/**
 * Soil layer entity representing the soil composition of an area
 */
export class SoilLayer extends MapFeature {
  constructor(
    id: FeatureId,
    name: string,
    area: SpatialBounds,
    public readonly soilProperties: SoilProperties,
    priority: number = 2
  ) {
    super(id, name, FeatureCategory.RELIEF, area, priority);
    this.validateProperties();
  }

  getType(): string {
    return 'soil_layer';
  }


  /**
   * Check if soil is suitable for agriculture
   */
  isSuitableForAgriculture(): boolean {
    return (
      this.soilProperties.fertility !== SoilFertility.BARREN &&
      this.soilProperties.pH >= 5.5 &&
      this.soilProperties.pH <= 7.5 &&
      this.soilProperties.drainage !== 'poor' &&
      this.soilProperties.drainage !== 'excessive' &&
      this.soilProperties.depth >= 0.5
    );
  }

  /**
   * Check if soil supports tree growth
   */
  supportsTreeGrowth(): boolean {
    return (
      this.soilProperties.depth >= 1.0 &&
      this.soilProperties.fertility !== SoilFertility.BARREN &&
      this.soilProperties.primaryType !== SoilType.ROCKY &&
      this.soilProperties.drainage !== 'poor'
    );
  }

  /**
   * Get water retention capacity
   */
  getWaterRetention(): number {
    let retention = 0.5;

    switch (this.soilProperties.primaryType) {
      case SoilType.CLAY:
        retention = 0.9;
        break;
      case SoilType.SILT:
        retention = 0.7;
        break;
      case SoilType.LOAM:
        retention = 0.6;
        break;
      case SoilType.PEAT:
        retention = 0.95;
        break;
      case SoilType.SAND:
        retention = 0.2;
        break;
      case SoilType.GRAVEL:
        retention = 0.1;
        break;
      case SoilType.ROCKY:
        retention = 0.05;
        break;
    }

    // Organic content increases water retention
    retention += this.soilProperties.organicContent * 0.2;

    return Math.min(1.0, retention);
  }

  /**
   * Calculate erosion susceptibility
   */
  getErosionSusceptibility(): number {
    let susceptibility = 0.5;

    // Sandy and silty soils erode more easily
    switch (this.soilProperties.primaryType) {
      case SoilType.SAND:
        susceptibility = 0.9;
        break;
      case SoilType.SILT:
        susceptibility = 0.8;
        break;
      case SoilType.LOAM:
        susceptibility = 0.5;
        break;
      case SoilType.CLAY:
        susceptibility = 0.4;
        break;
      case SoilType.ROCKY:
        susceptibility = 0.2;
        break;
    }

    // Organic content helps bind soil
    susceptibility -= this.soilProperties.organicContent * 0.3;

    return Math.max(0, Math.min(1, susceptibility));
  }

  /**
   * Get nutrient level based on fertility and organic content
   */
  getNutrientLevel(): number {
    const fertilityScore = {
      [SoilFertility.BARREN]: 0,
      [SoilFertility.POOR]: 0.25,
      [SoilFertility.MODERATE]: 0.5,
      [SoilFertility.FERTILE]: 0.75,
      [SoilFertility.VERY_FERTILE]: 1.0
    }[this.soilProperties.fertility];

    return (fertilityScore + this.soilProperties.organicContent) / 2;
  }

  private validateProperties(): void {
    if (this.soilProperties.pH < 0 || this.soilProperties.pH > 14) {
      throw new Error('Soil pH must be between 0 and 14');
    }
    if (this.soilProperties.organicContent < 0 || this.soilProperties.organicContent > 1) {
      throw new Error('Organic content must be between 0 and 1');
    }
    if (this.soilProperties.moisture < 0 || this.soilProperties.moisture > 1) {
      throw new Error('Moisture must be between 0 and 1');
    }
    if (this.soilProperties.depth < 0) {
      throw new Error('Soil depth cannot be negative');
    }
  }
}
