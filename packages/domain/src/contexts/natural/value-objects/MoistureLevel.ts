/**
 * Represents moisture levels in the environment
 * Affects vegetation growth and terrain characteristics
 */
export enum MoistureLevel {
  ARID = 'arid',           // Very dry, desert-like
  DRY = 'dry',             // Below average moisture
  MODERATE = 'moderate',   // Average moisture
  MOIST = 'moist',         // Above average moisture
  WET = 'wet',             // High moisture
  SATURATED = 'saturated'  // Waterlogged
}