# Lazy Map

> **A Clean Architecture battlemap generation system for tabletop RPGs**

Generate beautiful, customizable battlemaps with deterministic seeded generation, perfect for D&D, Pathfinder, and other tabletop RPGs.

## ✨ Features

### 🎲 **Seeded Map Generation**
- **Reproducible Maps** - Same seed always generates the same map
- **String Seeds** - Use memorable names like "forest-encounter-01"  
- **Coordinated Randomization** - Consistent results across terrain, forests, rivers
- **Perfect for Testing** - Reliable map generation for development and debugging

### 🗺️ **Rich Map Content**
- **Dynamic Terrain** - Plains, forests, mountains, water with realistic transitions
- **Natural Features** - Dense forests, winding rivers, elevation changes
- **Grid-Based Design** - Optimized for virtual tabletops (Roll20, FoundryVTT)
- **Multiple Export Formats** - PNG, PDF, SVG, and JSON data

### 🏗️ **Clean Architecture**
- **Domain-Driven Design** - Organized around business concepts
- **Testable Business Logic** - Pure domain layer with zero dependencies
- **Flexible Infrastructure** - Easy to extend and maintain
- **Type-Safe Development** - Full TypeScript coverage

## 🚀 Quick Start

```bash
# Clone and install
git clone <repository-url>
cd lazy-map
pnpm install

# Start development servers
pnpm run dev

# Frontend: http://localhost:5173
# Backend API: http://localhost:3000
# API Docs: http://localhost:3000/api/docs
```

## 🏛️ Architecture

This project follows **Clean Architecture** principles with **Domain-Driven Design**:

```
┌─────────────────────────────────────────────┐
│                Interface Layer               │
│  ┌─────────────────┐ ┌─────────────────┐   │
│  │   Frontend      │ │   Backend       │   │
│  │   (React)       │ │   (NestJS)      │   │
│  └─────────────────┘ └─────────────────┘   │
└─────────────────────────────────────────────┘
              │ HTTP/REST │
              ▼           ▼
┌─────────────────────────────────────────────┐
│             Application Layer                │
│  ┌─────────────────────────────────────────┐ │
│  │        @lazy-map/application         │ │
│  │   Use Cases, Ports, Commands         │ │
│  └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────┐
│              Domain Layer                    │
│  ┌─────────────────────────────────────────┐ │
│  │         @lazy-map/domain             │ │
│  │  Entities, Value Objects, Services   │ │
│  │                                     │ │
│  │ contexts/                           │ │
│  │ ├── relief/     (terrain, topo)     │ │
│  │ ├── natural/    (forests, rivers)   │ │
│  │ ├── artificial/ (roads, buildings)  │ │
│  │ └── cultural/   (settlements)       │ │
│  └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────┐
│           Infrastructure Layer               │
│  ┌─────────────────────────────────────────┐ │
│  │      @lazy-map/infrastructure        │ │
│  │   Persistence, External Services     │ │
│  └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

### 📦 Package Structure

| Package | Purpose | Dependencies |
|---------|---------|--------------|
| **@lazy-map/domain** | Business logic, entities, rules | None (pure) |
| **@lazy-map/application** | Use cases, orchestration | Domain only |
| **@lazy-map/infrastructure** | Data access, external APIs | Domain + Application |

## 🎮 Usage Examples

### Generate a Forest Battle Map
```typescript
const map = await mapApi.generateMap({
  name: "Goblin Ambush",
  seed: "forest-battle-01",
  width: 25, 
  height: 20,
  generateForests: true,
  forestSettings: {
    forestDensity: 0.4,
    treeDensity: 0.8,
    treeClumping: 0.7
  }
});
```

### Create Deterministic Content
```typescript
// These will ALWAYS generate identical maps
const map1 = await generateMap({ seed: "dragon-lair" });
const map2 = await generateMap({ seed: "dragon-lair" });
// map1 === map2 (content-wise)
```

### Export for Virtual Tabletops
```typescript
// PNG for Roll20/FoundryVTT
await mapApi.export(mapId, { 
  format: 'png', 
  includeGrid: true,
  scale: 2.0 
});

// PDF for printing
await mapApi.export(mapId, { 
  format: 'pdf',
  includeCoordinates: true 
});
```

## 🛠️ Development

### Prerequisites
- **Node.js 18+**
- **pnpm** (package manager)
- **TypeScript** knowledge
- Basic understanding of **Clean Architecture** concepts

### Project Commands
```bash
# Development
pnpm run dev          # Start both frontend and backend
pnpm run dev:frontend # React app only
pnpm run dev:backend  # NestJS API only

# Building
pnpm run build        # Build all packages
pnpm run build:domain # Build domain layer only

# Testing
pnpm run test         # Run all tests
pnpm run test:domain  # Domain unit tests
pnpm run test:e2e     # End-to-end tests

# Code Quality
pnpm run lint         # Lint all packages
pnpm run format       # Format code
pnpm run typecheck    # TypeScript validation
```

### Adding New Features

1. **Start with Domain** - Define entities and business rules
2. **Add Use Cases** - Implement application logic  
3. **Create Infrastructure** - Add persistence and external services
4. **Build Interface** - Add UI components and API endpoints

Example:
```typescript
// 1. Domain Entity
export class River extends MapFeature {
  constructor(
    id: FeatureId,
    private path: Position[],
    private width: number
  ) {}
}

// 2. Use Case  
export class GenerateRiverUseCase {
  async execute(command: GenerateRiverCommand) {
    // Orchestrate domain services
  }
}

// 3. Infrastructure
export class RiverRepository implements IRiverRepository {
  // Database access
}

// 4. Interface
export class RiverController {
  @Post('/rivers')
  async generateRiver(@Body() request: GenerateRiverRequest) {
    // HTTP endpoint
  }
}
```

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [CLAUDE.md](./CLAUDE.md) | **Complete architecture guide** |
| [Backend README](./apps/backend/README.md) | NestJS API documentation |
| [Frontend README](./apps/frontend/README.md) | React app documentation |

## 🧪 Testing

### Domain Tests (Pure Unit Tests)
```bash
pnpm --filter @lazy-map/domain test
```
- No mocks needed (zero dependencies)
- Test business logic in isolation
- Fast execution, comprehensive coverage

### Application Tests (Use Case Tests)  
```bash
pnpm --filter @lazy-map/application test
```
- Mock external dependencies (ports)
- Test orchestration logic
- Verify use case workflows

### Integration Tests
```bash
pnpm test:e2e
```
- Full system testing
- Real database and external services
- End-to-end user scenarios

## 🚀 Deployment

### Production Build
```bash
pnpm run build
pnpm run start:prod
```

### Docker Support
```dockerfile
FROM node:18-alpine
COPY . /app
WORKDIR /app
RUN pnpm install && pnpm build
CMD ["pnpm", "start:prod"]
```

### Environment Configuration
```env
# Backend
PORT=3000
DATABASE_URL=postgresql://...
REDIS_URL=redis://...

# Frontend  
VITE_API_URL=https://api.lazymap.com
VITE_ENABLE_ANALYTICS=true
```

## 🤝 Contributing

1. **Follow Clean Architecture** - Respect dependency boundaries
2. **Domain-First Development** - Start with business concepts
3. **Test Coverage** - Maintain comprehensive testing
4. **Type Safety** - Leverage TypeScript fully
5. **Documentation** - Update docs with changes

### Code Style
- **ESLint + Prettier** - Automated formatting
- **Conventional Commits** - Structured commit messages
- **TypeScript Strict** - No `any` types allowed

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details.

---

**Built with Clean Architecture principles for maintainable, testable, and scalable battlemap generation** ⚔️