import { useRef, useEffect, useState, useCallback } from 'react';
import { Download, Info } from 'lucide-react';
import type { GeneratedMap } from '../types';
import { Button } from './ui/button';
import { Separator } from './ui/separator';

interface MapCanvasProps {
  map: GeneratedMap;
}

const TERRAIN_COLORS: Record<string, string> = {
  grass: '#7CB342',
  dirt: '#8D6E63',
  stone: '#757575',
  water: '#1976D2',
  marsh: '#4E342E',
  sand: '#FFD54F',
  snow: '#ECEFF1',
  grassland: '#7CB342',
  forest: '#2E7D32',
  mountain: '#5D4037',
  default: '#9E9E9E',
};

const TERRAIN_LEGEND = [
  { key: 'grass', label: 'Grass' },
  { key: 'dirt', label: 'Dirt' },
  { key: 'stone', label: 'Stone' },
  { key: 'water', label: 'Water' },
  { key: 'marsh', label: 'Marsh' },
  { key: 'sand', label: 'Sand' },
  { key: 'snow', label: 'Snow' },
];

const FEATURE_LEGEND = [
  { symbol: '🌲', label: 'Dense trees' },
  { symbol: '🌳', label: 'Sparse trees' },
  { symbol: '🌿', label: 'Shrubs' },
  { symbol: '🌾', label: 'Tall grass' },
  { symbol: '═', label: 'Road' },
  { symbol: '🏠', label: 'Building' },
  { symbol: '🧱', label: 'Wall' },
];

const FEATURE_PRIORITY: Record<string, { symbol: string; priority: number }> = {
  dense_trees:   { symbol: '🌲', priority: 10 },
  sparse_trees:  { symbol: '🌳', priority: 9 },
  undergrowth:   { symbol: '🌿', priority: 7 },
  shrubs:        { symbol: '🌿', priority: 6 },
  tall_grass:    { symbol: '🌾', priority: 5 },
  building:      { symbol: '🏠', priority: 12 },
  wall:          { symbol: '🧱', priority: 11 },
  road:          { symbol: '═',  priority: 8 },
  cover_full:    { symbol: '▓',  priority: 4 },
  cover_partial: { symbol: '▒',  priority: 3 },
  cover_light:   { symbol: '░',  priority: 2 },
  tree:          { symbol: '🌲', priority: 10 },
  rock:          { symbol: '🗿', priority: 8 },
};

function getTopFeature(features: string[]): { symbol: string; priority: number } | null {
  let best: { symbol: string; priority: number } | null = null;
  for (const feature of features) {
    const match = Object.entries(FEATURE_PRIORITY).find(([key]) => feature.includes(key));
    if (match && (!best || match[1].priority > best.priority)) {
      best = match[1];
    }
  }
  return best;
}

export function MapCanvas({ map }: MapCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [parentWidth, setParentWidth] = useState(0);
  const [showLegend, setShowLegend] = useState(false);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setParentWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const cellSize = parentWidth > 0 ? Math.min(parentWidth / map.width, 25) : 0;
  const canvasWidth = Math.floor(map.width * cellSize);
  const canvasHeight = Math.floor(map.height * cellSize);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || cellSize === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    map.tiles.forEach((tile) => {
      const x = tile.x * cellSize;
      const y = tile.y * cellSize;
      ctx.fillStyle = TERRAIN_COLORS[tile.terrain] || TERRAIN_COLORS.default;
      ctx.globalAlpha = 0.8;
      ctx.fillRect(x, y, cellSize, cellSize);
      ctx.globalAlpha = 1.0;
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(x, y, cellSize, cellSize);
    });

    ctx.strokeStyle = '#666';
    ctx.globalAlpha = 0.3;
    ctx.lineWidth = 1;
    for (let i = 0; i <= map.width; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellSize, 0);
      ctx.lineTo(i * cellSize, canvasHeight);
      ctx.stroke();
    }
    for (let i = 0; i <= map.height; i++) {
      ctx.beginPath();
      ctx.moveTo(0, i * cellSize);
      ctx.lineTo(canvasWidth, i * cellSize);
      ctx.stroke();
    }
    ctx.globalAlpha = 1.0;

    ctx.fillStyle = '#333';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${Math.min(cellSize * 0.6, 16)}px Arial`;

    map.tiles.forEach((tile) => {
      if (tile.features.length === 0) return;
      const top = getTopFeature(tile.features);
      if (!top) return;
      ctx.fillText(top.symbol, tile.x * cellSize + cellSize / 2, tile.y * cellSize + cellSize / 2);
    });
  }, [map, cellSize, canvasWidth, canvasHeight]);

  useEffect(draw, [draw]);

  const handleExportPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `${map.name || 'map'}.png`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    });
  };

  return (
    <div ref={wrapperRef} className="w-full space-y-3">
      {/* Map info */}
      <div className="flex items-baseline justify-between text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{map.name}</span>
        <span>{map.width}&times;{map.height} cells</span>
      </div>

      {/* Canvas + floating legend */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          className="block w-full rounded-md"
          style={{ height: canvasHeight || 'auto' }}
        />

        {/* Floating legend */}
        {showLegend && (
          <div className="absolute top-2 left-2 rounded-md border bg-background/95 backdrop-blur-sm shadow-md p-3 max-w-[220px]">
            <p className="text-xs font-medium mb-2">Terrain</p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-muted-foreground">
              {TERRAIN_LEGEND.map(({ key, label }) => (
                <div key={key} className="flex items-center gap-1.5">
                  <div
                    className="size-2.5 rounded-sm border border-border shrink-0"
                    style={{ backgroundColor: TERRAIN_COLORS[key] }}
                  />
                  <span>{label}</span>
                </div>
              ))}
            </div>
            <Separator className="my-2" />
            <p className="text-xs font-medium mb-2">Features</p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-muted-foreground">
              {FEATURE_LEGEND.map(({ symbol, label }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <span className="size-2.5 text-center text-[10px] leading-none shrink-0">{symbol}</span>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowLegend(!showLegend)}
        >
          <Info className="mr-1.5 size-3.5" />
          Legend
        </Button>
        <Button variant="outline" size="sm" onClick={handleExportPNG}>
          <Download className="mr-1.5 size-3.5" />
          Export PNG
        </Button>
      </div>
    </div>
  );
}
