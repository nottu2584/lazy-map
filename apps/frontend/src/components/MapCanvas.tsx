import { useRef, useEffect, useState } from 'react';
import { Stage, Layer, Rect, Text } from 'react-konva';
import type { GeneratedMap } from './MapGenerator';

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
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

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

  const cellWidth = dimensions.width / map.width;
  const cellHeight = dimensions.height / map.height;
  const cellSize = Math.min(cellWidth, cellHeight);

  const getTerrainColor = (terrain: string): string => {
    return TERRAIN_COLORS[terrain as keyof typeof TERRAIN_COLORS] || TERRAIN_COLORS.default;
  };

  const renderTile = (tile: GeneratedMap['tiles'][0], index: number) => {
    const x = tile.x * cellSize;
    const y = tile.y * cellSize;
    const color = getTerrainColor(tile.terrain);

    return (
      <Rect
        key={index}
        x={x}
        y={y}
        width={cellSize}
        height={cellSize}
        fill={color}
        stroke="#333"
        strokeWidth={0.5}
        opacity={0.8}
      />
    );
  };

  const renderGridLines = () => {
    const lines = [];

    // Vertical lines
    for (let i = 0; i <= map.width; i++) {
      lines.push(
        <Rect
          key={`v-${i}`}
          x={i * cellSize}
          y={0}
          width={1}
          height={map.height * cellSize}
          fill="#666"
          opacity={0.3}
        />
      );
    }

    // Horizontal lines
    for (let i = 0; i <= map.height; i++) {
      lines.push(
        <Rect
          key={`h-${i}`}
          x={0}
          y={i * cellSize}
          width={map.width * cellSize}
          height={1}
          fill="#666"
          opacity={0.3}
        />
      );
    }

    return lines;
  };

  const renderFeatures = () => {
    return map.tiles.map((tile, index) => {
      if (tile.features.length === 0) return null;

      const x = tile.x * cellSize + cellSize / 2;
      const y = tile.y * cellSize + cellSize / 2;

      return tile.features.map((feature, featureIndex) => (
        <Text
          key={`${index}-${featureIndex}`}
          x={x - 5}
          y={y - 5}
          text={getFeatureSymbol(feature)}
          fontSize={Math.min(cellSize * 0.6, 16)}
          fill="#333"
        />
      ));
    });
  };

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

  return (
    <div className="space-y-4">
      {/* Map Info */}
      <div className="flex justify-between items-center text-sm text-gray-600">
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
                className="w-4 h-4 border border-gray-300"
                style={{ backgroundColor: color }}
              />
              <span className="capitalize">{terrain}</span>
            </div>
          ))}
      </div>

      {/* Canvas Container */}
      <div
        ref={containerRef}
        className="border border-gray-300 rounded-lg overflow-hidden bg-white"
        style={{ height: '500px' }}
      >
        <Stage width={map.width * cellSize} height={map.height * cellSize}>
          <Layer>
            {/* Terrain tiles */}
            {map.tiles.map(renderTile)}

            {/* Grid lines */}
            {renderGridLines()}

            {/* Features */}
            {renderFeatures()}
          </Layer>
        </Stage>
      </div>

      {/* Export Options */}
      <div className="flex gap-4">
        <button
          onClick={() => {
            // In a real implementation, this would generate and download the image
            alert('Export functionality will be implemented with the real API integration');
          }}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
        >
          Export PNG
        </button>
        <button
          onClick={() => {
            alert('PDF export functionality will be implemented with the real API integration');
          }}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
        >
          Export PDF
        </button>
      </div>
    </div>
  );
}