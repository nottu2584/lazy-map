import { Dimensions, SpatialBounds, Position } from '../../common/value-objects';
import { MapFeature } from '../../common/entities';

// Get the portion of a feature that intersects with map bounds
function getFeatureMapIntersection(
  feature: MapFeature,
  mapDimensions: Dimensions
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

// Test utility to verify feature visibility requirements
export function validateFeatureVisibility(
  features: MapFeature[],
  mapDimensions: Dimensions,
): {
  allVisible: boolean;
  partiallyOutOfBoundsCount: number;
  fullyInBoundsCount: number;
  invalidFeatures: MapFeature[];
} {
  let partiallyOutOfBoundsCount = 0;
  let fullyInBoundsCount = 0;
  const invalidFeatures: MapFeature[] = [];

  for (const feature of features) {
    const intersection = getFeatureMapIntersection(feature, mapDimensions);

    // Check if feature is visible (has intersection)
    if (!intersection || intersection.width <= 0 || intersection.height <= 0) {
      invalidFeatures.push(feature);
      continue;
    }

    // Check if feature extends beyond map bounds
    const isOutOfBounds =
      feature.area.x < 0 ||
      feature.area.y < 0 ||
      feature.area.x + feature.area.width > mapDimensions.width ||
      feature.area.y + feature.area.height > mapDimensions.height;

    if (isOutOfBounds) {
      partiallyOutOfBoundsCount++;
    } else {
      fullyInBoundsCount++;
    }
  }

  return {
    allVisible: invalidFeatures.length === 0,
    partiallyOutOfBoundsCount,
    fullyInBoundsCount,
    invalidFeatures,
  };
}

// Generate example feature scenarios for testing
export function createTestFeatureScenarios() {
  return {
    // Mountain that extends beyond north and west edges
    partialMountain: {
      area: { x: -3, y: -2, width: 6, height: 5 },
      shouldBeVisible: true,
      description: 'Mountain with slopes visible, peak out of bounds',
    },

    // River that flows across the map
    crossingRiver: {
      area: { x: -1, y: 2, width: 8, height: 2 },
      shouldBeVisible: true,
      description: 'River flowing from west off-map through visible area',
    },

    // Completely out of bounds (should not be generated)
    invisibleFeature: {
      area: { x: 10, y: 10, width: 3, height: 3 },
      shouldBeVisible: false,
      description: 'Feature completely outside map bounds',
    },
  };
}
