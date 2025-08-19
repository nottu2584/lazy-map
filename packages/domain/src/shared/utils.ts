import { Dimensions } from './types';

// Core utility functions
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

export function validateMapDimensions(dimensions: Dimensions): boolean {
  return (
    dimensions.width > 0 &&
    dimensions.height > 0 &&
    dimensions.width <= 200 &&
    dimensions.height <= 200
  );
}

// Mathematical utilities
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// Simple noise function for procedural generation
export function simpleNoise(x: number, y: number, seed = 0): number {
  const n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453;
  return n - Math.floor(n);
}
