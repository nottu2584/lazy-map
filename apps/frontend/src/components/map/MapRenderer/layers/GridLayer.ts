import type { LayerRenderer } from './types';

/**
 * Grid & UI overlay: grid lines with major/minor distinction,
 * coordinate labels on edges.
 */
export const renderGridLayer: LayerRenderer = (ctx, _map, rc) => {
  ctx.save();

  // Minor grid lines (every tile)
  ctx.strokeStyle = 'rgba(100,100,100,0.25)';
  ctx.lineWidth = 0.5;

  for (let x = 0; x <= rc.width; x++) {
    const px = x * rc.cellSize;
    ctx.beginPath();
    ctx.moveTo(px, 0);
    ctx.lineTo(px, rc.canvasHeight);
    ctx.stroke();
  }
  for (let y = 0; y <= rc.height; y++) {
    const py = y * rc.cellSize;
    ctx.beginPath();
    ctx.moveTo(0, py);
    ctx.lineTo(rc.canvasWidth, py);
    ctx.stroke();
  }

  // Major grid lines (every 5 tiles = 25ft)
  ctx.strokeStyle = 'rgba(80,80,80,0.4)';
  ctx.lineWidth = 1;

  for (let x = 0; x <= rc.width; x += 5) {
    const px = x * rc.cellSize;
    ctx.beginPath();
    ctx.moveTo(px, 0);
    ctx.lineTo(px, rc.canvasHeight);
    ctx.stroke();
  }
  for (let y = 0; y <= rc.height; y += 5) {
    const py = y * rc.cellSize;
    ctx.beginPath();
    ctx.moveTo(0, py);
    ctx.lineTo(rc.canvasWidth, py);
    ctx.stroke();
  }

  // Coordinate labels
  if (rc.cellSize >= 10) {
    const fontSize = Math.max(7, Math.min(rc.cellSize * 0.3, 11));
    ctx.font = `${fontSize}px monospace`;
    ctx.fillStyle = 'rgba(60,60,60,0.6)';
    ctx.textBaseline = 'top';
    ctx.textAlign = 'center';

    // Column labels (A-Z, then AA, AB...)
    for (let x = 0; x < rc.width; x += 5) {
      const label = columnLabel(x);
      ctx.fillText(label, x * rc.cellSize + rc.cellSize / 2, 2);
    }

    // Row labels (1-based)
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    for (let y = 0; y < rc.height; y += 5) {
      ctx.fillText(String(y + 1), 2, y * rc.cellSize + rc.cellSize / 2);
    }
  }

  ctx.restore();
};

function columnLabel(index: number): string {
  if (index < 26) return String.fromCharCode(65 + index);
  return String.fromCharCode(65 + Math.floor(index / 26) - 1) + String.fromCharCode(65 + (index % 26));
}
