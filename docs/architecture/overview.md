# Architecture Overview

Lazy Map follows Clean Architecture principles with Domain-Driven Design.

## Clean Architecture Layers

```
┌─────────────────────────┐
│    Delivery Layer       │  ← NestJS Controllers, React UI
├─────────────────────────┤
│   Application Layer     │  ← Use Cases, Orchestration
├─────────────────────────┤
│     Domain Layer        │  ← Business Logic, Entities
├─────────────────────────┤
│  Infrastructure Layer   │  ← External Services, Database
└─────────────────────────┘
```

### Domain Layer (Core)
- **No dependencies** - Pure business logic
- Entities: `TacticalMapTile`, `GeologicalFormation`
- Value Objects: `Position`, `Seed`, `TacticalMapContext`
- Domain Services: `NaturalLawValidator`

### Application Layer
- **Depends on**: Domain only
- Use Cases: `GenerateTacticalMapUseCase`
- Orchestrates domain logic
- Defines service interfaces (ports)

### Infrastructure Layer
- **Depends on**: Domain + Application
- Implements service interfaces
- Layer generators: `GeologyLayer`, `TopographyLayer`, etc.
- External integrations: Database, APIs

### Delivery Layer
- **Depends on**: Application
- HTTP endpoints (NestJS controllers)
- User interface (React components)
- Not the core - just the delivery mechanism

## Project Structure

```
lazy-map/
├── packages/              # Core business logic
│   ├── domain/           # Entities, value objects
│   ├── application/      # Use cases
│   └── infrastructure/   # External implementations
└── apps/                 # Delivery mechanisms
    ├── backend/          # NestJS API
    └── frontend/         # React UI
```

## Key Principles

**Dependency Rule**: Dependencies only point inward. Domain has no dependencies.

**Single Responsibility**: One file = one class/entity.

**Dependency Inversion**: Domain defines interfaces, infrastructure implements them.

**Determinism**: All operations are deterministic (same input = same output).

## Next Steps

- [Map Generation System](./map-generation.md)
- [Coding Conventions](./conventions.md)