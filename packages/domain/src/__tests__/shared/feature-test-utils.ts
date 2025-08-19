import { Dimensions } from '../../common/value-objects';
import { MapFeature, getFeatureMapIntersection } from '../../contexts/natural/shared';

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
