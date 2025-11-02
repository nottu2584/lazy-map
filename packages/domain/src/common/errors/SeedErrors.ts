import { ValidationError } from './types/ValidationError';
import { DeterministicError } from './types/DeterministicError';
import { ErrorContext } from './interfaces/ErrorContext';

/**
 * Seed-specific error codes
 */
export const SeedErrorCodes = {
  // Validation Errors
  SEED_EMPTY_STRING: 'SEED_EMPTY_STRING',
  SEED_INVALID_TYPE: 'SEED_INVALID_TYPE',
  SEED_NOT_FINITE: 'SEED_NOT_FINITE',
  SEED_OUT_OF_RANGE: 'SEED_OUT_OF_RANGE',
  
  // Deterministic Errors
  SEED_NON_DETERMINISTIC: 'SEED_NON_DETERMINISTIC',
  SEED_RANDOM_FALLBACK: 'SEED_RANDOM_FALLBACK',
  
  // Generation Errors
  SEED_GENERATION_FAILED: 'SEED_GENERATION_FAILED',
  SEED_HASH_FAILED: 'SEED_HASH_FAILED'
} as const;

/**
 * Factory for seed-related errors
 */
export class SeedErrors {
  /**
   * Error for empty string input to deterministic seed generation
   */
  static emptyStringInput(context?: ErrorContext): DeterministicError {
    return new DeterministicError(
      SeedErrorCodes.SEED_EMPTY_STRING,
      'Cannot generate deterministic seed from empty string. String input must contain at least 1 character to ensure deterministic behavior.',
      'Seed text cannot be empty. Please provide at least one character.',
      context,
      [
        'Provide a non-empty string for seed generation',
        'Use a map name, description, or other meaningful text',
        'Consider using a numeric seed instead'
      ]
    );
  }

  /**
   * Error for invalid seed type
   */
  static invalidType(actualType: string, context?: ErrorContext): ValidationError {
    return new ValidationError(
      SeedErrorCodes.SEED_INVALID_TYPE,
      `Invalid seed type: ${actualType}. Expected number or string.`,
      'Seed must be a number or text string.',
      context,
      [
        'Provide a numeric seed (e.g., 12345)',
        'Provide a text string (e.g., "my-map-name")',
        'Check the seed input format'
      ]
    );
  }

  /**
   * Error for non-finite numeric seeds
   */
  static notFinite(context?: ErrorContext): ValidationError {
    return new ValidationError(
      SeedErrorCodes.SEED_NOT_FINITE,
      'Seed must be a finite number',
      'Seed cannot be infinity or NaN.',
      context,
      [
        'Use a regular number instead of Infinity',
        'Check for calculation errors that might produce NaN',
        'Use a string seed if you need complex input'
      ]
    );
  }

  /**
   * Error for seeds outside valid range
   */
  static outOfRange(value: number, min: number, max: number, context?: ErrorContext): ValidationError {
    return new ValidationError(
      SeedErrorCodes.SEED_OUT_OF_RANGE,
      `Seed ${value} is outside valid range [${min}, ${max}]`,
      `Seed must be between ${min} and ${max}.`,
      {
        ...context,
        metadata: { value, min, max }
      },
      [
        `Use a number between ${min} and ${max}`,
        'The seed will be automatically adjusted if slightly out of range',
        'Consider using a string seed for more flexibility'
      ]
    );
  }

  /**
   * Error for operations that break determinism
   */
  static nonDeterministic(operation: string, context?: ErrorContext): DeterministicError {
    return new DeterministicError(
      SeedErrorCodes.SEED_NON_DETERMINISTIC,
      `Operation '${operation}' breaks deterministic seed generation. Random seeds prevent reproducible map generation.`,
      'This operation would create random seeds that cannot be shared reliably.',
      {
        ...context,
        operation
      },
      [
        'Use parameter-based seed generation instead',
        'Provide an explicit seed value',
        'Use ResolveSeedUseCase for reproducible seeds'
      ]
    );
  }

  /**
   * Error for fallback to random seed generation
   */
  static randomFallback(reason: string, context?: ErrorContext): DeterministicError {
    return new DeterministicError(
      SeedErrorCodes.SEED_RANDOM_FALLBACK,
      `Fallback to random seed generation: ${reason}. This breaks reproducibility.`,
      'Unable to create a reproducible seed with the provided input.',
      {
        ...context,
        metadata: { reason }
      },
      [
        'Provide valid input for deterministic seed generation',
        'Use explicit numeric seeds for guaranteed reproducibility',
        'Check that all parameters are properly specified'
      ]
    );
  }

  /**
   * Error for general seed generation failures
   */
  static generationFailed(details: string, context?: ErrorContext): ValidationError {
    return new ValidationError(
      SeedErrorCodes.SEED_GENERATION_FAILED,
      `Seed generation failed: ${details}`,
      'Unable to generate a valid seed from the provided input.',
      {
        ...context,
        metadata: { details }
      },
      [
        'Check the input format and try again',
        'Use a different seed input method',
        'Contact support if the problem persists'
      ]
    );
  }
}