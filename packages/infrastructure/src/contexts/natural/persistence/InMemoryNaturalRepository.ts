import { 
  Forest,
  Tree,
} from '@lazy-map/domain/contexts/natural/entities';
import { FeatureId } from '@lazy-map/domain/common/entities/MapFeature';

/**
 * In-memory repository for natural features
 */
export class InMemoryNaturalRepository {
  private forests = new Map<string, Forest>();
  private trees = new Map<string, Tree>();

  // Forest operations
  async saveForest(forest: Forest): Promise<void> {
    this.forests.set(forest.id, forest);
  }

  async getForest(id: FeatureId): Promise<Forest | null> {
    return this.forests.get(id) || null;
  }

  async getAllForests(): Promise<Forest[]> {
    return Array.from(this.forests.values());
  }

  async deleteForest(id: FeatureId): Promise<void> {
    this.forests.delete(id);
  }

  // Tree operations
  async saveTree(tree: Tree): Promise<void> {
    this.trees.set(tree.id, tree);
  }

  async getTree(id: FeatureId): Promise<Tree | null> {
    return this.trees.get(id) || null;
  }

  async getAllTrees(): Promise<Tree[]> {
    return Array.from(this.trees.values());
  }

  async deleteTree(id: FeatureId): Promise<void> {
    this.trees.delete(id);
  }

  // Bulk operations
  async getAllNaturalFeatures(): Promise<(Forest | Tree)[]> {
    return [
      ...this.forests.values(),
      ...this.trees.values(),
    ];
  }

  async clear(): Promise<void> {
    this.forests.clear();
    this.trees.clear();
  }
}