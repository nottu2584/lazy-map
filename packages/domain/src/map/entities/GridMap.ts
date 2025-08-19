import { Dimensions, Position, FeatureArea } from '../../common/value-objects';
import { MapTile } from './MapTile';

/**
 * Unique identifier for maps
 */
export class MapId {
  constructor(public readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('MapId cannot be empty');
    }
  }

  static generate(): MapId {
    return new MapId(`map_${Math.random().toString(36).substr(2, 9)}`);
  }

  equals(other: MapId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

/**
 * Metadata associated with a map
 */
export class MapMetadata {
  constructor(
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly author?: string,
    public readonly description?: string,
    public readonly tags: string[] = []
  ) {}

  withUpdate(author?: string, description?: string): MapMetadata {
    return new MapMetadata(
      this.createdAt,
      new Date(),
      author || this.author,
      description || this.description,
      this.tags
    );
  }

  addTag(tag: string): MapMetadata {
    if (this.tags.includes(tag)) {
      return this;
    }
    return new MapMetadata(
      this.createdAt,
      this.updatedAt,
      this.author,
      this.description,
      [...this.tags, tag]
    );
  }
}

/**
 * Main map entity representing a grid-based map
 */
export class GridMap {
  private _tiles: MapTile[][];
  private _featureIds: Set<string>;

  constructor(
    public readonly id: MapId,
    public readonly name: string,
    public readonly dimensions: Dimensions,
    public readonly cellSize: number,
    tiles: MapTile[][],
    public readonly metadata: MapMetadata
  ) {
    this.validateCellSize(cellSize);
    this.validateTiles(tiles);
    this._tiles = tiles;
    this._featureIds = new Set();
  }

  // Factory method for creating empty maps
  static createEmpty(
    name: string,
    dimensions: Dimensions,
    cellSize: number = 32,
    author?: string
  ): GridMap {
    const id = MapId.generate();
    const metadata = new MapMetadata(new Date(), new Date(), author);
    
    // Create empty tiles
    const tiles: MapTile[][] = [];
    for (let y = 0; y < dimensions.height; y++) {
      tiles[y] = [];
      for (let x = 0; x < dimensions.width; x++) {
        tiles[y][x] = new MapTile(new Position(x, y));
      }
    }

    return new GridMap(id, name, dimensions, cellSize, tiles, metadata);
  }

  // Tile access methods
  getTile(position: Position): MapTile | null {
    if (!this.isValidPosition(position)) {
      return null;
    }
    return this._tiles[Math.floor(position.y)][Math.floor(position.x)];
  }

  setTile(position: Position, tile: MapTile): void {
    if (!this.isValidPosition(position)) {
      throw new Error(`Position ${position} is outside map bounds`);
    }
    this._tiles[Math.floor(position.y)][Math.floor(position.x)] = tile;
  }

  getAllTiles(): MapTile[] {
    const allTiles: MapTile[] = [];
    for (let y = 0; y < this.dimensions.height; y++) {
      for (let x = 0; x < this.dimensions.width; x++) {
        allTiles.push(this._tiles[y][x]);
      }
    }
    return allTiles;
  }

  getTilesInArea(area: FeatureArea): MapTile[] {
    const tiles: MapTile[] = [];
    const startX = Math.max(0, Math.floor(area.left));
    const endX = Math.min(this.dimensions.width, Math.ceil(area.right));
    const startY = Math.max(0, Math.floor(area.top));
    const endY = Math.min(this.dimensions.height, Math.ceil(area.bottom));

    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        tiles.push(this._tiles[y][x]);
      }
    }
    return tiles;
  }

  // Feature management
  addFeature(featureId: string): void {
    this._featureIds.add(featureId);
  }

  removeFeature(featureId: string): void {
    this._featureIds.delete(featureId);
    
    // Remove feature from all tiles
    this.getAllTiles().forEach(tile => {
      if (tile.primaryFeatureId === featureId) {
        tile.setPrimaryFeature(null);
      }
      tile.removeMixedFeature(featureId);
    });
  }

  hasFeature(featureId: string): boolean {
    return this._featureIds.has(featureId);
  }

  get featureIds(): string[] {
    return Array.from(this._featureIds);
  }

  // Validation methods
  private isValidPosition(position: Position): boolean {
    return this.dimensions.contains(position);
  }

  private validateCellSize(cellSize: number): void {
    if (cellSize <= 0) {
      throw new Error('Cell size must be positive');
    }
    if (!Number.isInteger(cellSize)) {
      throw new Error('Cell size must be an integer');
    }
  }

  private validateTiles(tiles: MapTile[][]): void {
    if (tiles.length !== this.dimensions.height) {
      throw new Error('Tiles array height does not match dimensions');
    }
    
    for (let y = 0; y < tiles.length; y++) {
      if (tiles[y].length !== this.dimensions.width) {
        throw new Error(`Tiles array width at row ${y} does not match dimensions`);
      }
    }
  }

  // Utility methods
  getWorldBounds(): FeatureArea {
    return new FeatureArea(
      new Position(0, 0),
      this.dimensions
    );
  }

  toString(): string {
    return `GridMap(id: ${this.id}, name: ${this.name}, size: ${this.dimensions})`;
  }
}