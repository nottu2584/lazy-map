import { useRef, useEffect, useState, useCallback } from 'react';
import { Download, Info } from 'lucide-react';
import type { GeneratedMap } from '../types';
import type { MapLayersDTO } from '../types/layers';
import { Button } from './ui/button';
import { Separator } from './ui/separator';

interface MapCanvasProps {
  map: GeneratedMap;
}

type RGB = [number, number, number];

const TERRAIN_RGB: Record<string, RGB> = {
  grass:  [124, 179, 66],
  dirt:   [141, 110, 99],
  stone:  [117, 117, 117],
  water:  [25, 118, 210],
  marsh:  [78, 52, 46],
  sand:   [255, 213, 79],
  snow:   [236, 239, 241],
  forest: [46, 125, 50],
};

const TERRAIN_LEGEND = [
  { key: 'grass', label: 'Grass' },
  { key: 'dirt', label: 'Dirt' },
  { key: 'stone', label: 'Stone' },
  { key: 'water', label: 'Water' },
  { key: 'marsh', label: 'Marsh' },
  { key: 'sand', label: 'Sand' },
  { key: 'snow', label: 'Snow' },
  { key: 'forest', label: 'Forest' },
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

function blendRGB(weights: [RGB, number][]): RGB {
  let totalWeight = 0;
  let r = 0, g = 0, b = 0;
  for (const [color, w] of weights) {
    if (w <= 0) continue;
    r += color[0] * w;
    g += color[1] * w;
    b += color[2] * w;
    totalWeight += w;
  }
  if (totalWeight === 0) return TERRAIN_RGB.grass;
  return [Math.round(r / totalWeight), Math.round(g / totalWeight), Math.round(b / totalWeight)];
}

function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

function computeTileColor(layers: MapLayersDTO, x: number, y: number): string {
  const geo = layers.geology?.tiles?.[y]?.[x];
  const topo = layers.topography?.tiles?.[y]?.[x];
  const hydro = layers.hydrology?.tiles?.[y]?.[x];
  const veg = layers.vegetation?.tiles?.[y]?.[x];

  const soilDepth = geo?.soilDepth ?? 2;
  const slope = topo?.slope ?? 0;
  const waterDepth = hydro?.waterDepth ?? 0;
  const moisture = hydro?.moisture ?? 'moderate';
  const canopyDensity = veg?.canopyDensity ?? 0;
  const groundCover = veg?.groundCover ?? 0;
  const isEvaporite = geo?.formation?.rockType === 'evaporite';

  const weights: [RGB, number][] = [];

  // Water — strong when deep, partial when shallow
  if (waterDepth > 0) {
    const waterW = clamp(waterDepth / 0.8, 0, 1);
    weights.push([TERRAIN_RGB.water, waterW]);
  }

  // Marsh — wet/saturated moisture or very shallow water
  const isMarshy = moisture === 'saturated' || moisture === 'wet';
  if (isMarshy && waterDepth < 0.5) {
    weights.push([TERRAIN_RGB.marsh, 0.6]);
  }

  // Sand — evaporite geology
  if (isEvaporite) {
    weights.push([TERRAIN_RGB.sand, 0.8]);
  }

  // Stone — steep slopes or very thin soil
  const slopeStone = clamp((slope - 20) / 40, 0, 1);
  const soilStone = clamp((1 - soilDepth) / 1, 0, 1);
  const stoneW = Math.max(slopeStone, soilStone * 0.7);
  if (stoneW > 0.05) {
    weights.push([TERRAIN_RGB.stone, stoneW]);
  }

  // Dirt — moderate soil, low vegetation
  const dirtFromSoil = clamp(1 - soilDepth / 2, 0, 0.6);
  const dirtFromVeg = clamp(1 - groundCover, 0, 1);
  const dirtW = dirtFromSoil * dirtFromVeg * 0.8;
  if (dirtW > 0.05) {
    weights.push([TERRAIN_RGB.dirt, dirtW]);
  }

  // Forest canopy darkens toward deep green
  if (canopyDensity > 0) {
    weights.push([TERRAIN_RGB.forest, canopyDensity * 0.8]);
  }

  // Grass — base layer, weighted by ground cover and remaining soil
  const grassW = clamp(groundCover * 0.6 + soilDepth / 4, 0.1, 1);
  weights.push([TERRAIN_RGB.grass, grassW]);

  const [r, g, b] = blendRGB(weights);
  return `rgb(${r},${g},${b})`;
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

    const hasLayers = !!map.layers;

    map.tiles.forEach((tile) => {
      const x = tile.x * cellSize;
      const y = tile.y * cellSize;
      ctx.fillStyle = hasLayers
        ? computeTileColor(map.layers!, tile.x, tile.y)
        : `rgb(${(TERRAIN_RGB[tile.terrain] ?? TERRAIN_RGB.grass).join(',')})`;
      ctx.globalAlpha = 0.85;
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
          className="block max-w-full rounded-md"
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
                    style={{ backgroundColor: `rgb(${(TERRAIN_RGB[key] ?? TERRAIN_RGB.grass).join(',')})` }}
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
