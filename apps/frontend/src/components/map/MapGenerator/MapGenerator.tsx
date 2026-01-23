import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import { useMapGeneration } from '@/hooks';
import type { AdvancedMapSettings, MapSettings } from '@/types';
import { ChevronDown, Map } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { seedHistoryService, type SeedHistoryEntry } from '../../../services';
import { MapCanvas } from '../../MapCanvas';
import { MapBasicSettings } from './MapBasicSettings';
import { MapError } from './MapError';
import { MapProgress } from './MapProgress';
import { SeedHistory } from './SeedHistory';
import { VegetationDensityControl } from './VegetationDensityControl';

export function MapGenerator() {
  const [seedInput, setSeedInput] = useState('');
  const [advancedSettings, setAdvancedSettings] = useState<Omit<MapSettings, 'seed'>>({
    name: '',
    width: 50,
    height: 50,
    cellSize: 5,
  });

  const { generatedMap, isGenerating, error, progress, progressValue, generateMap, clearError } =
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
            <p className="text-sm text-muted-foreground text-center mt-3">
              Try: <code className="bg-muted rounded px-[0.3rem] py-[0.2rem] font-mono text-sm">goblin-ambush</code> or{' '}
              <code className="bg-muted rounded px-[0.3rem] py-[0.2rem] font-mono text-sm">forest-temple</code> or{' '}
              <code className="bg-muted rounded px-[0.3rem] py-[0.2rem] font-mono text-sm">mountain-pass</code>
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
                      <span className="text-lg font-medium">Advanced Settings</span>
                      <ChevronDown className="h-5 w-5 transition-transform duration-200 data-[state=open]:rotate-180" />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <form onSubmit={handleAdvancedSubmit} className="space-y-6 px-6 pb-6">
                      {/* Basic Settings */}
                      <div>
                        <h3 className="text-base font-semibold mb-3 text-foreground">
                          Map Configuration
                        </h3>
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
                      <div className="border-t border-border" />

                      {/* Vegetation Density Control */}
                      <div>
                        <h3 className="text-base font-semibold mb-3 text-foreground">
                          Environment Control
                        </h3>
                        <VegetationDensityControl
                          settings={advancedSettings.advancedSettings}
                          onChange={updateAdvancedSettings}
                        />
                      </div>

                      {/* Info Alert */}
                      <Alert>
                        <AlertTitle className="text-sm font-medium">
                          About Map Generation
                        </AlertTitle>
                        <AlertDescription className="text-sm">
                          The map's biome, elevation, and water features are automatically
                          determined from the seed value. The vegetation density slider provides
                          fine-tuned control over forest coverage and tree density while maintaining
                          deterministic generation.
                        </AlertDescription>
                      </Alert>

                      <Button type="submit" disabled={isGenerating} className="w-full">
                        {isGenerating ? 'Generating...' : 'Generate Map'}
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
