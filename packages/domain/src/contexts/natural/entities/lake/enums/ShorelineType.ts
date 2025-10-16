/**
 * Shoreline characteristics
 * Defines the type of shore around a lake
 */
export enum ShorelineType {
  SANDY = 'sandy', // Sandy beach
  ROCKY = 'rocky', // Rocky shore
  MARSHY = 'marshy', // Wetland/marsh transition
  WOODED = 'wooded', // Forest to water edge
  GRASSY = 'grassy', // Grassy meadow shore
  MUDDY = 'muddy', // Muddy/clay shore
}

/**
 * Check if shoreline type is suitable for swimming
 */
export function isSuitableForSwimming(type: ShorelineType): boolean {
  return type === ShorelineType.SANDY || type === ShorelineType.GRASSY;
}

/**
 * Check if shoreline type is suitable for boat launch
 */
export function isSuitableForBoatLaunch(type: ShorelineType): boolean {
  return type === ShorelineType.SANDY ||
         type === ShorelineType.ROCKY ||
         type === ShorelineType.GRASSY;
}

/**
 * Get shoreline accessibility rating
 */
export function getAccessibilityRating(type: ShorelineType): number {
  switch (type) {
    case ShorelineType.SANDY:
      return 0.9;
    case ShorelineType.GRASSY:
      return 0.8;
    case ShorelineType.MUDDY:
      return 0.5;
    case ShorelineType.ROCKY:
      return 0.4;
    case ShorelineType.WOODED:
      return 0.3;
    case ShorelineType.MARSHY:
      return 0.2;
  }
}

/**
 * Get shoreline type based on lake formation
 */
export function getDefaultShorelineForFormation(formation: string): ShorelineType[] {
  switch (formation) {
    case 'volcanic':
      return [ShorelineType.ROCKY, ShorelineType.SANDY];
    case 'glacial':
      return [ShorelineType.ROCKY, ShorelineType.SANDY, ShorelineType.GRASSY];
    case 'karst':
      return [ShorelineType.ROCKY, ShorelineType.GRASSY];
    case 'oxbow':
      return [ShorelineType.MUDDY, ShorelineType.MARSHY, ShorelineType.GRASSY];
    case 'artificial':
      return [ShorelineType.ROCKY, ShorelineType.GRASSY];
    default:
      return [ShorelineType.SANDY, ShorelineType.GRASSY, ShorelineType.WOODED];
  }
}