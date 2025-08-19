import { FeatureArea } from '../../../common/value-objects/FeatureArea';
import { MapFeature, FeatureId, FeatureCategory } from '../../../common/entities/MapFeature';
import { Tree, TreeType, EnhancedTree as TreePlant } from './Tree';
import { PlantSpecies } from './Plant';

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
 * Simplified Forest entity that works with the new vegetation system
 * Maintains backward compatibility while supporting enhanced features
 */
export class Forest extends MapFeature {
  private _trees: Map<string, Tree> = new Map();
  private _treePlants: Map<string, TreePlant> = new Map();

  constructor(
    id: FeatureId,
    name: string,
    area: FeatureArea,
    trees: (Tree | TreePlant)[] = [],
    public readonly dominantSpecies: (TreeType | PlantSpecies)[] = [],
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

  // Tree management - supports both legacy and new tree types
  addTree(tree: Tree | TreePlant): void {
    if (tree instanceof TreePlant) {
      if (!this.area.contains(tree.position.toPosition())) {
        throw new Error('Tree position must be within forest area');
      }
      this._treePlants.set(tree.id, tree);
    } else {
      // Legacy Tree interface
      if (!this.area.contains((tree.position as any).toPosition())) {
        throw new Error('Tree position must be within forest area');
      }
      this._trees.set(tree.id, tree);
    }
  }

  addTrees(trees: (Tree | TreePlant)[]): void {
    trees.forEach(tree => this.addTree(tree));
  }

  // Get all trees (combined legacy and new)
  getTrees(): (Tree | TreePlant)[] {
    return [...this._trees.values(), ...this._treePlants.values()];
  }

  // Get only TreePlant entities
  getTreePlants(): TreePlant[] {
    return Array.from(this._treePlants.values());
  }

  // Get only legacy Tree entities
  getLegacyTrees(): Tree[] {
    return Array.from(this._trees.values());
  }

  removeTree(treeId: string): void {
    this._trees.delete(treeId);
    this._treePlants.delete(treeId);
  }

  getTree(treeId: string): Tree | TreePlant | undefined {
    return this._trees.get(treeId) || this._treePlants.get(treeId);
  }

  // Forest properties
  get treeCount(): number {
    return this._trees.size + this._treePlants.size;
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
    
    // Count legacy trees
    this._trees.forEach(tree => {
      const species = tree.type.toString();
      distribution.set(species, (distribution.get(species) || 0) + 1);
    });

    // Count tree plants
    this._treePlants.forEach(tree => {
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
    
    const totalDensity = allTrees.reduce((sum, tree) => {
      if (tree instanceof TreePlant) {
        return sum + tree.canopyDensity;
      } else {
        return sum + (tree as any).canopyDensity;
      }
    }, 0);
    return totalDensity / allTrees.length;
  }

  // Simplified methods without complex tree interactions
  createForestGap(centerX: number, centerY: number, radius: number): void {
    // Remove trees in the gap area
    const treesToRemove: string[] = [];
    
    this.getTrees().forEach(tree => {
      const treePos = tree instanceof TreePlant ? tree.position : (tree as any).position;
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