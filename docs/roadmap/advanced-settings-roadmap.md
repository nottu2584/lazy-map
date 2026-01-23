# Advanced Settings Roadmap

This document outlines the plan to expose backend domain features as frontend customization settings, following the pattern established by the Vegetation Density Control feature.

## Overview

**Goal**: Allow users to customize tactical map generation beyond just the seed value, while maintaining deterministic generation.

**Current State**:
- ✅ Seed selection
- ✅ Map dimensions (width, height)
- ✅ Vegetation density multiplier
- ❌ TacticalMapContext control (biome, elevation, hydrology, etc.)
- ❌ Required features (roads, ruins, caves, etc.)
- ❌ Advanced vegetation parameters

**Target State**: Comprehensive customization UI with intelligent validation and user-friendly organization.

---

## Task Breakdown

### Phase 1: Backend Foundation (Critical Path)

#### Task #9: Implement Context Override Mode in backend
**Priority**: 🔴 Critical - Blocks all frontend context tasks

Allow partial TacticalMapContext overrides while maintaining seed-based generation for unspecified attributes.

**Technical Approach**:
```typescript
// New method in TacticalMapContext
static fromSeedWithOverrides(
  seed: Seed,
  overrides?: Partial<{
    biome: BiomeType;
    elevation: ElevationZone;
    hydrology: HydrologyType;
    development: DevelopmentLevel;
    season: Season;
    requiredFeatures: RequiredFeatures;
  }>
): TacticalMapContext
```

**Changes Required**:
1. `packages/domain/src/map/value-objects/TacticalMapContext.ts`:
   - Add `fromSeedWithOverrides()` static method
   - Generate base context from seed
   - Apply overrides selectively

2. `packages/application/src/map/use-cases/GenerateTacticalMapUseCase.ts`:
   - Accept optional context overrides parameter
   - Use `fromSeedWithOverrides()` instead of `fromSeed()`

3. `apps/backend/src/modules/maps/dto/generate-map.dto.ts`:
   - Add optional context override fields
   - Validation decorators for each field

4. `apps/backend/src/modules/maps/maps.controller.ts`:
   - Extract context overrides from DTO
   - Pass to use case

**Estimated Effort**: 4-6 hours

---

### Phase 2: UI/UX Planning

#### Task #10: Design Advanced Settings UI organization
**Priority**: 🟡 High - Should be designed before implementing frontend tasks

Plan the information architecture and component structure for all new settings.

**Deliverables**:
1. Wireframe/mockup of Advanced Settings panel
2. Component hierarchy diagram
3. State management strategy
4. Mobile responsive layout plan

**Design Principles**:
- Progressive disclosure (don't overwhelm beginners)
- Logical grouping (context, features, vegetation)
- Clear visual hierarchy
- Accessible keyboard navigation

**Proposed Structure**:
```
Advanced Settings
├── Map Configuration
│   ├── Name, Dimensions, Seed History (existing)
│   └── Cell Size (NEW)
├── Map Context (Override Seed Generation)
│   ├── Biome
│   ├── Elevation Zone
│   ├── Hydrology Type
│   ├── Development Level
│   └── Season
├── Environment Control
│   ├── Vegetation Density (existing)
│   └── Advanced Forestry Options (collapsible)
└── Required Features
    └── Feature toggles (road, bridge, ruins, etc.)
```

**shadcn Components**:
- Tabs or Accordion for major sections
- Select for dropdowns (biome, elevation, etc.)
- RadioGroup for season (with icons)
- Switch for boolean features
- Collapsible for advanced options

**Estimated Effort**: 3-4 hours

---

### Phase 3: Basic Customization (User-Friendly)

#### Task #7: Add Cell Size selection to frontend
**Priority**: 🟢 Medium - Useful, independent feature

**Options**: 2.5ft, 5ft (default), 10ft
**Location**: Basic Settings (alongside width/height)
**UI**: Select or radio group
**Display**: Show resulting map coverage

**Estimated Effort**: 2 hours

---

#### Task #5: Add Season selection to frontend
**Priority**: 🟢 Medium - Simple, high visual impact

**Options**: Spring 🌱, Summer 🌞, Autumn 🍂, Winter ❄️
**Location**: Map Context section
**UI**: RadioGroup with icons
**Impact**: Vegetation appearance, snow conditions

**Estimated Effort**: 2-3 hours

---

#### Task #6: Add Required Features toggles to frontend
**Priority**: 🟢 Medium - Highly useful for DMs

**Features**: Road, Bridge, Ruins, Cave, Water, Cliff
**Location**: Required Features section (collapsible)
**UI**: Switch/Checkbox toggles
**Help**: Tooltips explaining each feature

**Estimated Effort**: 3 hours

---

### Phase 4: Context Customization (Advanced)

These tasks depend on Task #9 (Context Override Mode) being complete.

#### Task #1: Add Biome selection to frontend
**Options**: Forest, Mountain, Plains, Swamp, Desert, Coastal, Underground
**UI**: Select with descriptive labels
**Validation**: Coordinate with Task #11

**Estimated Effort**: 2-3 hours

---

#### Task #2: Add Elevation Zone selection to frontend
**Options**: Lowland (0-500ft), Foothills (500-2000ft), Highland (2000-5000ft), Alpine (5000ft+)
**UI**: Select
**Validation**: No alpine + underground

**Estimated Effort**: 2 hours

---

#### Task #3: Add Hydrology Type selection to frontend
**Options**: Arid, Seasonal, Stream, River, Lake, Coastal, Wetland
**UI**: Select
**Validation**: Complex rules (see Task #11)

**Estimated Effort**: 2-3 hours

---

#### Task #4: Add Development Level selection to frontend
**Options**: Wilderness, Frontier, Rural, Settled, Urban, Ruins
**UI**: Select with descriptive subtitles
**Impact**: Building density, road presence

**Estimated Effort**: 2 hours

---

#### Task #11: Add Context Compatibility Validation to frontend
**Priority**: 🔴 Critical - Must ship with context selection

Implement real-time validation to prevent invalid combinations.

**Validation Rules**:
1. Underground ≠ Alpine elevation
2. Desert ≠ River/Lake/Wetland hydrology
3. Coastal biome → Coastal hydrology (required)
4. Swamp biome → Wetland hydrology (required)

**UI**:
- Inline error alerts
- Helpful correction suggestions
- Disable submit button if invalid
- Optional auto-correction

**Implementation**:
- `useContextValidation` hook
- Real-time validation on selection change
- Alert component for errors
- Suggested fix buttons

**Estimated Effort**: 4-5 hours

---

### Phase 5: Power User Features

#### Task #8: Add Advanced Vegetation Config options to frontend
**Priority**: 🟢 Low - For forestry enthusiasts

**Options** (all optional):
- Target Basal Area (ft²/acre)
- Average Tree Diameter (ft)
- Forest Survey Radius (tiles)

**Location**: Collapsible "Advanced Forestry Options" under Vegetation Density
**UI**: Number inputs with helpful tooltips
**Audience**: Users who understand forestry metrics

**Estimated Effort**: 3-4 hours

---

## Implementation Order

### Recommended Sequence

1. **Task #9** - Context Override Mode (backend) 🔴
2. **Task #10** - UI Design & Planning 🟡
3. **Task #7** - Cell Size (simple, independent) 🟢
4. **Task #5** - Season Selection 🟢
5. **Task #6** - Required Features 🟢
6. **Task #11** - Context Validation (foundation) 🔴
7. **Task #1** - Biome Selection
8. **Task #2** - Elevation Zone
9. **Task #3** - Hydrology Type
10. **Task #4** - Development Level
11. **Task #8** - Advanced Vegetation Config 🟢

### Milestone Definitions

**Milestone 1: Foundation Complete**
- ✅ Task #9 (Context Override Mode)
- ✅ Task #10 (UI Design)
- ✅ Task #11 (Validation Framework)

**Milestone 2: Basic Customization**
- ✅ Task #7 (Cell Size)
- ✅ Task #5 (Season)
- ✅ Task #6 (Required Features)

**Milestone 3: Full Context Control**
- ✅ Task #1 (Biome)
- ✅ Task #2 (Elevation)
- ✅ Task #3 (Hydrology)
- ✅ Task #4 (Development)

**Milestone 4: Power User Features**
- ✅ Task #8 (Advanced Vegetation)

---

## Technical Considerations

### Determinism Preservation

**Critical Requirement**: Same seed + same settings = identical map

**Implementation Strategy**:
- Context overrides must be part of generation parameters
- Backend must use overrides consistently
- Frontend must send complete configuration to backend
- No client-side randomness

### State Management

**Options**:
1. **Local Component State** (current approach)
   - Pros: Simple, no external dependencies
   - Cons: Can become complex with many settings

2. **Zustand Store** (recommended for Phase 4+)
   - Pros: Better state management, persistence support
   - Cons: Additional dependency

3. **React Context** (middle ground)
   - Pros: Built-in, suitable for moderate complexity
   - Cons: Performance considerations with many re-renders

**Recommendation**: Start with local state, migrate to Zustand if complexity grows.

### API Design

**Current Approach**: Flat DTO with optional fields
```json
{
  "seed": "goblin-ambush",
  "width": 50,
  "height": 50,
  "vegetationMultiplier": 1.5
}
```

**Extended Approach**: Nested configuration object
```json
{
  "seed": "goblin-ambush",
  "dimensions": { "width": 50, "height": 50 },
  "context": {
    "biome": "forest",
    "season": "winter"
  },
  "vegetation": {
    "densityMultiplier": 1.5
  },
  "requiredFeatures": {
    "hasRoad": true,
    "hasRuins": true
  }
}
```

**Decision**: Use nested structure for better organization and extensibility.

---

## Testing Strategy

### Unit Tests

**Backend**:
- `TacticalMapContext.fromSeedWithOverrides()` with various override combinations
- Validation logic for invalid combinations
- UseCase with partial overrides vs. full manual context

**Frontend**:
- `useContextValidation` hook with all validation rules
- Component behavior with valid/invalid selections
- State updates when changing context options

### Integration Tests

- Full map generation with context overrides
- API endpoint with nested configuration
- Determinism verification (same settings = same map)

### User Testing

- Can users find and understand advanced settings?
- Are validation errors clear and helpful?
- Does progressive disclosure work (not overwhelming)?
- Mobile/tablet usability

---

## Documentation Requirements

### User Documentation

1. **Advanced Settings Guide** (`/docs/guides/advanced-settings.md`)
   - Explanation of each setting
   - Use cases and examples
   - Validation rules and constraints

2. **Context Override Explanation**
   - Seed generation vs. manual override
   - How determinism is maintained
   - When to use each approach

3. **Required Features Guide**
   - What each feature guarantees
   - Tactical implications
   - Example scenarios

### Developer Documentation

1. **API Documentation** (OpenAPI/Swagger)
   - Updated DTO schemas
   - Validation rules
   - Example requests

2. **Architecture Decision Records**
   - Why context override pattern was chosen
   - State management decision
   - UI organization rationale

---

## Risks & Mitigation

### Risk 1: UI Complexity Overwhelms Users
**Mitigation**:
- Progressive disclosure (collapsibles)
- Beginner mode (hide advanced settings)
- Clear defaults
- Inline help and tooltips

### Risk 2: Invalid Combinations Frustrate Users
**Mitigation**:
- Real-time validation (Task #11)
- Helpful error messages
- Auto-correction suggestions
- Clear dependency explanations

### Risk 3: Performance Impact with Many Settings
**Mitigation**:
- Optimize re-renders (React.memo, useMemo)
- Debounce validation checks
- Lazy load advanced components
- Monitor bundle size

### Risk 4: Breaking Determinism
**Mitigation**:
- Comprehensive testing
- Determinism verification tests
- Document generation parameters clearly
- Version API responses

---

## Success Metrics

### User Engagement
- % of users using advanced settings
- Most popular custom settings
- Completion rate of map generation with custom context

### User Satisfaction
- Reduced support requests about map customization
- Positive feedback on control options
- Time to generate desired map type

### Technical Quality
- Zero determinism regressions
- Validation catches 100% of invalid combinations
- Build size increase < 10%
- Performance: No perceptible lag when changing settings

---

## Future Enhancements

### Post-Roadmap Ideas

1. **Preset Templates**
   - "Desert Ruins" preset
   - "Forest Ambush" preset
   - "Mountain Pass" preset
   - Save custom presets

2. **Advanced Hydrology Control**
   - Specific water feature placement
   - River path suggestions
   - Lake size control

3. **Structure Placement Hints**
   - "Place building at center"
   - "Road along edge"
   - "Ruins in northeast corner"

4. **Terrain Composition**
   - % of forest vs. plains
   - Elevation variance control
   - Water coverage percentage

5. **Weather & Time of Day**
   - Rain/fog/snow conditions
   - Dawn/day/dusk/night
   - Visibility modifiers

---

## Changelog

- **2025-01-24**: Initial roadmap created based on domain feature audit
- **Next Review**: After Task #9 completion (Context Override Mode)

---

## References

- [Vegetation Density Control Implementation](../session-review-2025-01-24.md) - Pattern to follow
- [Typography Standards](../guides/typography-standards.md) - UI component patterns
- [GitHub Issue #105](https://github.com/nottu2584/lazy-map/issues/105) - Real-time progress tracking
- [TacticalMapContext.ts](../../packages/domain/src/map/value-objects/TacticalMapContext.ts) - Domain model
- [Clean Architecture Principles](../../CLAUDE.md) - Project guidelines
