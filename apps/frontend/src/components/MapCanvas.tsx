import { useRef, useEffect, useState } from 'react';
import type { GeneratedMap } from '../types';
import { Button } from './ui/button';

interface MapCanvasProps {
  map: GeneratedMap;
}

const TERRAIN_COLORS = {
  // Terrain types from tactical map
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

export function MapCanvas({ map }: MapCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: Math.min(rect.width, 800),
          height: Math.min(rect.height, 600)
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Calculate cell size
  const cellWidth = dimensions.width / map.width;
  const cellHeight = dimensions.height / map.height;
  const cellSize = Math.min(cellWidth, cellHeight);
  const canvasWidth = map.width * cellSize;
  const canvasHeight = map.height * cellSize;

  // Helper to get terrain color
  const getTerrainColor = (terrain: string): string => {
    return TERRAIN_COLORS[terrain as keyof typeof TERRAIN_COLORS] || TERRAIN_COLORS.default;
  };

  // Helper to get feature symbol
  const getFeatureSymbol = (feature: string): string => {
    // Vegetation features
    if (feature.includes('dense_trees')) return '🌲';
    if (feature.includes('sparse_trees')) return '🌳';
    if (feature.includes('shrubs')) return '🌿';

    // Structure features
    if (feature.includes('building')) return '🏠';
    if (feature.includes('wall')) return '🧱';
    if (feature.includes('road')) return '═';

    // Tactical cover features
    if (feature.includes('cover_full')) return '▓';
    if (feature.includes('cover_partial')) return '▒';
    if (feature.includes('cover_light')) return '░';

    // Legacy features
    switch (feature) {
      case 'tree': return '🌲';
      case 'rock': return '🗿';
      case 'building': return '🏠';
      case 'road': return '🛤️';
      default: return '•';
    }
  };

  // Draw the map on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Draw terrain tiles
    map.tiles.forEach((tile) => {
      const x = tile.x * cellSize;
      const y = tile.y * cellSize;
      const color = getTerrainColor(tile.terrain);

      // Fill tile
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.8;
      ctx.fillRect(x, y, cellSize, cellSize);
      ctx.globalAlpha = 1.0;

      // Draw tile border
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(x, y, cellSize, cellSize);
    });

    // Draw grid lines
    ctx.strokeStyle = '#666';
    ctx.globalAlpha = 0.3;
    ctx.lineWidth = 1;

    // Vertical lines
    for (let i = 0; i <= map.width; i++) {
      const x = i * cellSize;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvasHeight);
      ctx.stroke();
    }

    // Horizontal lines
    for (let i = 0; i <= map.height; i++) {
      const y = i * cellSize;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvasWidth, y);
      ctx.stroke();
    }

    ctx.globalAlpha = 1.0;

    // Draw features
    ctx.fillStyle = '#333';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const fontSize = Math.min(cellSize * 0.6, 16);
    ctx.font = `${fontSize}px Arial`;

    map.tiles.forEach((tile) => {
      if (tile.features.length === 0) return;

      const centerX = tile.x * cellSize + cellSize / 2;
      const centerY = tile.y * cellSize + cellSize / 2;

      tile.features.forEach((feature) => {
        const symbol = getFeatureSymbol(feature);
        ctx.fillText(symbol, centerX, centerY);
      });
    });
  }, [map, cellSize, canvasWidth, canvasHeight, getTerrainColor, getFeatureSymbol]);

  // Export canvas as PNG
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

  // Export canvas as data URL for PDF or other uses
  const handleExportPDF = () => {
    // Placeholder for future PDF export implementation
    // Will use jsPDF or similar library
    alert('PDF export functionality will be implemented in a future update');
  };

  return (
    <div className="space-y-4">
      {/* Map Info */}
      <div className="flex justify-between items-center text-sm text-muted-foreground">
        <div>
          <strong>{map.name}</strong> - {map.width}x{map.height} cells
        </div>
        <div>
          Cell size: {cellSize.toFixed(1)}px
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-sm">
        {Object.entries(TERRAIN_COLORS)
          .filter(([terrain]) => !['default', 'grassland', 'forest', 'mountain'].includes(terrain))
          .map(([terrain, color]) => (
            <div key={terrain} className="flex items-center gap-2">
              <div
                className="w-4 h-4 border border-input"
                style={{ backgroundColor: color }}
                aria-label={`${terrain} terrain color`}
                role="img"
              />
              <span className="capitalize">{terrain}</span>
            </div>
          ))}
      </div>

      {/* Canvas Container */}
      <div
        ref={containerRef}
        className="border border-border rounded-lg overflow-hidden bg-background"
        style={{ height: '500px' }}
      >
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          className="mx-auto"
          style={{ display: 'block' }}
        />
      </div>

      {/* Export Options */}
      <div className="flex gap-4">
        <Button
          onClick={handleExportPNG}
          variant="default"
        >
          Export PNG
        </Button>
        <Button
          onClick={handleExportPDF}
          variant="secondary"
        >
          Export PDF
        </Button>
      </div>
    </div>
  );
}