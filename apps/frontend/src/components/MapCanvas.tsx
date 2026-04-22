import { useRef, useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import type { GeneratedMap } from '../types';
import { Button } from './ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Separator } from './ui/separator';

interface MapCanvasProps {
  map: GeneratedMap;
}

const TERRAIN_COLORS = {
  grass: '#7CB342',
  dirt: '#8D6E63',
  stone: '#757575',
  water: '#1976D2',
  marsh: '#4E342E',
  sand: '#FFD54F',
  snow: '#ECEFF1',
  // Legacy terrain types (fallback)
  grassland: '#7CB342',
  forest: '#2E7D32',
  mountain: '#5D4037',
  default: '#9E9E9E'
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
  const [maxWidth, setMaxWidth] = useState(800);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        setMaxWidth(containerRef.current.getBoundingClientRect().width);
      }
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const cellSize = Math.min(maxWidth / map.width, 600 / map.height, 25);
  const canvasWidth = map.width * cellSize;
  const canvasHeight = map.height * cellSize;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Terrain tiles
    map.tiles.forEach((tile) => {
      const x = tile.x * cellSize;
      const y = tile.y * cellSize;
      ctx.fillStyle = TERRAIN_COLORS[tile.terrain as keyof typeof TERRAIN_COLORS] || TERRAIN_COLORS.default;
      ctx.globalAlpha = 0.8;
      ctx.fillRect(x, y, cellSize, cellSize);
      ctx.globalAlpha = 1.0;
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(x, y, cellSize, cellSize);
    });

    // Grid
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

    // Features
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
    <div ref={containerRef} className="inline-flex flex-col items-start">
      <Card className="w-auto">
        <CardHeader className="pb-3">
          <div className="flex items-baseline justify-between gap-4">
            <CardTitle className="text-base">{map.name}</CardTitle>
            <CardDescription>
              {map.width}&times;{map.height} cells &middot; {cellSize.toFixed(1)}px/cell
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Legend */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
            {TERRAIN_LEGEND.map(({ key, label }) => (
              <div key={key} className="flex items-center gap-1">
                <div
                  className="size-3 rounded-sm border border-border"
                  style={{ backgroundColor: TERRAIN_COLORS[key as keyof typeof TERRAIN_COLORS] }}
                />
                <span>{label}</span>
              </div>
            ))}
            <Separator orientation="vertical" className="h-3" />
            {FEATURE_LEGEND.map(({ symbol, label }) => (
              <div key={label} className="flex items-center gap-1">
                <span className="size-3 text-center leading-3">{symbol}</span>
                <span>{label}</span>
              </div>
            ))}
          </div>

          {/* Canvas */}
          <canvas
            ref={canvasRef}
            width={canvasWidth}
            height={canvasHeight}
            className="rounded-md"
            style={{ display: 'block', width: canvasWidth, height: canvasHeight }}
          />
        </CardContent>

        <CardFooter>
          <Button onClick={handleExportPNG} variant="outline" size="sm">
            <Download className="mr-1.5 size-3.5" />
            Export PNG
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
