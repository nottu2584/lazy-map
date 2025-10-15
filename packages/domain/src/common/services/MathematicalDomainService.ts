import { Range } from '../value-objects/Range';

/**
 * Mathematical utilities as domain services rather than static utils
 * Provides domain-specific mathematical operations and factory methods
 */
export class MathematicalDomainService {
  /**
   * Create a range for common domain constraints
   */
  static createMapDimensionRange(): Range {
    return Range.create(1, 200);
  }

  /**
   * Create a percentage range
   */
  static createPercentageRange(): Range {
    return Range.create(0, 100);
  }

  /**
   * Create a probability range
   */
  static createProbabilityRange(): Range {
    return Range.create(0, 1);
  }

  /**
   * Validate if dimensions are within acceptable map limits
   */
  static validateMapDimensions(width: number, height: number): boolean {
    const dimensionRange = this.createMapDimensionRange();
    return dimensionRange.contains(width) && dimensionRange.contains(height);
  }

  /**
   * Calculate distance between two points
   */
  static calculateDistance(x1: number, y1: number, x2: number, y2: number): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  }
}