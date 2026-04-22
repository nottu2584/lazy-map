import type { LayeredMapResult } from '@lazy-map/application';

/**
 * Serializes LayeredMapResult into plain JSON-safe objects.
 *
 * Domain classes with private fields (Seed, Building) don't survive
 * JSON.stringify. This serializer extracts the data we need via getters
 * and omits heavyweight collections (plants[], buildings[], bridges[])
 * since tile-level data already contains the rendering info.
 */
export function serializeMapResult(result: LayeredMapResult) {
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
    },
    generationTime: result.generationTime,
  };
}

function serializeContext(context: LayeredMapResult['context']) {
  return {
    biome: context.biome,
    elevation: context.elevation,
    hydrology: context.hydrology,
    development: context.development,
    season: context.season,
    requiredFeatures: context.requiredFeatures,
  };
}

function serializeGeologyLayer(geology: LayeredMapResult['layers']['geology']) {
  return {
    tiles: geology.tiles,
    primaryFormation: geology.primaryFormation,
    secondaryFormation: geology.secondaryFormation,
    transitionZones: geology.transitionZones.map((p) => ({ x: p.x, y: p.y })),
  };
}

function serializeHydrologyLayer(hydrology: LayeredMapResult['layers']['hydrology']) {
  return {
    tiles: hydrology.tiles,
    streams: hydrology.streams,
    springs: hydrology.springs.map((p) => ({ x: p.x, y: p.y })),
    totalWaterCoverage: hydrology.totalWaterCoverage,
  };
}

function serializeVegetationLayer(vegetation: LayeredMapResult['layers']['vegetation']) {
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

function serializeStructuresLayer(structures: LayeredMapResult['layers']['structures']) {
  // Omit buildings[] and bridges[] - they have private fields and tile-level data suffices
  return {
    tiles: structures.tiles,
    roads: structures.roads,
    totalStructureCount: structures.totalStructureCount,
  };
}

