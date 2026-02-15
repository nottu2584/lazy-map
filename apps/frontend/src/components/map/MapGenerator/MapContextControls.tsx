import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { MapContextSettings } from '@/types';
import { ChevronDown } from 'lucide-react';
import {
  BIOME_OPTIONS,
  DEVELOPMENT_OPTIONS,
  ELEVATION_OPTIONS,
  HYDROLOGY_OPTIONS,
  SEASON_OPTIONS,
  getBlockedElevation,
  getBlockedHydrology,
} from './contextConstraints';

interface MapContextControlsProps {
  settings: MapContextSettings;
  onChange: (settings: MapContextSettings) => void;
}

interface SelectorRowProps {
  label: string;
  value?: string;
  options: ReadonlyArray<{ value: string; label: string }>;
  blocked?: Set<string>;
  onSelect: (value: string | undefined) => void;
}

function SelectorRow({ label, value, options, blocked, onSelect }: SelectorRowProps) {
  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium">{label}</p>
      <div className="flex flex-wrap gap-1">
        <Button
          type="button"
          variant={value === undefined ? 'secondary' : 'outline'}
          size="sm"
          onClick={() => onSelect(undefined)}
        >
          Auto
        </Button>
        {options.map((option) => {
          const isBlocked = blocked?.has(option.value);
          return (
            <Button
              key={option.value}
              type="button"
              variant={value === option.value ? 'secondary' : 'outline'}
              size="sm"
              disabled={isBlocked}
              onClick={() => onSelect(option.value)}
              title={isBlocked ? 'Not compatible with selected biome' : undefined}
            >
              {option.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}

export function MapContextControls({ settings, onChange }: MapContextControlsProps) {
  const blockedHydrology = getBlockedHydrology(settings.biome);
  const blockedElevation = getBlockedElevation(settings.biome);

  const update = (patch: Partial<MapContextSettings>) => {
    const next = { ...settings, ...patch };

    // Clear selections that become invalid when biome changes
    if (patch.biome !== undefined) {
      const newBlockedH = getBlockedHydrology(patch.biome);
      const newBlockedE = getBlockedElevation(patch.biome);
      if (next.hydrology && newBlockedH.has(next.hydrology)) {
        next.hydrology = undefined;
      }
      if (next.elevation && newBlockedE.has(next.elevation)) {
        next.elevation = undefined;
      }
    }

    onChange(next);
  };

  return (
    <div className="space-y-4">
      {/* Simplified Biome Selector - Always Visible */}
      <SelectorRow
        label="Environment"
        value={settings.biome}
        options={BIOME_OPTIONS}
        onSelect={(biome) => update({ biome })}
      />

      {/* Detailed Options - Collapsible */}
      <Collapsible>
        <CollapsibleTrigger asChild>
          <Button type="button" variant="ghost" size="sm" className="group w-full">
            More Environment Options
            <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 pt-3">
          <SelectorRow
            label="Elevation"
            value={settings.elevation}
            options={ELEVATION_OPTIONS}
            blocked={blockedElevation}
            onSelect={(elevation) => update({ elevation })}
          />
          <SelectorRow
            label="Water"
            value={settings.hydrology}
            options={HYDROLOGY_OPTIONS}
            blocked={blockedHydrology}
            onSelect={(hydrology) => update({ hydrology })}
          />
          <SelectorRow
            label="Development"
            value={settings.development}
            options={DEVELOPMENT_OPTIONS}
            onSelect={(development) => update({ development })}
          />
          <SelectorRow
            label="Season"
            value={settings.season}
            options={SEASON_OPTIONS}
            onSelect={(season) => update({ season })}
          />
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
