/**
 * Command for validating forest area
 */
export interface ValidateForestAreaCommand {
  width: number;
  height: number;
}

/**
 * Result of forest area validation
 */
export interface ValidateForestAreaResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Use case for validating forest area dimensions
 */
export class ValidateForestAreaUseCase {
  /**
   * Execute the use case
   */
  execute(command: ValidateForestAreaCommand): ValidateForestAreaResult {
    const { width, height } = command;
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