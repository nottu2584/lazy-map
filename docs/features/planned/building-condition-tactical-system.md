# Building Condition & Tactical Cover System

> Implement building condition effects on tactical gameplay while refactoring cover and condition enums to follow domain-driven design patterns.

## Status & Metadata

- **Status**: Planned
- **Priority**: Medium (Tactical gameplay enhancement + Code quality)
- **Effort**: 1-2 weeks
- **Architecture Impact**: Domain/Infrastructure (Value object refactoring + Integration)
- **Owner**: TBD
- **Related**: `/docs/archive/building-damage-system.md` (archived - contains advanced features for future phases)

## Executive Summary

This feature consolidates the cover system and integrates building condition with tactical gameplay. **Critically, it follows the MAP DOMAIN pattern** (enums used directly) rather than the USER DOMAIN pattern (enum wrappers with behavior).

**Key Insight**: The codebase has **two distinct patterns**:
1. **User Domain**: Wraps enums in value objects (UserRole, UserStatus) for identity + permissions
2. **Map Domain**: Uses enums directly (BiomeType, Season, MaterialType) for pure categorization

Building condition is a **map domain concept**, so we:
- ✅ Use `ConditionLevel` enum directly (like `BiomeType`)
- ✅ Add behavior to `Building` entity (like `TacticalMapContext.shouldHaveCliffs()`)
- ✅ Map numeric condition to enum when needed (like `TacticalMapContext.fromSeed()`)
- ❌ Do NOT create `BuildingCondition` value object wrapper (that's user domain pattern)

## Problem & Goals

### Problem Statement
The current system has inconsistencies and missed opportunities:

1. **Cover System Issues**:
   - `TacticalCoverLevel` enum defined in entity file (`TacticalMapTile.ts` lines 14-20)
   - `CoverLevel` enum defined in value object file (`TacticalProperties.ts` lines 178-185)
   - **Two different enums for the same concept** with different naming
   - Not following value object pattern used elsewhere (UserRole, UserStatus, AuthProvider)

2. **Condition System Issues**:
   - `StructureCondition` enum in domain PORT interface (`IStructuresLayerService.ts` lines 52-58)
   - `Building.condition` is numeric (0-1) but never maps to `StructureCondition`
   - `Building.isRuin()` checks condition < 0.3 but doesn't use the enum
   - Enum has 5 levels (EXCELLENT→RUINED) but no value object wrapper

3. **Tactical Integration Missing**:
   - **ALL buildings provide TOTAL cover** regardless of condition (TacticalMapTile line 353-354)
   - Damaged buildings should provide less cover (ruins vs intact walls)
   - No connection between `Building.condition` and `TacticalMapTile.coverLevel`
   - No passability differences for damaged structures

### Goals
**Phase 1**: Refactor cover and condition to follow domain patterns
- Create `Cover` value object wrapping `CoverLevel` enum (like `UserRole`)
- Create `BuildingCondition` value object wrapping `ConditionLevel` enum
- Consolidate duplicate cover enums
- Move enums to proper domain locations

**Phase 2**: Integrate building condition with tactical cover
- Pass building condition when setting tile structure
- Calculate cover modifier based on condition
- Add passability rules for damaged buildings
- Update line-of-sight for buildings with holes/gaps

**Phase 3**: Update infrastructure to use new patterns
- Modify `StructuresLayer` to pass condition to tiles
- Update `Building` entity to work with `BuildingCondition` value object
- Ensure backward compatibility during migration

### Out of Scope
- Visual sprite variations (future enhancement)
- Specific damage types (fire, siege, vegetation) - keep condition as simple number
- Complex damage tracking with history - just use condition level
- Repair mechanics or dynamic degradation during gameplay

## Current State

### Pattern Analysis: Map Domain vs User Domain

**Map Domain Patterns** (TacticalMapContext, Seed, Dimensions, TileCoordinate, TacticalProperties):
- ✅ **Enums are standalone** when used for categorization (BiomeType, Season, MaterialType)
- ✅ **Value objects wrap primitives** without enums (Seed wraps number, Dimensions wraps width/height)
- ✅ **Value objects focus on validation + calculation**, not behavior wrapping
- ✅ **Static factory methods** (TacticalMapContext.create(), Seed.fromString())
- ✅ **Domain logic methods** (shouldHaveCliffs(), getVisibilityRange(), getDefenseBonus())
- ❌ **NO enum wrapping pattern** - enums used directly in value objects and entities

**User Domain Patterns** (UserRole, UserStatus, AuthProvider):
- ✅ **Enum + Value Object wrapper** (UserRoleType enum + UserRole class)
- ✅ **Private constructor + factories** (UserRole.admin(), UserRole.user())
- ✅ **Behavioral methods** (canManageSystem(), isAdmin())
- ✅ **State validation** at construction

**Key Difference**: 
- **User domain wraps enums** because roles/statuses have identity + permissions
- **Map domain uses enums directly** because they're pure categorization (BiomeType doesn't need isForest() method, you just check `biome === BiomeType.FOREST`)

### Cover Enums (INCONSISTENT)

**Location 1** - `TacticalMapTile.ts` (lines 14-20):
```typescript
export enum TacticalCoverLevel {
  NONE = 'none',
  LIGHT = 'light',
  PARTIAL = 'partial',
  HEAVY = 'heavy',
  TOTAL = 'total'
}
```

**Location 2** - `TacticalProperties.ts` (lines 178-185):
```typescript
export enum CoverLevel {
  NONE = 'none',
  QUARTER = 'quarter',        // +2 AC (D&D 5e)
  HALF = 'half',              // +2 AC
  THREE_QUARTERS = 'three_quarters', // +5 AC
  TOTAL = 'total'
}
```

**Issue**: Two different scales! Tactical uses 5 levels (LIGHT/PARTIAL/HEAVY), Properties uses D&D terms (QUARTER/HALF/THREE_QUARTERS)

### Condition Enum (FOLLOWS MAP PATTERN CORRECTLY)

**Location** - `IStructuresLayerService.ts` (lines 52-58):
```typescript
export enum StructureCondition {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor',
  RUINED = 'ruined'
}
```

**Analysis**: 
- ✅ **Follows map domain pattern** - enums used directly for categorization
- ✅ **Similar to BiomeType, Season, MaterialType** - pure categorization without behavior
- ❌ **BUT**: Disconnected from Building.condition (numeric 0-1)
- ❌ **AND**: Not integrated with tactical cover system

### Building Entity (NUMERIC CONDITION)

**Location** - `Building.ts` (lines 13-27):
```typescript
export class Building {
  private constructor(
    // ...
    private readonly condition: number, // 0-1, 1 = perfect
    // ...
  ) {}
  
  isRuin(): boolean {
    return this.condition < 0.3 || this.type === BuildingType.RUIN;
  }
}
```

**Issue**: Numeric condition never maps to `StructureCondition` enum

### Tactical Integration (MISSING)

**Location** - `TacticalMapTile.ts` (lines 351-357):
```typescript
// Structures provide cover
if (this.hasStructure) {
  if (this.structureType === 'building') {
    this.coverLevel = TacticalCoverLevel.TOTAL;  // ❌ Always TOTAL
  } else if (this.structureType === 'wall' || this.structureType === 'bridge') {
    this.coverLevel = TacticalCoverLevel.HEAVY;
  }
}
```

**Issue**: No consideration of building condition

## Proposed Solution

Follow the **MAP DOMAIN PATTERN** (TacticalMapContext, TacticalProperties) NOT the User domain pattern.

### Architectural Decisions

**Why NOT Use Value Object Wrappers?**
1. ❌ **User domain pattern doesn't apply**: UserRole wraps enums for identity/permissions, but map enums are pure categorization
2. ✅ **Map domain uses enums directly**: BiomeType, Season, MaterialType, CoverLevel - all used without wrappers
3. ✅ **Value objects wrap primitives, not enums**: Seed wraps number, Dimensions wraps width/height, TileCoordinate wraps x/y
4. ✅ **Behavior lives in entities/value objects**: TacticalMapContext has `shouldHaveCliffs()`, TacticalProperties has `getDefenseBonus()`
5. ✅ **Simpler, more direct**: `if (condition === ConditionLevel.RUINED)` vs `if (condition.isRuined())`

**Map Domain Pattern Examples**:
```typescript
// ✅ Enums used directly for categorization
export enum BiomeType { FOREST, MOUNTAIN, PLAINS }
export enum Season { SPRING, SUMMER, AUTUMN, WINTER }
export enum MaterialType { WOOD, STONE, BRICK }

// ✅ Value objects wrap primitives with validation + calculation
export class Seed { 
  constructor(private value: number) {} 
  static fromString(str: string): Seed { ... }
}

export class TacticalMapContext {
  constructor(
    public readonly biome: BiomeType,      // ← Enum used directly
    public readonly season: Season,        // ← Enum used directly
    // ...
  ) {}
  
  shouldHaveCliffs(): boolean { ... }      // ← Behavior in value object, not enum wrapper
}
```

**Why Consolidate Cover Enums?**
- D&D-style naming (QUARTER/HALF/THREE_QUARTERS) is more standard for tactical games
- Already used in `TacticalProperties` with game logic
- `TacticalCoverLevel` can be an alias for backward compatibility

**Why Keep Numeric Condition in Building?**
- Allows smooth degradation (0.85 vs 0.84)
- Easy to age buildings gradually
- Map to `ConditionLevel` enum when needed for display/serialization
- Backward compatible

**Solution**: 
- Keep `ConditionLevel` as standalone enum (like BiomeType)
- Create `BuildingCondition` value object that wraps NUMERIC condition + provides enum mapping
- Add helper methods to Building entity, NOT to enum wrapper

### Key Components

#### 1. Consolidate Cover Enums (REFACTOR)

**Action**: Move CoverLevel to shared location, make TacticalCoverLevel an alias

**Location**: Keep `CoverLevel` in `TacticalProperties.ts` (already has D&D bonuses logic)

**In `TacticalMapTile.ts`** - Replace TacticalCoverLevel definition:
```typescript
// Before (DELETE THIS):
export enum TacticalCoverLevel {
  NONE = 'none',
  LIGHT = 'light',
  PARTIAL = 'partial',
  HEAVY = 'heavy',
  TOTAL = 'total'
}

// After (ADD THIS):
import { CoverLevel } from '../value-objects/TacticalProperties';

// Backward compatibility - map old values to new
export { CoverLevel as TacticalCoverLevel };
```

**Rationale**:
- ❌ **NO new Cover value object** - map domain uses enums directly (like BiomeType, Season)
- ✅ **CoverLevel already has behavior** in TacticalProperties.getACBonus()
- ✅ **Follows pattern**: Enums for categorization, value objects for primitive wrapping
- ✅ **Simpler**: Direct enum usage `tile.coverLevel === CoverLevel.TOTAL`

#### 2. Rename & Relocate ConditionLevel Enum (REFACTOR)

**Action**: Move `StructureCondition` from interface to proper enum location

**Location**: `packages/domain/src/contexts/artificial/enums/ConditionLevel.ts` (NEW FILE)

```typescript
/**
 * Building/structure condition levels
 * Used for categorization in map generation and tactical systems
 * Follows map domain pattern: enums used directly without wrappers
 */
export enum ConditionLevel {
  EXCELLENT = 'excellent',   // 80-100% - New or well-maintained
  GOOD = 'good',            // 60-80% - Minor wear, fully functional
  FAIR = 'fair',            // 40-60% - Visible damage, needs repair
  POOR = 'poor',            // 20-40% - Major damage, partially collapsed
  RUINED = 'ruined'         // 0-20% - Mostly collapsed, ruins
}

// Backward compatibility alias
export { ConditionLevel as StructureCondition };
```

**In `IStructuresLayerService.ts`** - Update import:
```typescript
// Before (DELETE enum definition):
export enum StructureCondition { ... }

// After (IMPORT from enums):
import { ConditionLevel, StructureCondition } from '../../../contexts/artificial/enums/ConditionLevel';
export { ConditionLevel, StructureCondition }; // Re-export for consumers
```

**Rationale**:
- ✅ **Follows map pattern**: Enums in `/enums/` folders (MaterialType, BiomeType, Season)
- ✅ **Domain interfaces shouldn't define enums**, they should import them
- ❌ **NO BuildingCondition value object wrapper** - that's user domain pattern, not map pattern
- ✅ **Behavior goes in Building entity**, not enum wrapper

#### 3. Add Helper Methods to Building Entity (NEW)

**Location**: `packages/domain/src/contexts/artificial/entities/Building.ts`

```typescript
import { ConditionLevel } from '../enums/ConditionLevel';

export class Building {
  // ... existing code ...
  
  /**
   * Get categorical condition level from numeric condition
   * Maps 0-1 numeric value to enum
   */
  getConditionLevel(): ConditionLevel {
    if (this.condition > 0.8) return ConditionLevel.EXCELLENT;
    if (this.condition > 0.6) return ConditionLevel.GOOD;
    if (this.condition > 0.4) return ConditionLevel.FAIR;
    if (this.condition > 0.2) return ConditionLevel.POOR;
    return ConditionLevel.RUINED;
  }
  
  /**
   * Get cover modifier for tactical system
   * Used to reduce cover based on building damage
   */
  getCoverModifier(): number {
    const level = this.getConditionLevel();
    switch (level) {
      case ConditionLevel.EXCELLENT: return 1.0;
      case ConditionLevel.GOOD: return 0.9;
      case ConditionLevel.FAIR: return 0.7;
      case ConditionLevel.POOR: return 0.4;
      case ConditionLevel.RUINED: return 0.1;
    }
  }
  
  /**
   * Check if building has passable gaps (poor/ruined condition)
   */
  hasPassableGaps(): boolean {
    const level = this.getConditionLevel();
    return level === ConditionLevel.POOR || level === ConditionLevel.RUINED;
  }
  
  /**
   * Check if building blocks line of sight
   * Poor/ruined buildings have gaps
   */
  blocksLineOfSight(): boolean {
    const level = this.getConditionLevel();
    return level !== ConditionLevel.POOR && level !== ConditionLevel.RUINED;
  }
  
  /**
   * Get movement cost for passing through damaged building
   */
  getPassThroughCost(): number {
    const level = this.getConditionLevel();
    switch (level) {
      case ConditionLevel.EXCELLENT:
      case ConditionLevel.GOOD:
        return Infinity; // Cannot pass through intact walls
      case ConditionLevel.FAIR:
        return 4; // Can climb/squeeze through (very difficult)
      case ConditionLevel.POOR:
        return 2; // Large gaps (difficult terrain)
      case ConditionLevel.RUINED:
        return 1.5; // Rubble (slightly difficult)
    }
  }
}
```

**Rationale**:
- ✅ **Behavior in entity** - follows TacticalMapContext pattern (shouldHaveCliffs() in value object)
- ✅ **Maps primitive to enum** - like TacticalMapContext.fromSeed()
- ✅ **No wrapper object needed** - direct enum usage is simpler
- ✅ **Single responsibility** - Building knows its own condition implications

## Implementation Plan

### Phase 1: Create Value Objects & Consolidate Enums (Days 1-2)

**Objective**: Create value objects and consolidate duplicate enums

**Deliverables**:
- [ ] Create `Cover` value object:
  - Location: `packages/domain/src/map/value-objects/Cover.ts`
  - Export from `packages/domain/src/map/value-objects/index.ts`
  - Include `applyConditionModifier()` method

- [ ] Create `BuildingCondition` value object:
  - Location: `packages/domain/src/contexts/artificial/value-objects/BuildingCondition.ts`
  - Export from `packages/domain/src/contexts/artificial/value-objects/index.ts`
  - Bidirectional conversion: numeric ↔ level

- [ ] Update `TacticalMapTile`:
  - Keep `TacticalCoverLevel` as type alias for backward compatibility
  - Add comment: `// Deprecated: Use CoverLevel from Cover value object`
  - Don't break existing code yet

- [ ] Update `IStructuresLayerService`:
  - Export `ConditionLevel` as alias: `export { ConditionLevel as StructureCondition }`
  - Add comment about migration to `BuildingCondition` value object

- [ ] Write unit tests:
  - Cover value object tests
  - BuildingCondition value object tests
  - Cover.applyConditionModifier() tests
  - BuildingCondition conversion tests

**Success Criteria**:
- Both value objects follow established patterns (UserRole, UserStatus)
- All tests pass
- No breaking changes to existing code
- TypeScript compiles successfully

### Phase 2: Integrate Condition with Tactical System (Days 3-5)

**Objective**: Connect building condition to tactical cover calculation

**Deliverables**:
- [ ] Add condition field to `TacticalMapTile`:
  ```typescript
  export class TacticalMapTile {
    // ... existing structure fields ...
    private structureCondition: number | null = null; // 0-1, from Building.condition
  }
  ```

- [ ] Update `TacticalMapTile.setStructure()` method:
  ```typescript
  // Before
  setStructure(type: string | null): void {
    this.hasStructure = type !== null;
    this.structureType = type;
    this.updateTacticalProperties();
  }

  // After
  setStructure(
    type: string | null,
    condition?: number // Numeric 0-1 from Building
  ): void {
    this.hasStructure = type !== null;
    this.structureType = type;
    this.structureCondition = condition ?? null;
    this.updateTacticalProperties();
  }
  ```

- [ ] Update `TacticalMapTile.updateTacticalProperties()`:
  ```typescript
  // Structures provide cover (now considers condition)
  if (this.hasStructure) {
    let baseCover = CoverLevel.NONE;
    
    if (this.structureType === 'building') {
      baseCover = CoverLevel.TOTAL;
      
      // Apply condition modifier if available
      if (this.structureCondition !== null) {
        const modifier = this.structureCondition;
        
        // Reduce cover based on condition
        if (modifier < 0.2) {
          baseCover = CoverLevel.QUARTER; // Ruined: minimal cover
        } else if (modifier < 0.4) {
          baseCover = CoverLevel.HALF; // Poor: half cover
        } else if (modifier < 0.6) {
          baseCover = CoverLevel.THREE_QUARTERS; // Fair: three-quarters
        }
        // Good/Excellent (>0.6): keep TOTAL cover
      }
    } else if (this.structureType === 'wall') {
      baseCover = CoverLevel.THREE_QUARTERS;
    } else if (this.structureType === 'bridge') {
      baseCover = CoverLevel.HALF;
    }

    this.coverLevel = baseCover;
  }
  ```

- [ ] Add passability logic for damaged buildings:
  ```typescript
  getStructureMovementCost(): number {
    if (!this.hasStructure || this.structureType !== 'building') {
      return 1;
    }
    
    if (this.structureCondition === null) {
      return Infinity; // Unknown condition = assume intact
    }
    
    // Use condition thresholds from ConditionLevel enum
    if (this.structureCondition > 0.6) return Infinity; // Intact walls
    if (this.structureCondition > 0.4) return 4; // Fair: very difficult
    if (this.structureCondition > 0.2) return 2; // Poor: difficult
    return 1.5; // Ruined: rubble
  }
  ```

- [ ] Add line-of-sight method:
  ```typescript
  structureBlocksLineOfSight(): boolean {
    if (!this.hasStructure || this.structureType !== 'building') {
      return false;
    }
    
    if (this.structureCondition === null) {
      return true; // Unknown = assume intact
    }
    
    // Poor/ruined have gaps
    return this.structureCondition > 0.4;
  }
  ```

- [ ] Write integration tests:
  - Building condition affects cover
  - Ruins provide QUARTER cover
  - Poor condition provides HALF cover
  - Fair condition provides THREE_QUARTERS cover
  - Good/Excellent provide TOTAL cover
  - Damaged buildings are passable
  - Line of sight through poor/ruined buildings

**Success Criteria**:
- Building condition correctly modifies cover
- Damaged buildings provide less cover than intact ones
- Ruins are passable with difficult terrain (1.5x cost)
- Tests validate all condition thresholds

### Phase 3: Update Infrastructure Layer (Days 6-7)

**Objective**: Pass building condition from generation to tiles

**Deliverables**:
- [ ] Update `StructuresLayer.generate()`:
  ```typescript
  // When placing buildings on tiles
  const building = domainBuilding; // Building entity
  const condition = building.getCondition(); // Get numeric 0-1
  const conditionLevel = building.getConditionLevel(); // Get enum
  
  // Set on tile (pass numeric condition)
  tile.setStructure('building', condition);
  
  // Store enum in StructureTileData for serialization
  structureTileData.condition = conditionLevel;
  ```

- [ ] Update `StructureTileData` interface:
  ```typescript
  import { ConditionLevel } from '../../../contexts/artificial/enums/ConditionLevel';
  
  export interface StructureTileData {
    hasStructure: boolean;
    structureType: StructureType | null;
    material: MaterialType | null;
    height: number;
    isRoad: boolean;
    isPath: boolean;
    condition: ConditionLevel | null; // Enum for serialization, null if no structure
  }
  ```

- [ ] Update `Building` entity (already added in Phase 1):
  ```typescript
  // These methods already added:
  getConditionLevel(): ConditionLevel { ... }
  getCoverModifier(): number { ... }
  hasPassableGaps(): boolean { ... }
  ```

- [ ] Write infrastructure tests:
  - Buildings generate with correct numeric condition
  - Condition flows from Building → TacticalMapTile (numeric)
  - StructureTileData stores condition as enum
  - Cover calculation uses numeric condition correctly
  - Passability based on condition works

**Success Criteria**:
- Building.condition (0-1) propagates to TacticalMapTile.structureCondition
- TacticalMapTile uses numeric condition for cover calculations
- StructureTileData serializes condition as ConditionLevel enum
- Cover system automatically adjusts based on condition
- All infrastructure tests pass

### Phase 4: Documentation & Migration Guide (Day 8)

**Objective**: Document changes and migration path

**Deliverables**:
- [ ] Create migration guide:
  ```markdown
  ## Cover System Migration

  ### TacticalCoverLevel → CoverLevel
  
  **Before**:
  \`\`\`typescript
  import { TacticalCoverLevel } from './TacticalMapTile';
  const coverLevel = TacticalCoverLevel.TOTAL;
  if (coverLevel === TacticalCoverLevel.LIGHT) { ... }
  \`\`\`

  **After**:
  \`\`\`typescript
  import { CoverLevel } from '../value-objects/TacticalProperties';
  const coverLevel = CoverLevel.TOTAL;
  if (coverLevel === CoverLevel.QUARTER) { ... } // LIGHT → QUARTER
  \`\`\`

  ### Mapping:
  - LIGHT → QUARTER (+2 AC)
  - PARTIAL → HALF (+2 AC)
  - HEAVY → THREE_QUARTERS (+5 AC)
  - TOTAL → TOTAL (untargetable)
  
  ## Condition System

  ### StructureCondition → ConditionLevel
  
  **Before**:
  \`\`\`typescript
  import { StructureCondition } from '../services/layers/IStructuresLayerService';
  \`\`\`

  **After**:
  \`\`\`typescript
  import { ConditionLevel } from '../contexts/artificial/enums/ConditionLevel';
  // Or use alias:
  import { StructureCondition } from '../contexts/artificial/enums/ConditionLevel';
  \`\`\`

  ### Building Integration
  
  \`\`\`typescript
  const building: Building;
  
  // Get numeric condition (0-1)
  const condition = building.getCondition();
  
  // Get categorical level
  const level = building.getConditionLevel(); // ConditionLevel enum
  
  // Get cover modifier for tactical
  const modifier = building.getCoverModifier(); // 0.1 to 1.0
  
  // Check passability
  if (building.hasPassableGaps()) {
    // Can move through damaged building
  }
  \`\`\`
  \`\`\`

- [ ] Update architecture docs:
  - Document enum consolidation (TacticalCoverLevel → CoverLevel)
  - Document ConditionLevel enum location move
  - Add Building.getConditionLevel() to entity docs
  - Explain map domain pattern (enums not wrapped)

- [ ] Update `building-system.md`:
  - Reference Building.getConditionLevel()
  - Link to tactical cover integration
  - Document condition → cover modifier mapping

- [ ] Delete `building-damage-system.md` (replaced by this document)

**Success Criteria**:
- Migration guide covers both enum changes
- Pattern differences (map vs user domain) documented
- All documentation updated
- Original document archived/removed

## Top Risks

1. **Breaking Changes - MEDIUM**: Changing cover system could break infrastructure code
   - **Mitigation**: Keep backward compatibility aliases, gradual migration, comprehensive tests

2. **Performance - LOW**: Value object creation overhead
   - **Mitigation**: Value objects are lightweight, frozen objects are fast, cache common instances

3. **Enum Proliferation - LOW**: Adding more enums/value objects increases complexity
   - **Mitigation**: Following established patterns reduces cognitive load, consolidating duplicates

4. **Testing Coverage - MEDIUM**: Need to test many condition + cover combinations
   - **Mitigation**: Property-based testing for condition modifiers, matrix tests for cover levels

## Success Criteria

**Functional**:
- [ ] Cover value object works like UserRole/UserStatus
- [ ] BuildingCondition bridges numeric and categorical
- [ ] Building condition affects tactical cover correctly
- [ ] Damaged buildings are passable
- [ ] Line of sight works through poor condition structures
- [ ] All tests pass

**Non-Functional**:
- [ ] Follows domain-driven design patterns
- [ ] No performance regression
- [ ] Code is more maintainable
- [ ] Documentation is complete
- [ ] Backward compatible during migration

## Notes

### Design Pattern: Domain-Specific Patterns

**Map Domain** (this feature follows this pattern):
```typescript
// ✅ Enums used directly for categorization
export enum BiomeType { FOREST, MOUNTAIN, PLAINS }
export enum Season { SPRING, SUMMER, AUTUMN, WINTER }
export enum ConditionLevel { EXCELLENT, GOOD, FAIR, POOR, RUINED }

// ✅ Value objects wrap primitives (not enums)
export class Seed {
  constructor(private value: number) {}
  static fromString(str: string): Seed { ... }
}

export class TacticalMapContext {
  constructor(
    public readonly biome: BiomeType,     // ← Direct enum usage
    public readonly season: Season        // ← Direct enum usage
  ) {}
  
  // ✅ Behavior in value object/entity, not enum wrapper
  shouldHaveCliffs(): boolean { ... }
  getVisibilityRange(): number { ... }
}

export class Building {
  constructor(private condition: number) {} // ← Primitive
  
  // ✅ Maps primitive to enum when needed
  getConditionLevel(): ConditionLevel { ... }
  
  // ✅ Behavior in entity
  getCoverModifier(): number { ... }
}
```

**User Domain** (different pattern - NOT used here):
```typescript
// Enum + wrapper pattern (for identity/permissions)
export enum UserRoleType { USER, ADMIN }

export class UserRole {
  private constructor(public readonly value: UserRoleType) {
    Object.freeze(this);
  }
  
  static user(): UserRole { ... }
  static admin(): UserRole { ... }
  
  isAdmin(): boolean { ... }
  canManageUsers(): boolean { ... }
}
```

**Why Different?**
- User roles have identity & permissions (needs wrapper)
- Map enums are pure categorization (direct usage is simpler)
- Building condition is numeric with categorical display (like temperature: 72°F = "warm")

### Condition to Cover Mapping

| Condition | Numeric Range | Cover Level | Movement Cost | Line of Sight |
|-----------|---------------|-------------|---------------|---------------|
| EXCELLENT | 0.8 - 1.0 | TOTAL | Infinity (impassable) | Blocked |
| GOOD | 0.6 - 0.8 | TOTAL | Infinity (impassable) | Blocked |
| FAIR | 0.4 - 0.6 | THREE_QUARTERS | 4x (very difficult) | Blocked |
| POOR | 0.2 - 0.4 | HALF | 2x (difficult) | Clear (gaps) |
| RUINED | 0.0 - 0.2 | QUARTER | 1.5x (rubble) | Clear (gaps) |

**Logic**:
- Good/Excellent: Intact walls provide full cover, impassable, block sight
- Fair: Visible damage, some cover, hard to climb through, still blocks sight
- Poor: Large gaps, half cover, passable with difficulty, can see through
- Ruined: Mostly rubble, minimal cover, easier passage, clear sight lines

### Backward Compatibility Strategy

**Phase 1**: Alias old enum to new (Day 1)
```typescript
// In TacticalMapTile.ts - REMOVE old enum definition
// export enum TacticalCoverLevel { ... } ← DELETE

// ADD import and alias
import { CoverLevel } from '../value-objects/TacticalProperties';
export { CoverLevel as TacticalCoverLevel }; // ← Backward compatibility
```

**Phase 2**: Update consumers gradually (Days 2-3)
```typescript
// Old code still works (uses alias)
import { TacticalCoverLevel } from './TacticalMapTile';
const level = TacticalCoverLevel.TOTAL;

// New code uses CoverLevel directly
import { CoverLevel } from '../value-objects/TacticalProperties';
const level = CoverLevel.TOTAL;
```

**Phase 3**: Deprecate alias (future release)
```typescript
/** @deprecated Use CoverLevel from TacticalProperties instead */
export { CoverLevel as TacticalCoverLevel };
```

**Phase 4**: Remove alias (breaking change - major version)
```typescript
// Remove export alias entirely
// Consumers must use CoverLevel
```

### Future Enhancements (Out of Scope)

**Phase 5+** (see `/docs/archive/building-damage-system.md` for detailed design):

- **Visual sprite variations**: 5 condition variants per material (pristine → ruins)
- **Specific damage types**: DamageType enum (fire, siege, vegetation, water, foundation)
- **Damage tracking**: BuildingCondition class with damage history
- **Weathering system**: Separate weathering property from structural integrity
- **Dynamic degradation**: ageByYears() method, maintenance tracking
- **Damage application**: applyDamage() for specific sources (battles, natural disasters)
- **Repair mechanics**: Restore condition, clear damage types
- **Structural collapse risks**: Foundation failure, progressive damage
- **Age-based generation**: Buildings degrade based on settlement age and maintenance

**Rationale for Deferral**:
The current feature focuses on **tactical gameplay integration** (condition affects cover/movement). Advanced features like damage tracking and visual variations should be added after:
1. Core tactical system is stable
2. Visual rendering system is implemented
3. Dynamic gameplay systems are designed

The archived document provides a comprehensive design for these advanced features.

### References

- Existing Value Objects: `UserRole`, `UserStatus`, `AuthProvider`, `Email`, `Password`
- CLAUDE.md: Value Object pattern (lines 137-149)
- TacticalProperties: Cover system foundation
- Building entity: Condition tracking
