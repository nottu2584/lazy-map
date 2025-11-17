import {
  GeologyLayerData,
  TopographyLayerData,
  HydrologyLayerData,
  VegetationLayerData,
  StructuresLayerData,
  StructureType
} from './layers';
import { VegetationType, MoistureLevel } from '../entities/TacticalMapTile';

/**
 * Validates that generated map layers comply with natural laws
 * Ensures physical realism and logical consistency
 */
export class NaturalLawValidator {
  private violations: ValidationViolation[] = [];

  /**
   * Validate all layers for natural law compliance
   */
  validateLayers(layers: {
    geology: GeologyLayerData;
    topography: TopographyLayerData;
    hydrology: HydrologyLayerData;
    vegetation: VegetationLayerData;
    structures: StructuresLayerData;
  }): ValidationResult {
    this.violations = [];

    // Validate individual layers
    this.validateGeology(layers.geology);
    this.validateTopography(layers.topography, layers.geology);
    this.validateHydrology(layers.hydrology, layers.topography);
    this.validateVegetation(layers.vegetation, layers.hydrology, layers.topography);
    this.validateStructures(layers.structures, layers.topography, layers.hydrology);

    // Cross-layer validation
    this.validateCrossLayerConsistency(layers);

    return {
      isValid: this.violations.length === 0,
      violations: this.violations,
      summary: this.generateSummary()
    };
  }

  /**
   * Validate geological layer
   */
  private validateGeology(geology: GeologyLayerData): void {
    const { tiles } = geology;
    const height = tiles.length;
    const width = tiles[0]?.length || 0;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const tile = tiles[y][x];

        // Check soil depth consistency with rock hardness
        if (tile.formation.properties.hardness > 6 && tile.soilDepth > 3) {
          this.addViolation(
            ViolationType.GEOLOGY,
            ViolationSeverity.WARNING,
            `Hard rock (hardness ${tile.formation.properties.hardness}) has excessive soil depth (${tile.soilDepth}ft)`,
            { x, y }
          );
        }

        // Check fracture intensity bounds
        if (tile.fractureIntensity < 0 || tile.fractureIntensity > 1) {
          this.addViolation(
            ViolationType.GEOLOGY,
            ViolationSeverity.ERROR,
            `Invalid fracture intensity: ${tile.fractureIntensity}`,
            { x, y }
          );
        }
      }
    }
  }

  /**
   * Validate topographic layer
   */
  private validateTopography(topography: TopographyLayerData, geology: GeologyLayerData): void {
    const { tiles } = topography;
    const height = tiles.length;
    const width = tiles[0]?.length || 0;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const topoTile = tiles[y][x];
        const geoTile = geology.tiles[y][x];

        // Check slope limits
        if (topoTile.slope > 90) {
          this.addViolation(
            ViolationType.TOPOGRAPHY,
            ViolationSeverity.ERROR,
            `Impossible slope angle: ${topoTile.slope}°`,
            { x, y }
          );
        }

        // Check elevation consistency with rock resistance
        if (topoTile.isRidge && geoTile.formation.properties.hardness < 3) {
          this.addViolation(
            ViolationType.TOPOGRAPHY,
            ViolationSeverity.WARNING,
            `Ridge formed in soft rock (hardness ${geoTile.formation.properties.hardness})`,
            { x, y }
          );
        }

        // Validate drainage patterns
        if (topoTile.isDrainage && topoTile.isRidge) {
          this.addViolation(
            ViolationType.TOPOGRAPHY,
            ViolationSeverity.ERROR,
            `Tile marked as both ridge and drainage`,
            { x, y }
          );
        }
      }
    }

    // Check global elevation consistency
    if (topography.minElevation > topography.maxElevation) {
      this.addViolation(
        ViolationType.TOPOGRAPHY,
        ViolationSeverity.CRITICAL,
        `Min elevation (${topography.minElevation}) exceeds max elevation (${topography.maxElevation})`,
        null
      );
    }
  }

  /**
   * Validate hydrological layer - water must flow downhill
   */
  private validateHydrology(hydrology: HydrologyLayerData, topography: TopographyLayerData): void {
    const { tiles } = hydrology;
    const height = tiles.length;
    const width = tiles[0]?.length || 0;

    // Direction vectors for D8 flow
    const directions = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],           [0, 1],
      [1, -1],  [1, 0],  [1, 1]
    ];

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const hydroTile = tiles[y][x];
        const topoTile = topography.tiles[y][x];

        // Validate flow direction (water flows downhill)
        if (hydroTile.flowDirection >= 0 && hydroTile.flowDirection < 8) {
          const [dy, dx] = directions[hydroTile.flowDirection];
          const ny = y + dy;
          const nx = x + dx;

          if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
            const neighborElev = topography.tiles[ny][nx].elevation;

            if (neighborElev > topoTile.elevation + 0.1) { // Small tolerance
              this.addViolation(
                ViolationType.HYDROLOGY,
                ViolationSeverity.ERROR,
                `Water flowing uphill: ${topoTile.elevation}ft to ${neighborElev}ft`,
                { x, y }
              );
            }
          }
        }

        // Springs should not appear in impermeable rock
        if (hydroTile.isSpring) {
          const geoTile = topography.tiles[y][x];
          if (geoTile.aspect === 'flat' && topoTile.elevation < 10) {
            this.addViolation(
              ViolationType.HYDROLOGY,
              ViolationSeverity.WARNING,
              `Spring at very low elevation (${topoTile.elevation}ft)`,
              { x, y }
            );
          }
        }

        // Validate stream order
        if (hydroTile.streamOrder < 0 || hydroTile.streamOrder > 10) {
          this.addViolation(
            ViolationType.HYDROLOGY,
            ViolationSeverity.ERROR,
            `Invalid stream order: ${hydroTile.streamOrder}`,
            { x, y }
          );
        }

        // Check flow accumulation consistency
        if (hydroTile.isStream && hydroTile.flowAccumulation < 5) {
          this.addViolation(
            ViolationType.HYDROLOGY,
            ViolationSeverity.WARNING,
            `Stream with low flow accumulation: ${hydroTile.flowAccumulation}`,
            { x, y }
          );
        }
      }
    }
  }

  /**
   * Validate vegetation layer
   */
  private validateVegetation(
    vegetation: VegetationLayerData,
    hydrology: HydrologyLayerData,
    topography: TopographyLayerData
  ): void {
    const { tiles } = vegetation;
    const height = tiles.length;
    const width = tiles[0]?.length || 0;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const vegTile = tiles[y][x];
        const hydroTile = hydrology.tiles[y][x];
        const topoTile = topography.tiles[y][x];

        // Dense vegetation shouldn't exist on very steep slopes
        if (vegTile.vegetationType === VegetationType.DENSE_TREES && topoTile.slope > 60) {
          this.addViolation(
            ViolationType.VEGETATION,
            ViolationSeverity.WARNING,
            `Dense forest on steep slope (${topoTile.slope}°)`,
            { x, y }
          );
        }

        // Check canopy height bounds
        if (vegTile.canopyHeight < 0 || vegTile.canopyHeight > 200) {
          this.addViolation(
            ViolationType.VEGETATION,
            ViolationSeverity.ERROR,
            `Invalid canopy height: ${vegTile.canopyHeight}ft`,
            { x, y }
          );
        }

        // Wetland vegetation should be near water
        if (vegTile.vegetationType === VegetationType.UNDERGROWTH &&
            !hydroTile.isStream && !hydroTile.isPool && hydroTile.moisture === MoistureLevel.DRY) {
          this.addViolation(
            ViolationType.VEGETATION,
            ViolationSeverity.WARNING,
            `Wetland vegetation without water source`,
            { x, y }
          );
        }

        // Trees shouldn't be underwater
        if (vegTile.plants.length > 0 && hydroTile.waterDepth > 2) {
          this.addViolation(
            ViolationType.VEGETATION,
            ViolationSeverity.WARNING,
            `Vegetation in deep water (${hydroTile.waterDepth}ft)`,
            { x, y }
          );
        }
      }
    }
  }

  /**
   * Validate structures layer
   */
  private validateStructures(
    structures: StructuresLayerData,
    topography: TopographyLayerData,
    hydrology: HydrologyLayerData
  ): void {
    const { tiles } = structures;
    const height = tiles.length;
    const width = tiles[0]?.length || 0;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const structTile = tiles[y][x];
        const topoTile = topography.tiles[y][x];
        const hydroTile = hydrology.tiles[y][x];

        if (structTile.hasStructure) {
          // Buildings shouldn't be on very steep slopes
          if (structTile.structureType === StructureType.HOUSE && topoTile.slope > 30) {
            this.addViolation(
              ViolationType.STRUCTURES,
              ViolationSeverity.WARNING,
              `Building on steep slope (${topoTile.slope}°)`,
              { x, y }
            );
          }

          // Structures shouldn't be underwater (except bridges)
          if (structTile.structureType !== StructureType.BRIDGE && hydroTile.waterDepth > 0) {
            this.addViolation(
              ViolationType.STRUCTURES,
              ViolationSeverity.ERROR,
              `${structTile.structureType} in water (${hydroTile.waterDepth}ft deep)`,
              { x, y }
            );
          }

          // Bridges should be over water
          if (structTile.structureType === StructureType.BRIDGE && !hydroTile.isStream) {
            this.addViolation(
              ViolationType.STRUCTURES,
              ViolationSeverity.WARNING,
              `Bridge not over water`,
              { x, y }
            );
          }
        }
      }
    }
  }

  /**
   * Validate cross-layer consistency
   */
  private validateCrossLayerConsistency(layers: any): void {
    // Check that all layers have the same dimensions
    const geoHeight = layers.geology.tiles.length;
    const geoWidth = layers.geology.tiles[0]?.length || 0;

    const layerNames = ['topography', 'hydrology', 'vegetation', 'structures'];
    for (const layerName of layerNames) {
      const layer = layers[layerName];
      const height = layer.tiles.length;
      const width = layer.tiles[0]?.length || 0;

      if (height !== geoHeight || width !== geoWidth) {
        this.addViolation(
          ViolationType.CONSISTENCY,
          ViolationSeverity.CRITICAL,
          `Layer dimension mismatch: ${layerName} (${width}x${height}) vs geology (${geoWidth}x${geoHeight})`,
          null
        );
      }
    }
  }

  /**
   * Add a validation violation
   */
  private addViolation(
    type: ViolationType,
    severity: ViolationSeverity,
    message: string,
    location: { x: number; y: number } | null
  ): void {
    this.violations.push({
      type,
      severity,
      message,
      location
    });
  }

  /**
   * Generate validation summary
   */
  private generateSummary(): string {
    if (this.violations.length === 0) {
      return 'All natural laws validated successfully';
    }

    const bySeverity = {
      [ViolationSeverity.CRITICAL]: 0,
      [ViolationSeverity.ERROR]: 0,
      [ViolationSeverity.WARNING]: 0
    };

    for (const violation of this.violations) {
      bySeverity[violation.severity]++;
    }

    const parts: string[] = [];
    if (bySeverity[ViolationSeverity.CRITICAL] > 0) {
      parts.push(`${bySeverity[ViolationSeverity.CRITICAL]} critical`);
    }
    if (bySeverity[ViolationSeverity.ERROR] > 0) {
      parts.push(`${bySeverity[ViolationSeverity.ERROR]} errors`);
    }
    if (bySeverity[ViolationSeverity.WARNING] > 0) {
      parts.push(`${bySeverity[ViolationSeverity.WARNING]} warnings`);
    }

    return `Validation found ${parts.join(', ')}`;
  }
}

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean;
  violations: ValidationViolation[];
  summary: string;
}

/**
 * Validation violation
 */
export interface ValidationViolation {
  type: ViolationType;
  severity: ViolationSeverity;
  message: string;
  location: { x: number; y: number } | null;
}

/**
 * Types of validation violations
 */
export enum ViolationType {
  GEOLOGY = 'geology',
  TOPOGRAPHY = 'topography',
  HYDROLOGY = 'hydrology',
  VEGETATION = 'vegetation',
  STRUCTURES = 'structures',
  CONSISTENCY = 'consistency'
}

/**
 * Severity levels for violations
 */
export enum ViolationSeverity {
  WARNING = 'warning',      // Minor issue, may be intentional
  ERROR = 'error',         // Should be fixed
  CRITICAL = 'critical'    // Must be fixed
}