/**
 * River segment types for pathfinding and generation
 * Defines different structural parts of a river system
 */
export enum RiverSegmentType {
  SOURCE = 'source', // Beginning of river (spring, lake outlet)
  STRAIGHT = 'straight', // Straight flowing section
  CURVE = 'curve', // Curved section
  MEANDER = 'meander', // S-shaped meandering section
  RAPIDS = 'rapids', // Fast-flowing, rocky section
  CONFLUENCE = 'confluence', // Where two rivers meet
  DELTA = 'delta', // River mouth spreading into multiple channels
  MOUTH = 'mouth', // River ending (lake, ocean)
}

/**
 * Check if segment type represents a river endpoint
 */
export function isRiverEndpoint(type: RiverSegmentType): boolean {
  return type === RiverSegmentType.SOURCE ||
         type === RiverSegmentType.MOUTH ||
         type === RiverSegmentType.DELTA;
}

/**
 * Check if segment type represents navigable water
 */
export function isNavigableSegment(type: RiverSegmentType): boolean {
  return type !== RiverSegmentType.RAPIDS;
}