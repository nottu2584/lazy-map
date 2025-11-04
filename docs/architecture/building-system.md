# Building Generation System

Advanced building generation with realistic medieval architecture.

## Overview

The building system creates naturalistic structures with interiors, multiple floors, and period-appropriate materials. Buildings are generated deterministically from seeds and can share walls when placed adjacently.

## Architecture

### Domain Entities

#### Building
The main aggregate root representing a complete structure:
- **Floors**: Multiple levels including basements and upper floors
- **Materials**: Medieval-appropriate (wood, stone, thatch, etc.)
- **Foundation**: Based on terrain slope (flat, terraced, stilts)
- **Roof**: Style varies by building type and climate
- **Interiors**: Rooms with specific purposes and connections

#### BuildingFootprint
Immutable value object defining ground area:
- Rectangular or polygon shapes
- Minimum 5ft x 5ft (one tile)
- Shared wall detection for row houses
- Area and perimeter calculations

#### Room
Interior spaces within buildings:
- **Types**: Hall, kitchen, bedroom, storage, workshop, etc.
- **Bounds**: Position and dimensions within floor
- **Connections**: Doors/passages to adjacent rooms
- **Purpose**: Affects contents and layout

### Building Types

```typescript
enum BuildingType {
  HUT,        // 10-15ft, single room
  HOUSE,      // 15-25ft, 2-3 rooms
  COTTAGE,    // 20-30ft, 3-4 rooms
  FARMHOUSE,  // 25-35ft, 4-6 rooms
  TOWNHOUSE,  // 15-20ft wide, 2-3 floors
  MANOR,      // 40-60ft, multiple floors
  BARN,       // 20-40ft, open interior
  TAVERN,     // 30-45ft, common room + private
  CHURCH,     // 35-50ft, sanctuary + support
  TOWER,      // 10-15ft, 3-5 floors
  CASTLE      // 60-100ft, complex layout
}
```

### Materials System

Materials are selected based on:
- **Wealth Level**: Richer areas use better materials
- **Biome**: Available local resources
- **Period**: Historical accuracy
- **Determinism**: Same seed = same material

```typescript
enum MaterialType {
  WOOD_ROUGH,      // Poor areas
  WOOD_PLANKED,    // Standard construction
  STONE_ROUGH,     // Basic masonry
  STONE_CUT,       // Quality stonework
  STONE_FORTIFIED, // Military grade
  WATTLE_DAUB,     // Traditional peasant
  ADOBE,           // Desert regions
  BRICK            // Urban areas
}
```

## Generation Process

### 1. Site Analysis
```typescript
interface BuildingSite {
  position: Position;
  width: number;
  height: number;
  slope: number;
  adjacentBuildings: Building[];
  constraints: SiteConstraints;
}
```

### 2. Shell Generation
- Determine dimensions from building type
- Select appropriate materials
- Choose foundation based on slope
- Calculate orientation for sun/wind
- Add floors based on type and wealth

### 3. Interior Layout
```typescript
interface SpaceRequirements {
  requiredRooms: RoomRequirements[];
  optionalRooms: RoomRequirements[];
  minTotalArea?: number;
}
```

Room allocation follows medieval patterns:
- **Ground Floor**: Public spaces (hall, shop, kitchen)
- **Upper Floors**: Private spaces (bedrooms, studies)
- **Basement**: Storage and cellars

### 4. Shared Walls
Adjacent buildings can share walls:
- Reduces construction cost
- Creates realistic row houses
- Maintains structural integrity
- Deterministic based on position

## Settlement Integration

Buildings are placed naturalistically:
- **Near Water**: Wells and mills
- **Along Roads**: Shops and taverns
- **Elevated Sites**: Churches and manors
- **Defensible**: Towers and fortifications

### Development Levels

```typescript
enum DevelopmentLevel {
  WILDERNESS,  // No buildings
  FRONTIER,    // 1 building (cabin)
  RURAL,       // 2-3 buildings
  SETTLED,     // 8-12 buildings
  URBAN,       // 15-20 buildings
  RUINS        // 3-5 damaged buildings
}
```

## Deterministic Generation

Every aspect is seed-controlled:
- Building placement
- Material selection
- Room configuration
- Decorative elements
- Damage/wear patterns

```typescript
// Same seed always produces identical buildings
const building = await generateBuilding({
  type: BuildingType.TAVERN,
  seed: Seed.fromString("the-prancing-pony"),
  position: Position.create(50, 50),
  context: {
    biome: "temperate",
    wealthLevel: 0.6,
    period: "high_medieval"
  }
});
```

## Use Cases

### GenerateBuildingUseCase
Orchestrates complete building generation:
1. Creates building site from command
2. Generates exterior shell
3. Adds interior layout if requested
4. Validates result
5. Returns metrics

### PlanSettlementUseCase
Plans entire settlement layouts:
1. Analyzes terrain suitability
2. Places buildings based on size/period
3. Adds special buildings (market, church)
4. Optimizes shared walls
5. Adds defensive structures

## Clean Architecture

The building system follows strict Clean Architecture:

```
Domain Layer (No dependencies):
  ├── entities/Building
  ├── value-objects/BuildingFootprint
  ├── value-objects/BuildingMaterial
  └── services/IBuildingGenerationService

Application Layer (Depends on Domain):
  ├── use-cases/GenerateBuildingUseCase
  └── use-cases/PlanSettlementUseCase

Infrastructure Layer (Implements interfaces):
  └── services/BuildingGenerationService
```

## Error Handling

Uses DomainError hierarchy:
- `ValidationError`: Invalid dimensions/parameters
- `DomainRuleError`: Business rule violations
- Includes user-friendly messages
- Provides recovery suggestions

## Performance

- Single building: < 50ms
- Settlement (20 buildings): < 500ms
- Full interiors: < 100ms per building
- Memory efficient with frozen objects