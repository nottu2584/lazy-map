/** Linear interpolation between two values */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

/** Interpolate between two RGB colors */
export function lerpColor(
  c1: [number, number, number],
  c2: [number, number, number],
  t: number,
): [number, number, number] {
  return [lerp(c1[0], c2[0], t), lerp(c1[1], c2[1], t), lerp(c1[2], c2[2], t)];
}

/** Convert HSL (0-360, 0-1, 0-1) to RGB (0-255) */
export function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r = 0,
    g = 0,
    b = 0;
  if (h < 60) {
    r = c;
    g = x;
  } else if (h < 120) {
    r = x;
    g = c;
  } else if (h < 180) {
    g = c;
    b = x;
  } else if (h < 240) {
    g = x;
    b = c;
  } else if (h < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }

  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}

/** Convert RGB to CSS string */
export function rgbToStr(r: number, g: number, b: number, a = 1): string {
  if (a < 1) return `rgba(${r},${g},${b},${a})`;
  return `rgb(${r},${g},${b})`;
}

/** Parse hex color to RGB tuple */
export function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/**
 * Deterministic hash-based noise for visual texture.
 * Returns 0..1 for a given (x, y, seed) triple.
 */
export function deterministicNoise(x: number, y: number, seed: number): number {
  let h = seed ^ 0x5bd1e995;
  h = Math.imul(h ^ (x * 374761393), 0x85ebca6b);
  h = Math.imul(h ^ (y * 668265263), 0xc2b2ae35);
  h ^= h >>> 16;
  return (h >>> 0) / 0xffffffff;
}

/** Rock type -> base color mapping */
export const ROCK_COLORS: Record<string, [number, number, number]> = {
  carbonate: [168, 159, 145], // warm gray
  granitic: [158, 144, 137], // cool gray with pink
  volcanic: [74, 74, 74], // dark charcoal
  clastic: [194, 168, 117], // tan/ochre
  metamorphic: [107, 123, 141], // blue-gray
  evaporite: [232, 220, 200], // pale cream
};

/** Earthy brown for soil blending */
export const SOIL_COLOR: [number, number, number] = [139, 119, 101];

/** Fallback terrain colors matching the old MapCanvas */
export const TERRAIN_COLORS: Record<string, string> = {
  grass: '#7CB342',
  dirt: '#8D6E63',
  stone: '#757575',
  water: '#1976D2',
  marsh: '#4E342E',
  sand: '#FFD54F',
  snow: '#ECEFF1',
  grassland: '#7CB342',
  forest: '#2E7D32',
  mountain: '#5D4037',
  default: '#9E9E9E',
};
