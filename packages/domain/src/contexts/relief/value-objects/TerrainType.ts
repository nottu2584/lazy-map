/**
 * Domain representation of terrain types
 */
export enum TerrainType {
  GRASS = 'grass',
  FOREST = 'forest', 
  MOUNTAIN = 'mountain',
  WATER = 'water',
  DESERT = 'desert',
  SNOW = 'snow',
  SWAMP = 'swamp',
  ROCK = 'rock',
  CAVE = 'cave',
  ROAD = 'road',
  BUILDING = 'building',
  WALL = 'wall',
}

/**
 * Terrain type with properties and validation
 */
export class Terrain {
  constructor(
    public readonly type: TerrainType,
    public readonly movementCost: number = 1,
    public readonly isPassable: boolean = true,
    public readonly isWater: boolean = false
  ) {
    this.validateTerrain();
  }

  private validateTerrain(): void {
    if (this.movementCost < 0) {
      throw new Error('Movement cost cannot be negative');
    }
  }

  static grass(): Terrain {
    return new Terrain(TerrainType.GRASS, 1, true, false);
  }

  static forest(): Terrain {
    return new Terrain(TerrainType.FOREST, 2, true, false);
  }

  static mountain(): Terrain {
    return new Terrain(TerrainType.MOUNTAIN, 3, true, false);
  }

  static water(): Terrain {
    return new Terrain(TerrainType.WATER, Infinity, false, true);
  }

  static desert(): Terrain {
    return new Terrain(TerrainType.DESERT, 2, true, false);
  }

  static road(): Terrain {
    return new Terrain(TerrainType.ROAD, 0.5, true, false);
  }

  static building(): Terrain {
    return new Terrain(TerrainType.BUILDING, Infinity, false, false);
  }

  static wall(): Terrain {
    return new Terrain(TerrainType.WALL, Infinity, false, false);
  }

  equals(other: Terrain): boolean {
    return this.type === other.type;
  }

  toString(): string {
    return `Terrain(${this.type})`;
  }
}