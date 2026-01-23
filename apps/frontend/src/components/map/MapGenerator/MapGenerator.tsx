import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { MapBasicSettings } from './MapBasicSettings';
import { SeedHistory } from './SeedHistory';
import { ElevationSettings } from './MapAdvancedSettings/ElevationSettings';
import { VegetationSettings } from './MapAdvancedSettings/VegetationSettings';
import { TerrainDistributionSettings } from './MapAdvancedSettings/TerrainDistributionSettings';
import { FeatureToggles } from './MapAdvancedSettings/FeatureToggles';
import { MapProgress } from './MapProgress';
import { MapError } from './MapError';
import { MapCanvas } from '../../MapCanvas';
import { useMapGeneration } from '@/hooks';
import { seedHistoryService, type SeedHistoryEntry } from '../../../services';
import type { MapSettings } from '@/types';

export function MapGenerator() {
  const [seedInput, setSeedInput] = useState('');
  const [advancedSettings, setAdvancedSettings] = useState<Omit<MapSettings, 'seed'>>({
    name: '',
    width: 50,
    height: 50,
    cellSize: 5,
  });

  const { generatedMap, isGenerating, error, progress, generateMap, clearError } =
    useMapGeneration();

  const mapSectionRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to map when generation completes
  useEffect(() => {
    if (generatedMap && !isGenerating && mapSectionRef.current) {
      mapSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [generatedMap, isGenerating]);

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
    value: typeof advancedSettings[K]
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

  const updateAdvancedElevation = (elevation: NonNullable<MapSettings['advancedSettings']>['elevation']) => {
    setAdvancedSettings((prev) => ({
      ...prev,
      advancedSettings: { ...prev.advancedSettings, elevation },
    }));
  };

  const updateAdvancedVegetation = (vegetation: NonNullable<MapSettings['advancedSettings']>['vegetation']) => {
    setAdvancedSettings((prev) => ({
      ...prev,
      advancedSettings: { ...prev.advancedSettings, vegetation },
    }));
  };

  const updateAdvancedTerrainDistribution = (terrainDistribution: NonNullable<MapSettings['advancedSettings']>['terrainDistribution']) => {
    setAdvancedSettings((prev) => ({
      ...prev,
      advancedSettings: { ...prev.advancedSettings, terrainDistribution },
    }));
  };

  const updateAdvancedFeatures = (features: NonNullable<MapSettings['advancedSettings']>['features']) => {
    setAdvancedSettings((prev) => ({
      ...prev,
      advancedSettings: { ...prev.advancedSettings, features },
    }));
  };

  const hasAdvancedModifications = () => {
    const adv = advancedSettings.advancedSettings;
    return !!(adv?.elevation || adv?.vegetation || adv?.terrainDistribution || adv?.features);
  };

  const resetAdvancedSettings = () => {
    setAdvancedSettings((prev) => ({
      ...prev,
      advancedSettings: undefined,
    }));
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="pt-32 pb-16 px-6 text-center">
        <h1 className="text-hero font-heading">Generate Your Map</h1>
        <p className="mt-6 text-body-large text-muted-foreground max-w-2xl mx-auto">
          Tactical battlemap generator for tabletop RPGs. Enter a seed value to create your map.
        </p>
      </section>

      {/* Quick Input Section */}
      <section className="px-6 pb-8">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleQuickSubmit} className="flex gap-3">
            <Input
              value={seedInput}
              onChange={(e) => setSeedInput(e.target.value)}
              placeholder="goblin-ambush"
              className="h-14 text-lg"
              disabled={isGenerating}
            />
            <Button type="submit" size="lg" className="px-8" disabled={isGenerating}>
              {isGenerating ? 'Generating...' : 'Generate'}
            </Button>
          </form>
          <p className="mt-3 text-sm text-muted-foreground text-center">
            Try: <span className="font-mono">"goblin-ambush"</span> or{' '}
            <span className="font-mono">"forest-temple"</span> or{' '}
            <span className="font-mono">"mountain-pass"</span>
          </p>
        </div>
      </section>

      {/* Advanced Settings - Collapsed */}
      <section className="px-6 pb-8">
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible>
            <AccordionItem value="advanced">
              <AccordionTrigger className="text-lg font-medium">
                Advanced Settings
              </AccordionTrigger>
              <AccordionContent>
                <form onSubmit={handleAdvancedSubmit} className="space-y-6 pt-4">
                  {/* Basic Settings */}
                  <div>
                    <h3 className="text-base font-semibold mb-3 text-foreground">Map Configuration</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Seed value is taken from the main input above. Configure map dimensions and name here.
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
                  <div className="border-t border-border" />

                  {/* Reset Button */}
                  {hasAdvancedModifications() && (
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={resetAdvancedSettings}
                        className="text-destructive hover:text-destructive"
                      >
                        Reset Advanced Settings
                      </Button>
                    </div>
                  )}

                  {/* Terrain & Environment */}
                  <div>
                    <h3 className="text-base font-semibold mb-3 text-foreground">Terrain & Environment</h3>
                    <div className="space-y-4">
                      <ElevationSettings
                        settings={advancedSettings.advancedSettings?.elevation ?? {}}
                        onChange={updateAdvancedElevation}
                      />
                      <TerrainDistributionSettings
                        settings={advancedSettings.advancedSettings?.terrainDistribution ?? {}}
                        onChange={updateAdvancedTerrainDistribution}
                      />
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-border" />

                  {/* Vegetation */}
                  <div>
                    <h3 className="text-base font-semibold mb-3 text-foreground">Vegetation</h3>
                    <VegetationSettings
                      settings={advancedSettings.advancedSettings?.vegetation ?? {}}
                      onChange={updateAdvancedVegetation}
                    />
                  </div>

                  {/* Divider */}
                  <div className="border-t border-border" />

                  {/* Features */}
                  <div>
                    <h3 className="text-base font-semibold mb-3 text-foreground">Map Features</h3>
                    <FeatureToggles
                      settings={advancedSettings.advancedSettings?.features ?? {}}
                      onChange={updateAdvancedFeatures}
                    />
                  </div>

                  {/* Info Alert */}
                  <Alert>
                    <AlertTitle className="text-sm font-medium">
                      About Tactical Context
                    </AlertTitle>
                    <AlertDescription className="text-sm">
                      The tactical context (biome, elevation zone, and development level) is
                      automatically determined from the seed value. Advanced settings above provide
                      fine-tuned control while maintaining deterministic generation.
                    </AlertDescription>
                  </Alert>

                  <Button type="submit" disabled={isGenerating} className="w-full">
                    {isGenerating ? 'Generating...' : 'Generate Map'}
                  </Button>
                </form>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* Progress & Error */}
      <section className="px-6 pb-8">
        <div className="max-w-3xl mx-auto">
          <MapProgress progress={progress} />
          <MapError error={error} onClear={clearError} />
        </div>
      </section>

      {/* Map Display Section */}
      <section
        ref={mapSectionRef}
        className="relative w-full flex-1 min-h-[70vh] border-t border-border bg-muted/30"
      >
        {/* Loading State */}
        {isGenerating && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background">
            <div className="text-4xl font-heading font-bold mb-4">Generating Map...</div>
            {progress && (
              <p className="text-lg text-muted-foreground font-mono">{progress}</p>
            )}
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
          <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
            <p className="text-2xl font-heading">Your map will appear here</p>
            <p className="mt-2 text-base font-mono">50×50 tiles @ 5ft/tile</p>
          </div>
        )}
      </section>
    </div>
  );
}
