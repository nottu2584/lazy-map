/**
 * Topographic layers for map features
 * Ordered from bottom (terrain) to top (overlays)
 * Following Clean Architecture: Pure domain enum with no external dependencies
 */
export enum TopographicLayer {
  /**
   * Base terrain elevation and shape
   * Mountains, valleys, hills, plateaus
   */
  ELEVATION = 0,

  /**
   * Geological composition
   * Rock types, soil, mineral deposits
   */
  GEOLOGY = 1,

  /**
   * Water features
   * Rivers, lakes, springs, wetlands
   */
  HYDROLOGY = 2,

  /**
   * Plant life
   * Forests, grasslands, plains
   */
  VEGETATION = 3,

  /**
   * Man-made structures
   * Buildings, roads, bridges, fortifications
   */
  STRUCTURES = 4,

  /**
   * Political and cultural boundaries
   * Territories, regions, settlements
   */
  TERRITORIES = 5
}

/**
 * Helper functions for TopographicLayer
 */
export class TopographicLayerUtils {
  /**
   * Get human-readable name for a layer
   */
  static getName(layer: TopographicLayer): string {
    const names: Record<TopographicLayer, string> = {
      [TopographicLayer.ELEVATION]: 'Elevation',
      [TopographicLayer.GEOLOGY]: 'Geology',
      [TopographicLayer.HYDROLOGY]: 'Hydrology',
      [TopographicLayer.VEGETATION]: 'Vegetation',
      [TopographicLayer.STRUCTURES]: 'Structures',
      [TopographicLayer.TERRITORIES]: 'Territories'
    };
    return names[layer];
  }

  /**
   * Get all layers in order
   */
  static getAllLayers(): TopographicLayer[] {
    return [
      TopographicLayer.ELEVATION,
      TopographicLayer.GEOLOGY,
      TopographicLayer.HYDROLOGY,
      TopographicLayer.VEGETATION,
      TopographicLayer.STRUCTURES,
      TopographicLayer.TERRITORIES
    ];
  }

  /**
   * Check if one layer is above another
   */
  static isAbove(layer1: TopographicLayer, layer2: TopographicLayer): boolean {
    return layer1 > layer2;
  }

  /**
   * Get layers that can coexist on the same tile
   */
  static getCompatibleLayers(layer: TopographicLayer): TopographicLayer[] {
    // Most layers can coexist, with some exceptions
    const incompatible: Partial<Record<TopographicLayer, TopographicLayer[]>> = {
      [TopographicLayer.HYDROLOGY]: [], // Water can exist with all layers
      [TopographicLayer.STRUCTURES]: [TopographicLayer.HYDROLOGY] // Buildings typically avoid water
    };

    const allLayers = TopographicLayerUtils.getAllLayers();
    const incompatibleLayers = incompatible[layer] || [];

    return allLayers.filter(l =>
      l !== layer && !incompatibleLayers.includes(l)
    );
  }
}