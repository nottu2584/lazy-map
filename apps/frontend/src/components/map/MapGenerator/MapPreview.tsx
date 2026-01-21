import { Loader2 } from 'lucide-react';
import { MapCanvas } from '../../MapCanvas';
import type { GeneratedMap } from '@/types';

interface MapPreviewProps {
  map: GeneratedMap | null;
  isGenerating: boolean;
  progress: string;
}

export function MapPreview({ map, isGenerating, progress }: MapPreviewProps) {
  if (isGenerating) {
    return (
      <div className="bg-muted/50 border-2 border-dashed rounded-lg h-96 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <div>
            <p className="font-medium">{progress || 'Generating map...'}</p>
            <p className="text-sm text-muted-foreground mt-2">
              This may take a few moments
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (map) {
    return <MapCanvas map={map} />;
  }

  return (
    <div className="bg-muted/50 border-2 border-dashed rounded-lg h-96 flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-2">🗺️</div>
        <p className="text-muted-foreground">
          Configure settings and click "Generate Map" to create your battlemap
        </p>
      </div>
    </div>
  );
}
