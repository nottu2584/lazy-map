import { useState, useCallback, useEffect } from 'react';
import { apiService } from '../services/apiService';
import type { SeedValidationResult } from '@/types';

export function useSeedValidation(seed: string | undefined) {
  const [validation, setValidation] = useState<
    SeedValidationResult & { isValidating: boolean }
  >({
    isValidating: false,
    valid: true,
  });

  const validateSeed = useCallback(async (seedValue: string) => {
    if (!seedValue.trim()) {
      setValidation({ isValidating: false, valid: true });
      return;
    }

    setValidation((prev) => ({ ...prev, isValidating: true }));

    try {
      const result = await apiService.validateSeed(seedValue);
      setValidation({
        isValidating: false,
        valid: result.valid,
        error: result.error,
        warnings: result.warnings,
        normalizedSeed: result.normalizedSeed,
      });
    } catch (error) {
      setValidation({
        isValidating: false,
        valid: false,
        error: error instanceof Error ? error.message : 'Validation failed',
      });
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      validateSeed(seed || '');
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [seed, validateSeed]);

  return validation;
}
