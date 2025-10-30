/**
 * Base plant properties
 */
export interface PlantProperties {
  // Growth characteristics
  maxHeight: number;
  maxWidth: number;
  growthRate: number; // 0-1 scale

  // Visual properties
  foliageColor: string[];
  flowerColor?: string[];
  bloomingSeason?: string[];

  // Ecological properties
  soilPreference: string[];
  lightRequirement: 'full_sun' | 'partial_shade' | 'full_shade';
  waterRequirement: 'low' | 'medium' | 'high';
  hardiness: number; // Cold tolerance

  // Special traits
  isEdible?: boolean;
  isMedicinal?: boolean;
  isFragrant?: boolean;
  attractsPollinators?: boolean;
  providesNesting?: boolean;
}