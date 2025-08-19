import { FeatureArea } from '../value-objects/FeatureArea';

/**
 * Unique identifier for features
 */
export class FeatureId {
  constructor(public readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('FeatureId cannot be empty');
    }
  }

  static generate(): FeatureId {
    return new FeatureId(`feat_${Math.random().toString(36).substr(2, 9)}`);
  }

  equals(other: FeatureId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

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
 */
export abstract class MapFeature {
  constructor(
    public readonly id: FeatureId,
    public readonly name: string,
    public readonly category: FeatureCategory,
    public readonly area: FeatureArea,
    public readonly priority: number = 1,
    private _properties: Record<string, any> = {}
  ) {
    this.validatePriority(priority);
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

  intersectionWith(other: MapFeature): FeatureArea | null {
    return this.area.intersection(other.area);
  }

  // Abstract methods that subclasses must implement
  abstract getType(): string;
  abstract canMixWith(other: MapFeature): boolean;

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