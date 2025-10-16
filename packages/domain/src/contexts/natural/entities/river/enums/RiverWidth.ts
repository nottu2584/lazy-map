/**
 * River width categories
 * Defines different sizes of river features for gameplay and visualization
 */
export enum RiverWidth {
  STREAM = 'stream', // < 10 feet, easily crossable
  CREEK = 'creek', // 10-25 feet
  RIVER = 'river', // 25-100 feet
  WIDE_RIVER = 'wide_river', // 100-500 feet
  MAJOR_RIVER = 'major_river', // > 500 feet
}

/**
 * Utility function to get width category from numeric width
 */
export function getWidthCategory(width: number): RiverWidth {
  if (width < 10) return RiverWidth.STREAM;
  if (width < 25) return RiverWidth.CREEK;
  if (width < 100) return RiverWidth.RIVER;
  if (width < 500) return RiverWidth.WIDE_RIVER;
  return RiverWidth.MAJOR_RIVER;
}

/**
 * Check if a river width is crossable without special equipment
 */
export function isCrossableWidth(category: RiverWidth): boolean {
  return category === RiverWidth.STREAM || category === RiverWidth.CREEK;
}