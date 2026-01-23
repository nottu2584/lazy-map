import { SettingsGroup } from './';
import { SliderInput } from '@/components/ui';

export interface TerrainDistributionSettingsProps {
  settings: {
    grassland?: number;
    forest?: number;
    mountain?: number;
    water?: number;
    desert?: number;
    swamp?: number;
  };
  onChange: (settings: TerrainDistributionSettingsProps['settings']) => void;
}

const DEFAULT_TERRAIN_SETTINGS = {
  grassland: 0.4,
  forest: 0.3,
  mountain: 0.2,
  water: 0.1,
  desert: 0.0,
  swamp: 0.0,
};

export function TerrainDistributionSettings({
  settings,
  onChange,
}: TerrainDistributionSettingsProps) {
  const updateSetting = <K extends keyof typeof settings>(
    key: K,
    value: (typeof settings)[K]
  ) => {
    onChange({ ...settings, [key]: value });
  };

  const handleReset = () => {
    onChange(DEFAULT_TERRAIN_SETTINGS);
  };

  // Calculate total percentage
  const total =
    (settings.grassland ?? DEFAULT_TERRAIN_SETTINGS.grassland) +
    (settings.forest ?? DEFAULT_TERRAIN_SETTINGS.forest) +
    (settings.mountain ?? DEFAULT_TERRAIN_SETTINGS.mountain) +
    (settings.water ?? DEFAULT_TERRAIN_SETTINGS.water) +
    (settings.desert ?? DEFAULT_TERRAIN_SETTINGS.desert) +
    (settings.swamp ?? DEFAULT_TERRAIN_SETTINGS.swamp);

  const isValidTotal = Math.abs(total - 1.0) < 0.05; // Allow 5% tolerance

  return (
    <SettingsGroup title="Terrain Distribution" icon="🗺️" onReset={handleReset}>
      <div className="space-y-4">
        <SliderInput
          label="Grassland"
          value={settings.grassland ?? DEFAULT_TERRAIN_SETTINGS.grassland}
          onChange={(value) => updateSetting('grassland', value)}
          showPercentage
          tooltip="Open grassland and meadows. Good for movement and visibility."
        />

        <SliderInput
          label="Forest"
          value={settings.forest ?? DEFAULT_TERRAIN_SETTINGS.forest}
          onChange={(value) => updateSetting('forest', value)}
          showPercentage
          tooltip="Wooded areas with trees. Provides cover and limits visibility."
        />

        <SliderInput
          label="Mountain"
          value={settings.mountain ?? DEFAULT_TERRAIN_SETTINGS.mountain}
          onChange={(value) => updateSetting('mountain', value)}
          showPercentage
          tooltip="Rocky mountainous terrain. Difficult movement, high elevation."
        />

        <SliderInput
          label="Water"
          value={settings.water ?? DEFAULT_TERRAIN_SETTINGS.water}
          onChange={(value) => updateSetting('water', value)}
          showPercentage
          tooltip="Rivers, lakes, and ponds. May require swimming or obstacles to movement."
        />

        <SliderInput
          label="Desert"
          value={settings.desert ?? DEFAULT_TERRAIN_SETTINGS.desert}
          onChange={(value) => updateSetting('desert', value)}
          showPercentage
          tooltip="Sandy or rocky desert terrain. Limited cover and vegetation."
        />

        <SliderInput
          label="Swamp"
          value={settings.swamp ?? DEFAULT_TERRAIN_SETTINGS.swamp}
          onChange={(value) => updateSetting('swamp', value)}
          showPercentage
          tooltip="Wetlands and marshes. Difficult terrain with limited visibility."
        />

        {/* Total validation indicator */}
        <div
          className={`mt-4 p-3 rounded-md border ${
            isValidTotal
              ? 'bg-green-50 border-green-200'
              : 'bg-yellow-50 border-yellow-300'
          }`}
        >
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-gray-700">Total Distribution:</span>
            <span
              className={`font-bold ${isValidTotal ? 'text-green-700' : 'text-yellow-700'}`}
            >
              {Math.round(total * 100)}%
            </span>
          </div>
          {!isValidTotal && (
            <p className="mt-1 text-xs text-yellow-700">
              Terrain percentages should sum to approximately 100% for balanced distribution.
            </p>
          )}
        </div>
      </div>
    </SettingsGroup>
  );
}
