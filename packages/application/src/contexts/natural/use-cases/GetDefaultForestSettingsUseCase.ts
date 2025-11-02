/**
 * Forest generation settings
 */
export interface ForestSettings {
  treeDensity: number;
  treeClumping: number;
  preferredSpecies: string[];
  allowTreeOverlap: boolean;
  enableInosculation: boolean;
  underbrushDensity: number;
}

/**
 * Use case for getting default forest creation settings
 */
export class GetDefaultForestSettingsUseCase {
  /**
   * Execute the use case
   */
  execute(): ForestSettings {
    return {
      treeDensity: 0.6,
      treeClumping: 0.7,
      preferredSpecies: ['oak', 'pine', 'birch'],
      allowTreeOverlap: true,
      enableInosculation: true,
      underbrushDensity: 0.4
    };
  }
}