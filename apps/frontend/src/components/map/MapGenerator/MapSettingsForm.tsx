import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { MapBasicSettings } from './MapBasicSettings';
import { MapSeedInput } from './MapSeedInput';
import { SeedHistory } from './SeedHistory';
import { seedHistoryService, type SeedHistoryEntry } from '../../../services/seedHistoryService';
import type { MapSettings } from '@/types';

interface MapSettingsFormProps {
  onGenerate: (settings: MapSettings) => void;
  isGenerating: boolean;
}

export function MapSettingsForm({ onGenerate, isGenerating }: MapSettingsFormProps) {
  const [settings, setSettings] = useState<MapSettings>({
    name: 'My Tactical Map',
    width: 50,
    height: 50,
    cellSize: 5,
    seed: '',
    generateForests: true,
    generateRivers: false,
    generateRoads: false,
    generateBuildings: false,
    terrainDistribution: {
      grassland: 0.4,
      forest: 0.3,
      mountain: 0.2,
      water: 0.1,
    },
    forestSettings: {
      forestDensity: 0.3,
      treeDensity: 0.6,
      treeClumping: 0.7,
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (settings.seed) {
      seedHistoryService.saveEntry({
        seed: settings.seed,
        mapName: settings.name,
        generationSuccess: true,
        metadata: {
          dimensions: { width: settings.width, height: settings.height },
          cellSize: settings.cellSize,
          algorithmVersion: '1.0.0',
        },
      });
    }

    onGenerate(settings);
  };

  const updateSetting = <K extends keyof MapSettings>(
    key: K,
    value: MapSettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const applySeedFromHistory = (entry: SeedHistoryEntry) => {
    setSettings((prev) => ({
      ...prev,
      seed: String(entry.seed),
      name: entry.mapName,
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium mb-3">Basic Settings</h3>
          <MapBasicSettings
            name={settings.name}
            width={settings.width}
            height={settings.height}
            onNameChange={(name) => updateSetting('name', name)}
            onWidthChange={(width) => updateSetting('width', width)}
            onHeightChange={(height) => updateSetting('height', height)}
          />
        </div>

        <div>
          <MapSeedInput
            seed={settings.seed}
            onSeedChange={(seed) => updateSetting('seed', seed)}
          />
          <SeedHistory onApplySeed={applySeedFromHistory} />
        </div>
      </div>

      <Alert>
        <AlertTitle className="text-sm font-medium">
          Tactical Map Generation
        </AlertTitle>
        <AlertDescription className="text-sm">
          The tactical context (biome, elevation, and development level) is
          automatically determined from the seed value. Each unique seed creates
          a consistent environment with appropriate terrain, vegetation, and
          structures.
        </AlertDescription>
        <div className="mt-2 text-xs space-y-0.5">
          <p>
            <strong>Biome:</strong> Desert, Temperate, Tropical, Arctic, or Arid
          </p>
          <p>
            <strong>Elevation:</strong> Lowland, Midland, or Highland
          </p>
          <p>
            <strong>Development:</strong> Wilderness, Rural, or Urban
          </p>
        </div>
      </Alert>

      <Button type="submit" disabled={isGenerating} className="w-full">
        {isGenerating ? 'Generating...' : 'Generate Map'}
      </Button>
    </form>
  );
}
