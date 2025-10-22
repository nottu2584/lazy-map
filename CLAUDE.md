# CLAUDE.md

Guide for Claude Code (claude.ai/code) when working with this repository.

## What This Project Does

**Lazy Map** generates graphical battlemaps for tabletop games. Users input settings (size, terrain, features) and get deterministic, grid-based maps perfect for D&D/RPG sessions.

**Architecture**: Clean Architecture + Domain-Driven Design
**Tech Stack**: TypeScript monorepo with NestJS backend, React frontend

## Quick Start

```bash
# Setup everything
pnpm run setup

# Start development
pnpm run dev              # Both frontend + backend
pnpm run dev:backend      # Just NestJS server (port 3000)
pnpm run dev:frontend     # Just React app (port 5173)

# Testing & Building
pnpm test                 # All tests
pnpm build               # All packages
```

## Project Structure

```
lazy-map/
├── apps/
│   ├── backend/         # NestJS API server
│   └── frontend/        # React + Konva map viewer
└── packages/           # Clean Architecture layers
    ├── domain/         # Business logic (no dependencies)
    ├── application/    # Use cases (depends: domain)
    └── infrastructure/ # External stuff (depends: domain + application)
```

## 🏗️ Architecture Rules (MUST FOLLOW)

### 1. **Single Responsibility Principle**
**Rule**: One file = One entity/use case/service

❌ **Bad Example**:
```typescript
// WaterFeature.ts - Multiple entities (WRONG)
export class Spring { /*...*/ }
export class Pond { /*...*/ }
export class Wetland { /*...*/ }
```

✅ **Good Example**:
```typescript
// Spring.ts
export class Spring extends MapFeature { /*...*/ }

// Pond.ts
export class Pond extends MapFeature { /*...*/ }

// Wetland.ts
export class Wetland extends MapFeature { /*...*/ }
```

### 2. **Clean Architecture Flow**
**Rule**: Controllers → Use Cases → Repositories

❌ **Wrong**:
```typescript
// Controller directly using services
export class MapsController {
  private readonly seedService = new SeedService(); // WRONG!
}
```

✅ **Right**:
```typescript
// Controller using Use Case
export class MapsController {
  constructor(
    @Inject('ValidateSeedUseCase')
    private readonly validateSeedUseCase: ValidateSeedUseCase
  ) {}
}
```

### 3. **No Backwards Compatibility**
**Rule**: Remove legacy code immediately

❌ **Never keep**:
- `@deprecated` code
- "backward compatibility" comments
- Legacy wrapper services (like MapService)
- Empty/orphaned files

✅ **Do instead**:
- Clean breaks when refactoring
- Remove old code completely
- Update all references

### 4. **Domain Purity**
**Rule**: Domain entities must be deterministic

❌ **Wrong**:
```typescript
get seasonalActivity() {
  return Math.random() > 0.5 ? 'wet' : 'dry'; // NO RANDOMNESS!
}
```

✅ **Right**:
```typescript
constructor(
  // ...
  public readonly seasonalPattern: 'wet' | 'dry' // Deterministic
) {}
```

### 5. **File Organization**
**Rules**:
- **Clean imports** - No `/dist` paths
- **Consistent structure** - Follow Lake/River pattern for new entities

**Domain Contexts**:
- `relief/` = Terrain, elevation, topography
- `natural/` = Forests, rivers, **water features (Spring, Pond, Wetland)**
- `artificial/` = Buildings, roads, structures
- `cultural/` = Settlements, territories

### 6. **Dependencies**
**Strict Rules**:
- ✅ Domain → Nothing
- ✅ Application → Domain only
- ✅ Infrastructure → Domain + Application
- ❌ **NEVER** reverse these
- ❌ **NO** services in application layer (use Use Cases)

## 🎯 Domain Structure

```
packages/domain/src/
├── common/              # Shared across contexts
│   ├── entities/        # MapFeature, MapTile
│   ├── value-objects/   # Position, Dimensions, Range, Seed
│   ├── services/        # SeedService, RandomGeneration
│   └── interfaces/      # ILogger, IRandomGenerator
├── contexts/            # Business domains
│   ├── relief/         # Terrain generation
│   ├── natural/        # Forests, rivers
│   ├── artificial/     # Buildings, roads
│   └── cultural/       # Settlements
└── map/                # Map aggregate root
    ├── entities/       # MapGrid
    ├── services/       # IMapGenerationService
    └── repositories/   # IMapRepository
```

## 🔧 Development Patterns

### Adding New Features
1. **Start with Domain** - What's the core business concept?
2. **Pick Context** - Which bounded context does it belong to?
3. **Create Value Objects** - Immutable data + validation
4. **Add Domain Services** - Complex business logic
5. **Build Use Cases** - Application layer orchestration
6. **Implement Infrastructure** - External integrations

### Code Examples

**Value Object** (immutable, validated data):
```typescript
export class Position {
  private constructor(private readonly x: number, private readonly y: number) {}

  static create(x: number, y: number): Position {
    if (x < 0 || y < 0) throw new Error('Coordinates must be positive');
    return new Position(x, y);
  }

  getX(): number { return this.x; }
  getY(): number { return this.y; }
}
```

**Domain Service** (complex business logic):
```typescript
export class SeedService {
  generateSeed(input?: number | string): Seed {
    if (typeof input === 'string') return Seed.fromString(input);
    if (typeof input === 'number') return Seed.fromNumber(input);
    return Seed.createDefault();
  }
}
```

### Testing Strategy
- **Domain**: Pure unit tests (no mocks - no dependencies!)
- **Application**: Mock domain services, test orchestration
- **Infrastructure**: Integration tests with real externals
- **Deterministic**: Same seed = same map (always!)

## 🚫 Common Mistakes to Avoid

1. **Mixed Responsibilities**: Don't put multiple concepts in one file
2. **Wrong Layer**: Don't put orchestration logic in value objects
3. **Dependency Violations**: Domain must never import from application/infrastructure
4. **Large Files**: Split when >100 lines or multiple classes
5. **Generic Utils**: Use domain services instead of static utility classes
6. **Direct Service Usage**: Controllers must use Use Cases, not services
7. **Legacy Code**: Remove immediately, no backwards compatibility

## 🎮 Key Features

**Deterministic Generation**:
- Same seed = identical map every time
- Perfect for testing and reproducible sessions
- String seeds work: "my-awesome-dungeon" → unique map

**Clean Separation**:
- Business logic isolated in domain layer
- Easy to test, modify, and extend
- Clear boundaries between concerns

## 📝 Recent Clean Architecture Refactoring

**Water Features Reorganization**:
- Split `WaterFeature.ts` (345 lines, 3 entities) into:
  - `Spring.ts` - Water source features
  - `Pond.ts` - Small standing water
  - `Wetland.ts` - Marshes and swamps
- Fixed non-deterministic code (removed Math.random())
- Aligned with Lake/River entity patterns

**Legacy Code Removal**:
- Deleted `MapService` (anti-pattern wrapper)
- Removed `Tree.ts` (deprecated compatibility)
- Cleaned `application/map/services/` directory
- Eliminated all `@deprecated` code
- Replaced `isLazyMapError` with `isDomainError` throughout codebase
- Removed backwards compatibility methods from `RandomGeneratorService`

**Architecture Enforcement**:
- Controllers now only use Use Cases
- No direct service instantiation
- Clean import paths (no `/dist`)
- Strict single responsibility per file

---

*This guide ensures consistent, maintainable code following Clean Architecture principles. When in doubt, favor smaller, focused files over large ones with multiple responsibilities.*