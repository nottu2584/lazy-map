import { useState } from 'react';
import { toast } from 'sonner';
import { apiService } from '../services/apiService';
import type { MapSettings, GeneratedMap } from '@/types';

export function useMapGeneration() {
  const [generatedMap, setGeneratedMap] = useState<GeneratedMap | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>('');

  const generateMap = async (settings: MapSettings) => {
    setIsGenerating(true);
    setError(null);
    setProgress('Initializing map generation...');

    try {
      const progressSteps = [
        'Generating terrain...',
        'Adding elevation details...',
        'Creating forests and vegetation...',
        'Placing features...',
        'Finalizing map...',
      ];

      let stepIndex = 0;
      const progressInterval = setInterval(() => {
        if (stepIndex < progressSteps.length) {
          setProgress(progressSteps[stepIndex]);
          stepIndex++;
        }
      }, 1000);

      const response = await apiService.generateMap(settings);

      clearInterval(progressInterval);
      setProgress('Map generation complete!');
      setGeneratedMap(response);
      toast.success('Map generated successfully!');

      setTimeout(() => setProgress(''), 2000);
    } catch (err) {
      setProgress('');
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to generate map';
      setError(errorMessage);
      toast.error(errorMessage, {
        description: 'Please try again or adjust your settings.',
      });

      setTimeout(() => setError(null), 10000);
    } finally {
      setIsGenerating(false);
    }
  };

  const clearError = () => setError(null);

  return {
    generatedMap,
    isGenerating,
    error,
    progress,
    generateMap,
    clearError,
  };
}
