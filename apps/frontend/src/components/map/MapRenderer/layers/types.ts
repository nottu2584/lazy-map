import type { GeneratedMap } from '@/types';

export interface RenderContext {
  width: number;
  height: number;
  cellSize: number;
  canvasWidth: number;
  canvasHeight: number;
}

export type LayerRenderer = (
  ctx: CanvasRenderingContext2D,
  map: GeneratedMap,
  rc: RenderContext,
) => void;
