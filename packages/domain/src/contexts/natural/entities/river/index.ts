/**
 * River module exports
 * Aggregates all river-related components following clean architecture
 */

// Constants
export { RIVER_FEATURE_TYPE } from './constants';

// Enums
export { RiverWidth, getWidthCategory, isCrossableWidth } from './enums/RiverWidth';
export { RiverSegmentType, isRiverEndpoint, isNavigableSegment } from './enums/RiverSegmentType';

// Value Objects
export { RiverPoint } from './value-objects/RiverPoint';

// Main Entity
export { River } from './River';