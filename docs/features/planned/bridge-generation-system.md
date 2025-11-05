# Bridge Generation System

> Implement proper bridge entities and generation logic following domain-driven design patterns

## Status & Metadata

- **Status**: Planned
- **Priority**: Medium (Infrastructure enhancement)
- **Effort**: 1-2 weeks
- **Architecture Impact**: Domain/Infrastructure (Entity creation + Generation logic)
- **Owner**: TBD
- **Related**: `packages/domain/src/contexts/artificial/entities/Bridge.ts`

## Executive Summary

The current structures layer generates bridge locations but doesn't create proper Bridge entities that extend MapFeature. This feature will implement comprehensive bridge generation with proper domain entities, material selection, and structural design based on terrain context.

## Problem & Goals

### Problem Statement

Current issues with bridge generation:

1. **Type Mismatch**:
   - `StructuresLayerData.bridges` expects `Bridge[]` (full entities)
   - `StructuresLayer` generates simple `BridgeLocation` objects
   - Bridge extends MapFeature with 40+ properties and methods
   - Current implementation doesn't satisfy the domain contract

2. **Missing Bridge Logic**:
   - No proper bridge material selection based on development level
   - No structural type determination (arch, beam, suspension)
   - No weight capacity calculation
   - No condition/degradation system
   - No controlled access logic (toll bridges, drawbridges)

3. **Incomplete Integration**:
   - Bridges exist only as tiles, not as first-class entities
   - Can't query bridge properties (capacity, condition, toll)
   - No relationship with road network entities
   - Missing tactical implications (choke points, cover)

### Goals

**Phase 1**: Create Bridge Factory
- Implement `BridgeFactory` class for entity creation
- Map development levels to bridge materials
- Calculate bridge dimensions from terrain
- Generate appropriate FeatureIds

**Phase 2**: Enhance Bridge Generation
- Detect optimal bridge locations (shortest crossing)
- Select structure type based on span and materials
- Calculate weight capacity from materials and structure
- Add condition based on age and maintenance

**Phase 3**: Tactical Integration
- Mark bridges as tactical choke points
- Add cover properties for bridge structures
- Implement controlled access (drawbridges, gates)
- Calculate movement costs for crossing

### Out of Scope
- Dynamic bridge destruction during gameplay
- Bridge construction/repair mechanics
- Complex multi-span bridges
- Moving parts animation (drawbridges)

## Current State

### Current Implementation (StructuresLayer)

```typescript
// Simple bridge location tracking
interface BridgeLocation {
  position: { x: number; y: number };
  material: MaterialType;
  length: number;
  direction: 'horizontal' | 'vertical';
}

// Returns empty array to satisfy interface
generate(): StructuresLayerData {
  return {
    buildings: [...],
    roads: {...},
    bridges: [], // Empty - not implemented
    tiles: [...]
  };
}
```

### Domain Expectation (Bridge Entity)

```typescript
export class Bridge extends MapFeature {
  constructor(
    id: FeatureId,
    name: string,
    area: SpatialBounds,
    material: BridgeMaterial,
    structure: BridgeStructure,
    length: number,
    width: number,
    maxWeight: number,
    elevation: number,
    condition: number,
    controlledAccess: boolean,
    // ... 30+ more inherited properties
  )
}
```

## Proposed Solution

### Phase 1: Bridge Factory

```typescript
export class BridgeFactory {
  /**
   * Create bridge entity from location data
   */
  static createBridge(
    location: BridgeLocation,
    context: TacticalMapContext,
    seed: Seed
  ): Bridge {
    const id = FeatureId.generate('bridge', seed, location.position);
    const name = this.generateBridgeName(location, context);
    const bounds = this.calculateBounds(location);
    const material = this.selectMaterial(context.development);
    const structure = this.selectStructure(location.length, material);
    const capacity = this.calculateCapacity(structure, material);

    return new Bridge(
      id,
      name,
      bounds,
      material,
      structure,
      location.length * 5, // Convert tiles to feet
      10, // Standard width
      capacity,
      5, // Standard elevation above water
      this.calculateCondition(context),
      this.shouldHaveControlledAccess(context, location)
    );
  }

  private static selectMaterial(development: DevelopmentLevel): BridgeMaterial {
    switch (development) {
      case DevelopmentLevel.WILDERNESS:
        return BridgeMaterial.ROPE;
      case DevelopmentLevel.RURAL:
        return BridgeMaterial.WOOD;
      case DevelopmentLevel.VILLAGE:
        return Math.random() > 0.5 ? BridgeMaterial.WOOD : BridgeMaterial.STONE;
      case DevelopmentLevel.TOWN:
        return BridgeMaterial.STONE;
      case DevelopmentLevel.CITY:
        return Math.random() > 0.3 ? BridgeMaterial.STONE : BridgeMaterial.METAL;
      default:
        return BridgeMaterial.WOOD;
    }
  }

  private static selectStructure(
    lengthTiles: number,
    material: BridgeMaterial
  ): BridgeStructure {
    const lengthFeet = lengthTiles * 5;

    // Short spans - simple beam
    if (lengthFeet <= 20) {
      return BridgeStructure.BEAM;
    }

    // Medium spans - arch if stone
    if (lengthFeet <= 50 && material === BridgeMaterial.STONE) {
      return BridgeStructure.ARCH;
    }

    // Long spans - suspension if possible
    if (lengthFeet > 50 && material !== BridgeMaterial.STONE) {
      return BridgeStructure.SUSPENSION;
    }

    // Default to beam
    return BridgeStructure.BEAM;
  }
}
```

### Phase 2: Enhanced Generation

```typescript
export class EnhancedBridgeGenerator {
  /**
   * Find optimal bridge locations
   */
  findBridgeLocations(
    roads: RoadNetwork,
    hydrology: HydrologyLayerData,
    topography: TopographyLayerData
  ): BridgeLocation[] {
    const locations: BridgeLocation[] = [];

    for (const segment of roads.segments) {
      const crossings = this.findWaterCrossings(segment, hydrology);

      for (const crossing of crossings) {
        // Find narrowest point nearby
        const optimal = this.findOptimalCrossing(
          crossing,
          hydrology,
          topography
        );

        // Check if bridge is needed (not fordable)
        if (this.needsBridge(optimal, hydrology)) {
          locations.push(this.planBridge(optimal, hydrology));
        }
      }
    }

    return locations;
  }

  private findOptimalCrossing(
    crossing: CrossingPoint,
    hydrology: HydrologyLayerData,
    topography: TopographyLayerData
  ): CrossingPoint {
    // Search radius for better crossing
    const searchRadius = 5;
    let bestCrossing = crossing;
    let minWidth = this.measureWaterWidth(crossing, hydrology);

    for (let dy = -searchRadius; dy <= searchRadius; dy++) {
      for (let dx = -searchRadius; dx <= searchRadius; dx++) {
        const candidate = {
          x: crossing.x + dx,
          y: crossing.y + dy
        };

        // Check if banks are stable
        if (!this.hasStableBanks(candidate, topography)) continue;

        const width = this.measureWaterWidth(candidate, hydrology);
        if (width < minWidth) {
          minWidth = width;
          bestCrossing = candidate;
        }
      }
    }

    return bestCrossing;
  }
}
```

### Phase 3: Tactical Properties

```typescript
export class TacticalBridgeAnalyzer {
  /**
   * Analyze bridge tactical properties
   */
  analyzeTacticalValue(bridge: Bridge): TacticalBridgeProperties {
    return {
      isChokePoint: this.isChokePoint(bridge),
      providesCover: this.calculateCover(bridge),
      movementCost: this.calculateMovementCost(bridge),
      canBeDestroyed: this.isDestructible(bridge),
      controlsAccess: bridge.controlledAccess,
      visibility: this.calculateVisibility(bridge)
    };
  }

  private isChokePoint(bridge: Bridge): boolean {
    // Bridges are natural choke points if they're the only crossing
    return bridge.length > 20; // Long bridges are key choke points
  }

  private calculateCover(bridge: Bridge): CoverLevel {
    switch (bridge.structure) {
      case BridgeStructure.COVERED:
        return CoverLevel.TOTAL;
      case BridgeStructure.ARCH:
        return CoverLevel.PARTIAL; // Can hide under arches
      case BridgeStructure.SUSPENSION:
        return CoverLevel.NONE; // Too open
      default:
        return CoverLevel.MINIMAL;
    }
  }
}
```

## Implementation Plan

### Phase 1: Basic Factory (Week 1)
1. Create `BridgeFactory` class
2. Implement material selection logic
3. Add structure type determination
4. Generate proper Bridge entities
5. Update StructuresLayer to use factory

### Phase 2: Enhanced Generation (Week 2)
1. Implement optimal crossing detection
2. Add ford vs bridge decision logic
3. Calculate bridge dimensions properly
4. Add bridge naming system
5. Integrate with road network

### Phase 3: Tactical Integration (Week 3)
1. Add tactical property analysis
2. Implement choke point detection
3. Calculate cover and concealment
4. Add controlled access logic
5. Update tactical map tiles

## Migration Strategy

### Step 1: Add Factory (Non-breaking)
```typescript
// Add factory alongside existing code
const bridgeLocations = this.findBridgeLocations(...);
const bridges = bridgeLocations.map(loc =>
  BridgeFactory.createBridge(loc, context, seed)
);
```

### Step 2: Update Return Type
```typescript
// Return actual Bridge entities
return {
  buildings,
  roads,
  bridges, // Now Bridge[] instead of empty array
  tiles
};
```

### Step 3: Remove Legacy Code
```typescript
// Remove simple BridgeLocation interface
// Remove temporary bridge generation code
// Rely fully on new system
```

## Success Criteria

1. **Type Safety**: StructuresLayer returns valid Bridge[] array
2. **Proper Entities**: All bridges are full MapFeature entities
3. **Material Logic**: Bridge materials match development level
4. **Structural Design**: Bridge types appropriate for spans
5. **Tactical Integration**: Bridges affect movement and combat
6. **Performance**: Generation remains under 100ms for 100x100 map

## Technical Considerations

### Memory Impact
- Bridge entity: ~500 bytes (MapFeature base + properties)
- Typical map: 2-5 bridges
- Total overhead: ~2.5KB (negligible)

### Performance Optimization
- Cache bridge calculations during generation
- Reuse FeatureId generation logic
- Batch spatial bounds calculations

### Compatibility
- Maintain backward compatibility with existing tile data
- Bridge entities supplement, don't replace, tile representation
- Allow both entity and tile queries for flexibility

## Related Systems

- **Road Network**: Bridges connect road segments
- **Hydrology Layer**: Determines where bridges needed
- **Tactical System**: Uses bridges for choke points
- **Building Generation**: Similar entity creation pattern
- **Map Features**: Bridges extend MapFeature base class

## Future Enhancements

After this feature is complete, consider:

1. **Dynamic Bridges**: Drawbridges that can open/close
2. **Bridge Damage**: Structural damage affecting capacity
3. **Toll System**: Economic aspects of controlled bridges
4. **Multi-Span**: Complex bridges with multiple segments
5. **Construction**: Allow runtime bridge building