import { 
  Forest,
  FeatureId,
  IVegetationGenerationService
} from '@lazy-map/domain';
import { UpdateForestCommand, FeatureOperationResult } from '../../../ports/input';
import { 
  IMapPersistencePort, 
  IRandomGeneratorPort, 
  INotificationPort 
} from '../../../ports/output';
import { RandomGeneratorAdapter } from '../../../common/adapters';

/**
 * Simplified use case for updating existing forests
 */
export class UpdateForestUseCase {
  constructor(
    private readonly vegetationService: IVegetationGenerationService,
    private readonly mapPersistence: IMapPersistencePort,
    private readonly randomGeneratorPort: IRandomGeneratorPort,
    private readonly notificationPort: INotificationPort
  ) {}

  async execute(command: UpdateForestCommand): Promise<FeatureOperationResult> {
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

      // Load existing forest
      const forestId = new FeatureId(command.featureId);
      const existingForest = await this.mapPersistence.loadFeature(forestId);

      if (!existingForest || existingForest.getType() !== 'forest') {
        return {
          success: false,
          error: `Forest with ID ${command.featureId} not found`
        };
      }

      const forest = existingForest as Forest;
      let updated = false;

      // Update forest name if provided
      if (command.name && command.name !== forest.name) {
        // Create updated forest with new name
        // Note: Forest entity would need to be made mutable or recreated
        updated = true;
      }

      // Add trees if requested
      if (command.addTrees && command.addTrees > 0) {
        const seededRng = this.randomGeneratorPort.createSeeded();
        const randomGenerator = new RandomGeneratorAdapter(seededRng);
        
        // Generate additional understory vegetation for the existing forest
        await this.vegetationService.generateUnderstoryVegetation(
          forest,
          {
            shrubDensity: 0.1,
            fernDensity: 0.05,
            flowerDensity: 0.02
          },
          randomGenerator
        );

        // In a real implementation, we'd add these plants to the forest
        updated = true;
      }

      // Remove trees if requested
      if (command.removeTrees && command.removeTrees.length > 0) {
        // Remove specified trees by ID
        command.removeTrees.forEach(_treeId => {
          // Implementation would remove tree from forest
        });
        updated = true;
      }

      // Age the forest if requested
      if (command.ageForest && command.ageForest > 0) {
        // Apply aging effects to the forest
        // This would modify tree properties, add dead trees, create gaps, etc.
        updated = true;
      }

      if (updated) {
        // Save updated forest
        await this.mapPersistence.updateFeature(forest);

        // Notify success
        await this.notificationPort.notifyFeatureOperation(
          'updated',
          'forest',
          forest.name,
          'unknown' // mapId not available in command
        );

        return {
          success: true,
          feature: forest,
          warnings: validationResult.warnings
        };
      } else {
        return {
          success: true,
          feature: forest,
          warnings: ['No changes were made to the forest']
        };
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      await this.notificationPort.notifyError(
        'Forest Update Failed',
        errorMessage,
        { command, timestamp: new Date() }
      );

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  private validateCommand(command: UpdateForestCommand): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!command.featureId || command.featureId.trim().length === 0) {
      errors.push('Feature ID is required');
    }

    if (command.addTrees !== undefined && command.addTrees < 0) {
      errors.push('Number of trees to add cannot be negative');
    }

    if (command.ageForest !== undefined && command.ageForest < 0) {
      errors.push('Forest aging value cannot be negative');
    }

    if (!command.name && !command.addTrees && !command.removeTrees && !command.ageForest) {
      warnings.push('No update operations specified');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}