import { Injectable, Inject, Optional } from '@nestjs/common';
import {
  GeologicalFormation,
  TacticalMapContext,
  BiomeType,
  Seed,
  type ILogger,
  LIMESTONE_KARST,
  DOLOMITE_TOWERS,
  GRANITE_DOME,
  WEATHERED_GRANODIORITE,
  BASALT_COLUMNS,
  VOLCANIC_TUFF,
  SANDSTONE_FINS,
  CROSS_BEDDED_SANDSTONE,
  FOLIATED_SCHIST,
  SLATE_BEDS,
  GYPSUM_BADLANDS
} from '@lazy-map/domain';

@Injectable()
export class FormationSelectionService {
  constructor(
    @Optional() @Inject('ILogger')
    private readonly logger?: ILogger
  ) {}

  selectFormations(
    context: TacticalMapContext,
    seed: Seed
  ): { primary: GeologicalFormation; secondary?: GeologicalFormation } {
    const candidates = this.getFormationsForBiome(context.biome);
    const random = this.createSeededRandom(seed.getValue());

    const primaryIndex = Math.floor(random() * candidates.length);
    const primary = candidates[primaryIndex];

    let secondary: GeologicalFormation | undefined;
    if (random() < 0.3 && candidates.length > 1) {
      const secondaryIndex = (primaryIndex + 1) % candidates.length;
      secondary = candidates[secondaryIndex];
    }

    this.logger?.debug('Selected geological formations', {
      metadata: {
        biome: context.biome,
        primaryRockType: primary.rockType,
        secondaryRockType: secondary?.rockType
      }
    });

    return { primary, secondary };
  }

  private getFormationsForBiome(biome: BiomeType): GeologicalFormation[] {
    switch (biome) {
      case BiomeType.MOUNTAIN:
        return [
          LIMESTONE_KARST,
          DOLOMITE_TOWERS,
          GRANITE_DOME,
          BASALT_COLUMNS,
          FOLIATED_SCHIST,
          SLATE_BEDS
        ];

      case BiomeType.DESERT:
        return [
          SANDSTONE_FINS,
          CROSS_BEDDED_SANDSTONE,
          GYPSUM_BADLANDS,
          VOLCANIC_TUFF
        ];

      case BiomeType.FOREST:
        return [
          GRANITE_DOME,
          WEATHERED_GRANODIORITE,
          FOLIATED_SCHIST,
          LIMESTONE_KARST
        ];

      case BiomeType.PLAINS:
        return [
          LIMESTONE_KARST,
          CROSS_BEDDED_SANDSTONE,
          SLATE_BEDS
        ];

      case BiomeType.COASTAL:
        return [
          SANDSTONE_FINS,
          BASALT_COLUMNS,
          LIMESTONE_KARST
        ];

      case BiomeType.SWAMP:
        return [
          LIMESTONE_KARST,
          GYPSUM_BADLANDS
        ];

      case BiomeType.UNDERGROUND:
        return [
          LIMESTONE_KARST,
          DOLOMITE_TOWERS,
          GYPSUM_BADLANDS
        ];

      default:
        return [GRANITE_DOME];
    }
  }

  private createSeededRandom(seed: number): () => number {
    let s = seed;
    return () => {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      return s / 0x7fffffff;
    };
  }
}
