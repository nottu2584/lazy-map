import { SettingsGroup } from './';
import { SliderInput } from '@/components/ui';

export interface VegetationSettingsProps {
  settings: {
    forestDensity?: number;
    treeDensity?: number;
    treeClumping?: number;
    underbrushDensity?: number;
    allowTreeOverlap?: boolean;
    enableInosculation?: boolean;
  };
  onChange: (settings: VegetationSettingsProps['settings']) => void;
}

const DEFAULT_VEGETATION_SETTINGS = {
  forestDensity: 0.3,
  treeDensity: 0.6,
  treeClumping: 0.7,
  underbrushDensity: 0.4,
  allowTreeOverlap: true,
  enableInosculation: true,
};

export function VegetationSettings({ settings, onChange }: VegetationSettingsProps) {
  const updateSetting = <K extends keyof typeof settings>(
    key: K,
    value: (typeof settings)[K]
  ) => {
    onChange({ ...settings, [key]: value });
  };

  const handleReset = () => {
    onChange(DEFAULT_VEGETATION_SETTINGS);
  };

  const ToggleSwitch = ({
    label,
    checked,
    onChange,
    tooltip,
  }: {
    label: string;
    checked: boolean;
    onChange: () => void;
    tooltip: string;
  }) => (
    <div className="flex items-center justify-between pt-2">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700">{label}</label>
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
            {tooltip}
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? 'bg-blue-600' : 'bg-gray-300'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );

  return (
    <SettingsGroup title="Vegetation & Forests" icon="🌲" onReset={handleReset}>
      <SliderInput
        label="Forest Coverage"
        value={settings.forestDensity ?? DEFAULT_VEGETATION_SETTINGS.forestDensity}
        onChange={(value) => updateSetting('forestDensity', value)}
        showPercentage
        tooltip="Percentage of the map covered by forests. 30% = roughly one-third of suitable terrain will have forests."
      />

      <SliderInput
        label="Tree Density"
        value={settings.treeDensity ?? DEFAULT_VEGETATION_SETTINGS.treeDensity}
        onChange={(value) => updateSetting('treeDensity', value)}
        showPercentage
        tooltip="Density of individual trees within forest areas. Higher values create thicker, more crowded forests."
      />

      <SliderInput
        label="Tree Clumping"
        value={settings.treeClumping ?? DEFAULT_VEGETATION_SETTINGS.treeClumping}
        onChange={(value) => updateSetting('treeClumping', value)}
        showPercentage
        tooltip="Tendency for trees to group together in clusters. Higher values create more natural-looking groves and clearings."
      />

      <SliderInput
        label="Underbrush Density"
        value={settings.underbrushDensity ?? DEFAULT_VEGETATION_SETTINGS.underbrushDensity}
        onChange={(value) => updateSetting('underbrushDensity', value)}
        showPercentage
        tooltip="Amount of low vegetation like shrubs and bushes beneath tree canopy. Affects tactical cover and movement."
      />

      <ToggleSwitch
        label="Allow Tree Overlap"
        checked={settings.allowTreeOverlap ?? DEFAULT_VEGETATION_SETTINGS.allowTreeOverlap}
        onChange={() => updateSetting('allowTreeOverlap', !settings.allowTreeOverlap)}
        tooltip="Allow tree canopies to overlap each other for more realistic, dense forest appearance."
      />

      <ToggleSwitch
        label="Enable Inosculation"
        checked={
          settings.enableInosculation ?? DEFAULT_VEGETATION_SETTINGS.enableInosculation
        }
        onChange={() => updateSetting('enableInosculation', !settings.enableInosculation)}
        tooltip="Enable natural tree grafting where adjacent trees grow together. Creates unique forest features."
      />
    </SettingsGroup>
  );
}
