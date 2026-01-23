import { useState } from 'react';
import type { AdvancedMapSettings } from '@/types';
import { ElevationSettings } from './ElevationSettings';
import { VegetationSettings } from './VegetationSettings';
import { TerrainDistributionSettings } from './TerrainDistributionSettings';
import { FeatureToggles } from './FeatureToggles';

export interface MapAdvancedSettingsProps {
  settings?: AdvancedMapSettings;
  onChange: (settings: AdvancedMapSettings) => void;
}

export function MapAdvancedSettings({ settings = {}, onChange }: MapAdvancedSettingsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateElevation = (elevation: NonNullable<AdvancedMapSettings['elevation']>) => {
    onChange({ ...settings, elevation });
  };

  const updateVegetation = (vegetation: NonNullable<AdvancedMapSettings['vegetation']>) => {
    onChange({ ...settings, vegetation });
  };

  const updateTerrainDistribution = (
    terrainDistribution: NonNullable<AdvancedMapSettings['terrainDistribution']>
  ) => {
    onChange({ ...settings, terrainDistribution });
  };

  const updateFeatures = (features: NonNullable<AdvancedMapSettings['features']>) => {
    onChange({ ...settings, features });
  };

  const hasModifiedSettings = () => {
    return (
      settings.elevation ||
      settings.vegetation ||
      settings.terrainDistribution ||
      settings.features ||
      settings.biomeOverride
    );
  };

  const handleResetAll = () => {
    onChange({});
    setIsExpanded(false);
  };

  return (
    <div className="border border-gray-300 rounded-md">
      {/* Collapsible Header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <svg
            className={`h-5 w-5 text-gray-500 transform transition-transform ${
              isExpanded ? 'rotate-90' : ''
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
              clipRule="evenodd"
            />
          </svg>
          <div className="text-left">
            <h3 className="text-lg font-medium text-gray-900">Advanced Settings</h3>
            <p className="text-sm text-gray-500">
              Fine-tune terrain, vegetation, and features
            </p>
          </div>
          {hasModifiedSettings() && (
            <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
              Modified
            </span>
          )}
        </div>
        <div className="text-sm text-gray-500">
          {isExpanded ? 'Click to collapse' : 'Click to expand'}
        </div>
      </button>

      {/* Collapsible Content */}
      {isExpanded && (
        <div className="border-t border-gray-300 p-4 space-y-6 bg-gray-50">
          {/* Reset All Button */}
          {hasModifiedSettings() && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleResetAll}
                className="text-sm text-red-600 hover:text-red-800 font-medium flex items-center gap-1"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                    clipRule="evenodd"
                  />
                </svg>
                Reset All to Defaults
              </button>
            </div>
          )}

          {/* Elevation Settings */}
          <ElevationSettings
            settings={settings.elevation ?? {}}
            onChange={updateElevation}
          />

          {/* Vegetation Settings */}
          <VegetationSettings
            settings={settings.vegetation ?? {}}
            onChange={updateVegetation}
          />

          {/* Terrain Distribution */}
          <TerrainDistributionSettings
            settings={settings.terrainDistribution ?? {}}
            onChange={updateTerrainDistribution}
          />

          {/* Feature Toggles */}
          <FeatureToggles settings={settings.features ?? {}} onChange={updateFeatures} />

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">About Advanced Settings</h4>
            <p className="text-sm text-blue-700">
              These settings provide fine-grained control over map generation. All settings are
              optional and will use smart defaults if not specified. The tactical context (biome,
              elevation zone, development level) is still automatically determined from your seed
              value.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
