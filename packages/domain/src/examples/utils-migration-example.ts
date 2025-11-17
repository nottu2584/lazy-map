/**
 * BEFORE AND AFTER DEMONSTRATION
 * 
 * This file shows how to migrate from generic utils to domain-driven design patterns
 * Following Clean Architecture and Domain-Driven Design principles
 */

// ============================================================================
// ❌ BEFORE: Generic Utils Pattern (AVOID THIS)
// ============================================================================

// Generic utils with scattered functionality (EXAMPLE - DON'T USE)
class SeedUtils {
  static generateFromString(input: string): number {
    // Business logic scattered in static methods
    if (!input) throw new Error('Empty input');
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      hash = ((hash << 5) - hash) + input.charCodeAt(i);
    }
    return hash;
  }
  
  static validate(seed: number): boolean {
    return Number.isInteger(seed) && seed >= 0;
  }
}

// Mathematical utils dump (EXAMPLE - DON'T USE)
class MathUtils {
  static clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }
  
  static lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }
}

// ID generation utils (EXAMPLE - DON'T USE)
class IdUtils {
  static generateFeatureId(type: string, seed: number): string {
    return `${type}-${seed}-${Math.random()}`;
  }
}

// ============================================================================
// ✅ AFTER: Domain-Driven Design Pattern (RECOMMENDED)
// ============================================================================

import { 
  Seed, 
  Coordinates, 
  Range, 
  NoiseGenerator 
} from '../common/value-objects';

import { 
  RandomGenerationService, 
  EntityIdGenerationService,
  MathematicalDomainService 
} from '../common/services';

/**
 * Example Usage: Map Generation Use Case
 * Shows how domain objects replace generic utils
 */
export class MapGenerationExample {
  private randomService: RandomGenerationService;
  private idService: EntityIdGenerationService;
  private noiseGenerator: NoiseGenerator;

  constructor(seedInput: string) {
    // Create domain value objects
    const seed = Seed.fromString(seedInput);
    
    // Inject domain services
    this.randomService = new RandomGenerationService(seed);
    this.idService = new EntityIdGenerationService(seed);
    this.noiseGenerator = NoiseGenerator.create(seed.getValue());
  }

  /**
   * Generate terrain using domain-driven approach
   */
  generateTerrain(width: number, height: number) {
    // Validate using domain rules
    if (!MathematicalDomainService.validateMapDimensions(width, height)) {
      throw new Error('Invalid map dimensions');
    }

    // Use domain services instead of static utils
    const terrainDistribution = this.randomService.generateTerrainDistribution();
    const mapId = this.idService.generateMapId();
    
    // Use value objects for mathematical operations
    const elevationRange = Range.create(0, 100);
    const terrain = [];

    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        const coordinates = Coordinates.create(x, y);
        
        // Generate noise using domain object
        const rawNoise = this.noiseGenerator.generateOctaves(x, y, 4);
        const elevation = elevationRange.lerp(rawNoise);
        
        terrain.push({
          id: this.idService.generateEntityId('terrain'),
          coordinates,
          elevation,
          terrainType: this.determineTerrainType(elevation, terrainDistribution)
        });
      }
    }

    return {
      mapId,
      dimensions: { width, height },
      terrain,
      distribution: terrainDistribution
    };
  }

  private determineTerrainType(elevation: number, distribution: any): string {
    const waterThreshold = distribution.water * 100;
    const mountainThreshold = (1 - distribution.mountain) * 100;
    
    if (elevation < waterThreshold) return 'water';
    if (elevation > mountainThreshold) return 'mountain';
    return 'land';
  }
}

// ============================================================================
// 📊 COMPARISON SUMMARY
// ============================================================================

/**
 * Utils Pattern Problems:
 * ❌ Static methods hard to test and mock
 * ❌ Business logic scattered across utility classes  
 * ❌ No encapsulation of domain rules
 * ❌ Generic names that don't express domain concepts
 * ❌ Difficult to extend and maintain
 * ❌ Violates Single Responsibility Principle
 * 
 * Domain-Driven Design Benefits:
 * ✅ Value objects encapsulate domain concepts (Seed, Coordinates, Range)
 * ✅ Domain services handle complex operations (RandomGenerationService)
 * ✅ Proper validation and error handling
 * ✅ Easy to test with dependency injection
 * ✅ Clear separation of concerns
 * ✅ Expressive domain language
 * ✅ Follows Clean Architecture principles
 * ✅ Extensible and maintainable
 */