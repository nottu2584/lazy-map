# Lazy Map

> **Deterministic tabletop RPG map generator built with Clean Architecture**

Generate beautiful, reproducible grid-based maps for D&D, Pathfinder, and other tabletop RPGs. Same seed always generates the same map - perfect for consistent gameplay and testing.

## ✨ Features

- **🎲 Deterministic Generation** - Same seed = same map, every time
- **🗺️ Rich Terrain System** - Forests, rivers, mountains, settlements with realistic transitions
- **📐 Grid-Based Design** - Optimized for virtual tabletops (Roll20, FoundryVTT)
- **🏗️ Clean Architecture** - Domain-driven, testable, maintainable
- **🌱 Seeded Randomization** - String or numeric seeds for memorable maps

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
// Simple map with string seed
const map = await mapApi.generateMap({
  name: "Goblin Ambush",
  seed: "forest-encounter-01",  // Memorable string seed
  width: 25,
  height: 20
});

// Customized terrain distribution
const map = await mapApi.generateMap({
  seed: "mountain-pass",
  width: 30,
  height: 30,
  terrainDistribution: {
    grassland: 0.3,
    forest: 0.2,
    mountain: 0.4,
    water: 0.1
  },
  generateForests: true,
  forestSettings: {
    forestDensity: 0.4,
    treeDensity: 0.8,
    treeClumping: 0.7
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

```
lazy-map/
├── apps/                    # Applications
│   ├── backend/            # NestJS API server
│   │   ├── src/
│   │   │   ├── *.controller.ts    # HTTP endpoints
│   │   │   ├── application/       # Use case providers
│   │   │   └── infrastructure/    # External services
│   │   └── .env.example
│   └── frontend/           # React application
│       ├── src/
│       └── .env.example
│
├── packages/               # Clean Architecture layers
│   ├── domain/            # Business logic (pure)
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

| Document | Description |
|----------|-------------|
| [CLAUDE.md](./CLAUDE.md) | AI agent guide & architecture details |
| [docs/DATABASE_SETUP.md](./docs/DATABASE_SETUP.md) | Database configuration guide |
| [docs/ENVIRONMENT_STRATEGY.md](./docs/ENVIRONMENT_STRATEGY.md) | Environment separation strategy |
| [docs/GOOGLE_OAUTH_INTEGRATION_PLAN.md](./docs/GOOGLE_OAUTH_INTEGRATION_PLAN.md) | OAuth implementation plan |

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