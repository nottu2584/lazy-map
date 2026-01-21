import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMapGeneration } from '@/hooks';
import { MapError } from './MapError';
import { MapProgress } from './MapProgress';
import { MapCanvas } from '../../MapCanvas';
import type { MapSettings } from '@/types';

export function SimplifiedMapGenerator() {
  const [seedInput, setSeedInput] = useState('');
  const { generatedMap, isGenerating, error, progress, generateMap, clearError } =
    useMapGeneration();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const settings: MapSettings = {
      name: seedInput || 'Tactical Map',
      width: 50,
      height: 50,
      cellSize: 5,
      seed: seedInput,
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
    };

    generateMap(settings);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="pt-32 pb-16 px-6 text-center">
        <h1 className="text-hero font-heading">
          Generate Your Map
        </h1>
        <p className="mt-6 text-body-large text-muted-foreground max-w-2xl mx-auto">
          Tactical battlemap generator for tabletop RPGs. Enter a seed value to create your map.
        </p>
      </section>

      {/* Input Section */}
      <section className="px-6 pb-16">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <Input
              value={seedInput}
              onChange={(e) => setSeedInput(e.target.value)}
              placeholder="goblin-ambush"
              className="h-14 text-lg"
              disabled={isGenerating}
            />
            <Button
              type="submit"
              size="lg"
              className="px-8"
              disabled={isGenerating}
            >
              {isGenerating ? 'Generating...' : 'Generate'}
            </Button>
          </form>
          <p className="mt-3 text-sm text-muted-foreground text-center">
            Try: <span className="font-mono">"goblin-ambush"</span> or <span className="font-mono">"forest-temple"</span> or <span className="font-mono">"mountain-pass"</span>
          </p>

          {/* Progress & Error */}
          <div className="mt-6">
            <MapProgress progress={progress} />
            <MapError error={error} onClear={clearError} />
          </div>
        </div>
      </section>

      {/* Canvas Section - Full Bleed */}
      <section className="relative w-full flex-1 min-h-[70vh] border-t border-border bg-muted/30">
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
