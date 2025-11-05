# Building Damage and Condition System (ARCHIVED)

> **Status**: Archived - Superseded by `/docs/features/planned/building-condition-tactical-system.md`
> 
> **Archived Date**: November 5, 2025
> 
> **Reason**: This document proposed a comprehensive damage system with advanced features. The planned feature implements a **simplified, focused approach** for Phase 1-4 (tactical integration only). This document is preserved as **design reference for Phase 5+** (advanced damage tracking, visual variations, dynamic systems).

---

## Coverage Analysis

### What Was Implemented in Tactical Feature

✅ **ConditionLevel enum** (EXCELLENT, GOOD, FAIR, POOR, RUINED)
✅ **Building.getConditionLevel()** - Maps numeric condition (0-1) to categorical level
✅ **Cover modifiers** - Building.getCoverModifier() affects tactical cover
✅ **Passability rules** - Building.hasPassableGaps() for movement through damaged buildings
✅ **Line of sight** - Building.blocksLineOfSight() for visibility through gaps
✅ **Movement costs** - Building.getPassThroughCost() for terrain difficulty
✅ **Tactical integration** - Condition affects TacticalMapTile cover system

### What Was Deferred (Phase 5+)

❌ **DamageType enum** - Specific damage sources (fire, siege, vegetation, water, foundation)
❌ **BuildingCondition class** - Separate class tracking integrity, weathering, damage history
❌ **Damage application** - applyDamage() method for specific sources
❌ **Age-based degradation** - ageByYears() with material-specific decay
❌ **Maintenance tracking** - lastMaintenance property
❌ **Visual sprite variations** - 5 condition variants per material type
❌ **Dynamic systems** - Repair mechanics, structural collapse, runtime degradation

**Rationale for Simplification**: 
- Follows **map domain pattern** (numeric primitive + methods, not complex value object)
- Easier to implement and test
- Sufficient for tactical gameplay needs
- Can be extended later without breaking changes
- Avoids premature optimization

---

## Original Document Content

### Overview
A comprehensive system for representing building damage, degradation, and ruins in the tactical map generation system.

### Current State (Nov 2025)
- Buildings have a `condition` property (0-1 scale) representing overall integrity
- Building.isRuin() returns true when condition < 0.2 (20% integrity)
- Materials have durability and weather resistance properties
- BuildingMaterial.getDegradation() calculates decay over time

### Proposed Enhancement

#### Core Concept
Separate material type from condition state. A stone wall is still stone whether pristine or crumbling.

#### Damage System Design

##### 1. Building Condition Class
```typescript
class BuildingCondition {
  private integrity: number;        // 0-1 (0 = ruin, 1 = perfect)
  private weathering: number;       // 0-1 (visual aging)
  private structuralDamage: DamageType[];
  private lastMaintenance: number;  // Years since last repair

  constructor(integrity: number = 1.0) {
    this.integrity = integrity;
    this.weathering = 0;
    this.structuralDamage = [];
    this.lastMaintenance = 0;
  }

  getConditionLevel(): ConditionLevel {
    if (this.integrity > 0.8) return ConditionLevel.EXCELLENT;
    if (this.integrity > 0.6) return ConditionLevel.GOOD;
    if (this.integrity > 0.4) return ConditionLevel.FAIR;
    if (this.integrity > 0.2) return ConditionLevel.POOR;
    return ConditionLevel.RUINED;
  }

  // Apply damage from specific source
  applyDamage(type: DamageType, severity: number): void {
    this.structuralDamage.push(type);
    this.integrity = Math.max(0, this.integrity - severity);
  }

  // Natural degradation over time
  ageByYears(years: number, material: BuildingMaterial): void {
    const degradation = material.getDegradation(years, this.weathering);
    this.integrity = Math.max(0, this.integrity - degradation);
    this.weathering = Math.min(1, this.weathering + (years * 0.02));
  }
}
```

##### 2. Damage Types
```typescript
enum DamageType {
  CRACKS = 'cracks',                     // Minor structural cracks
  HOLES = 'holes',                       // Gaps/holes in walls
  MISSING_SECTIONS = 'missing_sections', // Large portions missing
  VEGETATION_OVERGROWTH = 'vegetation',  // Vines, roots breaking walls
  FIRE_DAMAGE = 'fire_damage',          // Burn marks, weakened structure
  WATER_DAMAGE = 'water_damage',        // Erosion, rot (for wood)
  SIEGE_DAMAGE = 'siege_damage',        // Battle damage
  FOUNDATION_FAILURE = 'foundation'      // Settling, collapse risk
}
```

##### 3. Condition Levels
```typescript
enum ConditionLevel {
  EXCELLENT = 'excellent',   // 80-100% - New or well-maintained
  GOOD = 'good',            // 60-80% - Minor wear, fully functional
  FAIR = 'fair',            // 40-60% - Visible damage, needs repair
  POOR = 'poor',            // 20-40% - Major damage, partially collapsed
  RUINED = 'ruined'         // 0-20% - Mostly collapsed, ruins
}
```

### Tactical Implications

#### Cover Modifiers
```typescript
getCoverModifier(): number {
  const baseLevel = this.material.getCoverLevel();
  const condition = this.condition.getConditionLevel();

  switch(condition) {
    case ConditionLevel.EXCELLENT: return 1.0;    // Full cover
    case ConditionLevel.GOOD: return 0.9;         // 90% effectiveness
    case ConditionLevel.FAIR: return 0.7;         // 70% effectiveness
    case ConditionLevel.POOR: return 0.4;         // 40% effectiveness
    case ConditionLevel.RUINED: return 0.1;       // 10% effectiveness
  }
}
```

#### Passability
- EXCELLENT/GOOD: Walls block movement
- FAIR: May have climbable sections (DC 15)
- POOR: Gaps allow passage (difficult terrain)
- RUINED: Freely passable (difficult terrain)

#### Line of Sight
- Holes and gaps in POOR/RUINED walls allow shooting through
- Provides concealment but not full cover

### Visual Representation

#### Sprite Variations
Each material type would have 5 condition variants:
1. Pristine (new construction)
2. Weathered (shows age but solid)
3. Damaged (cracks, missing mortar)
4. Heavily damaged (holes, partial collapse)
5. Ruins (mostly collapsed)

#### Dynamic Features
- Vegetation overgrowth on old buildings
- Burn marks from fire damage
- Water stains and erosion patterns
- Battle damage (arrow marks, siege damage)

### Generation Rules

#### Age-Based Degradation
```typescript
function generateBuildingCondition(
  age: number,
  material: BuildingMaterial,
  maintained: boolean,
  seed: Seed
): BuildingCondition {
  const condition = new BuildingCondition();

  // Base degradation from age
  const baseYears = maintained ? age * 0.3 : age;
  condition.ageByYears(baseYears, material);

  // Random events based on seed
  const rng = seed.deriveRandom('damage');

  // 20% chance of fire damage for old wooden buildings
  if (material.getType() === MaterialType.TIMBER_FRAME && age > 50) {
    if (rng.next() < 0.2) {
      condition.applyDamage(DamageType.FIRE_DAMAGE, 0.3);
    }
  }

  // Vegetation for abandoned buildings
  if (!maintained && age > 20) {
    condition.applyDamage(DamageType.VEGETATION_OVERGROWTH, 0.1);
  }

  return condition;
}
```

#### Settlement Context
- Active settlements: Buildings maintained (slower degradation)
- Abandoned settlements: Rapid degradation, vegetation overgrowth
- Battlefield sites: Siege damage, fire damage
- Ancient ruins: Maximum degradation, only foundations remain

### Implementation Priority (Original Proposal)

1. **Phase 1**: Extend existing condition system
   - Add ConditionLevel enum ✅ **DONE IN TACTICAL FEATURE**
   - Implement getConditionLevel() method ✅ **DONE IN TACTICAL FEATURE**
   - Update cover calculations ✅ **DONE IN TACTICAL FEATURE**

2. **Phase 2**: Damage types
   - Create DamageType enum ⏳ **DEFERRED TO PHASE 5+**
   - Track specific damage on buildings ⏳ **DEFERRED**
   - Modify tactical properties based on damage ⏳ **DEFERRED**

3. **Phase 3**: Visual system
   - Create damage sprite variants ⏳ **DEFERRED TO PHASE 5+**
   - Implement sprite selection based on condition ⏳ **DEFERRED**
   - Add visual damage indicators ⏳ **DEFERRED**

4. **Phase 4**: Advanced features
   - Dynamic degradation during gameplay ⏳ **DEFERRED TO PHASE 5+**
   - Repair mechanics ⏳ **DEFERRED**
   - Structural collapse risks ⏳ **DEFERRED**

### Benefits

1. **Realism**: Materials remain consistent, only condition changes
2. **Tactical Depth**: Damaged walls create interesting combat scenarios ✅ **ACHIEVED**
3. **Narrative**: Ruins tell stories through their damage patterns ⏳ **FUTURE**
4. **Flexibility**: Can represent any degradation state ✅ **ACHIEVED**
5. **Extensibility**: Easy to add new damage types or conditions ✅ **DESIGNED FOR**

### Migration Path (Original)

1. Remove CRUMBLING and RUIN from MaterialType enum ✅ **COMPLETED**
2. Remove RUIN from BuildingType enum ✅ **COMPLETED**
3. Update Building.isRuin() to use condition only ✅ **COMPLETED**
4. Implement BuildingCondition class ⏳ **DEFERRED** (using simple numeric + methods instead)
5. Migrate Building.condition to use new system ✅ **COMPLETED** (kept numeric, added getConditionLevel())
6. Update tactical calculations ✅ **COMPLETED**
7. Add visual variations ⏳ **DEFERRED TO PHASE 5+**

### Related Systems
- Weather system (affects degradation rate) ⏳ **FUTURE**
- Time passage (buildings age naturally) ⏳ **FUTURE**
- Combat system (siege weapons cause damage) ⏳ **FUTURE**
- Settlement lifecycle (maintenance vs abandonment) ⏳ **FUTURE**

---

## Implementation Notes for Phase 5+

When implementing these advanced features:

### Technical Approach

1. **Start with DamageType enum**: Simple categorical tracking before complex class
2. **Keep BuildingCondition optional**: Existing numeric system should still work
3. **Migrate gradually**: Add BuildingCondition alongside numeric, deprecate numeric later
4. **Test performance**: Damage tracking adds memory overhead for every building
5. **Consider visual budget**: 5 variants × material types = many sprites needed
6. **Design for extensibility**: New damage types should be easy to add

### Compatibility Strategy

The current tactical feature (numeric condition + methods) can coexist with this system:

```typescript
// Current approach (Phase 1-4)
class Building {
  private condition: number; // 0-1
  
  getConditionLevel(): ConditionLevel {
    if (this.condition > 0.8) return ConditionLevel.EXCELLENT;
    // ...
  }
  
  getCoverModifier(): number {
    const level = this.getConditionLevel();
    // ...
  }
}

// Future approach (Phase 5+)
class BuildingCondition {
  private integrity: number; // Maps to Building.condition
  private weathering: number;
  private structuralDamage: DamageType[];
  
  getConditionLevel(): ConditionLevel {
    // Same logic as Building.getConditionLevel()
  }
}

class Building {
  private conditionObj?: BuildingCondition; // Optional, for advanced features
  private condition: number; // Keep for backward compatibility
  
  getConditionLevel(): ConditionLevel {
    return this.conditionObj?.getConditionLevel() 
      ?? this.legacyGetConditionLevel();
  }
}
```

### Data Migration

When adding BuildingCondition class:

1. **Phase A**: Add BuildingCondition as optional property
2. **Phase B**: Generate new buildings with BuildingCondition
3. **Phase C**: Migrate existing buildings (condition → BuildingCondition.integrity)
4. **Phase D**: Deprecate numeric condition
5. **Phase E**: Remove numeric condition (breaking change - major version)

### Performance Considerations

- **Memory**: BuildingCondition adds ~40 bytes per building (integrity, weathering, array, timestamp)
- **100x100 map with 50 buildings**: 2KB additional memory (negligible)
- **Serialization**: DamageType[] array needs JSON serialization
- **Rendering**: 5 variants per material = 5× sprite assets

---

## References

- **Current Implementation**: `/docs/features/planned/building-condition-tactical-system.md`
- **Building Entity**: `packages/domain/src/contexts/artificial/entities/Building.ts`
- **Tactical Integration**: `packages/domain/src/map/entities/TacticalMapTile.ts`
- **ConditionLevel Enum**: Will be at `packages/domain/src/contexts/artificial/enums/ConditionLevel.ts`
