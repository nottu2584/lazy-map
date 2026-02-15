import type { LayerRenderer } from './types';

/**
 * Features/Tactical layer: canvas-drawn icons for hazards, resources,
 * landmarks, and tactical elements. Replaces emoji symbols.
 *
 * Visibility-based opacity: obvious=100%, noticeable=80%, hidden=50%,
 * concealed/secret=30%.
 */
export const renderFeaturesLayer: LayerRenderer = (ctx, map, rc) => {
  const featTiles = map.layers?.features?.tiles;
  if (!featTiles) return;

  ctx.save();
  for (let y = 0; y < rc.height; y++) {
    for (let x = 0; x < rc.width; x++) {
      const tile = featTiles[y]?.[x];
      if (!tile?.hasFeature || !tile.featureType) continue;

      const cx = x * rc.cellSize + rc.cellSize / 2;
      const cy = y * rc.cellSize + rc.cellSize / 2;
      const r = rc.cellSize * 0.3;

      ctx.globalAlpha = visibilityAlpha(tile.visibility);
      renderFeatureIcon(ctx, cx, cy, r, tile.featureType, tile.hazardLevel);
    }
  }
  ctx.globalAlpha = 1;
  ctx.restore();
};

function visibilityAlpha(visibility: string): number {
  switch (visibility) {
    case 'obvious':
      return 1;
    case 'noticeable':
      return 0.8;
    case 'hidden':
      return 0.5;
    case 'concealed':
    case 'secret':
      return 0.3;
    default:
      return 0.8;
  }
}

function renderFeatureIcon(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  type: string,
  hazardLevel: string,
) {
  const category = getCategory(type);

  switch (category) {
    case 'hazard':
      drawHazard(ctx, cx, cy, r, hazardLevel);
      break;
    case 'resource':
      drawResource(ctx, cx, cy, r, type);
      break;
    case 'landmark':
      drawLandmark(ctx, cx, cy, r, type);
      break;
    case 'tactical':
      drawTactical(ctx, cx, cy, r, type);
      break;
  }
}

function getCategory(type: string): 'hazard' | 'resource' | 'landmark' | 'tactical' {
  if (
    ['quicksand', 'unstable_ground', 'poison_plants', 'insect_nest', 'animal_den'].includes(type)
  ) {
    return 'hazard';
  }
  if (
    ['medicinal_herbs', 'berries', 'mushrooms', 'fresh_water', 'mineral_deposit'].includes(type)
  ) {
    return 'resource';
  }
  if (
    [
      'ancient_tree',
      'standing_stones',
      'battlefield_remains',
      'campsite',
      'cave_entrance',
    ].includes(type)
  ) {
    return 'landmark';
  }
  return 'tactical';
}

// ─── Hazards: Warning shapes in yellow/red ──────────────────

function drawHazard(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  level: string,
) {
  const color = level === 'severe' || level === 'deadly' ? '#D32F2F' : '#F9A825';

  // Warning triangle
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.lineTo(cx - r * 0.9, cy + r * 0.7);
  ctx.lineTo(cx + r * 0.9, cy + r * 0.7);
  ctx.closePath();
  ctx.fill();

  // Exclamation mark
  ctx.fillStyle = '#fff';
  ctx.fillRect(cx - r * 0.08, cy - r * 0.3, r * 0.16, r * 0.5);
  ctx.beginPath();
  ctx.arc(cx, cy + r * 0.4, r * 0.1, 0, Math.PI * 2);
  ctx.fill();
}

// ─── Resources: Colored dots/droplets ───────────────────────

function drawResource(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  type: string,
) {
  let color: string;
  switch (type) {
    case 'fresh_water':
      color = '#42A5F5';
      break;
    case 'medicinal_herbs':
      color = '#66BB6A';
      break;
    case 'berries':
      color = '#AB47BC';
      break;
    case 'mushrooms':
      color = '#8D6E63';
      break;
    case 'mineral_deposit':
      color = '#78909C';
      break;
    default:
      color = '#4CAF50';
  }

  // Filled circle with border
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.7, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 1;
  ctx.stroke();
}

// ─── Landmarks: Silhouette shapes ───────────────────────────

function drawLandmark(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  type: string,
) {
  ctx.save();
  ctx.fillStyle = '#5D4037';
  ctx.strokeStyle = '#3E2723';
  ctx.lineWidth = 1;

  switch (type) {
    case 'ancient_tree':
      // Large tree silhouette
      ctx.fillStyle = '#2E7D32';
      ctx.beginPath();
      ctx.arc(cx, cy - r * 0.3, r * 0.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#4E342E';
      ctx.fillRect(cx - r * 0.1, cy, r * 0.2, r * 0.6);
      break;

    case 'standing_stones':
      // Vertical rectangle
      ctx.fillStyle = '#78909C';
      ctx.fillRect(cx - r * 0.15, cy - r * 0.7, r * 0.3, r * 1.2);
      ctx.fillRect(cx + r * 0.25, cy - r * 0.5, r * 0.2, r);
      break;

    case 'cave_entrance':
      // Dark arch
      ctx.fillStyle = '#212121';
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.7, Math.PI, 0);
      ctx.lineTo(cx + r * 0.7, cy + r * 0.3);
      ctx.lineTo(cx - r * 0.7, cy + r * 0.3);
      ctx.closePath();
      ctx.fill();
      break;

    case 'campsite':
      // Triangle tent
      ctx.fillStyle = '#795548';
      ctx.beginPath();
      ctx.moveTo(cx, cy - r * 0.6);
      ctx.lineTo(cx - r * 0.6, cy + r * 0.4);
      ctx.lineTo(cx + r * 0.6, cy + r * 0.4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;

    case 'battlefield_remains':
      // Crossed lines
      ctx.strokeStyle = '#5D4037';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx - r * 0.5, cy - r * 0.5);
      ctx.lineTo(cx + r * 0.5, cy + r * 0.5);
      ctx.moveTo(cx + r * 0.5, cy - r * 0.5);
      ctx.lineTo(cx - r * 0.5, cy + r * 0.5);
      ctx.stroke();
      break;

    default:
      // Generic marker
      ctx.fillStyle = '#795548';
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.5, 0, Math.PI * 2);
      ctx.fill();
  }

  ctx.restore();
}

// ─── Tactical: Directional arrows/eye icons ─────────────────

function drawTactical(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  type: string,
) {
  ctx.save();

  switch (type) {
    case 'high_ground':
      // Upward arrow
      ctx.fillStyle = 'rgba(33,150,243,0.7)';
      ctx.beginPath();
      ctx.moveTo(cx, cy - r * 0.7);
      ctx.lineTo(cx + r * 0.5, cy + r * 0.1);
      ctx.lineTo(cx + r * 0.2, cy + r * 0.1);
      ctx.lineTo(cx + r * 0.2, cy + r * 0.6);
      ctx.lineTo(cx - r * 0.2, cy + r * 0.6);
      ctx.lineTo(cx - r * 0.2, cy + r * 0.1);
      ctx.lineTo(cx - r * 0.5, cy + r * 0.1);
      ctx.closePath();
      ctx.fill();
      break;

    case 'choke_point':
      // Hourglass shape
      ctx.fillStyle = 'rgba(255,152,0,0.7)';
      ctx.beginPath();
      ctx.moveTo(cx - r * 0.5, cy - r * 0.6);
      ctx.lineTo(cx + r * 0.5, cy - r * 0.6);
      ctx.lineTo(cx + r * 0.1, cy);
      ctx.lineTo(cx + r * 0.5, cy + r * 0.6);
      ctx.lineTo(cx - r * 0.5, cy + r * 0.6);
      ctx.lineTo(cx - r * 0.1, cy);
      ctx.closePath();
      ctx.fill();
      break;

    case 'ambush_site':
      // Eye shape
      ctx.strokeStyle = 'rgba(244,67,54,0.8)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx - r * 0.7, cy);
      ctx.quadraticCurveTo(cx, cy - r * 0.6, cx + r * 0.7, cy);
      ctx.quadraticCurveTo(cx, cy + r * 0.6, cx - r * 0.7, cy);
      ctx.stroke();
      // Pupil
      ctx.fillStyle = 'rgba(244,67,54,0.8)';
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.15, 0, Math.PI * 2);
      ctx.fill();
      break;

    case 'vantage_point':
      // Target crosshair
      ctx.strokeStyle = 'rgba(33,150,243,0.7)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - r * 0.7, cy);
      ctx.lineTo(cx + r * 0.7, cy);
      ctx.moveTo(cx, cy - r * 0.7);
      ctx.lineTo(cx, cy + r * 0.7);
      ctx.stroke();
      break;

    case 'escape_route':
      // Arrow pointing right
      ctx.fillStyle = 'rgba(76,175,80,0.7)';
      ctx.beginPath();
      ctx.moveTo(cx + r * 0.7, cy);
      ctx.lineTo(cx, cy - r * 0.4);
      ctx.lineTo(cx, cy - r * 0.15);
      ctx.lineTo(cx - r * 0.5, cy - r * 0.15);
      ctx.lineTo(cx - r * 0.5, cy + r * 0.15);
      ctx.lineTo(cx, cy + r * 0.15);
      ctx.lineTo(cx, cy + r * 0.4);
      ctx.closePath();
      ctx.fill();
      break;

    default:
      // Generic diamond
      ctx.fillStyle = 'rgba(158,158,158,0.6)';
      ctx.beginPath();
      ctx.moveTo(cx, cy - r * 0.5);
      ctx.lineTo(cx + r * 0.5, cy);
      ctx.lineTo(cx, cy + r * 0.5);
      ctx.lineTo(cx - r * 0.5, cy);
      ctx.closePath();
      ctx.fill();
  }

  ctx.restore();
}
