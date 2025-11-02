import { MapFeature, FeatureCategory } from '../../../common/entities/MapFeature';
import { FeatureId } from '../../../common/value-objects/FeatureId';
import { SpatialBounds } from '../../../common/value-objects/SpatialBounds';

/**
 * Mineral types
 */
export enum MineralType {
  // Precious metals
  GOLD = 'gold',
  SILVER = 'silver',
  PLATINUM = 'platinum',

  // Base metals
  IRON = 'iron',
  COPPER = 'copper',
  TIN = 'tin',
  LEAD = 'lead',
  ZINC = 'zinc',

  // Energy minerals
  COAL = 'coal',
  OIL = 'oil',
  NATURAL_GAS = 'natural_gas',

  // Precious stones
  DIAMOND = 'diamond',
  RUBY = 'ruby',
  EMERALD = 'emerald',
  SAPPHIRE = 'sapphire',

  // Construction minerals
  LIMESTONE = 'limestone',
  MARBLE = 'marble',
  GRANITE = 'granite',
  SAND = 'sand',
  CLAY = 'clay',

  // Other valuable minerals
  SALT = 'salt',
  SULFUR = 'sulfur',
  QUARTZ = 'quartz'
}

/**
 * Deposit quality/richness
 */
export enum DepositQuality {
  TRACE = 'trace',
  POOR = 'poor',
  MODERATE = 'moderate',
  RICH = 'rich',
  VERY_RICH = 'very_rich'
}

/**
 * Properties of mineral deposits
 */
export interface MineralDepositProperties {
  mineralType: MineralType;
  quality: DepositQuality;
  estimatedQuantity: number; // tons
  depth: number; // meters below surface
  purity: number; // 0-1 scale
  accessibility: 'surface' | 'shallow' | 'deep' | 'very_deep';
  extractionDifficulty: number; // 0-1 scale
}

/**
 * Mineral deposit entity representing valuable underground resources
 */
export class MineralDeposit extends MapFeature {
  constructor(
    id: FeatureId,
    name: string,
    area: SpatialBounds,
    public readonly depositProperties: MineralDepositProperties,
    public readonly isDiscovered: boolean = false,
    priority: number = 2
  ) {
    super(id, name, FeatureCategory.RELIEF, area, priority);
    this.validateProperties();
  }

  getType(): string {
    return 'mineral_deposit';
  }


  /**
   * Calculate the economic value of the deposit
   */
  getEconomicValue(): number {
    // Base value by mineral type
    let baseValue = this.getBaseValueByType();

    // Adjust for quality
    const qualityMultiplier = {
      [DepositQuality.TRACE]: 0.1,
      [DepositQuality.POOR]: 0.3,
      [DepositQuality.MODERATE]: 0.6,
      [DepositQuality.RICH]: 1.0,
      [DepositQuality.VERY_RICH]: 1.5
    }[this.depositProperties.quality];

    // Adjust for purity
    const purityMultiplier = 0.5 + this.depositProperties.purity * 0.5;

    // Adjust for accessibility
    const accessibilityMultiplier = {
      'surface': 1.0,
      'shallow': 0.8,
      'deep': 0.5,
      'very_deep': 0.3
    }[this.depositProperties.accessibility];

    // Calculate total value
    const value = baseValue * qualityMultiplier * purityMultiplier *
                  accessibilityMultiplier * (1 - this.depositProperties.extractionDifficulty * 0.5);

    return Math.max(0, value);
  }

  /**
   * Check if deposit is worth mining
   */
  isEconomicallyViable(): boolean {
    return this.getEconomicValue() > 0.3 &&
           this.depositProperties.quality !== DepositQuality.TRACE;
  }

  /**
   * Get extraction cost factor
   */
  getExtractionCost(): number {
    let cost = 0.5;

    // Depth increases cost
    cost += this.depositProperties.depth / 1000;

    // Difficulty increases cost
    cost += this.depositProperties.extractionDifficulty;

    // Low purity increases processing cost
    cost += (1 - this.depositProperties.purity) * 0.5;

    return Math.min(1.0, cost);
  }

  /**
   * Check if deposit requires specialized mining techniques
   */
  requiresSpecializedMining(): boolean {
    return this.depositProperties.accessibility === 'very_deep' ||
           this.depositProperties.extractionDifficulty > 0.7 ||
           this.depositProperties.mineralType === MineralType.OIL ||
           this.depositProperties.mineralType === MineralType.NATURAL_GAS ||
           this.depositProperties.mineralType === MineralType.DIAMOND;
  }

  /**
   * Get environmental impact of extraction
   */
  getEnvironmentalImpact(): number {
    let impact = 0.3;

    // Surface mining has higher impact
    if (this.depositProperties.accessibility === 'surface') {
      impact += 0.3;
    }

    // Certain minerals have higher environmental cost
    switch (this.depositProperties.mineralType) {
      case MineralType.COAL:
      case MineralType.OIL:
        impact += 0.4;
        break;
      case MineralType.GOLD:
      case MineralType.COPPER:
        impact += 0.3;
        break;
    }

    return Math.min(1.0, impact);
  }

  private getBaseValueByType(): number {
    switch (this.depositProperties.mineralType) {
      // Precious metals and stones (highest value)
      case MineralType.DIAMOND:
      case MineralType.PLATINUM:
        return 1.0;
      case MineralType.GOLD:
      case MineralType.RUBY:
      case MineralType.EMERALD:
      case MineralType.SAPPHIRE:
        return 0.9;
      case MineralType.SILVER:
        return 0.7;

      // Energy minerals (high strategic value)
      case MineralType.OIL:
      case MineralType.NATURAL_GAS:
        return 0.8;
      case MineralType.COAL:
        return 0.5;

      // Base metals (moderate value)
      case MineralType.COPPER:
      case MineralType.TIN:
        return 0.6;
      case MineralType.IRON:
        return 0.5;
      case MineralType.LEAD:
      case MineralType.ZINC:
        return 0.4;

      // Construction minerals (lower value)
      case MineralType.MARBLE:
        return 0.4;
      case MineralType.GRANITE:
      case MineralType.LIMESTONE:
        return 0.3;
      case MineralType.SAND:
      case MineralType.CLAY:
        return 0.2;

      // Other minerals
      case MineralType.SALT:
      case MineralType.SULFUR:
      case MineralType.QUARTZ:
        return 0.3;

      default:
        return 0.5;
    }
  }

  private validateProperties(): void {
    if (this.depositProperties.estimatedQuantity < 0) {
      throw new Error('Estimated quantity cannot be negative');
    }
    if (this.depositProperties.depth < 0) {
      throw new Error('Depth cannot be negative');
    }
    if (this.depositProperties.purity < 0 || this.depositProperties.purity > 1) {
      throw new Error('Purity must be between 0 and 1');
    }
    if (this.depositProperties.extractionDifficulty < 0 || this.depositProperties.extractionDifficulty > 1) {
      throw new Error('Extraction difficulty must be between 0 and 1');
    }
  }
}
