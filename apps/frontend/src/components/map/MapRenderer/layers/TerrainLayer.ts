import type { LayerRenderer } from './types';
import {
  ROCK_COLORS,
  SOIL_COLOR,
  TERRAIN_COLORS,
  deterministicNoise,
  hexToRgb,
  lerpColor,
  rgbToStr,
} from './colorUtils';

/**
 * Base terrain layer: geology-based coloring with texture.
 *
 * Reads geology tile data to produce rock-type colors, soil depth blending,
 * fracture textures, and grain-size stippling. Falls back to TERRAIN_COLORS
 * when no geology data is available.
 */
export const renderTerrainLayer: LayerRenderer = (ctx, map, rc) => {
  const geoTiles = map.layers?.geology?.tiles;
  const seed = typeof map.seed === 'number' ? map.seed : 42;

  for (let y = 0; y < rc.height; y++) {
    for (let x = 0; x < rc.width; x++) {
      const px = x * rc.cellSize;
      const py = y * rc.cellSize;
      const geoTile = geoTiles?.[y]?.[x];

      if (geoTile) {
        renderGeologyTile(ctx, px, py, rc.cellSize, geoTile, x, y, seed);
      } else {
        renderFallbackTile(ctx, px, py, rc.cellSize, map, x, y);
      }
    }
  }
};

function renderGeologyTile(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  size: number,
  tile: {
    formation: { rockType: string; properties: { grainSize: string } };
    soilDepth: number;
    features: string[];
    fractureIntensity: number;
  },
  x: number,
  y: number,
  seed: number,
) {
  // 1. Base color from rock type
  const rockType = tile.formation.rockType;
  let baseColor = ROCK_COLORS[rockType] ?? ROCK_COLORS.clastic;

  // Add per-tile noise variation for natural look
  const noise = deterministicNoise(x, y, seed);
  const variation = (noise - 0.5) * 20;
  baseColor = [
    Math.max(0, Math.min(255, baseColor[0] + variation)),
    Math.max(0, Math.min(255, baseColor[1] + variation)),
    Math.max(0, Math.min(255, baseColor[2] + variation)),
  ] as [number, number, number];

  // 2. Soil depth blend: deeper soil -> earthy brown
  const soilBlend = Math.min(tile.soilDepth / 4, 1);
  if (soilBlend > 0.1) {
    baseColor = lerpColor(baseColor, SOIL_COLOR, soilBlend * 0.6);
  }

  // 3. Geological feature darkening/lightening
  for (const feature of tile.features) {
    if (feature === 'tower' || feature === 'dome' || feature === 'tor') {
      // Prominent features -> slightly lighter
      baseColor = lerpColor(baseColor, [220, 220, 220], 0.15);
    } else if (feature === 'sinkhole' || feature === 'ravine' || feature === 'slot_canyon') {
      // Depressions -> darker
      baseColor = lerpColor(baseColor, [40, 40, 40], 0.2);
    }
  }

  // Fill the tile
  ctx.fillStyle = rgbToStr(baseColor[0], baseColor[1], baseColor[2]);
  ctx.fillRect(px, py, size, size);

  // 4. Fracture texture: thin crack lines for high fracture intensity
  if (tile.fractureIntensity > 0.5 && size >= 8) {
    ctx.save();
    ctx.strokeStyle = rgbToStr(
      Math.max(0, baseColor[0] - 40),
      Math.max(0, baseColor[1] - 40),
      Math.max(0, baseColor[2] - 40),
      0.3,
    );
    ctx.lineWidth = 0.5;

    const crackCount = Math.floor(tile.fractureIntensity * 3);
    for (let i = 0; i < crackCount; i++) {
      const n1 = deterministicNoise(x * 7 + i, y * 13, seed + 1);
      const n2 = deterministicNoise(x * 11 + i, y * 3, seed + 2);
      ctx.beginPath();
      ctx.moveTo(px + n1 * size, py + n2 * size * 0.3);
      ctx.lineTo(px + n2 * size, py + size - n1 * size * 0.3);
      ctx.stroke();
    }
    ctx.restore();
  }

  // 5. Grain size texture: stipple dots for crystalline/coarse
  const grainSize = tile.formation.properties?.grainSize;
  if ((grainSize === 'crystalline' || grainSize === 'coarse') && size >= 8) {
    ctx.save();
    ctx.fillStyle = rgbToStr(
      Math.min(255, baseColor[0] + 30),
      Math.min(255, baseColor[1] + 30),
      Math.min(255, baseColor[2] + 30),
      0.25,
    );

    const dotCount = grainSize === 'crystalline' ? 5 : 3;
    for (let i = 0; i < dotCount; i++) {
      const dx = deterministicNoise(x + i * 17, y, seed + 10) * size;
      const dy = deterministicNoise(x, y + i * 23, seed + 11) * size;
      ctx.beginPath();
      ctx.arc(px + dx, py + dy, size * 0.04, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

function renderFallbackTile(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  size: number,
  map: { tiles: Array<{ x: number; y: number; terrain: string }> },
  x: number,
  y: number,
) {
  const tile = map.tiles.find((t) => t.x === x && t.y === y);
  const terrainKey = tile?.terrain ?? 'default';
  const hex = TERRAIN_COLORS[terrainKey] ?? TERRAIN_COLORS.default;
  const [r, g, b] = hexToRgb(hex);

  ctx.fillStyle = rgbToStr(r, g, b, 0.8);
  ctx.fillRect(px, py, size, size);
}
