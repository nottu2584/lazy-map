import { Dimensions, Position, SpatialBounds } from '../../../common/value-objects';
import {
  MapFeature,
  FeatureCategory,
  ReliefFeatureType,
  NaturalFeatureType,
  ArtificialFeatureType,
  CulturalFeatureType,
} from './types';

// Feature creation utility
export function createFeature(
  name: string,
  category: FeatureCategory,
  type: ReliefFeatureType | NaturalFeatureType | ArtificialFeatureType | CulturalFeatureType,
  area: SpatialBounds,
  priority: number = 1,
  properties: Record<string, any> = {},
): MapFeature {
  return {
    id: generateFeatureId(),
    name,
    category,
    type,
    area,
    priority,
    properties,
  };
}

// Generate unique feature ID
export function generateFeatureId(): string {
  return `feat_${Math.random().toString(36).substr(2, 9)}`;
}

// Check if feature area intersects with map bounds
export function isFeatureInBounds(feature: MapFeature, mapDimensions: Dimensions): boolean {
  const { x, y, width, height } = feature.area;

  // Feature is in bounds if any part of it overlaps with map
  return !(
    x >= mapDimensions.width || // Feature starts beyond right edge
    y >= mapDimensions.height || // Feature starts beyond bottom edge
    x + width <= 0 || // Feature ends before left edge
    y + height <= 0 // Feature ends before top edge
  );
}

// Get the portion of a feature that intersects with map bounds
export function getFeatureMapIntersection(
  feature: MapFeature,
  mapDimensions: Dimensions,
): SpatialBounds | null {
  const { x, y, width, height } = feature.area;

  // Calculate intersection bounds
  const left = Math.max(0, x);
  const top = Math.max(0, y);
  const right = Math.min(mapDimensions.width, x + width);
  const bottom = Math.min(mapDimensions.height, y + height);

  // Check if there's any intersection
  if (left >= right || top >= bottom) {
    return null;
  }

  return new SpatialBounds(
    new Position(left, top),
    new Dimensions(right - left, bottom - top)
  );
}

// Check if two feature areas overlap
export function doFeaturesOverlap(area1: SpatialBounds, area2: SpatialBounds): boolean {
  return !(
    area1.x >= area2.x + area2.width ||
    area2.x >= area1.x + area1.width ||
    area1.y >= area2.y + area2.height ||
    area2.y >= area1.y + area1.height
  );
}

// Generate random feature area within extended bounds
export function generateRandomSpatialBounds(
  mapDimensions: Dimensions,
  outOfBoundsExtension: number,
  minSize: number,
  maxSize: number,
): SpatialBounds {
  // Random size within bounds
  const width = Math.floor(Math.random() * (maxSize - minSize + 1)) + minSize;
  const height = Math.floor(Math.random() * (maxSize - minSize + 1)) + minSize;

  if (outOfBoundsExtension === 0) {
    // If out-of-bounds is disabled, generate fully within map
    const x = Math.floor(Math.random() * Math.max(1, mapDimensions.width - width + 1));
    const y = Math.floor(Math.random() * Math.max(1, mapDimensions.height - height + 1));
    return new SpatialBounds(new Position(x, y), new Dimensions(width, height));
  }

  // For out-of-bounds features, ensure they're always partially visible
  // Calculate the valid range where feature origin can be placed while guaranteeing intersection
  const minX = -outOfBoundsExtension;
  const maxX = mapDimensions.width + outOfBoundsExtension - 1; // -1 to ensure at least 1 tile visible
  const minY = -outOfBoundsExtension;
  const maxY = mapDimensions.height + outOfBoundsExtension - 1;

  // Further constrain to ensure feature actually intersects with map bounds
  const constrainedMinX = Math.max(minX, -width + 1); // Feature must extend at least 1 tile into map
  const constrainedMaxX = Math.min(maxX, mapDimensions.width - 1); // Feature must start before map ends
  const constrainedMinY = Math.max(minY, -height + 1);
  const constrainedMaxY = Math.min(maxY, mapDimensions.height - 1);

  // Generate position that guarantees partial visibility
  const x = Math.floor(Math.random() * (constrainedMaxX - constrainedMinX + 1)) + constrainedMinX;
  const y = Math.floor(Math.random() * (constrainedMaxY - constrainedMinY + 1)) + constrainedMinY;

  return new SpatialBounds(new Position(x, y), new Dimensions(width, height));
}

// Sort features by priority (higher priority first)
export function sortFeaturesByPriority(features: MapFeature[]): MapFeature[] {
  return [...features].sort((a, b) => b.priority - a.priority);
}
