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
**Rule**: One file = One responsibility

❌ **Bad Example**:
```typescript
// MathematicalConcepts.ts (3 different responsibilities)
export class Range { /*...*/ }          // Math operations
export class NoiseGenerator { /*...*/ }  // Noise algorithms  
export class MathOperations { /*...*/ }  // Utility functions
```

✅ **Good Example**:
```typescript
// Range.ts - Only range operations
export class Range { /*...*/ }

// NoiseGenerator.ts - Only noise generation
export class NoiseGenerator { /*...*/ }

// MathematicalDomainService.ts - Only domain math utilities
export class MathematicalDomainService { /*...*/ }
```

### 2. **Clean Architecture Layers**
**Rule**: Respect dependency direction

```
Domain ← Application ← Infrastructure
  ↑         ↑            ↑
  Pure    Use Cases   External
```

✅ **Correct Placement**:
- **Value Objects** (`/value-objects/`) = Single domain concepts (Position, Range, Seed)
- **Domain Services** (`/services/`) = Complex business logic (SeedService, RandomGeneration)
- **Application Services** = Use cases and orchestration

❌ **Wrong**: Value object with orchestration logic
✅ **Right**: Simple value object + separate domain service

### 3. **File Organization**
**Rules**:
- File name = What it contains
- Split when >100 lines OR multiple concepts
- Specific imports (not `import *`)

**Domain Contexts**:
- `relief/` = Terrain, elevation, topography
- `natural/` = Forests, rivers, vegetation  
- `artificial/` = Buildings, roads, structures
- `cultural/` = Settlements, territories

### 4. **Dependencies**
**Strict Rules** (enforced by build):
- ✅ Domain → Nothing
- ✅ Application → Domain only  
- ✅ Infrastructure → Domain + Application
- ❌ **NEVER** reverse these

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

## 🎮 Key Features

**Deterministic Generation**: 
- Same seed = identical map every time
- Perfect for testing and reproducible sessions
- String seeds work: "my-awesome-dungeon" → unique map

**Clean Separation**:
- Business logic isolated in domain layer
- Easy to test, modify, and extend
- Clear boundaries between concerns

---

*This guide ensures consistent, maintainable code following Clean Architecture principles. When in doubt, favor smaller, focused files over large ones with multiple responsibilities.*