import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMapGeneration } from '@/hooks';
import { MapSettingsForm } from './MapSettingsForm';
import { MapProgress } from './MapProgress';
import { MapError } from './MapError';
import { MapPreview } from './MapPreview';

export function MapGenerator() {
  const { generatedMap, isGenerating, error, progress, generateMap, clearError } =
    useMapGeneration();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Settings Panel */}
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>Map Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <MapSettingsForm
              onGenerate={generateMap}
              isGenerating={isGenerating}
            />
            <MapProgress progress={progress} />
            <MapError error={error} onClear={clearError} />
          </CardContent>
        </Card>
      </div>

      {/* Map Canvas */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Generated Map</CardTitle>
          </CardHeader>
          <CardContent>
            <MapPreview
              map={generatedMap}
              isGenerating={isGenerating}
              progress={progress}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
