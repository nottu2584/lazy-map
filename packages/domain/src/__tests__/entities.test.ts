import { describe, it, expect } from 'vitest';
import { 
  GridMap, 
  MapId, 
  MapMetadata
} from '../map/entities/GridMap';
import { MapTile } from '../map/entities/MapTile';
import {
  Tree,
  TreeId,
  TreeType,
  TreeSize,
  TreeHealth,
  TreeAge,
  TreeDiameter,
  TreeProperties
} from '../contexts/natural/entities/Tree';
import { Forest } from '../contexts/natural/entities/Forest';
import { FeatureId } from '../common/entities/MapFeature';
import { Position, Dimensions, FeatureArea } from '../common/value-objects';
import { SubTilePosition } from '../common/value-objects/SubTilePosition';
import { Terrain } from '../contexts/relief/value-objects/TerrainType';

describe('Domain Entities', () => {
  describe('MapId', () => {
    it('should create a valid map ID', () => {
      const id = new MapId('test-map-123');
      expect(id.value).toBe('test-map-123');
    });

    it('should generate unique IDs', () => {
      const id1 = MapId.generate();
      const id2 = MapId.generate();
      expect(id1.value).not.toBe(id2.value);
      expect(id1.value).toMatch(/^map_[a-z0-9]{9}$/);
    });

    it('should validate non-empty ID', () => {
      expect(() => new MapId('')).toThrow('MapId cannot be empty');
      expect(() => new MapId('   ')).toThrow('MapId cannot be empty');
    });
  });

  describe('MapTile', () => {
    it('should create a tile with default terrain', () => {
      const position = new Position(5, 10);
      const tile = new MapTile(position);
      
      expect(tile.position).toBe(position);
      expect(tile.terrainType).toBe('grass');
      expect(tile.heightMultiplier).toBe(1.0);
      expect(tile.isBlocked).toBe(false);
    });

    it('should change terrain correctly', () => {
      const tile = new MapTile(new Position(0, 0));
      const waterTerrain = Terrain.water();
      
      tile.changeTerrain(waterTerrain);
      expect(tile.terrainType).toBe('water');
      expect(tile.isBlocked).toBe(true);
    });

    it('should manage features correctly', () => {
      const tile = new MapTile(new Position(0, 0));
      
      tile.setPrimaryFeature('feature-1');
      expect(tile.primaryFeatureId).toBe('feature-1');
      
      tile.addMixedFeature('feature-2');
      tile.addMixedFeature('feature-3');
      expect(tile.mixedFeatureIds).toContain('feature-2');
      expect(tile.mixedFeatureIds).toContain('feature-3');
      expect(tile.hasFeature('feature-2')).toBe(true);
      
      tile.removeMixedFeature('feature-2');
      expect(tile.hasFeature('feature-2')).toBe(false);
    });

    it('should validate height multiplier', () => {
      const position = new Position(0, 0);
      expect(() => new MapTile(position, Terrain.grass(), -1)).toThrow('Height multiplier cannot be negative');
      expect(() => new MapTile(position, Terrain.grass(), NaN)).toThrow('Height multiplier must be a finite number');
    });
  });

  describe('GridMap', () => {
    it('should create an empty map correctly', () => {
      const dimensions = new Dimensions(3, 4);
      const map = GridMap.createEmpty('Test Map', dimensions, 32, 'test-author');
      
      expect(map.name).toBe('Test Map');
      expect(map.dimensions).toBe(dimensions);
      expect(map.cellSize).toBe(32);
      expect(map.metadata.author).toBe('test-author');
    });

    it('should get and set tiles correctly', () => {
      const map = GridMap.createEmpty('Test', new Dimensions(3, 3));
      const position = new Position(1, 2);
      const newTile = new MapTile(position, Terrain.forest());
      
      map.setTile(position, newTile);
      const retrievedTile = map.getTile(position);
      
      expect(retrievedTile).toBe(newTile);
      expect(retrievedTile!.terrainType).toBe('forest');
    });

    it('should handle out-of-bounds positions', () => {
      const map = GridMap.createEmpty('Test', new Dimensions(3, 3));
      
      expect(map.getTile(new Position(-1, 0))).toBeNull();
      expect(map.getTile(new Position(3, 0))).toBeNull();
      expect(() => map.setTile(new Position(5, 5), new MapTile(new Position(5, 5)))).toThrow();
    });

    it('should manage features correctly', () => {
      const map = GridMap.createEmpty('Test', new Dimensions(3, 3));
      
      map.addFeature('feature-1');
      expect(map.hasFeature('feature-1')).toBe(true);
      expect(map.featureIds).toContain('feature-1');
      
      map.removeFeature('feature-1');
      expect(map.hasFeature('feature-1')).toBe(false);
    });
  });

  describe('Tree', () => {
    it('should create a tree with valid properties', () => {
      const id = TreeId.generate();
      const position = new SubTilePosition(5, 10, 0.5, 0.7);
      const health = new TreeHealth(0.8);
      const age = new TreeAge(25);
      const diameter = new TreeDiameter(1.2);
      const properties = new TreeProperties();
      
      const tree = new Tree(
        id,
        TreeType.OAK,
        TreeSize.MATURE,
        position,
        health,
        age,
        diameter,
        15.5,
        0.8,
        properties
      );
      
      expect(tree.id).toBe(id);
      expect(tree.type).toBe(TreeType.OAK);
      expect(tree.size).toBe(TreeSize.MATURE);
      expect(tree.position).toBe(position);
      expect(tree.health.value).toBe(0.8);
      expect(tree.age.value).toBe(25);
      expect(tree.diameter.value).toBe(1.2);
      expect(tree.height).toBe(15.5);
      expect(tree.canopyDensity).toBe(0.8);
    });

    it('should check if tree occupies a tile', () => {
      // Tree at center (5.5, 10.5) with diameter 1.0 spans multiple tiles
      const tree = new Tree(
        TreeId.generate(),
        TreeType.OAK,
        TreeSize.MATURE,
        new SubTilePosition(5, 10, 0.5, 0.5),
        new TreeHealth(1.0),
        new TreeAge(50),
        new TreeDiameter(1.0),
        20,
        0.8,
        new TreeProperties()
      );
      
      expect(tree.occupiesTile(5, 10)).toBe(true);
      
      // Test edge cases with different tree sizes
      const smallTree = new Tree(
        TreeId.generate(),
        TreeType.OAK,
        TreeSize.SAPLING,
        new SubTilePosition(2, 3, 0.5, 0.5),
        new TreeHealth(1.0),
        new TreeAge(5),
        new TreeDiameter(0.3),
        5,
        0.6,
        new TreeProperties()
      );
      
      expect(smallTree.occupiesTile(2, 3)).toBe(true);
      expect(smallTree.occupiesTile(1, 3)).toBe(false); // Too far for small tree
    });

    it('should allow trees to graft together', () => {
      const tree1 = new Tree(
        TreeId.generate(),
        TreeType.OAK,
        TreeSize.MATURE,
        new SubTilePosition(5, 10, 0.3, 0.3),
        new TreeHealth(0.9),
        new TreeAge(50),
        new TreeDiameter(0.8),
        20,
        0.8,
        new TreeProperties()
      );
      
      const tree2 = new Tree(
        TreeId.generate(),
        TreeType.OAK,
        TreeSize.MATURE,
        new SubTilePosition(5, 10, 0.7, 0.7),
        new TreeHealth(0.8),
        new TreeAge(45),
        new TreeDiameter(0.9),
        18,
        0.7,
        new TreeProperties()
      );
      
      expect(tree1.canGraftWith(tree2, 1.0)).toBe(true);
      
      tree1.graftWith(tree2);
      expect(tree1.properties.isInosculated()).toBe(true);
      expect(tree1.health.value).toBeGreaterThan(0.9); // Health boost from grafting
    });

    it('should validate tree properties', () => {
      const id = TreeId.generate();
      const position = new SubTilePosition(0, 0, 0.5, 0.5);
      const health = new TreeHealth(1.0);
      const age = new TreeAge(25);
      const diameter = new TreeDiameter(1.0);
      const properties = new TreeProperties();
      
      expect(() => new Tree(id, TreeType.OAK, TreeSize.MATURE, position, health, age, diameter, -5, 0.8, properties))
        .toThrow('Tree height must be positive');
        
      expect(() => new Tree(id, TreeType.OAK, TreeSize.MATURE, position, health, age, diameter, 15, 1.5, properties))
        .toThrow('Canopy density must be between 0 and 1');
    });
  });

  describe('Forest', () => {
    it('should create a forest with trees', () => {
      const area = new FeatureArea(new Position(0, 0), new Dimensions(5, 5));
      const tree1 = createTestTree(new SubTilePosition(1, 1, 0.5, 0.5));
      const tree2 = createTestTree(new SubTilePosition(2, 2, 0.3, 0.7));
      
      const forest = new Forest(
        FeatureId.generate(),
        'Test Forest',
        area,
        [tree1, tree2],
        [TreeType.OAK, TreeType.MAPLE],
        0.6
      );
      
      expect(forest.name).toBe('Test Forest');
      expect(forest.treeCount).toBe(2);
      expect(forest.dominantSpecies).toContain(TreeType.OAK);
      expect(forest.underbrushDensity).toBe(0.6);
    });

    it('should manage trees correctly', () => {
      const area = new FeatureArea(new Position(0, 0), new Dimensions(5, 5));
      const forest = new Forest(FeatureId.generate(), 'Test Forest', area);
      
      const tree = createTestTree(new SubTilePosition(2, 2, 0.5, 0.5));
      forest.addTree(tree);
      
      expect(forest.treeCount).toBe(1);
      expect(forest.getTree(tree.id.value)).toBe(tree);
      
      forest.removeTree(tree.id.value);
      expect(forest.treeCount).toBe(0);
      expect(forest.getTree(tree.id.value)).toBeUndefined();
    });

    it('should calculate forest density correctly', () => {
      const area = new FeatureArea(new Position(0, 0), new Dimensions(2, 2)); // 4 tiles
      const forest = new Forest(FeatureId.generate(), 'Test Forest', area);
      
      // Add 1 tree (0.25 trees per tile = sparse)
      forest.addTree(createTestTree(new SubTilePosition(0, 0, 0.5, 0.5)));
      expect(forest.forestDensity).toBe('sparse');
      
      // Add another tree (0.5 trees per tile = moderate)
      forest.addTree(createTestTree(new SubTilePosition(1, 1, 0.5, 0.5)));
      expect(forest.forestDensity).toBe('moderate');
    });

    it('should validate tree positions within forest area', () => {
      const area = new FeatureArea(new Position(0, 0), new Dimensions(3, 3));
      const forest = new Forest(FeatureId.generate(), 'Test Forest', area);
      
      const treeInBounds = createTestTree(new SubTilePosition(1, 1, 0.5, 0.5));
      const treeOutOfBounds = createTestTree(new SubTilePosition(5, 5, 0.5, 0.5));
      
      expect(() => forest.addTree(treeInBounds)).not.toThrow();
      expect(() => forest.addTree(treeOutOfBounds)).toThrow('Tree position must be within forest area');
    });
  });
});

// Helper function to create test trees
function createTestTree(position: SubTilePosition): Tree {
  return new Tree(
    TreeId.generate(),
    TreeType.OAK,
    TreeSize.MATURE,
    position,
    new TreeHealth(0.8),
    new TreeAge(50),
    new TreeDiameter(1.0),
    20,
    0.7,
    new TreeProperties()
  );
}