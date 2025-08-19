import { GenerateMapCommand, ValidationResult } from '../../ports/input';

/**
 * Use case for validating map generation settings
 */
export class ValidateMapSettingsUseCase {
  async execute(command: GenerateMapCommand): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic validation
    this.validateBasicSettings(command, errors, warnings);
    
    // Dimension validation
    this.validateDimensions(command, errors, warnings);
    
    // Terrain validation
    this.validateTerrainSettings(command, errors, warnings);
    
    // Forest validation
    this.validateForestSettings(command, errors, warnings);
    
    // Feature validation
    this.validateFeatureSettings(command, errors, warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  private validateBasicSettings(
    command: GenerateMapCommand,
    errors: string[],
    warnings: string[]
  ): void {
    if (!command.name || command.name.trim().length === 0) {
      errors.push('Map name is required and cannot be empty');
    } else if (command.name.length > 100) {
      warnings.push('Map name is very long and may be truncated in some displays');
    }

    if (command.description && command.description.length > 500) {
      warnings.push('Description is very long and may be truncated');
    }

    if (command.tags && command.tags.length > 10) {
      warnings.push('Many tags may make the map harder to categorize');
    }

    if (command.cellSize !== undefined) {
      if (command.cellSize <= 0) {
        errors.push('Cell size must be positive');
      } else if (command.cellSize < 16) {
        warnings.push('Very small cell sizes may impact performance');
      } else if (command.cellSize > 128) {
        warnings.push('Very large cell sizes may look pixelated');
      }
    }

    if (command.seed !== undefined && (command.seed < 0 || !Number.isInteger(command.seed))) {
      errors.push('Seed must be a non-negative integer');
    }
  }

  private validateDimensions(
    command: GenerateMapCommand,
    errors: string[],
    warnings: string[]
  ): void {
    if (command.width <= 0 || command.height <= 0) {
      errors.push('Map dimensions must be positive numbers');
      return;
    }

    if (!Number.isInteger(command.width) || !Number.isInteger(command.height)) {
      errors.push('Map dimensions must be integers');
      return;
    }

    const area = command.width * command.height;
    
    if (area > 1000000) {
      errors.push('Map is too large (maximum 1,000,000 tiles)');
    } else if (area > 100000) {
      warnings.push('Large maps may take significant time to generate and consume substantial memory');
    } else if (area < 100) {
      warnings.push('Very small maps may not have room for interesting features');
    }

    const aspectRatio = Math.max(command.width, command.height) / Math.min(command.width, command.height);
    if (aspectRatio > 10) {
      warnings.push('Extreme aspect ratios may not display well in some contexts');
    }
  }

  private validateTerrainSettings(
    command: GenerateMapCommand,
    errors: string[],
    warnings: string[]
  ): void {
    if (command.terrainDistribution) {
      const distribution = command.terrainDistribution;
      const values = Object.values(distribution);
      
      // Check for negative values
      if (values.some(val => val < 0)) {
        errors.push('Terrain distribution values cannot be negative');
      }

      // Check sum
      const sum = values.reduce((total, val) => total + val, 0);
      if (Math.abs(sum - 1.0) > 0.01) {
        if (sum === 0) {
          errors.push('Terrain distribution cannot be all zeros');
        } else if (sum > 1.1) {
          errors.push('Terrain distribution sum cannot exceed 1.1');
        } else {
          warnings.push(`Terrain distribution sum is ${sum.toFixed(2)}, should be 1.0`);
        }
      }
    }

    if (command.elevationVariance !== undefined) {
      if (command.elevationVariance < 0 || command.elevationVariance > 1) {
        errors.push('Elevation variance must be between 0 and 1');
      }
    }

    if (command.elevationMultiplier !== undefined) {
      if (command.elevationMultiplier < 0) {
        errors.push('Elevation multiplier cannot be negative');
      } else if (command.elevationMultiplier > 10) {
        warnings.push('Very high elevation multipliers may create extreme terrain');
      }
    }

    if (command.heightVariance !== undefined) {
      if (command.heightVariance < 0 || command.heightVariance > 1) {
        errors.push('Height variance must be between 0 and 1');
      }
    }

    if (command.inclinationChance !== undefined) {
      if (command.inclinationChance < 0 || command.inclinationChance > 1) {
        errors.push('Inclination chance must be between 0 and 1');
      }
    }
  }

  private validateForestSettings(
    command: GenerateMapCommand,
    errors: string[],
    warnings: string[]
  ): void {
    if (!command.generateForests || !command.forestSettings) {
      return;
    }

    const settings = command.forestSettings;

    if (settings.forestDensity !== undefined) {
      if (settings.forestDensity < 0 || settings.forestDensity > 1) {
        errors.push('Forest density must be between 0 and 1');
      }
    }

    if (settings.treeDensity !== undefined) {
      if (settings.treeDensity < 0 || settings.treeDensity > 1) {
        errors.push('Tree density must be between 0 and 1');
      } else if (settings.treeDensity > 0.8) {
        warnings.push('Very high tree density may create overcrowded forests');
      }
    }

    if (settings.treeClumping !== undefined) {
      if (settings.treeClumping < 0 || settings.treeClumping > 1) {
        errors.push('Tree clumping must be between 0 and 1');
      }
    }

    if (settings.preferredSpecies && settings.preferredSpecies.length === 0) {
      warnings.push('Empty preferred species list may result in random species selection');
    }

    // Check for conflicting settings
    if (settings.allowTreeOverlap === false && settings.treeDensity && settings.treeDensity > 0.5) {
      warnings.push('High tree density with no overlap may result in fewer trees than expected');
    }
  }

  private validateFeatureSettings(
    command: GenerateMapCommand,
    errors: string[],
    warnings: string[]
  ): void {
    // Validate biome type
    if (command.biomeType) {
      const validBiomes = ['temperate', 'tropical', 'arctic', 'desert', 'mixed'];
      if (!validBiomes.includes(command.biomeType)) {
        errors.push(`Invalid biome type. Must be one of: ${validBiomes.join(', ')}`);
      }
    }

    // Check for conflicting feature settings
    const featureCount = [
      command.generateRivers,
      command.generateRoads,
      command.generateBuildings,
      command.generateForests
    ].filter(Boolean).length;

    if (featureCount === 0) {
      warnings.push('No features enabled - map may be plain');
    }

    const area = command.width * command.height;
    if (featureCount > 3 && area < 400) {
      warnings.push('Many features on a small map may create overcrowding');
    }

    // Biome-specific warnings
    if (command.biomeType === 'desert' && command.generateRivers) {
      warnings.push('Rivers are uncommon in desert biomes');
    }

    if (command.biomeType === 'arctic' && command.generateForests) {
      warnings.push('Dense forests are uncommon in arctic biomes');
    }
  }
}