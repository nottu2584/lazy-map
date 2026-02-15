import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useLayerVisibility, type LayerId } from '@/hooks/useLayerVisibility';
import type { GeneratedMap } from '@/types';
import { LayerTogglePanel } from './LayerTogglePanel';
import type { LayerRenderer, RenderContext } from './layers/types';
import { renderTerrainLayer } from './layers/TerrainLayer';
import { renderReliefLayer } from './layers/ReliefLayer';
import { renderHydrologyLayer } from './layers/HydrologyLayer';
import { renderVegetationLayer } from './layers/VegetationLayer';
import { renderStructuresLayer } from './layers/StructuresLayer';
import { renderFeaturesLayer } from './layers/FeaturesLayer';
import { renderGridLayer } from './layers/GridLayer';

interface MapRendererProps {
  map: GeneratedMap;
}

const LAYER_ORDER: { id: LayerId; renderer: LayerRenderer; zIndex: number }[] = [
  { id: 'terrain', renderer: renderTerrainLayer, zIndex: 1 },
  { id: 'relief', renderer: renderReliefLayer, zIndex: 2 },
  { id: 'hydrology', renderer: renderHydrologyLayer, zIndex: 3 },
  { id: 'vegetation', renderer: renderVegetationLayer, zIndex: 4 },
  { id: 'structures', renderer: renderStructuresLayer, zIndex: 5 },
  { id: 'features', renderer: renderFeaturesLayer, zIndex: 6 },
  { id: 'grid', renderer: renderGridLayer, zIndex: 7 },
];

export function MapRenderer({ map }: MapRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRefs = useRef<Map<LayerId, HTMLCanvasElement>>(new Map());
  const [containerWidth, setContainerWidth] = useState(800);
  const { layers, toggleLayer } = useLayerVisibility();

  // Responsive sizing
  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerWidth(Math.min(rect.width, 900));
      }
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Compute render context
  const cellSize = Math.floor(containerWidth / Math.max(map.width, map.height));
  const canvasWidth = map.width * cellSize;
  const canvasHeight = map.height * cellSize;

  const rc: RenderContext = {
    width: map.width,
    height: map.height,
    cellSize,
    canvasWidth,
    canvasHeight,
  };

  // Register canvas ref
  const setCanvasRef = useCallback(
    (id: LayerId) => (el: HTMLCanvasElement | null) => {
      if (el) canvasRefs.current.set(id, el);
      else canvasRefs.current.delete(id);
    },
    [],
  );

  // Render each layer when map or dimensions change
  useEffect(() => {
    for (const { id, renderer } of LAYER_ORDER) {
      const canvas = canvasRefs.current.get(id);
      if (!canvas) continue;

      canvas.width = canvasWidth;
      canvas.height = canvasHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) continue;

      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      renderer(ctx, map, rc);
    }
  }, [map, cellSize, canvasWidth, canvasHeight]);

  // Export visible layers as composite PNG
  const handleExportPNG = useCallback(() => {
    const offscreen = document.createElement('canvas');
    offscreen.width = canvasWidth;
    offscreen.height = canvasHeight;
    const offCtx = offscreen.getContext('2d');
    if (!offCtx) return;

    for (const { id } of LAYER_ORDER) {
      if (!layers[id].visible) continue;
      const canvas = canvasRefs.current.get(id);
      if (!canvas) continue;

      offCtx.globalAlpha = layers[id].opacity;
      offCtx.drawImage(canvas, 0, 0);
    }
    offCtx.globalAlpha = 1;

    offscreen.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `${map.name || 'map'}.png`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    });
  }, [canvasWidth, canvasHeight, layers, map.name]);

  return (
    <div className="space-y-4">
      {/* Map Info */}
      <div className="flex justify-between items-center text-sm text-muted-foreground">
        <div>
          <strong>{map.name}</strong> — {map.width}x{map.height} tiles
        </div>
        <div>Cell: {cellSize}px</div>
      </div>

      {/* Layer Toggles */}
      <LayerTogglePanel layers={layers} onToggle={toggleLayer} />

      {/* Canvas Stack */}
      <div
        ref={containerRef}
        className="border border-border rounded-lg overflow-hidden bg-background"
        style={{ height: canvasHeight || 500 }}
      >
        <div className="relative mx-auto" style={{ width: canvasWidth, height: canvasHeight }}>
          {LAYER_ORDER.map(({ id, zIndex }) => (
            <canvas
              key={id}
              ref={setCanvasRef(id)}
              width={canvasWidth}
              height={canvasHeight}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                zIndex,
                display: layers[id].visible ? 'block' : 'none',
                opacity: layers[id].opacity,
              }}
            />
          ))}
        </div>
      </div>

      {/* Export */}
      <div className="flex gap-4">
        <Button onClick={handleExportPNG} variant="default">
          Export PNG
        </Button>
      </div>
    </div>
  );
}
