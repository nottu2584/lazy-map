import { describe, it, expect } from 'vitest';
import {
  MapGrid,
  MapId
} from '../map/entities/MapGrid';
import { MapTile } from '../map/entities/MapTile';
import { Position, Dimensions, SubTilePosition } from '../common/value-objects';

describe('Basic Domain Entities', () => {
  describe('MapId', () => {
    it('should create a valid map ID', () => {
      const id = new MapId('test-map-123');
      expect(id.value).toBe('test-map-123');
    });
  });

  describe('MapGrid', () => {
    it('should create a map with valid dimensions', () => {
      const map = MapGrid.createEmpty('Test Map', new Dimensions(10, 10), 32, 'Test Author');
      
      expect(map.name).toBe('Test Map');
      expect(map.dimensions.width).toBe(10);
      expect(map.dimensions.height).toBe(10);
      expect(map.cellSize).toBe(32);
    });
  });

  describe('MapTile', () => {
    it('should create a tile with position', () => {
      const position = new Position(5, 7);
      const tile = new MapTile(position);
      
      expect(tile.position).toBe(position);
    });
  });

  describe('SubTilePosition', () => {
    it('should create valid sub-tile positions', () => {
      const position = new SubTilePosition(5, 10, 0.5, 0.7);
      
      expect(position.tileX).toBe(5);
      expect(position.tileY).toBe(10);
      expect(position.offsetX).toBe(0.5);
      expect(position.offsetY).toBe(0.7);
      expect(position.x).toBe(5.5);
      expect(position.y).toBe(10.7);
    });

    it('should validate tile coordinates are integers', () => {
      expect(() => new SubTilePosition(5.5, 10, 0.5, 0.5)).toThrow('Tile coordinates must be integers');
    });

    it('should validate offset coordinates are between 0 and 1', () => {
      expect(() => new SubTilePosition(5, 10, 1.5, 0.5)).toThrow('offsetX must be between 0 and 1');
      expect(() => new SubTilePosition(5, 10, 0.5, -0.1)).toThrow('offsetY must be between 0 and 1');
    });
  });
});
