import { Injectable, Inject, Optional } from '@nestjs/common';
import {
  Seed,
  NoiseGenerator,
  type ILogger,
  GeologyLayerData,
  RockType
} from '@lazy-map/domain';

/**
 * Applies rock-type-specific erosional features
 * Creates features based on geological behavior
 */
@Injectable()
export class GeologicalFeaturesService {
  constructor(
    @Optional() @Inject('ILogger') private readonly logger?: ILogger
  ) {}

  /**
   * Apply geology-specific erosional features
   * Adapts behavior based on rock type properties
   */
  applyGeologicalFeatures(
    elevations: number[][],
    geology: GeologyLayerData,
    seed: Seed,
    maxElevation: number
  ): void {
    const width = elevations[0].length;
    const height = elevations.length;
    const featureNoise = NoiseGenerator.create(seed.getValue() * 11);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const geoTile = geology.tiles[y][x];
        const rockType = geoTile.formation.rockType;

        // Apply erosion features based on rock behavior
        if (rockType === RockType.CARBONATE) {
          // Chemical dissolution → irregular, angular features (limestone karst)
          this.applyDissolutionFeatures(x, y, elevations, geoTile.fractureIntensity, maxElevation, featureNoise);
        } else if (rockType === RockType.GRANITIC) {
          // Mechanical fracture → needles or domes (granite)
          this.applyFractureFeatures(x, y, elevations, geoTile.fractureIntensity, maxElevation, featureNoise);
        } else if (rockType === RockType.CLASTIC) {
          // Rapid erosion → smooth or badlands (sandstone/shale)
          const resistance = geoTile.formation.properties.getErosionResistance();
          this.applyWashFeatures(x, y, elevations, resistance, maxElevation, featureNoise);
        } else if (rockType === RockType.METAMORPHIC) {
          // Exfoliation → serrated ridges (slate/schist)
          this.applyLayeredFeatures(x, y, elevations, maxElevation, featureNoise);
        }
      }
    }
  }

  /**
   * Apply dissolution features (limestone karst)
   * Creates lapiaces (grooves) and dolinas (sinkholes)
   * Features scaled proportionally to map relief
   */
  private applyDissolutionFeatures(
    x: number,
    y: number,
    elevations: number[][],
    fractureIntensity: number,
    maxElevation: number,
    noise: NoiseGenerator
  ): void {
    const width = elevations[0].length;
    const height = elevations.length;
    const dissolveStrength = noise.generateAt(x * 0.12, y * 0.12);
    const featureScale = maxElevation / 50; // Scale to map relief

    // High fracture + dissolution = fissures and grooves
    if (fractureIntensity > 0.6 && dissolveStrength > 0.65) {
      const depth = (8 + dissolveStrength * 15) * featureScale; // 8-23ft * scale
      elevations[y][x] = Math.max(0, elevations[y][x] - depth);
    }

    // Circular depressions (dolinas/sinkholes)
    if (fractureIntensity > 0.7 && dissolveStrength > 0.80) {
      const dolinaDepth = (10 + dissolveStrength * 20) * featureScale; // 10-30ft * scale
      // Apply radial depression
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 3) {
              const falloff = (3 - dist) / 3;
              elevations[ny][nx] = Math.max(0, elevations[ny][nx] - dolinaDepth * falloff);
            }
          }
        }
      }
    }
  }

  /**
   * Apply fracture features (granite)
   * Creates agujas (needles) at peaks, domos (domes) at base
   * Features scaled proportionally to map relief
   */
  private applyFractureFeatures(
    x: number,
    y: number,
    elevations: number[][],
    fractureIntensity: number,
    maxElevation: number,
    noise: NoiseGenerator
  ): void {
    const width = elevations[0].length;
    const height = elevations.length;
    const fractureStrength = noise.generateAt(x * 0.15, y * 0.15);
    const currentElevation = elevations[y][x];
    const heightRatio = currentElevation / maxElevation;
    const featureScale = maxElevation / 50; // Scale to map relief

    // High altitude + high fracture = sharp needles
    if (heightRatio > 0.7 && fractureIntensity > 0.6 && fractureStrength > 0.75) {
      const needleHeight = (10 + fractureStrength * 20) * featureScale; // 10-30ft * scale
      elevations[y][x] += needleHeight;
    }
    // Low altitude + low fracture = rounded domes
    else if (heightRatio < 0.4 && fractureIntensity < 0.4) {
      // Smooth by averaging with wider neighborhood
      let sum = elevations[y][x];
      let count = 1;
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            sum += elevations[ny][nx];
            count++;
          }
        }
      }
      elevations[y][x] = sum / count;
    }
  }

  /**
   * Apply wash features (soft sedimentary rocks)
   * Creates smooth hills or badlands (cárcavas)
   * Features scaled proportionally to map relief
   */
  private applyWashFeatures(
    x: number,
    y: number,
    elevations: number[][],
    erosionResistance: number,
    maxElevation: number,
    noise: NoiseGenerator
  ): void {
    const washStrength = noise.generateAt(x * 0.08, y * 0.08);
    const featureScale = maxElevation / 50; // Scale to map relief

    // Very low resistance = badlands with gullies
    if (erosionResistance < 0.3 && washStrength > 0.70) {
      const gullySteepness = 1.0 - erosionResistance;
      const gullyDepth = (5 + washStrength * 10 * gullySteepness) * featureScale; // 5-15ft * scale
      elevations[y][x] = Math.max(0, elevations[y][x] - gullyDepth);
    }
    // Normal wash erosion creates smooth terrain (handled by smoothing)
  }

  /**
   * Apply layered features (slate/metamorphic)
   * Creates serrated, saw-tooth ridges
   * Features scaled proportionally to map relief
   */
  private applyLayeredFeatures(
    x: number,
    y: number,
    elevations: number[][],
    maxElevation: number,
    noise: NoiseGenerator
  ): void {
    const layering = noise.generateAt(x * 0.20, y * 0.20);
    const featureScale = maxElevation / 50; // Scale to map relief

    // Create alternating peaks and troughs
    if (layering > 0.65) {
      const toothHeight = (3 + layering * 5) * featureScale; // 3-8ft * scale
      const isUpper = ((x + y) % 3) === 0;
      elevations[y][x] += isUpper ? toothHeight : -toothHeight * 0.5;
    }
  }
}
