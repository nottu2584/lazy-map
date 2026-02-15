import { Button } from '@/components/ui/button';
import type { LayerId, LayerState } from '@/hooks/useLayerVisibility';

interface LayerTogglePanelProps {
  layers: Record<LayerId, LayerState>;
  onToggle: (id: LayerId) => void;
}

const LAYER_LABELS: { id: LayerId; label: string }[] = [
  { id: 'terrain', label: 'Terrain' },
  { id: 'relief', label: 'Relief' },
  { id: 'hydrology', label: 'Water' },
  { id: 'vegetation', label: 'Vegetation' },
  { id: 'structures', label: 'Structures' },
  { id: 'features', label: 'Features' },
  { id: 'grid', label: 'Grid' },
];

export function LayerTogglePanel({ layers, onToggle }: LayerTogglePanelProps) {
  return (
    <div className="flex flex-wrap gap-1">
      {LAYER_LABELS.map(({ id, label }) => (
        <Button
          key={id}
          variant={layers[id].visible ? 'default' : 'outline'}
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={() => onToggle(id)}
        >
          {label}
        </Button>
      ))}
    </div>
  );
}
