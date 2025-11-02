import { SpatialBounds, FeatureId } from '../value-objects';
import { TileCoordinate } from '../../map/value-objects/TileCoordinate';
import { TopographicLayer } from '../../map/value-objects/TopographicLayer';

/**
 * Feature categories for classification
 */
export enum FeatureCategory {
  RELIEF = 'relief',
  NATURAL = 'natural',
  ARTIFICIAL = 'artificial',
  CULTURAL = 'cultural',
}

/**
 * Base class for all map features
 * Updated for layered topographic system - features now track their tiles
 */
export abstract class MapFeature {
  private _tiles: Set<TileCoordinate>;
  private _layer: TopographicLayer;

  constructor(
    public readonly id: FeatureId,
    public readonly name: string,
    public readonly category: FeatureCategory,
    public readonly area: SpatialBounds,
    public readonly priority: number = 1,
    private _properties: Record<string, any> = {}
  ) {
    this.validatePriority(priority);
    this._tiles = new Set<TileCoordinate>();
    this._layer = this.determineLayer();
  }

  /**
   * Determine the topographic layer based on category
   * Can be overridden by subclasses for specific features
   */
  protected determineLayer(): TopographicLayer {
    switch (this.category) {
      case FeatureCategory.RELIEF:
        return TopographicLayer.ELEVATION;
      case FeatureCategory.NATURAL:
        // Natural features could be hydrology or vegetation
        // Subclasses should override for specificity
        return TopographicLayer.VEGETATION;
      case FeatureCategory.ARTIFICIAL:
        return TopographicLayer.STRUCTURES;
      case FeatureCategory.CULTURAL:
        return TopographicLayer.TERRITORIES;
      default:
        return TopographicLayer.VEGETATION;
    }
  }

  /**
   * Get the topographic layer this feature belongs to
   */
  getLayer(): TopographicLayer {
    return this._layer;
  }

  /**
   * Set the topographic layer (for features that can exist on multiple layers)
   */
  setLayer(layer: TopographicLayer): void {
    this._layer = layer;
  }

  /**
   * Add tiles that this feature occupies
   */
  addTiles(tiles: TileCoordinate[]): void {
    for (const tile of tiles) {
      this._tiles.add(tile);
    }
  }

  /**
   * Add a single tile
   */
  addTile(tile: TileCoordinate): void {
    this._tiles.add(tile);
  }

  /**
   * Remove a tile
   */
  removeTile(tile: TileCoordinate): void {
    // Find and remove the matching tile
    for (const t of this._tiles) {
      if (t.equals(tile)) {
        this._tiles.delete(t);
        break;
      }
    }
  }

  /**
   * Get all tiles this feature occupies
   */
  getTiles(): TileCoordinate[] {
    return Array.from(this._tiles);
  }

  /**
   * Get the number of tiles this feature occupies
   */
  getTileCount(): number {
    return this._tiles.size;
  }

  /**
   * Check if this feature occupies a specific tile
   */
  occupiesTile(coordinate: TileCoordinate): boolean {
    for (const tile of this._tiles) {
      if (tile.equals(coordinate)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if this feature occupies a specific position
   */
  occupiesPosition(x: number, y: number): boolean {
    return this.occupiesTile(TileCoordinate.create(x, y));
  }

  /**
   * Clear all tiles
   */
  clearTiles(): void {
    this._tiles.clear();
  }

  /**
   * Calculate tiles from spatial bounds
   * This should be called after the feature is positioned
   */
  calculateTilesFromBounds(): void {
    this._tiles.clear();

    const minX = Math.floor(this.area.left);
    const minY = Math.floor(this.area.top);
    const maxX = Math.ceil(this.area.right);
    const maxY = Math.ceil(this.area.bottom);

    for (let x = minX; x < maxX; x++) {
      for (let y = minY; y < maxY; y++) {
        this._tiles.add(TileCoordinate.create(x, y));
      }
    }
  }

  // Property management
  get properties(): Record<string, any> {
    return { ...this._properties };
  }

  setProperty(key: string, value: any): void {
    this._properties[key] = value;
  }

  getProperty(key: string): any {
    return this._properties[key];
  }

  removeProperty(key: string): void {
    delete this._properties[key];
  }

  hasProperty(key: string): boolean {
    return key in this._properties;
  }

  // Spatial methods
  overlaps(other: MapFeature): boolean {
    return this.area.overlaps(other.area);
  }

  intersectionWith(other: MapFeature): SpatialBounds | null {
    return this.area.intersection(other.area);
  }

  // Abstract methods that subclasses must implement
  abstract getType(): string;

  private validatePriority(priority: number): void {
    if (priority < 0) {
      throw new Error('Feature priority cannot be negative');
    }
  }

  equals(other: MapFeature): boolean {
    return this.id.equals(other.id);
  }

  toString(): string {
    return `MapFeature(id: ${this.id}, name: ${this.name}, category: ${this.category})`;
  }
}