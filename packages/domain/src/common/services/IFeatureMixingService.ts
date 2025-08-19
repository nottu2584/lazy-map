import { MapFeature } from '../entities/MapFeature';
import { MapTile } from '../../map/entities/MapTile';
import { TerrainType } from '../../contexts/relief/value-objects/TerrainType';

/**
 * Compatibility levels between features
 */
export enum CompatibilityLevel {
  INCOMPATIBLE = 0,
  NEUTRAL = 1,
  COMPATIBLE = 2,
  SYNERGISTIC = 3,
}

/**
 * Aspects of feature interaction
 */
export enum InteractionAspect {
  TERRAIN = 'terrain',
  HEIGHT = 'height',
  MOVEMENT = 'movement',
  BLOCKING = 'blocking',
  VISUAL = 'visual',
}

/**
 * Result of feature interaction calculation
 */
export interface FeatureInteraction {
  compatibility: CompatibilityLevel;
  dominantFeature: Record<InteractionAspect, string>;
  heightBlending: 'add' | 'average' | 'max' | 'dominant';
  terrainModification?: TerrainType;
  movementModification?: number;
  specialProperties?: Record<string, any>;
}

/**
 * Settings for feature mixing
 */
export interface FeatureMixingSettings {
  enableFeatureMixing: boolean;
  mixingProbability: number;
  maxMixingDepth: number;
}

/**
 * Domain service interface for feature mixing
 */
export interface IFeatureMixingService {
  /**
   * Determines compatibility between two features
   */
  getFeatureCompatibility(feature1: MapFeature, feature2: MapFeature): CompatibilityLevel;

  /**
   * Calculates how features should interact
   */
  calculateFeatureInteraction(
    primaryFeature: MapFeature,
    secondaryFeature: MapFeature
  ): FeatureInteraction;

  /**
   * Applies feature mixing to a tile
   */
  applyFeatureMixing(
    tile: MapTile,
    features: MapFeature[],
    settings: FeatureMixingSettings
  ): MapTile;

  /**
   * Gets all compatible features for mixing
   */
  getCompatibleFeatures(
    primaryFeature: MapFeature,
    candidateFeatures: MapFeature[]
  ): MapFeature[];

  /**
   * Validates mixing settings
   */
  validateMixingSettings(settings: FeatureMixingSettings): string[];
}