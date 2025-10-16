/**
 * Lake entity module
 * Exports all lake-related components
 */

// Constants
export { LAKE_FEATURE_TYPE } from './constants';

// Enums
export { LakeFormation } from './enums/LakeFormation';
export { LakeSize, getSizeCategory, isNavigableSize, getTypicalDepthRange } from './enums/LakeSize';
export {
  ShorelineType,
  isSuitableForSwimming,
  isSuitableForBoatLaunch,
  getAccessibilityRating,
  getDefaultShorelineForFormation,
} from './enums/ShorelineType';

// Value Objects
export { ShorelinePoint } from './value-objects/ShorelinePoint';

// Main Entity
export { Lake } from './Lake';