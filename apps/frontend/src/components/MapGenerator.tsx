import { useState } from 'react';
import { MapSettingsForm } from './MapSettingsForm';
import { MapCanvas } from './MapCanvas';
import { useAuth } from '../contexts/AuthContext';
import { LoginForm } from './LoginForm';
import { apiService } from '../services/apiService';

export interface MapSettings {
  name: string;
  width: number;
  height: number;
  cellSize: number;
  seed?: string;
  generateForests: boolean;
  generateRivers: boolean;
  generateRoads: boolean;
  generateBuildings: boolean;
  terrainDistribution: {
    grassland: number;
    forest: number;
    mountain: number;
    water: number;
  };
  forestSettings: {
    forestDensity: number;
    treeDensity: number;
    treeClumping: number;
  };
}

export interface GeneratedMap {
  id: string;
  name: string;
  width: number;
  height: number;
  cellSize: number;
  tiles: Array<{
    x: number;
    y: number;
    terrain: string;
    elevation: number;
    features: string[];
  }>;
}

export function MapGenerator() {
  const { user } = useAuth();
  const [generatedMap, setGeneratedMap] = useState<GeneratedMap | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>('');

  const handleGenerateMap = async (settings: MapSettings) => {
    setIsGenerating(true);
    setError(null);
    setProgress('Initializing map generation...');

    try {
      // Simulate progress updates for better UX
      const progressSteps = [
        'Generating terrain...',
        'Adding elevation details...',
        'Creating forests and vegetation...',
        'Placing features...',
        'Finalizing map...'
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

      // Clear progress after a short delay
      setTimeout(() => setProgress(''), 2000);
    } catch (err) {
      setProgress('');
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate map';
      setError(errorMessage);

      // Auto-clear error after 10 seconds
      setTimeout(() => setError(null), 10000);
    } finally {
      setIsGenerating(false);
    }
  };

  const clearError = () => setError(null);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Settings Panel */}
      <div className="lg:col-span-1">
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Map Settings
          </h2>
          <MapSettingsForm
            onGenerate={handleGenerateMap}
            isGenerating={isGenerating}
          />

          {/* Progress indicator */}
          {isGenerating && progress && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent mr-3"></div>
                <span className="text-blue-700 text-sm">{progress}</span>
              </div>
            </div>
          )}

          {/* Error display */}
          {error && (
            <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              <div className="flex items-center justify-between">
                <span>{error}</span>
                <button
                  onClick={clearError}
                  className="ml-3 text-red-500 hover:text-red-700"
                  aria-label="Close error"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Map Canvas */}
      <div className="lg:col-span-2">
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Generated Map
          </h2>
          {isGenerating ? (
            <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg h-96 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
                <p className="text-gray-600 font-medium">{progress || 'Generating map...'}</p>
                <p className="text-gray-500 text-sm mt-2">This may take a few moments</p>
              </div>
            </div>
          ) : generatedMap ? (
            <MapCanvas map={generatedMap} />
          ) : (
            <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg h-96 flex items-center justify-center">
              <div className="text-center">
                <div className="text-gray-400 text-lg mb-2">
                  🗺️
                </div>
                <p className="text-gray-500">
                  Configure settings and click "Generate Map" to create your battlemap
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}