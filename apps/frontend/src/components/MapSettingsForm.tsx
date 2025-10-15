import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/apiService';
import { seedHistoryService, type SeedHistoryEntry } from '../services/seedHistoryService';
import type { MapSettings } from './MapGenerator';

interface MapSettingsFormProps {
  onGenerate: (settings: MapSettings) => void;
  isGenerating: boolean;
}

export function MapSettingsForm({ onGenerate, isGenerating }: MapSettingsFormProps) {
  const [settings, setSettings] = useState<MapSettings>({
    name: 'My Battlemap',
    width: 25,
    height: 20,
    cellSize: 32,
    seed: '',
    generateForests: true,
    generateRivers: false,
    generateRoads: false,
    generateBuildings: false,
    terrainDistribution: {
      grassland: 0.4,
      forest: 0.3,
      mountain: 0.2,
      water: 0.1
    },
    forestSettings: {
      forestDensity: 0.3,
      treeDensity: 0.6,
      treeClumping: 0.7
    }
  });

  // Seed history state
  const [seedHistory, setSeedHistory] = useState<SeedHistoryEntry[]>([]);
  const [showSeedHistory, setShowSeedHistory] = useState(false);

  // Load seed history on component mount
  useEffect(() => {
    setSeedHistory(seedHistoryService.getRecentSeeds(10));
  }, []);

  // Seed validation state
  const [seedValidation, setSeedValidation] = useState<{
    isValidating: boolean;
    isValid: boolean;
    error?: string;
    warnings?: string[];
    normalizedSeed?: number;
  }>({
    isValidating: false,
    isValid: true
  });

  // Debounced seed validation
  const validateSeed = useCallback(async (seed: string) => {
    if (!seed.trim()) {
      setSeedValidation({ isValidating: false, isValid: true });
      return;
    }

    setSeedValidation(prev => ({ ...prev, isValidating: true }));
    
    try {
      const result = await apiService.validateSeed(seed);
      setSeedValidation({
        isValidating: false,
        isValid: result.valid,
        error: result.error,
        warnings: result.warnings,
        normalizedSeed: result.normalizedSeed
      });
    } catch (error) {
      setSeedValidation({
        isValidating: false,
        isValid: false,
        error: error instanceof Error ? error.message : 'Validation failed'
      });
    }
  }, []);

  // Debounce seed validation
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      validateSeed(settings.seed || '');
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [settings.seed, validateSeed]);

  // Handle seed history operations
  const applySeedFromHistory = (entry: SeedHistoryEntry) => {
    setSettings(prev => ({
      ...prev,
      seed: String(entry.seed),
      name: entry.mapName
    }));
    setShowSeedHistory(false);
  };

  const removeSeedFromHistory = (id: string) => {
    seedHistoryService.removeEntry(id);
    setSeedHistory(seedHistoryService.getRecentSeeds(10));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Save successful generation to history
    if (settings.seed) {
      seedHistoryService.saveEntry({
        seed: settings.seed,
        mapName: settings.name,
        generationSuccess: true, // Assume success for now
        metadata: {
          dimensions: { width: settings.width, height: settings.height },
          cellSize: settings.cellSize,
          algorithmVersion: '1.0.0'
        }
      });
      // Update history display
      setSeedHistory(seedHistoryService.getRecentSeeds(10));
    }
    
    onGenerate(settings);
  };

  const updateSetting = <K extends keyof MapSettings>(
    key: K,
    value: MapSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const updateTerrainDistribution = (terrain: string, value: number) => {
    setSettings(prev => ({
      ...prev,
      terrainDistribution: {
        ...prev.terrainDistribution,
        [terrain]: value
      }
    }));
  };

  const updateForestSettings = (key: string, value: number) => {
    setSettings(prev => ({
      ...prev,
      forestSettings: {
        ...prev.forestSettings,
        [key]: value
      }
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Settings */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-3">Basic Settings</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Map Name</label>
            <input
              type="text"
              value={settings.name}
              onChange={(e) => updateSetting('name', e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Width</label>
              <input
                type="number"
                min="10"
                max="100"
                value={settings.width}
                onChange={(e) => updateSetting('width', parseInt(e.target.value))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Height</label>
              <input
                type="number"
                min="10"
                max="100"
                value={settings.height}
                onChange={(e) => updateSetting('height', parseInt(e.target.value))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Seed (optional)</label>
            <div className="relative">
              <input
                type="text"
                value={settings.seed}
                onChange={(e) => updateSetting('seed', e.target.value)}
                placeholder="Leave empty for random"
                className={`mt-1 block w-full px-3 py-2 pr-10 border rounded-md shadow-sm focus:outline-none text-sm ${
                  seedValidation.isValidating
                    ? 'border-yellow-300 focus:ring-yellow-500 focus:border-yellow-500'
                    : seedValidation.isValid
                    ? 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    : 'border-red-300 focus:ring-red-500 focus:border-red-500'
                }`}
              />
              {seedValidation.isValidating && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-500"></div>
                </div>
              )}
              {!seedValidation.isValidating && !seedValidation.isValid && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <svg className="h-4 w-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
              {!seedValidation.isValidating && seedValidation.isValid && settings.seed && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
            {seedValidation.error && (
              <p className="mt-1 text-sm text-red-600">{seedValidation.error}</p>
            )}
            {seedValidation.warnings && seedValidation.warnings.length > 0 && (
              <div className="mt-1 space-y-1">
                {seedValidation.warnings.map((warning, index) => (
                  <p key={index} className="text-sm text-yellow-600">{warning}</p>
                ))}
              </div>
            )}
            {seedValidation.normalizedSeed && (
              <p className="mt-1 text-sm text-gray-500">
                Normalized seed: {seedValidation.normalizedSeed}
              </p>
            )}
            
            {/* Seed History */}
            {seedHistory.length > 0 && (
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => setShowSeedHistory(!showSeedHistory)}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <svg className={`h-4 w-4 transform transition-transform ${showSeedHistory ? 'rotate-90' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  Recent Seeds ({seedHistory.length})
                </button>
                
                {showSeedHistory && (
                  <div className="mt-2 bg-gray-50 rounded-md p-3 space-y-2 max-h-48 overflow-y-auto">
                    {seedHistory.map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between bg-white rounded px-3 py-2 shadow-sm">
                        <div className="flex-1 min-w-0">
                          <button
                            type="button"
                            onClick={() => applySeedFromHistory(entry)}
                            className="text-left w-full hover:text-blue-600 group"
                          >
                            <div className="text-sm font-medium text-gray-900 group-hover:text-blue-600 truncate">
                              {entry.mapName}
                            </div>
                            <div className="text-xs text-gray-500 truncate">
                              Seed: {typeof entry.seed === 'string' ? `"${entry.seed}"` : entry.seed}
                              {entry.metadata?.dimensions && ` • ${entry.metadata.dimensions.width}×${entry.metadata.dimensions.height}`}
                            </div>
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeSeedFromHistory(entry.id)}
                          className="ml-2 text-gray-400 hover:text-red-500 flex-shrink-0"
                        >
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    ))}
                    {seedHistory.length > 5 && (
                      <button
                        type="button"
                        onClick={() => {
                          seedHistoryService.clearHistory();
                          setSeedHistory([]);
                        }}
                        className="w-full text-center text-xs text-gray-500 hover:text-red-500 pt-2 border-t"
                      >
                        Clear All History
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Terrain Distribution */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-3">Terrain Distribution</h3>
        <div className="space-y-3">
          {Object.entries(settings.terrainDistribution).map(([terrain, value]) => (
            <div key={terrain}>
              <label className="block text-sm font-medium text-gray-700 capitalize">
                {terrain}: {Math.round(value * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={value}
                onChange={(e) => updateTerrainDistribution(terrain, parseFloat(e.target.value))}
                className="mt-1 block w-full"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-3">Features</h3>
        <div className="space-y-2">
          {[
            { key: 'generateForests', label: 'Generate Forests' },
            { key: 'generateRivers', label: 'Generate Rivers' },
            { key: 'generateRoads', label: 'Generate Roads' },
            { key: 'generateBuildings', label: 'Generate Buildings' }
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center">
              <input
                type="checkbox"
                checked={settings[key as keyof MapSettings] as boolean}
                onChange={(e) => updateSetting(key as keyof MapSettings, e.target.checked as any)}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
              <span className="ml-2 text-sm text-gray-700">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Forest Settings */}
      {settings.generateForests && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">Forest Settings</h3>
          <div className="space-y-3">
            {Object.entries(settings.forestSettings).map(([key, value]) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700">
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}: {Math.round(value * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={value}
                  onChange={(e) => updateForestSettings(key, parseFloat(e.target.value))}
                  className="mt-1 block w-full"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={isGenerating}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
      >
        {isGenerating ? 'Generating...' : 'Generate Map'}
      </button>
    </form>
  );
}