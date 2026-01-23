import { SettingsGroup } from './';
import { SliderInput } from '@/components/ui';

export interface ElevationSettingsProps {
  settings: {
    variance?: number;
    multiplier?: number;
    addNoise?: boolean;
    heightVariance?: number;
    inclinationChance?: number;
  };
  onChange: (settings: ElevationSettingsProps['settings']) => void;
}

const DEFAULT_ELEVATION_SETTINGS = {
  variance: 0.3,
  multiplier: 1.0,
  addNoise: false,
  heightVariance: 0.2,
  inclinationChance: 0.3,
};

export function ElevationSettings({ settings, onChange }: ElevationSettingsProps) {
  const updateSetting = <K extends keyof typeof settings>(
    key: K,
    value: (typeof settings)[K]
  ) => {
    onChange({ ...settings, [key]: value });
  };

  const handleReset = () => {
    onChange(DEFAULT_ELEVATION_SETTINGS);
  };

  return (
    <SettingsGroup title="Terrain & Elevation" icon="🏔️" onReset={handleReset}>
      <SliderInput
        label="Terrain Ruggedness"
        value={settings.variance ?? DEFAULT_ELEVATION_SETTINGS.variance}
        onChange={(value) => updateSetting('variance', value)}
        showPercentage
        tooltip="Controls how rough and varied the terrain is. 0% = flat terrain, 100% = very rugged with steep changes."
      />

      <SliderInput
        label="Elevation Multiplier"
        value={settings.multiplier ?? DEFAULT_ELEVATION_SETTINGS.multiplier}
        onChange={(value) => updateSetting('multiplier', value)}
        min={0}
        max={3}
        step={0.1}
        decimals={1}
        tooltip="Multiplies elevation differences. Higher values create more dramatic height changes."
      />

      <SliderInput
        label="Height Variance"
        value={settings.heightVariance ?? DEFAULT_ELEVATION_SETTINGS.heightVariance}
        onChange={(value) => updateSetting('heightVariance', value)}
        showPercentage
        tooltip="Amount of random variation in height values. Adds natural irregularity to terrain."
      />

      <SliderInput
        label="Inclination Chance"
        value={settings.inclinationChance ?? DEFAULT_ELEVATION_SETTINGS.inclinationChance}
        onChange={(value) => updateSetting('inclinationChance', value)}
        showPercentage
        tooltip="Probability of slopes between adjacent tiles. Higher values create more rolling terrain."
      />

      {/* Toggle for Add Height Noise */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Add Height Noise</label>
          <div className="group relative">
            <svg
              className="h-4 w-4 text-gray-400 cursor-help"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg z-10">
              Adds Perlin noise to height values for more organic, natural-looking terrain features.
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => updateSetting('addNoise', !settings.addNoise)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            settings.addNoise ? 'bg-blue-600' : 'bg-gray-300'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              settings.addNoise ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    </SettingsGroup>
  );
}
