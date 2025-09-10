import { describe, it, expect } from 'vitest';
import { Position, Dimensions, FeatureArea } from '../common/value-objects';
import { Terrain, TerrainType } from '../contexts/relief/value-objects/TerrainType';

describe('Domain Value Objects', () => {
  describe('Position', () => {
    it('should create a valid position', () => {
      const position = new Position(5, 10);
      expect(position.x).toBe(5);
      expect(position.y).toBe(10);
    });

    it('should calculate distance correctly', () => {
      const pos1 = new Position(0, 0);
      const pos2 = new Position(3, 4);
      expect(pos1.distanceTo(pos2)).toBe(5); // 3-4-5 triangle
    });

    it('should validate coordinates', () => {
      expect(() => new Position(NaN, 5)).toThrow('Position coordinates must be finite numbers');
      expect(() => new Position(5, Infinity)).toThrow('Position coordinates must be finite numbers');
    });

    it('should check equality correctly', () => {
      const pos1 = new Position(5, 10);
      const pos2 = new Position(5, 10);
      const pos3 = new Position(6, 10);
      
      expect(pos1.equals(pos2)).toBe(true);
      expect(pos1.equals(pos3)).toBe(false);
    });
  });

  describe('Dimensions', () => {
    it('should create valid dimensions', () => {
      const dim = new Dimensions(10, 15);
      expect(dim.width).toBe(10);
      expect(dim.height).toBe(15);
      expect(dim.area).toBe(150);
    });

    it('should validate positive dimensions', () => {
      expect(() => new Dimensions(-5, 10)).toThrow('Dimensions must be positive numbers');
      expect(() => new Dimensions(10, 0)).toThrow('Dimensions must be positive numbers');
    });

    it('should validate integer dimensions', () => {
      expect(() => new Dimensions(10.5, 15)).toThrow('Dimensions must be integers');
    });

    it('should check if position is contained', () => {
      const dim = new Dimensions(10, 15);
      expect(dim.contains(new Position(5, 7))).toBe(true);
      expect(dim.contains(new Position(10, 7))).toBe(false); // Edge case
      expect(dim.contains(new Position(-1, 7))).toBe(false);
    });
  });

  describe('FeatureArea', () => {
    it('should create a valid feature area', () => {
      const pos = new Position(2, 3);
      const dim = new Dimensions(5, 7);
      const area = new FeatureArea(pos, dim);
      
      expect(area.x).toBe(2);
      expect(area.y).toBe(3);
      expect(area.width).toBe(5);
      expect(area.height).toBe(7);
      expect(area.left).toBe(2);
      expect(area.right).toBe(7);
      expect(area.top).toBe(3);
      expect(area.bottom).toBe(10);
    });

    it('should check if position is contained', () => {
      const area = new FeatureArea(new Position(2, 3), new Dimensions(5, 7));
      expect(area.contains(new Position(4, 6))).toBe(true);
      expect(area.contains(new Position(1, 6))).toBe(false);
      expect(area.contains(new Position(4, 2))).toBe(false);
    });

    it('should calculate intersection correctly', () => {
      const area1 = new FeatureArea(new Position(0, 0), new Dimensions(5, 5));
      const area2 = new FeatureArea(new Position(2, 2), new Dimensions(5, 5));
      const intersection = area1.intersection(area2);
      
      expect(intersection).not.toBeNull();
      expect(intersection!.x).toBe(2);
      expect(intersection!.y).toBe(2);
      expect(intersection!.width).toBe(3);
      expect(intersection!.height).toBe(3);
    });
  });

  describe('TerrainType', () => {
    it('should validate terrain types', () => {
      expect(TerrainType.GRASS).toBe('grass');
      expect(TerrainType.FOREST).toBe('forest');
      expect(TerrainType.MOUNTAIN).toBe('mountain');
      expect(TerrainType.WATER).toBe('water');
    });

    it('should create terrain with type and properties', () => {
      const terrain = new Terrain(TerrainType.GRASS, 1, true, false);
      expect(terrain.type).toBe(TerrainType.GRASS);
      expect(terrain.movementCost).toBe(1);
      expect(terrain.isPassable).toBe(true);
      expect(terrain.isWater).toBe(false);
    });
  });
});