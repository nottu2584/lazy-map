import { Dimensions } from './types';

// Grid cell size options
export const CELL_SIZE_OPTIONS = [16, 24, 32, 48, 64, 96, 128];

// Map dimension presets
export const MAP_SIZE_PRESETS = {
  small: { width: 10, height: 10 },
  medium: { width: 20, height: 20 },
  large: { width: 40, height: 40 },
  huge: { width: 80, height: 80 },
  custom: { width: 0, height: 0 },
} as const;

// Export format configurations
export const EXPORT_CONFIG = {
  maxImageSize: 4096,
  defaultScale: 1,
  supportedFormats: ['json', 'png', 'svg', 'pdf'] as const,
};
