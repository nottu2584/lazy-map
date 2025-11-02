import { Seed } from '../../../common/value-objects/Seed';
import { TacticalMapContext } from '../../value-objects/TacticalMapContext';
import {
  GeologicalFormation,
  PermeabilityLevel,
  TerrainFeature
} from '../../../contexts/relief/value-objects/GeologicalFormation';
import { Position } from '../../../common/value-objects/Position';

/**
 * Geological layer data structure
 * Represents the geological foundation of the tactical map
 */
export interface GeologyLayerData {
  tiles: GeologyTileData[][];
  primaryFormation: GeologicalFormation;
  secondaryFormation?: GeologicalFormation;
  transitionZones: Position[];
}

/**
 * Geological properties for a single tile
 */
export interface GeologyTileData {
  formation: GeologicalFormation;
  soilDepth: number; // in feet
  permeability: PermeabilityLevel;
  features: TerrainFeature[];
  fractureIntensity: number; // 0-1, affects erosion
}

/**
 * Service interface for geological layer generation
 * This is a PORT in Clean Architecture - implemented by infrastructure
 */
export interface IGeologyLayerService {
  /**
   * Generate the geological foundation layer
   * @param width Map width in tiles
   * @param height Map height in tiles
   * @param context Tactical map context
   * @param seed Seed for deterministic generation
   * @returns Geological layer data
   */
  generate(
    width: number,
    height: number,
    context: TacticalMapContext,
    seed: Seed
  ): Promise<GeologyLayerData>;
}