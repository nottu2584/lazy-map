# Lazy Map

> **Deterministic tactical battlemap generator built with Clean Architecture**

Generate reproducible tactical-scale maps for D&D 5e and other tabletop RPGs. Create encounter areas with realistic terrain, buildings with interiors, and natural features - all deterministically generated from seeds.

## ✨ Features

- **🎲 Deterministic Generation** - Same seed = same map, every time
- **⚔️ Tactical Scale** - 50-100 tiles at 5ft/tile for combat encounters
- **🏰 Building Interiors** - Multi-floor structures with rooms and furnishings
- **🌳 6-Layer System** - Geology → Topography → Hydrology → Vegetation → Structures → Features
- **🏗️ Clean Architecture** - Domain-driven design, testable, maintainable
- **🌱 Memorable Seeds** - Use strings like "goblin-ambush" or "tavern-cellar"

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+**
- **pnpm** (required - npm/yarn will not work)
- **Docker** (optional, for PostgreSQL)

### Installation

```bash
# Install pnpm globally if you haven't already
npm install -g pnpm

# Clone the repository
git clone <repository-url>
cd lazy-map

# Install dependencies
pnpm install

# Set up environment files
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env

# Start development servers
pnpm dev
```

**Access Points:**
- 🎨 **Frontend**: http://localhost:5173
- 🔧 **Backend API**: http://localhost:3000
- 📚 **API Docs**: http://localhost:3000/api/docs

## 📖 Usage

### Basic Map Generation

```typescript
// Generate tactical encounter map
const map = await mapApi.generateTacticalMap({
  name: "Tavern Brawl",
  seed: "tavern-brawl-01",
  context: {
    biome: "temperate",
    elevation: "lowland",
    hydrology: "normal",
    development: "settled",  // Generates buildings
    season: "summer"
  }
});

// Forest ambush encounter
const map = await mapApi.generateTacticalMap({
  seed: "goblin-ambush",
  context: {
    biome: "forest",
    development: "wilderness",
    vegetationDensity: 0.8
  }
});
```

### Deterministic Seeds

```typescript
// String seeds for memorable, shareable maps
const map1 = await generateMap({ seed: "dragon-lair" });
const map2 = await generateMap({ seed: "dragon-lair" });
// map1 and map2 are identical

// Numeric seeds for testing
const testMap = await generateMap({ seed: 12345 });
```

### Export Formats

```typescript
// PNG for virtual tabletops
await mapApi.export(mapId, {
  format: 'png',
  scale: 2.0,
  includeGrid: true
});

// PDF for printing
await mapApi.export(mapId, {
  format: 'pdf',
  includeCoordinates: true
});

// JSON for data analysis
const mapData = await mapApi.export(mapId, { format: 'json' });
```

## 🏗️ Architecture

This project follows **Clean Architecture** principles with **Domain-Driven Design** for maximum maintainability and testability.

### Layer Structure

```
┌─────────────────────────────────────────┐
│         Interface Layer                  │
│   (Controllers, React Components)        │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│         Application Layer                │
│   (Use Cases, Commands, Queries)         │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│           Domain Layer                   │
│   (Entities, Value Objects, Rules)       │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│        Infrastructure Layer              │
│   (Database, External APIs, Adapters)    │
└─────────────────────────────────────────┘
```

### Core Principles

1. **Controllers → Use Cases → Repositories**
   - Controllers only call Use Cases
   - Never direct service instantiation
   - Clean dependency injection

2. **Single Responsibility**
   - One file = one entity/use case
   - Split files exceeding ~100 lines
   - No multi-entity files

3. **Domain Purity**
   - No randomness in domain entities
   - All entities are deterministic
   - Side effects only in infrastructure

4. **No Backwards Compatibility**
   - Clean refactoring when needed
   - Remove legacy code immediately
   - No `@deprecated` annotations

### Project Structure

> **Important**: This project follows Clean Architecture. The business logic lives in `packages/` (domain, application, infrastructure). The `apps/backend` is just the delivery mechanism (NestJS) that wires up the Clean Architecture layers.

```
lazy-map/
├── apps/                    # Applications (delivery layer)
│   ├── backend/            # NestJS API server
│   │   ├── src/
│   │   │   ├── modules/              # Feature modules (HTTP endpoints)
│   │   │   │   ├── maps/             # Map generation endpoints
│   │   │   │   ├── benchmark/        # Performance testing
│   │   │   │   ├── features/         # Feature management
│   │   │   │   ├── health/           # Health checks
│   │   │   │   ├── admin/            # Admin functionality
│   │   │   │   └── auth/             # Authentication
│   │   │   ├── common/               # Shared NestJS utilities
│   │   │   ├── application.module.ts # Wires up use cases
│   │   │   ├── infrastructure.module.ts # Wires up services
│   │   │   ├── app.module.ts        # Root module
│   │   │   └── main.ts               # Entry point
│   │   └── .env.example
│   └── frontend/           # React application
│       ├── src/
│       └── .env.example
│
├── packages/               # Clean Architecture layers (CORE)
│   ├── domain/            # Business logic (pure, no dependencies)
│   │   └── src/
│   │       ├── common/           # Shared kernel
│   │       ├── contexts/         # Bounded contexts
│   │       │   ├── relief/       # Terrain, elevation
│   │       │   ├── natural/      # Forests, water
│   │       │   ├── artificial/   # Buildings, roads
│   │       │   └── cultural/     # Settlements
│   │       └── map/              # Map aggregate root
│   │
│   ├── application/       # Use cases & orchestration
│   │   └── src/
│   │       ├── map/              # Map generation use cases
│   │       ├── features/         # Feature management
│   │       └── contexts/         # Context-specific use cases
│   │
│   └── infrastructure/    # External integrations
│       └── src/
│           ├── adapters/         # Port implementations
│           ├── persistence/      # Database
│           └── services/         # External services
│
└── docker-compose.yml     # Development services
```

### Domain Contexts

| Context | Responsibility | Key Entities |
|---------|---------------|--------------|
| **Relief** | Terrain & topography | Mountain, Hill, Valley, Plateau |
| **Natural** | Natural features | Forest, River, Lake, Spring, Pond, Wetland |
| **Artificial** | Man-made structures | Building, Road, Bridge |
| **Cultural** | Settlements & regions | Settlement, Territory, Region |

## 🛠️ Development

### Commands

```bash
# Development
pnpm dev              # Start frontend + backend
pnpm dev:backend      # Backend only (port 3000)
pnpm dev:frontend     # Frontend only (port 5173)

# Testing
pnpm test            # Run all tests
pnpm test:domain     # Domain unit tests (pure)
pnpm test:e2e        # End-to-end tests

# Building
pnpm build           # Build all packages
pnpm build:domain    # Build domain layer only

# Code Quality
pnpm lint            # ESLint + Prettier
pnpm typecheck       # TypeScript validation
pnpm format          # Auto-format code
```

### Database Options

#### Option 1: In-Memory (Default)
```bash
# No setup needed - just run the app
pnpm dev
```

#### Option 2: PostgreSQL
```bash
# Start PostgreSQL with Docker
docker-compose up -d

# Update backend/.env
USE_DATABASE=true
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=lazy_map

# Run the app
pnpm dev
```

### Environment Variables

**Backend** (`apps/backend/.env`):
```env
# Application
NODE_ENV=development
PORT=3000

# Database (optional)
USE_DATABASE=false  # Set true for PostgreSQL

# Authentication
JWT_SECRET=your-secret-key-here

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

**Frontend** (`apps/frontend/.env`):
```env
# API Configuration
VITE_API_URL=http://localhost:3000
VITE_API_TIMEOUT=30000
```

## 🧪 Testing Strategy

### Domain Tests (Pure)
```bash
pnpm --filter @lazy-map/domain test
```
- No mocks needed
- Test business logic in isolation
- Fast execution

### Application Tests
```bash
pnpm --filter @lazy-map/application test
```
- Mock repositories
- Test use case orchestration
- Verify workflows

### Integration Tests
```bash
pnpm test:e2e
```
- Full system testing
- Real database connections
- API endpoint validation

## 📚 Documentation

Full documentation available in `/docs`:

- **[Getting Started](./docs/getting-started/installation.md)** - Installation and setup
- **[Architecture Overview](./docs/architecture/overview.md)** - System design and patterns
- **[Map Generation](./docs/architecture/map-generation.md)** - 6-layer generation system
- **[Building System](./docs/architecture/building-system.md)** - Building generation with interiors
- **[Roadmap](./docs/roadmap.md)** - Development priorities

For AI agents and contributors: See [CLAUDE.md](./CLAUDE.md) for architecture rules and patterns.

## 🤝 Contributing

### Development Flow

1. **Start with Domain** - Define entities and business rules
2. **Create Use Cases** - Implement application logic
3. **Add Infrastructure** - Connect external services
4. **Build Interface** - Add controllers/UI

### Code Standards

- ✅ Follow Clean Architecture principles
- ✅ One entity/use case per file
- ✅ Write tests for new features
- ✅ Update documentation
- ❌ No backwards compatibility code
- ❌ No `Math.random()` in domain layer
- ❌ No direct service usage in controllers

See [CLAUDE.md](./CLAUDE.md) for detailed architecture rules and patterns.

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details.

---

**Built with Clean Architecture for maintainable, testable map generation** ⚔️