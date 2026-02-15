import type { LayerRenderer } from './types';
import { deterministicNoise, rgbToStr, lerp } from './colorUtils';

/**
 * Vegetation layer: tree crowns, shrubs, grass, species-based variation.
 *
 * Crown positions within a tile are deterministic (derived from tile coords).
 */
export const renderVegetationLayer: LayerRenderer = (ctx, map, rc) => {
  const vegTiles = map.layers?.vegetation?.tiles;
  if (!vegTiles) return;

  const forestPatches = map.layers?.vegetation?.forestPatches ?? [];
  const clearings = map.layers?.vegetation?.clearings ?? [];
  const seed = typeof map.seed === 'number' ? map.seed : 42;

  // Build a set of clearing tiles for quick lookup
  const clearingSet = new Set<string>();
  for (const c of clearings) {
    for (let dy = -c.radius; dy <= c.radius; dy++) {
      for (let dx = -c.radius; dx <= c.radius; dx++) {
        if (dx * dx + dy * dy <= c.radius * c.radius) {
          clearingSet.add(`${c.x + dx},${c.y + dy}`);
        }
      }
    }
  }

  // Build patch type lookup
  const patchTypeMap = new Map<string, string>();
  for (const patch of forestPatches) {
    for (const t of patch.tiles) {
      patchTypeMap.set(`${t.x},${t.y}`, patch.type);
    }
  }

  for (let y = 0; y < rc.height; y++) {
    for (let x = 0; x < rc.width; x++) {
      const tile = vegTiles[y]?.[x];
      if (!tile || tile.vegetationType === 'none') continue;
      if (clearingSet.has(`${x},${y}`)) continue;

      const px = x * rc.cellSize;
      const py = y * rc.cellSize;
      const cs = rc.cellSize;

      // Ground cover tint
      if (tile.groundCover > 0) {
        ctx.fillStyle = `rgba(100,160,60,${tile.groundCover * 0.15})`;
        ctx.fillRect(px, py, cs, cs);
      }

      switch (tile.vegetationType) {
        case 'grass':
          renderGrass(ctx, px, py, cs, tile.groundCover);
          break;
        case 'tall_grass':
          renderTallGrass(ctx, px, py, cs, x, y, seed);
          break;
        case 'shrubs':
          renderShrubs(ctx, px, py, cs, x, y, seed);
          break;
        case 'undergrowth':
          renderUndergrowth(ctx, px, py, cs, x, y, seed);
          break;
        case 'sparse_trees':
          renderTrees(ctx, px, py, cs, x, y, seed, tile, patchTypeMap.get(`${x},${y}`), 1, 2);
          break;
        case 'dense_trees':
          renderTrees(ctx, px, py, cs, x, y, seed, tile, patchTypeMap.get(`${x},${y}`), 2, 4);
          break;
      }
    }
  }
};

function renderGrass(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  cs: number,
  groundCover: number,
) {
  ctx.fillStyle = `rgba(140,190,70,${lerp(0.05, 0.2, groundCover)})`;
  ctx.fillRect(px, py, cs, cs);
}

function renderTallGrass(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  cs: number,
  x: number,
  y: number,
  seed: number,
) {
  ctx.fillStyle = 'rgba(120,170,50,0.25)';
  ctx.fillRect(px, py, cs, cs);

  // Hatching lines for tall grass
  if (cs >= 6) {
    ctx.save();
    ctx.strokeStyle = 'rgba(90,140,40,0.3)';
    ctx.lineWidth = 0.6;
    const count = Math.max(2, Math.floor(cs / 4));
    for (let i = 0; i < count; i++) {
      const n = deterministicNoise(x * 3 + i, y * 5, seed + 20);
      const sx = px + n * cs;
      ctx.beginPath();
      ctx.moveTo(sx, py + cs);
      ctx.lineTo(sx + cs * 0.1, py + cs * 0.4);
      ctx.stroke();
    }
    ctx.restore();
  }
}

function renderShrubs(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  cs: number,
  x: number,
  y: number,
  seed: number,
) {
  ctx.save();
  const count = Math.max(2, Math.floor(cs / 5));
  for (let i = 0; i < count; i++) {
    const dx = deterministicNoise(x + i * 7, y, seed + 30) * cs;
    const dy = deterministicNoise(x, y + i * 11, seed + 31) * cs;
    const r = cs * lerp(0.08, 0.14, deterministicNoise(x + i, y + i, seed + 32));

    ctx.fillStyle = `rgba(80,130,50,${lerp(0.4, 0.7, deterministicNoise(x * i, y, seed + 33))})`;
    ctx.beginPath();
    ctx.arc(px + dx, py + dy, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function renderUndergrowth(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  cs: number,
  x: number,
  y: number,
  seed: number,
) {
  ctx.fillStyle = 'rgba(70,120,40,0.2)';
  ctx.fillRect(px, py, cs, cs);
  renderShrubs(ctx, px, py, cs, x, y, seed + 100);
}

function renderTrees(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  cs: number,
  x: number,
  y: number,
  seed: number,
  tile: { canopyHeight: number; canopyDensity: number; dominantSpecies: string | null },
  patchType: string | undefined,
  minCrowns: number,
  maxCrowns: number,
) {
  // Dense canopy fill
  if (tile.canopyDensity > 0.3) {
    const baseGreen = getTreeBaseColor(tile.dominantSpecies, patchType);
    ctx.fillStyle = `rgba(${baseGreen},${tile.canopyDensity * 0.4})`;
    ctx.fillRect(px, py, cs, cs);
  }

  // Individual tree crowns
  ctx.save();
  const crownCount =
    minCrowns + Math.floor(deterministicNoise(x, y, seed + 40) * (maxCrowns - minCrowns + 1));
  const crownR = cs * lerp(0.15, 0.3, tile.canopyHeight / 60);

  for (let i = 0; i < crownCount; i++) {
    const dx = deterministicNoise(x * 3 + i, y * 7, seed + 41) * cs * 0.8 + cs * 0.1;
    const dy = deterministicNoise(x * 11 + i, y * 3, seed + 42) * cs * 0.8 + cs * 0.1;

    const species = tile.dominantSpecies;
    const color = getCrownColor(species, patchType, x, y, i, seed);

    ctx.fillStyle = color;
    if (species === 'pine' || species === 'spruce' || species === 'fir') {
      // Conifer: triangular shape
      drawTriangleCrown(ctx, px + dx, py + dy, crownR);
    } else {
      // Deciduous: circular crown
      ctx.beginPath();
      ctx.arc(px + dx, py + dy, crownR, 0, Math.PI * 2);
      ctx.fill();
    }

    // Crown shadow
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    ctx.beginPath();
    ctx.arc(px + dx + crownR * 0.2, py + dy + crownR * 0.2, crownR * 0.8, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawTriangleCrown(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.lineTo(cx - r * 0.8, cy + r * 0.7);
  ctx.lineTo(cx + r * 0.8, cy + r * 0.7);
  ctx.closePath();
  ctx.fill();
}

function getTreeBaseColor(species: string | null, patchType: string | undefined): string {
  if (patchType === 'coniferous') return '40,80,30';
  if (patchType === 'deciduous') return '70,120,40';
  if (species === 'pine' || species === 'spruce') return '40,80,30';
  if (species === 'oak') return '80,120,45';
  if (species === 'willow') return '90,140,60';
  return '60,110,40';
}

function getCrownColor(
  species: string | null,
  patchType: string | undefined,
  x: number,
  y: number,
  i: number,
  seed: number,
): string {
  const variation = deterministicNoise(x + i * 13, y + i * 7, seed + 45) * 20 - 10;

  if (species === 'pine' || species === 'spruce' || species === 'fir') {
    const g = Math.round(90 + variation);
    return rgbToStr(30, g, 30, 0.85);
  }
  if (species === 'oak') {
    const g = Math.round(130 + variation);
    return rgbToStr(70, g, 35, 0.8);
  }
  if (species === 'willow') {
    const g = Math.round(155 + variation);
    return rgbToStr(85, g, 55, 0.75);
  }

  // Default based on patch type
  if (patchType === 'coniferous') {
    return rgbToStr(35, Math.round(85 + variation), 30, 0.85);
  }

  const g = Math.round(120 + variation);
  return rgbToStr(55, g, 35, 0.8);
}
