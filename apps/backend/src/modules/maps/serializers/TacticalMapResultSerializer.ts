import type { TacticalMapGenerationResult } from '@lazy-map/application';

/**
 * Serializes TacticalMapGenerationResult into plain JSON-safe objects.
 *
 * Domain classes with private fields (Seed, Building) don't survive
 * JSON.stringify. This serializer extracts the data we need via getters
 * and omits heavyweight collections (plants[], buildings[], bridges[])
 * since tile-level data already contains the rendering info.
 */
export function serializeTacticalMapResult(result: TacticalMapGenerationResult) {
  return {
    width: result.width,
    height: result.height,
    seed: result.seed.getValue(),
    context: serializeContext(result.context),
    layers: {
      geology: serializeGeologyLayer(result.layers.geology),
      topography: result.layers.topography,
      hydrology: serializeHydrologyLayer(result.layers.hydrology),
      vegetation: serializeVegetationLayer(result.layers.vegetation),
      structures: serializeStructuresLayer(result.layers.structures),
      features: serializeFeaturesLayer(result.layers.features),
    },
    generationTime: result.generationTime,
  };
}

function serializeContext(context: TacticalMapGenerationResult['context']) {
  return {
    biome: context.biome,
    elevation: context.elevation,
    hydrology: context.hydrology,
    development: context.development,
    season: context.season,
    requiredFeatures: context.requiredFeatures,
  };
}

function serializeGeologyLayer(geology: TacticalMapGenerationResult['layers']['geology']) {
  return {
    tiles: geology.tiles,
    primaryFormation: geology.primaryFormation,
    secondaryFormation: geology.secondaryFormation,
    transitionZones: geology.transitionZones.map((p) => ({ x: p.x, y: p.y })),
  };
}

function serializeHydrologyLayer(hydrology: TacticalMapGenerationResult['layers']['hydrology']) {
  return {
    tiles: hydrology.tiles,
    streams: hydrology.streams,
    springs: hydrology.springs.map((p) => ({ x: p.x, y: p.y })),
    totalWaterCoverage: hydrology.totalWaterCoverage,
  };
}

function serializeVegetationLayer(vegetation: TacticalMapGenerationResult['layers']['vegetation']) {
  // Strip plants[] from tiles - too heavy and not needed for rendering
  const tiles = vegetation.tiles.map((row) =>
    row.map((tile) => ({
      canopyHeight: tile.canopyHeight,
      canopyDensity: tile.canopyDensity,
      vegetationType: tile.vegetationType,
      dominantSpecies: tile.dominantSpecies,
      groundCover: tile.groundCover,
      isPassable: tile.isPassable,
      providesConcealment: tile.providesConcealment,
      providesCover: tile.providesCover,
    })),
  );

  return {
    tiles,
    forestPatches: vegetation.forestPatches,
    clearings: vegetation.clearings,
    totalTreeCount: vegetation.totalTreeCount,
    averageCanopyCoverage: vegetation.averageCanopyCoverage,
  };
}

function serializeStructuresLayer(structures: TacticalMapGenerationResult['layers']['structures']) {
  // Omit buildings[] and bridges[] - they have private fields and tile-level data suffices
  return {
    tiles: structures.tiles,
    roads: structures.roads,
    totalStructureCount: structures.totalStructureCount,
  };
}

function serializeFeaturesLayer(features: TacticalMapGenerationResult['layers']['features']) {
  // Position objects have public x/y so they serialize, but normalize for safety
  return {
    tiles: features.tiles,
    hazards: features.hazards.map((h) => ({
      position: { x: h.position.x, y: h.position.y },
      type: h.type,
      level: h.level,
      radius: h.radius,
    })),
    resources: features.resources.map((r) => ({
      position: { x: r.position.x, y: r.position.y },
      type: r.type,
      quantity: r.quantity,
      quality: r.quality,
    })),
    landmarks: features.landmarks.map((l) => ({
      position: { x: l.position.x, y: l.position.y },
      type: l.type,
      significance: l.significance,
      lore: l.lore,
    })),
    totalFeatureCount: features.totalFeatureCount,
  };
}
