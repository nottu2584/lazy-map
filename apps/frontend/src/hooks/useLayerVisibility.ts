import { useCallback, useState } from 'react';

export type LayerId =
  | 'terrain'
  | 'relief'
  | 'hydrology'
  | 'vegetation'
  | 'structures'
  | 'features'
  | 'grid';

export interface LayerState {
  visible: boolean;
  opacity: number;
}

const DEFAULT_LAYERS: Record<LayerId, LayerState> = {
  terrain: { visible: true, opacity: 1 },
  relief: { visible: true, opacity: 0.6 },
  hydrology: { visible: true, opacity: 1 },
  vegetation: { visible: true, opacity: 1 },
  structures: { visible: true, opacity: 1 },
  features: { visible: true, opacity: 1 },
  grid: { visible: true, opacity: 0.3 },
};

export function useLayerVisibility() {
  const [layers, setLayers] = useState<Record<LayerId, LayerState>>(DEFAULT_LAYERS);

  const toggleLayer = useCallback((id: LayerId) => {
    setLayers((prev) => ({
      ...prev,
      [id]: { ...prev[id], visible: !prev[id].visible },
    }));
  }, []);

  const setOpacity = useCallback((id: LayerId, opacity: number) => {
    setLayers((prev) => ({
      ...prev,
      [id]: { ...prev[id], opacity: Math.max(0, Math.min(1, opacity)) },
    }));
  }, []);

  return { layers, toggleLayer, setOpacity };
}
