import type { LayerRenderer } from './types';
import { deterministicNoise, hslToRgb, lerp, rgbToStr } from './colorUtils';

/**
 * Hydrology layer: water depth, streams, springs, pools, moisture gradient.
 */
export const renderHydrologyLayer: LayerRenderer = (ctx, map, rc) => {
  const hydroTiles = map.layers?.hydrology?.tiles;
  if (!hydroTiles) return;

  const streams = map.layers?.hydrology?.streams ?? [];
  const seed = typeof map.seed === 'number' ? map.seed : 42;

  // 1. Moisture gradient (subtle background tinting)
  for (let y = 0; y < rc.height; y++) {
    for (let x = 0; x < rc.width; x++) {
      const tile = hydroTiles[y]?.[x];
      if (!tile) continue;

      const px = x * rc.cellSize;
      const py = y * rc.cellSize;

      // Moisture tint (no standing water)
      if (tile.waterDepth <= 0) {
        const tint = moistureTint(tile.moisture);
        if (tint > 0) {
          ctx.fillStyle = `rgba(100,140,200,${tint})`;
          ctx.fillRect(px, py, rc.cellSize, rc.cellSize);
        }
        continue;
      }

      // 2. Standing/flowing water: depth-based blue
      const depthNorm = Math.min(tile.waterDepth / 3, 1);
      const lightness = lerp(70, 30, depthNorm);
      const [r, g, b] = hslToRgb(210, 0.6, lightness / 100);

      ctx.fillStyle = rgbToStr(r, g, b, 0.85);
      ctx.fillRect(px, py, rc.cellSize, rc.cellSize);

      // Water surface shimmer
      if (rc.cellSize >= 8) {
        const shimmer = deterministicNoise(x, y, seed + 50) * 0.15;
        ctx.fillStyle = `rgba(200,230,255,${shimmer})`;
        ctx.fillRect(px, py, rc.cellSize, rc.cellSize);
      }
    }
  }

  // 3. Draw streams as smooth polylines
  ctx.save();
  for (const stream of streams) {
    if (stream.points.length < 2) continue;

    const baseWidth = Math.max(1, stream.order * 0.8) * (rc.cellSize / 12);
    const depthColor = streamColor(stream.order);

    ctx.strokeStyle = depthColor;
    ctx.lineWidth = baseWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    const p0 = tileCenter(stream.points[0], rc.cellSize);
    ctx.moveTo(p0.x, p0.y);

    // Smooth curve through midpoints
    for (let i = 1; i < stream.points.length; i++) {
      const prev = tileCenter(stream.points[i - 1], rc.cellSize);
      const curr = tileCenter(stream.points[i], rc.cellSize);
      const mx = (prev.x + curr.x) / 2;
      const my = (prev.y + curr.y) / 2;
      ctx.quadraticCurveTo(prev.x, prev.y, mx, my);
    }

    // Final segment to last point
    const last = tileCenter(stream.points[stream.points.length - 1], rc.cellSize);
    ctx.lineTo(last.x, last.y);
    ctx.stroke();
  }
  ctx.restore();

  // 4. Springs: small circle with radiating lines
  if (rc.cellSize >= 6) {
    ctx.save();
    for (let y = 0; y < rc.height; y++) {
      for (let x = 0; x < rc.width; x++) {
        const tile = hydroTiles[y]?.[x];
        if (!tile?.isSpring) continue;

        const cx = x * rc.cellSize + rc.cellSize / 2;
        const cy = y * rc.cellSize + rc.cellSize / 2;
        const r = rc.cellSize * 0.25;

        // Center dot
        ctx.fillStyle = 'rgba(80,160,255,0.9)';
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();

        // Radiating lines
        ctx.strokeStyle = 'rgba(80,160,255,0.5)';
        ctx.lineWidth = 0.8;
        for (let a = 0; a < 6; a++) {
          const angle = (a * Math.PI) / 3;
          ctx.beginPath();
          ctx.moveTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
          ctx.lineTo(cx + Math.cos(angle) * r * 2.2, cy + Math.sin(angle) * r * 2.2);
          ctx.stroke();
        }
      }
    }
    ctx.restore();
  }

  // 5. Pools: rounded lighter fill
  ctx.save();
  for (let y = 0; y < rc.height; y++) {
    for (let x = 0; x < rc.width; x++) {
      const tile = hydroTiles[y]?.[x];
      if (!tile?.isPool) continue;

      const cx = x * rc.cellSize + rc.cellSize / 2;
      const cy = y * rc.cellSize + rc.cellSize / 2;
      const r = rc.cellSize * 0.4;

      ctx.fillStyle = 'rgba(120,180,240,0.7)';
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
};

function tileCenter(p: { x: number; y: number }, cellSize: number) {
  return { x: p.x * cellSize + cellSize / 2, y: p.y * cellSize + cellSize / 2 };
}

function moistureTint(moisture: string): number {
  switch (moisture) {
    case 'saturated':
      return 0.12;
    case 'wet':
      return 0.08;
    case 'moist':
      return 0.04;
    default:
      return 0;
  }
}

function streamColor(order: number): string {
  if (order <= 1) return 'rgba(130,185,240,0.8)';
  if (order <= 2) return 'rgba(80,150,220,0.85)';
  if (order <= 3) return 'rgba(50,120,200,0.9)';
  return 'rgba(30,100,180,0.95)';
}
