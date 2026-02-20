import { Seed } from '../../../common/value-objects/Seed';
import { TacticalMapContext } from '../../value-objects/TacticalMapContext';
import { GeologyLayerData } from './IGeologyLayerService';
import { TopographyLayerData } from './ITopographyLayerService';
import { HydrologyLayerData } from './IHydrologyLayerService';
import { VegetationLayerData } from './IVegetationLayerService';
import { StructuresLayerData } from './IStructuresLayerService';
import { Position } from '../../../common/value-objects/Position';

/**
 * Features layer data structure
 * Represents tactical elements and points of interest
 */
export interface FeaturesLayerData {
  tiles: FeatureTileData[][];
  hazards: HazardLocation[];
  resources: ResourceLocation[];
  landmarks: LandmarkLocation[];
  totalFeatureCount: number;
}

/**
 * Feature properties for a single tile
 */
export interface FeatureTileData {
  hasFeature: boolean;
  featureType: FeatureType | null;
  hazardLevel: HazardLevel;
  resourceValue: number; // 0-1
  visibility: VisibilityLevel;
  interactionType: InteractionType | null;
  description: string | null;
}

/**
 * Type of feature in the tile
 */
export enum FeatureType {
  // Hazards
  QUICKSAND = 'quicksand',
  UNSTABLE_GROUND = 'unstable_ground',
  POISON_PLANTS = 'poison_plants',
  INSECT_NEST = 'insect_nest',
  ANIMAL_DEN = 'animal_den',

  // Resources
  MEDICINAL_HERBS = 'medicinal_herbs',
  BERRIES = 'berries',
  MUSHROOMS = 'mushrooms',
  FRESH_WATER = 'fresh_water',
  MINERAL_DEPOSIT = 'mineral_deposit',

  // Landmarks
  ANCIENT_TREE = 'ancient_tree',
  STANDING_STONES = 'standing_stones',
  BATTLEFIELD_REMAINS = 'battlefield_remains',
  CAMPSITE = 'campsite',
  CAVE_ENTRANCE = 'cave_entrance'
}

/**
 * Hazard severity levels
 */
export enum HazardLevel {
  NONE = 'none',
  MINOR = 'minor',
  MODERATE = 'moderate',
  SEVERE = 'severe',
  DEADLY = 'deadly'
}

/**
 * Visibility levels for features
 */
export enum VisibilityLevel {
  OBVIOUS = 'obvious',      // Immediately visible
  NOTICEABLE = 'noticeable', // DC 10 Perception
  HIDDEN = 'hidden',        // DC 15 Perception
  CONCEALED = 'concealed',  // DC 20 Perception
  SECRET = 'secret'         // DC 25 Perception
}

/**
 * How players can interact with the feature
 */
export enum InteractionType {
  INVESTIGATE = 'investigate', // Can be examined
  HARVEST = 'harvest',        // Can gather resources
  AVOID = 'avoid',           // Should be avoided
  TRIGGER = 'trigger'        // Activates on contact
}

/**
 * Hazard location and properties
 */
export interface HazardLocation {
  position: Position;
  type: FeatureType;
  level: HazardLevel;
  radius: number; // Effect radius in tiles
}

/**
 * Resource location and properties
 */
export interface ResourceLocation {
  position: Position;
  type: FeatureType;
  quantity: number; // 1-10
  quality: number; // 0-1
}

/**
 * Landmark location and properties
 */
export interface LandmarkLocation {
  position: Position;
  type: FeatureType;
  significance: number; // 0-1 importance
  lore: string; // Brief description
}

/**
 * Service interface for features layer generation
 * This is a PORT in Clean Architecture - implemented by infrastructure
 */
export interface IFeaturesLayerService {
  /**
   * Generate the features layer from all previous layers
   * @param layers All previous layer data
   * @param context Tactical map context
   * @param seed Seed for deterministic generation
   * @returns Features layer data
   */
  generate(
    layers: {
      geology: GeologyLayerData;
      topography: TopographyLayerData;
      hydrology: HydrologyLayerData;
      vegetation: VegetationLayerData;
      structures: StructuresLayerData;
    },
    context: TacticalMapContext,
    seed: Seed
  ): Promise<FeaturesLayerData>;
}