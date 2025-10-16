/**
 * Lake size categories
 * Defines different sizes of standing water bodies
 */
export enum LakeSize {
  POND = 'pond', // < 0.5 acres
  SMALL_LAKE = 'small_lake', // 0.5-5 acres
  MEDIUM_LAKE = 'medium_lake', // 5-50 acres
  LARGE_LAKE = 'large_lake', // 50-500 acres
  GREAT_LAKE = 'great_lake', // > 500 acres
}

/**
 * Get lake size category from area in acres
 */
export function getSizeCategory(acres: number): LakeSize {
  if (acres < 0.5) return LakeSize.POND;
  if (acres < 5) return LakeSize.SMALL_LAKE;
  if (acres < 50) return LakeSize.MEDIUM_LAKE;
  if (acres < 500) return LakeSize.LARGE_LAKE;
  return LakeSize.GREAT_LAKE;
}

/**
 * Check if a lake size is navigable by boats
 */
export function isNavigableSize(size: LakeSize): boolean {
  return size !== LakeSize.POND;
}

/**
 * Get typical depth range for lake size
 */
export function getTypicalDepthRange(size: LakeSize): { min: number; max: number } {
  switch (size) {
    case LakeSize.POND:
      return { min: 1, max: 5 };
    case LakeSize.SMALL_LAKE:
      return { min: 3, max: 15 };
    case LakeSize.MEDIUM_LAKE:
      return { min: 5, max: 30 };
    case LakeSize.LARGE_LAKE:
      return { min: 10, max: 60 };
    case LakeSize.GREAT_LAKE:
      return { min: 20, max: 200 };
  }
}