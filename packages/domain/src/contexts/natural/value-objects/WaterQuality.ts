/**
 * Water clarity levels
 */
export enum WaterClarity {
  CRYSTAL_CLEAR = 'crystal_clear',
  CLEAR = 'clear',
  SLIGHTLY_MURKY = 'slightly_murky',
  MURKY = 'murky',
  VERY_MURKY = 'very_murky',
}

/**
 * Water temperature ranges
 */
export enum WaterTemperature {
  FREEZING = 'freezing', // < 32°F, may be frozen
  COLD = 'cold', // 32-50°F
  COOL = 'cool', // 50-65°F
  MODERATE = 'moderate', // 65-75°F
  WARM = 'warm', // 75-85°F
  HOT = 'hot', // > 85°F, hot springs
}

/**
 * Water salinity levels
 */
export enum WaterSalinity {
  FRESH = 'fresh', // Rivers, lakes, springs
  BRACKISH = 'brackish', // Mixed fresh/salt water
  SALT = 'salt', // Ocean water, salt lakes
}

/**
 * Represents water quality characteristics
 */
export class WaterQuality {
  constructor(
    public readonly clarity: WaterClarity,
    public readonly temperature: WaterTemperature,
    public readonly salinity: WaterSalinity,
    public readonly pollution: number = 0, // 0-10 scale, 0 = pristine
    public readonly oxygenLevel: number = 8, // 0-10 scale, 8+ = healthy
    public readonly nutrients: number = 3, // 0-10 scale, 3-7 = balanced
  ) {
    this.validatePollution(pollution);
    this.validateOxygenLevel(oxygenLevel);
    this.validateNutrients(nutrients);
  }

  /**
   * Create pristine water quality (natural spring/mountain lake)
   */
  static pristine(
    temperature: WaterTemperature = WaterTemperature.COOL,
    salinity: WaterSalinity = WaterSalinity.FRESH,
  ): WaterQuality {
    return new WaterQuality(
      WaterClarity.CRYSTAL_CLEAR,
      temperature,
      salinity,
      0, // No pollution
      9, // High oxygen
      4, // Balanced nutrients
    );
  }

  /**
   * Create typical river water quality
   */
  static river(temperature: WaterTemperature = WaterTemperature.COOL): WaterQuality {
    return new WaterQuality(
      WaterClarity.CLEAR,
      temperature,
      WaterSalinity.FRESH,
      1, // Minimal pollution
      8, // Good oxygen
      5, // Moderate nutrients
    );
  }

  /**
   * Create typical lake water quality
   */
  static lake(temperature: WaterTemperature = WaterTemperature.MODERATE): WaterQuality {
    return new WaterQuality(
      WaterClarity.CLEAR,
      temperature,
      WaterSalinity.FRESH,
      1, // Minimal pollution
      7, // Moderate oxygen
      6, // Higher nutrients
    );
  }

  /**
   * Create swamp/wetland water quality
   */
  static wetland(temperature: WaterTemperature = WaterTemperature.WARM): WaterQuality {
    return new WaterQuality(
      WaterClarity.MURKY,
      temperature,
      WaterSalinity.FRESH,
      2, // Some organic pollution
      6, // Lower oxygen due to decomposition
      8, // High nutrients
    );
  }

  /**
   * Create hot spring water quality
   */
  static hotSpring(): WaterQuality {
    return new WaterQuality(
      WaterClarity.CLEAR,
      WaterTemperature.HOT,
      WaterSalinity.FRESH, // Could be mineral-rich but still fresh
      0, // Natural, unpolluted
      5, // Lower oxygen due to heat
      3, // Low nutrients
    );
  }

  /**
   * Check if water is potable (drinkable)
   */
  get isPotable(): boolean {
    return (
      this.pollution <= 2 &&
      this.salinity === WaterSalinity.FRESH &&
      this.oxygenLevel >= 6 &&
      this.nutrients <= 7
    );
  }

  /**
   * Check if water supports fish life
   */
  get supportsFish(): boolean {
    return (
      this.oxygenLevel >= 5 && this.pollution <= 6 && this.temperature !== WaterTemperature.FREEZING
    );
  }

  /**
   * Check if water supports plant life
   */
  get supportsPlants(): boolean {
    return this.oxygenLevel >= 4 && this.pollution <= 8 && this.nutrients >= 2;
  }

  /**
   * Check if water is suitable for swimming
   */
  get isSafeForSwimming(): boolean {
    return (
      this.pollution <= 3 &&
      this.clarity !== WaterClarity.VERY_MURKY &&
      this.temperature !== WaterTemperature.FREEZING
    );
  }

  /**
   * Get environmental health score (0-10)
   */
  get environmentalHealth(): number {
    const clarityScore = this.getClarityScore();
    const pollutionScore = 10 - this.pollution;
    const oxygenScore = this.oxygenLevel;
    const nutrientScore = this.getNutrientScore();

    return (clarityScore + pollutionScore + oxygenScore + nutrientScore) / 4;
  }

  /**
   * Check if water might freeze based on temperature
   */
  get mightFreeze(): boolean {
    return this.temperature === WaterTemperature.FREEZING;
  }

  /**
   * Create degraded water quality (for pollution effects)
   */
  degrade(pollutionIncrease: number): WaterQuality {
    const newPollution = Math.min(10, this.pollution + pollutionIncrease);
    const clarityDegradation = Math.floor(pollutionIncrease / 2);
    const newClarity = this.degradeClarity(clarityDegradation);
    const newOxygen = Math.max(0, this.oxygenLevel - Math.floor(pollutionIncrease / 3));

    return new WaterQuality(
      newClarity,
      this.temperature,
      this.salinity,
      newPollution,
      newOxygen,
      this.nutrients,
    );
  }

  private getClarityScore(): number {
    const scores = {
      [WaterClarity.CRYSTAL_CLEAR]: 10,
      [WaterClarity.CLEAR]: 8,
      [WaterClarity.SLIGHTLY_MURKY]: 6,
      [WaterClarity.MURKY]: 4,
      [WaterClarity.VERY_MURKY]: 2,
    };
    return scores[this.clarity];
  }

  private getNutrientScore(): number {
    // Nutrients are best in the 3-7 range (balanced)
    if (this.nutrients >= 3 && this.nutrients <= 7) return 10;
    if (this.nutrients >= 2 && this.nutrients <= 8) return 8;
    if (this.nutrients >= 1 && this.nutrients <= 9) return 6;
    return 4;
  }

  private degradeClarity(levels: number): WaterClarity {
    const clarityOrder = [
      WaterClarity.CRYSTAL_CLEAR,
      WaterClarity.CLEAR,
      WaterClarity.SLIGHTLY_MURKY,
      WaterClarity.MURKY,
      WaterClarity.VERY_MURKY,
    ];

    const currentIndex = clarityOrder.indexOf(this.clarity);
    const newIndex = Math.min(clarityOrder.length - 1, currentIndex + levels);
    return clarityOrder[newIndex];
  }

  private validatePollution(pollution: number): void {
    if (!Number.isFinite(pollution) || pollution < 0 || pollution > 10) {
      throw new Error('Pollution level must be between 0 and 10');
    }
  }

  private validateOxygenLevel(oxygen: number): void {
    if (!Number.isFinite(oxygen) || oxygen < 0 || oxygen > 10) {
      throw new Error('Oxygen level must be between 0 and 10');
    }
  }

  private validateNutrients(nutrients: number): void {
    if (!Number.isFinite(nutrients) || nutrients < 0 || nutrients > 10) {
      throw new Error('Nutrient level must be between 0 and 10');
    }
  }

  equals(other: WaterQuality): boolean {
    return (
      this.clarity === other.clarity &&
      this.temperature === other.temperature &&
      this.salinity === other.salinity &&
      Math.abs(this.pollution - other.pollution) < 0.1 &&
      Math.abs(this.oxygenLevel - other.oxygenLevel) < 0.1 &&
      Math.abs(this.nutrients - other.nutrients) < 0.1
    );
  }

  toString(): string {
    return `WaterQuality(${this.clarity}, ${this.temperature}, ${this.salinity}, pollution: ${this.pollution}, O2: ${this.oxygenLevel})`;
  }
}
