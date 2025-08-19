import { FeatureId } from '@lazy-map/domain';
import { RemoveFeatureCommand, FeatureOperationResult } from '../../ports/input';
import { 
  IMapPersistencePort, 
  INotificationPort 
} from '../../ports/output';

/**
 * Use case for removing features from maps
 */
export class RemoveFeatureUseCase {
  constructor(
    private readonly mapPersistence: IMapPersistencePort,
    private readonly notificationPort: INotificationPort
  ) {}

  async execute(command: RemoveFeatureCommand): Promise<FeatureOperationResult> {
    try {
      // Validate command
      const validationResult = this.validateCommand(command);
      if (!validationResult.isValid) {
        return {
          success: false,
          error: `Validation failed: ${validationResult.errors.join(', ')}`,
          warnings: validationResult.warnings
        };
      }

      // Load the feature to verify it exists and get metadata
      const feature = await this.mapPersistence.loadFeature(
        { value: command.featureId } as FeatureId
      );

      if (!feature) {
        return {
          success: false,
          error: `Feature with ID ${command.featureId} not found`
        };
      }

      // Remove the feature
      await this.mapPersistence.removeFeature(
        { value: command.featureId } as FeatureId
      );

      // Determine feature type for notification
      const featureType = this.getFeatureType(feature);
      const featureName = this.getFeatureName(feature);

      await this.notificationPort.notifyFeatureOperation(
        'removed',
        featureType,
        featureName,
        command.mapId || 'unknown'
      );

      return {
        success: true,
        warnings: validationResult.warnings
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      await this.notificationPort.notifyError(
        'Feature Removal Failed',
        errorMessage,
        { command, timestamp: new Date() }
      );

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  private validateCommand(command: RemoveFeatureCommand): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!command.featureId || command.featureId.trim().length === 0) {
      errors.push('Feature ID is required');
    }

    if (command.mapId && command.mapId.trim().length === 0) {
      errors.push('Map ID cannot be empty if provided');
    }

    if (!command.mapId) {
      warnings.push('Map ID not provided - notifications may be limited');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  private getFeatureType(feature: any): string {
    // Simple type detection based on constructor name or properties
    const className = feature.constructor.name.toLowerCase();
    
    if (className.includes('forest')) return 'forest';
    if (className.includes('river')) return 'river';
    if (className.includes('road')) return 'road';
    if (className.includes('building')) return 'building';
    
    return 'feature';
  }

  private getFeatureName(feature: any): string {
    if (feature.name && typeof feature.name === 'string') {
      return feature.name;
    }
    
    if (feature.id && typeof feature.id === 'object' && feature.id.value) {
      return `Unnamed ${this.getFeatureType(feature)} (${feature.id.value.substring(0, 8)})`;
    }
    
    return `Unnamed ${this.getFeatureType(feature)}`;
  }
}