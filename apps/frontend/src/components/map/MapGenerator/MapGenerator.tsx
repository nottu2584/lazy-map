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
import type {
  AdvancedMapSettings,
  MapContextSettings,
  MapSettings,
  SeedHistoryEntry,
  MapPreset,
} from '@/types';
import { ChevronDown, Lightbulb, Map, Settings, Settings2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { seedHistoryService } from '../../../services';
import { MapCanvas } from '../../MapCanvas';
import { EnvironmentSheet } from './EnvironmentSheet';
import { MapBasicSettings } from './MapBasicSettings';
import { MapContextControls } from './MapContextControls';
import { MapError } from './MapError';
import { MapProgress } from './MapProgress';
import { SeedHistorySheet } from './SeedHistorySheet';
import { MAP_PRESETS } from './terrainPresets';
import { TerrainRuggednessControl } from './TerrainRuggednessControl';
import { VegetationDensityControl } from './VegetationDensityControl';
import { WaterAbundanceControl } from './WaterAbundanceControl';

const STORAGE_KEY = 'lazy-map-environment-settings';

export function MapGenerator() {
  const [seedInput, setSeedInput] = useState('');
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [contextSettings, setContextSettings] = useState<MapContextSettings>({});
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

  const handleSubmit = (e: React.FormEvent, useAdvancedSettings: boolean) => {
    e.preventDefault();

    // Include context settings if any are set (even from quick generate)
    const hasContext = Object.values(contextSettings).some((v) => v !== undefined);

    const settings: MapSettings = useAdvancedSettings
      ? {
          ...advancedSettings,
          seed: seedInput,
          name: advancedSettings.name || seedInput || 'Tactical Map',
          contextSettings: hasContext ? contextSettings : undefined,
        }
      : {
          name: seedInput || 'Tactical Map',
          width: 50,
          height: 50,
          cellSize: 5,
          seed: seedInput,
          contextSettings: hasContext ? contextSettings : undefined,
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

    // Clear active preset when user manually adjusts sliders
    if (activePreset) {
      setActivePreset(null);
      toast.info('Settings customized');
    }
  };

  const applyPreset = (preset: MapPreset) => {
    setAdvancedSettings((prev) => ({
      ...prev,
      advancedSettings: preset.settings,
    }));
    // Don't override context - presets are now general terrain styles
    // User's biome/climate selection is preserved
    setActivePreset(preset.name);

    toast.success(`${preset.name} terrain style applied`);
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
            <form onSubmit={(e) => handleSubmit(e, false)}>
              <Field orientation="horizontal">
                <FieldLabel className="sr-only">Map Seed</FieldLabel>
                <Input
                  value={seedInput}
                  onChange={(e) => setSeedInput(e.target.value)}
                  placeholder="goblin-ambush"
                  className="h-12 md:h-14 text-base md:text-lg"
                  disabled={isGenerating}
                />
                <Button
                  type="submit"
                  variant="default"
                  disabled={isGenerating}
                  size="lg"
                  className="h-12 md:h-14 text-base md:text-lg"
                >
                  {isGenerating ? 'Generating...' : 'Generate'}
                </Button>
              </Field>
            </form>
            <p className="text-sm text-muted-foreground text-center mt-2">
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

            {/* Advanced Settings Toggle */}
            <div className="text-center mt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                className="transition-all duration-200"
              >
                <Settings className="h-4 w-4" />
                {isAdvancedOpen ? 'Hide' : 'Show'} Advanced Settings
              </Button>
            </div>
          </div>
        </section>

        {/* Advanced Settings Panel */}
        <section className="px-6 pb-8">
          <div className="max-w-3xl mx-auto">
            <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
              <CollapsibleContent>
                <Card>
                  <CardContent className="p-6">
                    <form onSubmit={(e) => handleSubmit(e, true)} className="space-y-6">
                      {/* Basic Settings */}
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h3>Map Configuration</h3>
                          <SeedHistorySheet onApplySeed={applySeedFromHistory} />
                        </div>
                        <MapBasicSettings
                          name={advancedSettings.name}
                          width={advancedSettings.width}
                          height={advancedSettings.height}
                          onNameChange={(name) => updateAdvancedSetting('name', name)}
                          onWidthChange={(width) => updateAdvancedSetting('width', width)}
                          onHeightChange={(height) => updateAdvancedSetting('height', height)}
                        />
                      </div>

                      {/* Divider */}
                      <Separator />

                      {/* Map Environment */}
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h3>Environment</h3>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          Choose your map's environment. "Auto" lets the seed decide. Expand for detailed control.
                        </p>
                        <MapContextControls
                          settings={contextSettings}
                          onChange={(ctx) => {
                            setContextSettings(ctx);
                            if (activePreset) {
                              setActivePreset(null);
                              toast.info('Settings customized');
                            }
                          }}
                        />
                      </div>

                      {/* Divider */}
                      <Separator />

                      {/* Terrain Style */}
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h3>Terrain Style</h3>
                          <EnvironmentSheet />
                        </div>

                        {/* Terrain Presets */}
                        <div className="space-y-3">
                          <p className="text-sm text-muted-foreground">
                            Choose terrain difficulty. Works with any climate selected above:
                          </p>
                          <ButtonGroup className="w-full">
                            {MAP_PRESETS.map((preset) => (
                              <Button
                                key={preset.name}
                                type="button"
                                variant={activePreset === preset.name ? 'secondary' : 'outline'}
                                className="flex-1"
                                onClick={() => applyPreset(preset)}
                                title={preset.description}
                              >
                                {preset.name}
                              </Button>
                            ))}
                          </ButtonGroup>

                          {/* Manual Controls (Collapsible) */}
                          <Collapsible>
                            <CollapsibleTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="group w-full"
                              >
                                <Settings2 className="h-4 w-4" />
                                Customize
                                <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
                              </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="space-y-4 p-3 pt-2">
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
                            </CollapsibleContent>
                          </Collapsible>
                        </div>
                      </div>

                      {/* Info Alert */}
                      <Alert>
                        <Lightbulb className="h-4 w-4" />
                        <AlertTitle className="text-sm font-medium">
                          About Map Generation
                        </AlertTitle>
                        <AlertDescription className="text-sm">
                          Pick your Environment (forest, desert, underground, etc.), then choose a Terrain Style (gentle, balanced, challenging).
                          Presets work with any environment - try "Desert + Gentle" for rolling dunes or "Mountain + Challenging" for dramatic cliffs.
                          "Auto" settings are derived from the seed. Same seed + same settings = identical map.
                        </AlertDescription>
                      </Alert>

                      <Button type="submit" disabled={isGenerating} className="w-full">
                        Generate Map
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </CollapsibleContent>
            </Collapsible>
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
            <h2 className="text-4xl mb-4">Generating Map...</h2>
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
