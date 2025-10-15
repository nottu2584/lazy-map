import { Dimensions } from './types';
import { EntityIdGenerationService } from '../common/services';
import { Seed } from '../common/value-objects';

// Deterministic ID generator instance (uses a fixed seed for consistent IDs)
const idService = new EntityIdGenerationService(Seed.fromNumber(12345)); // Fixed seed for utilities

// Core utility functions
export function generateId(): string {
  // Use deterministic ID generator instead of Math.random()
  return idService.generateEntityId('util').value;
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
