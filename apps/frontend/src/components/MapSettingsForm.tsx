import { useState } from 'react';
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
            <input
              type="text"
              value={settings.seed}
              onChange={(e) => updateSetting('seed', e.target.value)}
              placeholder="Leave empty for random"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
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