import { 
  CreateForestUseCase, 
  UpdateForestUseCase
} from '../use-cases';
import { RemoveFeatureUseCase } from '../../../common/use-cases';
import { 
  CreateForestCommand, 
  UpdateForestCommand,
  RemoveFeatureCommand,
  FeatureOperationResult
} from '../../../common/ports/IFeatureManagementPort';

/**
 * Application service for feature-related operations
 * Coordinates feature management use cases
 */
export class FeatureApplicationService {
  constructor(
    private readonly createForestUseCase: CreateForestUseCase,
    private readonly updateForestUseCase: UpdateForestUseCase,
    private readonly removeFeatureUseCase: RemoveFeatureUseCase
  ) {}

  /**
   * Create a new forest feature on a map
   */
  async createForest(command: CreateForestCommand): Promise<FeatureOperationResult> {
    return await this.createForestUseCase.execute(command);
  }

  /**
   * Update an existing forest feature
   */
  async updateForest(command: UpdateForestCommand): Promise<FeatureOperationResult> {
    return await this.updateForestUseCase.execute(command);
  }

  /**
   * Remove a feature from a map
   */
  async removeFeature(command: RemoveFeatureCommand): Promise<FeatureOperationResult> {
    return await this.removeFeatureUseCase.execute(command);
  }

  /**
   * Get default forest creation settings
   */
  getDefaultForestSettings(): CreateForestCommand['forestSettings'] {
    return {
      treeDensity: 0.6,
      treeClumping: 0.7,
      preferredSpecies: ['oak', 'pine', 'birch'],
      allowTreeOverlap: true,
      enableInosculation: true,
      underbrushDensity: 0.4
    };
  }

  /**
   * Validate forest area dimensions
   */
  validateForestArea(width: number, height: number): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (width <= 0 || height <= 0) {
      errors.push('Forest dimensions must be positive');
    }

    if (!Number.isInteger(width) || !Number.isInteger(height)) {
      errors.push('Forest dimensions must be integers');
    }

    const area = width * height;
    
    if (area > 10000) {
      warnings.push('Very large forests may take significant time to generate');
    } else if (area < 4) {
      warnings.push('Very small forests may not have room for multiple trees');
    }

    if (width > 200 || height > 200) {
      warnings.push('Large forest dimensions may impact performance');
    }

    const aspectRatio = Math.max(width, height) / Math.min(width, height);
    if (aspectRatio > 5) {
      warnings.push('Extreme aspect ratios may create unnatural-looking forests');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}