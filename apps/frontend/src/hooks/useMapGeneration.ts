import { useState } from 'react';
import { toast } from 'sonner';
import { apiService } from '../services';
import type { MapSettings, GeneratedMap } from '@/types';

export function useMapGeneration() {
  const [generatedMap, setGeneratedMap] = useState<GeneratedMap | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>('');
  const [progressValue, setProgressValue] = useState<number>(0);

  const generateMap = async (settings: MapSettings) => {
    setIsGenerating(true);
    setError(null);
    setProgress('Initializing map generation...');
    setProgressValue(0);

    try {
      const progressSteps = [
        { text: 'Generating terrain...', value: 20 },
        { text: 'Adding elevation details...', value: 40 },
        { text: 'Creating forests and vegetation...', value: 60 },
        { text: 'Placing features...', value: 80 },
        { text: 'Finalizing map...', value: 95 },
      ];

      let stepIndex = 0;
      const progressInterval = setInterval(() => {
        if (stepIndex < progressSteps.length) {
          setProgress(progressSteps[stepIndex].text);
          setProgressValue(progressSteps[stepIndex].value);
          stepIndex++;
        }
      }, 1000);

      const response = await apiService.generateMap(settings);

      clearInterval(progressInterval);
      setProgress('Map generation complete!');
      setProgressValue(100);
      setGeneratedMap(response);
      toast.success('Map generated successfully!');

      setTimeout(() => {
        setProgress('');
        setProgressValue(0);
      }, 2000);
    } catch (err) {
      setProgress('');
      setProgressValue(0);
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
    progressValue,
    generateMap,
    clearError,
  };
}
