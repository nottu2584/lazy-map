import { Position } from '../../common/value-objects';
import { Terrain, TerrainType } from '../../contexts/relief/value-objects/TerrainType';

/**
 * Represents a single tile in the map grid
 */
export class MapTile {
  private _terrain: Terrain;
  private _heightMultiplier: number;
  private _isBlocked: boolean;
  private _primaryFeatureId: string | null;
  private _mixedFeatureIds: string[];
  private _customProperties: Record<string, any>;

  constructor(
    public readonly position: Position,
    terrain: Terrain = Terrain.grass(),
    heightMultiplier: number = 1.0
  ) {
    this._terrain = terrain;
    this._heightMultiplier = this.validateHeightMultiplier(heightMultiplier);
    this._isBlocked = !terrain.isPassable;
    this._primaryFeatureId = null;
    this._mixedFeatureIds = [];
    this._customProperties = {};
  }

  // Getters
  get terrain(): Terrain { return this._terrain; }
  get terrainType(): TerrainType { return this._terrain.type; }
  get heightMultiplier(): number { return this._heightMultiplier; }
  get isBlocked(): boolean { return this._isBlocked; }
  get movementCost(): number { return this._terrain.movementCost; }
  get primaryFeatureId(): string | null { return this._primaryFeatureId; }
  get mixedFeatureIds(): string[] { return [...this._mixedFeatureIds]; }
  get customProperties(): Record<string, any> { return { ...this._customProperties }; }

  // Business methods
  changeTerrain(newTerrain: Terrain): void {
    this._terrain = newTerrain;
    this._isBlocked = !newTerrain.isPassable;
  }

  setHeightMultiplier(multiplier: number): void {
    this._heightMultiplier = this.validateHeightMultiplier(multiplier);
  }

  block(): void {
    this._isBlocked = true;
  }

  unblock(): void {
    this._isBlocked = this._terrain.isPassable ? false : true;
  }

  setPrimaryFeature(featureId: string | null): void {
    this._primaryFeatureId = featureId;
  }

  addMixedFeature(featureId: string): void {
    if (!this._mixedFeatureIds.includes(featureId)) {
      this._mixedFeatureIds.push(featureId);
    }
  }

  removeMixedFeature(featureId: string): void {
    this._mixedFeatureIds = this._mixedFeatureIds.filter(id => id !== featureId);
  }

  hasFeature(featureId: string): boolean {
    return this._primaryFeatureId === featureId || this._mixedFeatureIds.includes(featureId);
  }

  clearFeatures(): void {
    this._primaryFeatureId = null;
    this._mixedFeatureIds = [];
  }

  setCustomProperty(key: string, value: any): void {
    this._customProperties[key] = value;
  }

  getCustomProperty(key: string): any {
    return this._customProperties[key];
  }

  removeCustomProperty(key: string): void {
    delete this._customProperties[key];
  }

  private validateHeightMultiplier(multiplier: number): number {
    if (!Number.isFinite(multiplier)) {
      throw new Error('Height multiplier must be a finite number');
    }
    if (multiplier < 0) {
      throw new Error('Height multiplier cannot be negative');
    }
    return multiplier;
  }

  equals(other: MapTile): boolean {
    return this.position.equals(other.position) &&
           this._terrain.equals(other._terrain) &&
           this._heightMultiplier === other._heightMultiplier;
  }

  toString(): string {
    return `MapTile(pos: ${this.position}, terrain: ${this._terrain.type}, height: ${this._heightMultiplier})`;
  }
}