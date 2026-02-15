import type { LayerRenderer } from './types';

/**
 * Relief/Topography layer: hillshading using slope and aspect data.
 *
 * Classic GIS illumination model with NW light source at 45 altitude.
 * Ridge/valley highlighting for terrain readability.
 */
export const renderReliefLayer: LayerRenderer = (ctx, map, rc) => {
  const topoTiles = map.layers?.topography?.tiles;
  if (!topoTiles) return;

  const { minElevation = 0, maxElevation = 100 } = map.layers?.topography ?? {};
  const elevRange = maxElevation - minElevation || 1;

  // Light source: azimuth 315 (NW), altitude 45
  const azimuth = (315 * Math.PI) / 180;
  const zenith = (45 * Math.PI) / 180;
  const cosZenith = Math.cos(zenith);
  const sinZenith = Math.sin(zenith);

  for (let y = 0; y < rc.height; y++) {
    for (let x = 0; x < rc.width; x++) {
      const tile = topoTiles[y]?.[x];
      if (!tile) continue;

      const px = x * rc.cellSize;
      const py = y * rc.cellSize;
      const slopeRad = (tile.slope * Math.PI) / 180;
      const aspectRad = aspectToRadians(tile.aspect);

      // Hillshade illumination formula
      const illumination =
        cosZenith * Math.cos(slopeRad) +
        sinZenith * Math.sin(slopeRad) * Math.cos(azimuth - aspectRad);

      // Map illumination to overlay
      if (illumination > 0.5) {
        // Lit faces: white overlay
        const intensity = (illumination - 0.5) * 2;
        ctx.fillStyle = `rgba(255,255,255,${intensity * 0.35})`;
        ctx.fillRect(px, py, rc.cellSize, rc.cellSize);
      } else {
        // Shadowed faces: dark overlay
        const intensity = (0.5 - illumination) * 2;
        ctx.fillStyle = `rgba(0,0,0,${intensity * 0.4})`;
        ctx.fillRect(px, py, rc.cellSize, rc.cellSize);
      }

      // Ridge highlight
      if (tile.isRidge && rc.cellSize >= 6) {
        ctx.fillStyle = 'rgba(255,255,240,0.15)';
        ctx.fillRect(px, py, rc.cellSize, rc.cellSize);
      }

      // Valley shadow
      if (tile.isValley && rc.cellSize >= 6) {
        ctx.fillStyle = 'rgba(60,70,90,0.15)';
        ctx.fillRect(px, py, rc.cellSize, rc.cellSize);
      }

      // Elevation-based subtle tinting: higher = slightly blue, lower = slightly warm
      const normElev = (tile.elevation - minElevation) / elevRange;
      if (normElev > 0.7) {
        ctx.fillStyle = `rgba(180,200,230,${(normElev - 0.7) * 0.15})`;
        ctx.fillRect(px, py, rc.cellSize, rc.cellSize);
      }
    }
  }
};

function aspectToRadians(aspect: string): number {
  switch (aspect) {
    case 'north':
      return 0;
    case 'northeast':
      return Math.PI / 4;
    case 'east':
      return Math.PI / 2;
    case 'southeast':
      return (3 * Math.PI) / 4;
    case 'south':
      return Math.PI;
    case 'southwest':
      return (5 * Math.PI) / 4;
    case 'west':
      return (3 * Math.PI) / 2;
    case 'northwest':
      return (7 * Math.PI) / 4;
    default:
      return 0; // flat
  }
}
