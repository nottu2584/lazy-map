import type { LayerRenderer } from './types';
import { rgbToStr } from './colorUtils';

/**
 * Structures layer: buildings, roads, bridges.
 *
 * Material-based coloring. Condition affects rendering style.
 */
export const renderStructuresLayer: LayerRenderer = (ctx, map, rc) => {
  const structTiles = map.layers?.structures?.tiles;
  if (!structTiles) return;

  const roads = map.layers?.structures?.roads;

  // 1. Draw roads first (below buildings)
  if (roads?.segments) {
    ctx.save();
    for (const segment of roads.segments) {
      if (segment.points.length < 2) continue;

      const baseWidth = Math.max(2, segment.width * rc.cellSize * 0.6);
      ctx.strokeStyle = roadColor(segment.material);
      ctx.lineWidth = baseWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      const p0 = tileCenter(segment.points[0], rc.cellSize);
      ctx.moveTo(p0.x, p0.y);

      for (let i = 1; i < segment.points.length; i++) {
        const p = tileCenter(segment.points[i], rc.cellSize);
        ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();

      // Stone road edge detail
      if (segment.material === 'stone' && rc.cellSize >= 8) {
        ctx.strokeStyle = 'rgba(100,100,100,0.3)';
        ctx.lineWidth = baseWidth + 2;
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // 2. Draw path tiles
  for (let y = 0; y < rc.height; y++) {
    for (let x = 0; x < rc.width; x++) {
      const tile = structTiles[y]?.[x];
      if (!tile) continue;

      const px = x * rc.cellSize;
      const py = y * rc.cellSize;

      // Paths (not covered by road segments)
      if (tile.isPath && !tile.isRoad) {
        ctx.fillStyle = 'rgba(160,140,110,0.3)';
        ctx.fillRect(px, py, rc.cellSize, rc.cellSize);
      }
    }
  }

  // 3. Draw buildings
  for (let y = 0; y < rc.height; y++) {
    for (let x = 0; x < rc.width; x++) {
      const tile = structTiles[y]?.[x];
      if (!tile?.hasStructure || tile.isRoad) continue;

      const px = x * rc.cellSize;
      const py = y * rc.cellSize;
      const cs = rc.cellSize;

      renderBuilding(ctx, px, py, cs, tile);
    }
  }
};

function renderBuilding(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  cs: number,
  tile: {
    structureType: string | null;
    material: string | null;
    condition: string;
    height: number;
  },
) {
  const inset = cs * 0.1;
  const bx = px + inset;
  const by = py + inset;
  const bw = cs - inset * 2;
  const bh = cs - inset * 2;

  const [r, g, b] = materialColor(tile.material);
  const isRuined = tile.condition === 'ruined' || tile.condition === 'poor';

  // Fill
  ctx.fillStyle = rgbToStr(r, g, b, isRuined ? 0.5 : 0.85);
  if (isRuined) {
    // Partial fill for ruined buildings
    ctx.fillRect(bx, by, bw * 0.7, bh);
    ctx.fillRect(bx, by, bw, bh * 0.6);
  } else {
    ctx.fillRect(bx, by, bw, bh);
  }

  // Border
  ctx.strokeStyle = rgbToStr(
    Math.max(0, r - 40),
    Math.max(0, g - 40),
    Math.max(0, b - 40),
    0.8,
  );
  ctx.lineWidth = 1;
  ctx.strokeRect(bx, by, bw, bh);

  // Special structure indicators
  if (cs >= 10) {
    renderStructureDetail(ctx, px, py, cs, tile.structureType);
  }
}

function renderStructureDetail(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  cs: number,
  type: string | null,
) {
  const cx = px + cs / 2;
  const cy = py + cs / 2;

  ctx.save();
  switch (type) {
    case 'well':
      // Circle
      ctx.strokeStyle = 'rgba(80,130,180,0.7)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, cs * 0.25, 0, Math.PI * 2);
      ctx.stroke();
      break;

    case 'shrine':
      // Small star/diamond
      ctx.fillStyle = 'rgba(200,180,100,0.7)';
      ctx.beginPath();
      ctx.moveTo(cx, cy - cs * 0.2);
      ctx.lineTo(cx + cs * 0.15, cy);
      ctx.lineTo(cx, cy + cs * 0.2);
      ctx.lineTo(cx - cs * 0.15, cy);
      ctx.closePath();
      ctx.fill();
      break;

    case 'tower':
      // Darker fill overlay
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.fillRect(px + cs * 0.15, py + cs * 0.15, cs * 0.7, cs * 0.7);
      break;
  }
  ctx.restore();
}

function materialColor(material: string | null): [number, number, number] {
  switch (material) {
    case 'wood':
      return [139, 105, 20];
    case 'stone':
      return [122, 122, 122];
    case 'brick':
      return [160, 82, 45];
    default:
      return [130, 120, 100];
  }
}

function roadColor(material: string): string {
  switch (material) {
    case 'stone':
      return 'rgba(140,140,140,0.7)';
    case 'dirt':
      return 'rgba(150,130,100,0.6)';
    default:
      return 'rgba(140,130,110,0.6)';
  }
}

function tileCenter(p: { x: number; y: number }, cellSize: number) {
  return { x: p.x * cellSize + cellSize / 2, y: p.y * cellSize + cellSize / 2 };
}
