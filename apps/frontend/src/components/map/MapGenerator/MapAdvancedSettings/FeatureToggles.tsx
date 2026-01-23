import { SettingsGroup } from './';

export interface FeatureTogglesProps {
  settings: {
    generateForests?: boolean;
    generateRivers?: boolean;
    generateRoads?: boolean;
    generateBuildings?: boolean;
  };
  onChange: (settings: FeatureTogglesProps['settings']) => void;
}

const DEFAULT_FEATURE_SETTINGS = {
  generateForests: true,
  generateRivers: false,
  generateRoads: false,
  generateBuildings: false,
};

export function FeatureToggles({ settings, onChange }: FeatureTogglesProps) {
  const updateSetting = <K extends keyof typeof settings>(
    key: K,
    value: (typeof settings)[K]
  ) => {
    onChange({ ...settings, [key]: value });
  };

  const handleReset = () => {
    onChange(DEFAULT_FEATURE_SETTINGS);
  };

  const FeatureToggle = ({
    label,
    checked,
    onChange,
    tooltip,
    badge,
  }: {
    label: string;
    checked: boolean;
    onChange: () => void;
    tooltip: string;
    badge?: string;
  }) => (
    <div className="flex items-center justify-between py-2 px-3 bg-white rounded border border-gray-200">
      <div className="flex items-center gap-2 flex-1">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        {badge && (
          <span className="text-xs px-2 py-0.5 rounded bg-yellow-100 text-yellow-800 font-medium">
            {badge}
          </span>
        )}
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
    <SettingsGroup title="Map Features" icon="⚔️" onReset={handleReset}>
      <div className="space-y-2">
        <FeatureToggle
          label="Generate Forests"
          checked={settings.generateForests ?? DEFAULT_FEATURE_SETTINGS.generateForests}
          onChange={() => updateSetting('generateForests', !settings.generateForests)}
          tooltip="Add forest zones with trees, undergrowth, and natural vegetation features."
        />

        <FeatureToggle
          label="Generate Rivers"
          checked={settings.generateRivers ?? DEFAULT_FEATURE_SETTINGS.generateRivers}
          onChange={() => updateSetting('generateRivers', !settings.generateRivers)}
          tooltip="Add rivers and streams that flow naturally through the terrain based on elevation."
          badge="Coming Soon"
        />

        <FeatureToggle
          label="Generate Roads"
          checked={settings.generateRoads ?? DEFAULT_FEATURE_SETTINGS.generateRoads}
          onChange={() => updateSetting('generateRoads', !settings.generateRoads)}
          tooltip="Add road networks connecting settlements and points of interest."
          badge="Coming Soon"
        />

        <FeatureToggle
          label="Generate Buildings"
          checked={
            settings.generateBuildings ?? DEFAULT_FEATURE_SETTINGS.generateBuildings
          }
          onChange={() => updateSetting('generateBuildings', !settings.generateBuildings)}
          tooltip="Add structures like houses, barns, ruins, and other buildings based on development level."
          badge="Coming Soon"
        />
      </div>

      {/* Info note */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
        <p className="text-xs text-blue-700">
          Features marked "Coming Soon" are accepted by the API but not yet fully implemented in
          the generation system. They will be activated in future updates.
        </p>
      </div>
    </SettingsGroup>
  );
}
