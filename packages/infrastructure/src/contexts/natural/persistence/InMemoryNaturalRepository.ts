import { 
  Forest,
  TreePlant,
  FeatureId
} from '@lazy-map/domain';

/**
 * In-memory repository for natural features
 */
export class InMemoryNaturalRepository {
  private forests = new Map<string, Forest>();
  private trees = new Map<string, TreePlant>();

  // Forest operations
  async saveForest(forest: Forest): Promise<void> {
    this.forests.set(forest.id.value, forest);
  }

  async getForest(id: FeatureId): Promise<Forest | null> {
    return this.forests.get(id.value) || null;
  }

  async getAllForests(): Promise<Forest[]> {
    return Array.from(this.forests.values());
  }

  async deleteForest(id: FeatureId): Promise<void> {
    this.forests.delete(id.value);
  }

  // Tree operations
  async saveTree(tree: TreePlant): Promise<void> {
    this.trees.set(tree.id, tree);
  }

  async getTree(id: FeatureId): Promise<TreePlant | null> {
    return this.trees.get(id.value) || null;
  }

  async getAllTrees(): Promise<TreePlant[]> {
    return Array.from(this.trees.values());
  }

  async deleteTree(id: FeatureId): Promise<void> {
    this.trees.delete(id.value);
  }

  // Bulk operations
  async getAllNaturalFeatures(): Promise<(Forest | TreePlant)[]> {
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