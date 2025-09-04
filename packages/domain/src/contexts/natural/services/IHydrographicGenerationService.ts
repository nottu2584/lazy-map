import { IRandomGenerator } from '../../../common/interfaces/IRandomGenerator';
import { FeatureArea } from '../../../common/value-objects/FeatureArea';
import { Position } from '../../../common/value-objects/Position';
import {
  Lake,
  LakeFormation,
  Pond,
  River,
  Spring,
  SpringType,
  Wetland,
  WetlandType,
} from '../entities';
import { FlowDirection, WaterLevel, WaterQuality } from '../value-objects';

/**
 * Hydrographic generation settings for rivers
 */
export interface RiverGenerationSettings {
  // Basic river properties
  minLength: number;
  maxLength: number;
  averageWidth: number;
  widthVariation: number; // 0-1, how much width varies along river

  // Flow characteristics
  baseFlowVelocity: number; // 1-10 scale
  meandering: number; // 0-1, how much the river curves
  naturalObstacles: boolean; // Generate rapids, rocks, etc.

  // Water properties
  waterQuality: WaterQuality;
  seasonal: boolean;

  // Generation constraints
  allowPartial: boolean; // Allow rivers to extend beyond map boundaries
  requireSource: boolean; // Must have identifiable source (spring, lake)
  requireMouth: boolean; // Must have mouth (lake, ocean, map edge)

  // Confluence settings
  allowTributaries: boolean;
  maxTributaries: number;
  tributaryChance: number; // 0-1 probability per suitable location

  // Environmental factors
  elevation: number; // Affects flow speed and meandering
  climate: 'arid' | 'temperate' | 'tropical' | 'arctic';
  terrain: 'flat' | 'hilly' | 'mountainous';
}

/**
 * Lake generation settings
 */
export interface LakeGenerationSettings {
  // Size constraints
  minSize: number; // Minimum area
  maxSize: number; // Maximum area

  // Shape characteristics
  irregularity: number; // 0-1, how irregular the shoreline is
  formation: LakeFormation;

  // Depth characteristics
  averageDepth: number;
  maxDepth: number;
  shallowAreas: number; // 0-1, proportion of shallow areas

  // Water properties
  waterQuality: WaterQuality;
  thermalStability: boolean;

  // Features
  generateIslands: boolean;
  islandChance: number; // 0-1 probability
  generateInlets: boolean;
  generateOutlets: boolean;

  // Shoreline properties
  shorelineComplexity: number; // 0-1, affects point density
  accessibilityRatio: number; // 0-1, proportion of accessible shoreline
}

/**
 * Spring generation settings
 */
export interface SpringGenerationSettings {
  springType: SpringType;
  flowRate: number; // GPM
  temperature: number; // For thermal springs

  // Placement preferences
  preferHighElevation: boolean;
  preferRockFormations: boolean;
  nearWaterFeatures: boolean; // Springs near lakes/rivers

  // Output characteristics
  generateOutflow: boolean; // Create stream from spring
  outflowLength: number;
}

/**
 * Wetland generation settings
 */
export interface WetlandGenerationSettings {
  wetlandType: WetlandType;
  size: number;

  // Characteristics
  vegetationDensity: number; // 0-1
  seasonal: boolean;
  waterLevel: WaterLevel;
  waterQuality: WaterQuality;

  // Placement preferences
  preferLowElevation: boolean;
  nearWaterSources: boolean;
}

/**
 * Comprehensive hydrographic generation settings
 */
export interface HydrographicGenerationSettings {
  // Feature density (0-1 scale, higher = more features)
  riverDensity: number;
  lakeDensity: number;
  springDensity: number;
  pondDensity: number;
  wetlandDensity: number;

  // Default settings for each feature type
  defaultRiverSettings: RiverGenerationSettings;
  defaultLakeSettings: LakeGenerationSettings;
  defaultSpringSettings: SpringGenerationSettings;
  defaultWetlandSettings: WetlandGenerationSettings;

  // Global water system settings
  allowInterconnectedSystems: boolean; // Rivers flow between lakes
  maintainWaterBalance: boolean; // Ensure logical flow patterns
  respectTopography: boolean; // Water flows downhill

  // Climate influence
  climate: 'arid' | 'temperate' | 'tropical' | 'arctic';
  seasonality: boolean; // Generate seasonal water features

  // Quality and realism
  naturalismLevel: number; // 0-1, how realistic vs fantastical
  biodiversityFocus: boolean; // Prioritize ecological diversity
}

/**
 * Results from hydrographic generation
 */
export interface HydrographicGenerationResult {
  success: boolean;

  // Generated features
  rivers: River[];
  lakes: Lake[];
  springs: Spring[];
  ponds: Pond[];
  wetlands: Wetland[];

  // System statistics
  totalWaterCoverage: number; // Percentage of map covered by water
  interconnectionScore: number; // How well features connect (0-10)
  biodiversityScore: number; // Ecological diversity score (0-10)

  // Generation metadata
  generationTime: number; // Time taken in milliseconds
  warnings: string[];
  error?: string;
}

/**
 * Service interface for generating hydrographic features
 */
export interface IHydrographicGenerationService {
  /**
   * Generate a complete water system for a map area
   */
  generateWaterSystem(
    area: FeatureArea,
    settings: HydrographicGenerationSettings,
    randomGenerator: IRandomGenerator,
  ): Promise<HydrographicGenerationResult>;

  /**
   * Generate a river with natural flow patterns
   */
  generateRiver(
    area: FeatureArea,
    settings: RiverGenerationSettings,
    source?: Position,
    mouth?: Position,
    randomGenerator?: IRandomGenerator,
  ): Promise<River>;

  /**
   * Generate a lake with natural shoreline
   */
  generateLake(
    area: FeatureArea,
    settings: LakeGenerationSettings,
    randomGenerator?: IRandomGenerator,
  ): Promise<Lake>;

  /**
   * Generate a spring water source
   */
  generateSpring(
    position: Position,
    settings: SpringGenerationSettings,
    randomGenerator?: IRandomGenerator,
  ): Promise<Spring>;

  /**
   * Generate a pond
   */
  generatePond(
    area: FeatureArea,
    seasonal: boolean,
    randomGenerator?: IRandomGenerator,
  ): Promise<Pond>;

  /**
   * Generate a wetland area
   */
  generateWetland(
    area: FeatureArea,
    settings: WetlandGenerationSettings,
    randomGenerator?: IRandomGenerator,
  ): Promise<Wetland>;

  /**
   * Connect water features (rivers flowing into lakes, etc.)
   */
  connectWaterFeatures(
    rivers: River[],
    lakes: Lake[],
    springs: Spring[],
    randomGenerator: IRandomGenerator,
  ): Promise<void>;

  /**
   * Generate realistic river path between two points
   */
  generateRiverPath(
    source: Position,
    mouth: Position,
    area: FeatureArea,
    settings: RiverGenerationSettings,
    randomGenerator: IRandomGenerator,
  ): Promise<Position[]>;

  /**
   * Validate water system for logical flow patterns
   */
  validateWaterSystem(
    rivers: River[],
    lakes: Lake[],
    springs: Spring[],
  ): { isValid: boolean; errors: string[] };

  /**
   * Get default generation settings for different climates
   */
  getDefaultSettingsForClimate(
    climate: 'arid' | 'temperate' | 'tropical' | 'arctic',
  ): HydrographicGenerationSettings;

  /**
   * Calculate optimal water feature placement
   */
  calculateOptimalPlacements(
    area: FeatureArea,
    settings: HydrographicGenerationSettings,
    existingFeatures: any[], // Other map features that might influence placement
    randomGenerator: IRandomGenerator,
  ): Promise<{
    riverPlacements: { source: Position; mouth: Position; area: FeatureArea }[];
    lakePlacements: FeatureArea[];
    springPlacements: Position[];
    wetlandPlacements: FeatureArea[];
  }>;

  /**
   * Generate seasonal variations of water features
   */
  applySeasonalChanges(
    waterFeatures: (River | Lake | Wetland | Pond)[],
    season: 'spring' | 'summer' | 'autumn' | 'winter',
    climate: 'arid' | 'temperate' | 'tropical' | 'arctic',
  ): void;

  /**
   * Calculate flow direction based on topography
   */
  calculateFlowDirection(
    position: Position,
    elevationData?: number[][],
    randomGenerator?: IRandomGenerator,
  ): FlowDirection;

  /**
   * Generate water quality based on environmental factors
   */
  generateWaterQuality(
    featureType: 'river' | 'lake' | 'spring' | 'pond' | 'wetland',
    environment: {
      elevation: number;
      distanceFromSource: number;
      pollution: number;
      climate: 'arid' | 'temperate' | 'tropical' | 'arctic';
    },
    randomGenerator?: IRandomGenerator,
  ): WaterQuality;

  /**
   * Generate realistic river tributaries
   */
  generateTributaries(
    mainRiver: River,
    settings: RiverGenerationSettings,
    area: FeatureArea,
    randomGenerator: IRandomGenerator,
  ): Promise<River[]>;
}
