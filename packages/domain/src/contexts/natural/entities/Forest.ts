import { SpatialBounds } from '../../../common/value-objects/SpatialBounds';
import { MapFeature, FeatureCategory } from '../../../common/entities/MapFeature';
import { FeatureId } from '../../../common/entities/../value-objects';
import { TreePlant, PlantSpecies } from './Plant';

/**
 * Forest-specific feature type
 */
export const FOREST_FEATURE_TYPE = 'forest';

/**
 * Forest density levels
 */
export enum ForestDensity {
  SPARSE = 'sparse',
  MODERATE = 'moderate',
  DENSE = 'dense',
  VERY_DENSE = 'very_dense',
}

/**
 * Forest entity containing TreePlant instances
 * Represents a collection of trees within a spatial boundary
 */
export class Forest extends MapFeature {
  private _trees: Map<string, TreePlant> = new Map();

  constructor(
    id: FeatureId,
    name: string,
    area: SpatialBounds,
    trees: TreePlant[] = [],
    public readonly dominantSpecies: PlantSpecies[] = [],
    public readonly underbrushDensity: number = 0.5,
    priority: number = 2
  ) {
    super(id, name, FeatureCategory.NATURAL, area, priority);
    this.validateUnderbrushDensity(underbrushDensity);
    this.addTrees(trees);
  }

  getType(): string {
    return FOREST_FEATURE_TYPE;
  }

  canMixWith(other: MapFeature): boolean {
    // Forests can mix with relief features (hills, mountains)
    // but not with water or building features
    if (other.category === FeatureCategory.RELIEF) {
      return true;
    }
    if (other.category === FeatureCategory.CULTURAL) {
      return true;
    }
    if (other.category === FeatureCategory.NATURAL) {
      // Can mix with clearings, but not with water features
      const otherType = other.getType();
      return otherType === 'clearing' || otherType === 'wetland';
    }
    return false;
  }

  // Tree management
  addTree(tree: TreePlant): void {
    if (!this.area.contains(tree.position.toPosition())) {
      throw new Error('Tree position must be within forest area');
    }
    this._trees.set(tree.id, tree);
  }

  addTrees(trees: TreePlant[]): void {
    trees.forEach(tree => this.addTree(tree));
  }

  // Get all trees
  getTrees(): TreePlant[] {
    return Array.from(this._trees.values());
  }

  removeTree(treeId: string): void {
    this._trees.delete(treeId);
  }

  getTree(treeId: string): TreePlant | undefined {
    return this._trees.get(treeId);
  }

  // Forest properties
  get treeCount(): number {
    return this._trees.size;
  }

  get forestDensity(): ForestDensity {
    const treesPerTile = this.treeCount / this.area.dimensions.area;
    if (treesPerTile < 0.3) return ForestDensity.SPARSE;
    if (treesPerTile < 0.6) return ForestDensity.MODERATE;
    if (treesPerTile < 0.9) return ForestDensity.DENSE;
    return ForestDensity.VERY_DENSE;
  }

  getSpeciesDistribution(): Map<string, number> {
    const distribution = new Map<string, number>();

    // Count trees by species
    this._trees.forEach(tree => {
      const species = tree.species.toString();
      distribution.set(species, (distribution.get(species) || 0) + 1);
    });

    return distribution;
  }

  getAverageTreeHealth(): number {
    const allTrees = this.getTrees();
    if (allTrees.length === 0) return 0;
    
    const totalHealth = allTrees.reduce((sum, tree) => sum + tree.health, 0);
    return totalHealth / allTrees.length;
  }

  getAverageCanopyDensity(): number {
    const allTrees = this.getTrees();
    if (allTrees.length === 0) return 0;

    const totalDensity = allTrees.reduce((sum, tree) => sum + tree.canopyDensity, 0);
    return totalDensity / allTrees.length;
  }

  // Simplified methods without complex tree interactions
  createForestGap(centerX: number, centerY: number, radius: number): void {
    // Remove trees in the gap area
    const treesToRemove: string[] = [];
    
    this.getTrees().forEach(tree => {
      const treePos = tree.position;
      const distance = Math.sqrt(
        Math.pow(treePos.tileX - centerX, 2) + Math.pow(treePos.tileY - centerY, 2)
      );

      if (distance <= radius) {
        treesToRemove.push(tree.id);
      }
    });

    treesToRemove.forEach(treeId => this.removeTree(treeId));
  }

  // Helper method to get dominant species names
  getDominantSpeciesNames(): string[] {
    const distribution = this.getSpeciesDistribution();
    const sortedSpecies = Array.from(distribution.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3) // Top 3 species
      .map(([species]) => species);
    
    return sortedSpecies;
  }

  private validateUnderbrushDensity(density: number): void {
    if (density < 0 || density > 1) {
      throw new Error('Underbrush density must be between 0 and 1');
    }
  }
}