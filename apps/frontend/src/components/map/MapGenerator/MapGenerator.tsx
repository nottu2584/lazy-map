import { Input } from '@/components/ui';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Field, FieldLabel } from '@/components/ui/field';
import { useMapGeneration } from '@/hooks';
import type { AdvancedMapSettings, MapSettings } from '@/types';
import { ChevronDown, Lightbulb, Map } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { seedHistoryService, type SeedHistoryEntry } from '../../../services';
import { MapCanvas } from '../../MapCanvas';
import { EnvironmentSheet } from './EnvironmentSheet';
import { MapBasicSettings } from './MapBasicSettings';
import { MapError } from './MapError';
import { MapProgress } from './MapProgress';
import { SeedHistory } from './SeedHistory';
import { TerrainRuggednessControl } from './TerrainRuggednessControl';
import { VegetationDensityControl } from './VegetationDensityControl';
import { WaterAbundanceControl } from './WaterAbundanceControl';

type TerrainPreset = {
  name: string;
  description: string;
  settings: AdvancedMapSettings;
};

const TERRAIN_PRESETS: TerrainPreset[] = [
  {
    name: 'Gentle',
    description: 'Smooth rolling hills, abundant water, dense forests',
    settings: {
      terrainRuggedness: 0.6,
      waterAbundance: 1.4,
      vegetationMultiplier: 1.6,
    },
  },
  {
    name: 'Normal',
    description: 'Balanced terrain with realistic variation',
    settings: {
      terrainRuggedness: 1.0,
      waterAbundance: 1.0,
      vegetationMultiplier: 1.0,
    },
  },
  {
    name: 'Challenging',
    description: 'Rugged broken terrain, sparse water and vegetation',
    settings: {
      terrainRuggedness: 1.8,
      waterAbundance: 1.3,
      vegetationMultiplier: 0.6,
    },
  },
];

const STORAGE_KEY = 'lazy-map-environment-settings';

export function MapGenerator() {
  const [seedInput, setSeedInput] = useState('');
  const [advancedSettings, setAdvancedSettings] = useState<Omit<MapSettings, 'seed'>>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const defaultSettings = {
      name: '',
      width: 50,
      height: 50,
      cellSize: 5,
    };

    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return {
          ...defaultSettings,
          advancedSettings: parsed,
        };
      } catch (e) {
        return defaultSettings;
      }
    }

    return defaultSettings;
  });

  const { generatedMap, isGenerating, error, progress, progressValue, generateMap, clearError } =
    useMapGeneration();

  const mapSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (generatedMap && !isGenerating && mapSectionRef.current) {
      mapSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [generatedMap, isGenerating]);

  useEffect(() => {
    if (advancedSettings.advancedSettings) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(advancedSettings.advancedSettings));
    }
  }, [advancedSettings.advancedSettings]);

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const settings: MapSettings = {
      name: seedInput || 'Tactical Map',
      width: 50,
      height: 50,
      cellSize: 5,
      seed: seedInput,
    };

    if (seedInput) {
      seedHistoryService.saveEntry({
        seed: seedInput,
        mapName: settings.name,
        generationSuccess: true,
        metadata: {
          dimensions: { width: settings.width, height: settings.height },
          cellSize: settings.cellSize,
          algorithmVersion: '1.0.0',
        },
      });
    }

    generateMap(settings);
  };

  const handleAdvancedSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const settings: MapSettings = {
      ...advancedSettings,
      seed: seedInput,
      name: advancedSettings.name || seedInput || 'Tactical Map',
    };

    if (seedInput) {
      seedHistoryService.saveEntry({
        seed: seedInput,
        mapName: settings.name,
        generationSuccess: true,
        metadata: {
          dimensions: { width: settings.width, height: settings.height },
          cellSize: settings.cellSize,
          algorithmVersion: '1.0.0',
        },
      });
    }

    generateMap(settings);
  };

  const updateAdvancedSetting = <K extends keyof typeof advancedSettings>(
    key: K,
    value: (typeof advancedSettings)[K],
  ) => {
    setAdvancedSettings((prev) => ({ ...prev, [key]: value }));
  };

  const applySeedFromHistory = (entry: SeedHistoryEntry) => {
    setSeedInput(String(entry.seed));
    setAdvancedSettings((prev) => ({
      ...prev,
      name: entry.mapName,
    }));
  };

  const updateAdvancedSettings = (advSettings: AdvancedMapSettings) => {
    setAdvancedSettings((prev) => ({
      ...prev,
      advancedSettings: advSettings,
    }));
  };

  const applyPreset = (preset: TerrainPreset) => {
    setAdvancedSettings((prev) => ({
      ...prev,
      advancedSettings: preset.settings,
    }));
  };

  return (
    <>
      <div className="flex flex-col">
        {/* Hero Section */}
        <section className="pt-32 pb-16 px-6 text-center">
          <h1 className="scroll-m-20 text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-balance">
            Generate Your Map
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mt-6">
            Tactical battlemap generator for tabletop RPGs. Enter a seed value to create your map.
          </p>
        </section>

        {/* Quick Input Section */}
        <section className="px-6 pb-8">
          <div className="max-w-3xl mx-auto">
            <form onSubmit={handleQuickSubmit}>
              <Field orientation="horizontal">
                <FieldLabel className="sr-only">Map Seed</FieldLabel>
                <Input
                  value={seedInput}
                  onChange={(e) => setSeedInput(e.target.value)}
                  placeholder="goblin-ambush"
                  className="h-14 text-lg md:text-lg"
                  disabled={isGenerating}
                />
                <Button type="submit" variant="default" disabled={isGenerating} size="lg" className="h-14 px-8 text-lg">
                  {isGenerating ? 'Generating...' : 'Generate'}
                </Button>
              </Field>
            </form>
            <p className="text-sm text-muted-foreground text-center mt-3">
              Try:{' '}
              <code className="bg-muted rounded-lg px-[0.3rem] py-[0.2rem] font-mono text-sm">
                goblin-ambush
              </code>{' '}
              ,{' '}
              <code className="bg-muted rounded-lg px-[0.3rem] py-[0.2rem] font-mono text-sm">
                forest-temple
              </code>{' '}
              or{' '}
              <code className="bg-muted rounded-lg px-[0.3rem] py-[0.2rem] font-mono text-sm">
                mountain-pass
              </code>
            </p>
          </div>
        </section>

        {/* Advanced Settings - Collapsed */}
        <section className="px-6 pb-8">
          <div className="max-w-3xl mx-auto">
            <Card>
              <CardContent className="p-0">
                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-between px-6 py-4 h-auto hover:bg-transparent"
                    >
                      <span className="text-base font-semibold text-foreground">
                        Advanced Settings
                      </span>
                      <ChevronDown className="h-5 w-5 transition-transform duration-200 data-[state=open]:rotate-180" />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <form onSubmit={handleAdvancedSubmit} className="space-y-6 px-6 pb-6">
                      {/* Basic Settings */}
                      <div>
                        <p className="text-sm text-muted-foreground mb-4">
                          Seed value is taken from the main input above. Configure map dimensions
                          and name here.
                        </p>
                        <div className="space-y-4">
                          <MapBasicSettings
                            name={advancedSettings.name}
                            width={advancedSettings.width}
                            height={advancedSettings.height}
                            onNameChange={(name) => updateAdvancedSetting('name', name)}
                            onWidthChange={(width) => updateAdvancedSetting('width', width)}
                            onHeightChange={(height) => updateAdvancedSetting('height', height)}
                          />
                          <SeedHistory onApplySeed={applySeedFromHistory} />
                        </div>
                      </div>

                      {/* Divider */}
                      <Separator />

                      {/* Environment Controls */}
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-base font-semibold text-foreground">
                            Environment Control
                          </h3>
                          <EnvironmentSheet />
                        </div>

                        {/* Terrain Presets */}
                        <div className="mb-6">
                          <p className="text-sm text-muted-foreground mb-3">
                            Quick presets for common terrain types:
                          </p>
                          <ButtonGroup className="w-full">
                            {TERRAIN_PRESETS.map((preset) => (
                              <Button
                                key={preset.name}
                                type="button"
                                variant="outline"
                                className="flex-1"
                                onClick={() => applyPreset(preset)}
                                title={preset.description}
                              >
                                {preset.name}
                              </Button>
                            ))}
                          </ButtonGroup>
                          <p className="text-xs text-muted-foreground mt-2">
                            Or fine-tune individual settings below
                          </p>
                        </div>

                        <div className="space-y-4">
                          <TerrainRuggednessControl
                            settings={advancedSettings.advancedSettings}
                            onChange={updateAdvancedSettings}
                          />
                          <WaterAbundanceControl
                            settings={advancedSettings.advancedSettings}
                            onChange={updateAdvancedSettings}
                          />
                          <VegetationDensityControl
                            settings={advancedSettings.advancedSettings}
                            onChange={updateAdvancedSettings}
                          />
                        </div>
                      </div>

                      {/* Info Alert */}
                      <Alert>
                        <Lightbulb className="h-4 w-4" />
                        <AlertTitle className="text-sm font-medium">
                          About Map Generation
                        </AlertTitle>
                        <AlertDescription className="text-sm">
                          The map's biome, elevation, and hydrology are automatically determined
                          from the seed value. The environment controls provide fine-tuned
                          customization: adjust terrain roughness, water feature frequency, and
                          forest coverage while maintaining deterministic generation.
                        </AlertDescription>
                      </Alert>

                      <Button type="submit" disabled={isGenerating} className="w-full">
                        Generate Map
                      </Button>
                    </form>
                  </CollapsibleContent>
                </Collapsible>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Progress & Error */}
        <section className="px-6 pb-8">
          <div className="max-w-3xl mx-auto">
            <MapProgress progress={progress} value={progressValue} />
            <MapError error={error} onClear={clearError} />
          </div>
        </section>
      </div>

      {/* Map Display Section - Full Width */}
      <section
        ref={mapSectionRef}
        className="relative w-full min-h-[70vh] border-t border-border bg-muted/30"
      >
        {/* Loading State */}
        {isGenerating && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background">
            <div className="text-4xl font-heading font-bold mb-4">Generating Map...</div>
            {progress && <p className="text-lg text-muted-foreground font-mono">{progress}</p>}
          </div>
        )}

        {/* Map Display */}
        {generatedMap && !isGenerating && (
          <div className="w-full h-full flex items-center justify-center p-8">
            <MapCanvas map={generatedMap} />
          </div>
        )}

        {/* Empty State */}
        {!isGenerating && !generatedMap && (
          <div className="absolute inset-0 flex items-center justify-center p-8">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Map className="size-6" />
                </EmptyMedia>
                <EmptyTitle>No map generated yet</EmptyTitle>
                <EmptyDescription>
                  Enter a seed value above and click Generate to create your tactical battlemap. The
                  map will appear here once generation is complete.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </div>
        )}
      </section>
    </>
  );
}
