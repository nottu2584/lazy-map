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

> ⚠️ **This project requires [pnpm](https://pnpm.io/) as the package manager. Using npm or yarn will fail.**

```bash
# Install pnpm globally if you haven't already
npm install -g pnpm
# or
curl -fsSL https://get.pnpm.io/install.sh | sh

# Clone and install
git clone <repository-url>
cd lazy-map
pnpm install

# Set up environment files (separate for each app)
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env
# Edit each .env file with your specific values

# Set up database services
docker-compose up -d      # Start PostgreSQL and Redis

# Start development servers
pnpm run dev

# Frontend: http://localhost:5173
# Backend API: http://localhost:3000
# API Docs: http://localhost:3000/api/docs
```

### 📦 Why pnpm?
- **Faster installs** - Efficient dependency sharing
- **Workspace support** - Perfect for monorepos
- **Strict mode** - Better dependency management
- **Smaller disk usage** - Hard-linked dependencies

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
│  │   Use Cases, Commands, Queries       │ │
│  │                                     │ │
│  │ contexts/                           │ │
│  │ ├── natural/   (forest use cases)   │ │
│  │ └── [others]/  (future contexts)    │ │
│  │                                     │ │
│  │ map/                                │ │
│  │ └── use-cases/ (core map generation) │ │
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
│  │ common/     (shared kernel)         │ │
│  │ contexts/   (bounded contexts)      │ │
│  │ ├── relief/     (terrain, topo)     │ │
│  │ ├── natural/    (forests, rivers)   │ │
│  │ ├── artificial/ (roads, buildings)  │ │
│  │ └── cultural/   (settlements)       │ │
│  │ map/        (map aggregate)         │ │
│  │ shared/     (constants, types)      │ │
│  └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────┐
│           Infrastructure Layer               │
│  ┌─────────────────────────────────────────┐ │
│  │      @lazy-map/infrastructure        │ │
│  │   Adapters, External Services        │ │
│  │                                     │ │
│  │ adapters/   (port implementations)   │ │
│  │ contexts/   (context-specific impls) │ │
│  │ map/        (map persistence)        │ │
│  │ common/     (shared infrastructure)  │ │
│  └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

### 📦 Package Structure

| Package | Purpose | Dependencies |
|---------|---------|--------------|
| **@lazy-map/domain** | Business logic, entities, rules | None (pure) |
| **@lazy-map/application** | Use cases, orchestration | Domain only |
| **@lazy-map/infrastructure** | Adapters, external APIs | Domain + Application |

### 🗂️ Project Structure

```
lazy-map/
├── apps/                          # Applications (interface layer)
│   ├── backend/                   # NestJS API server
│   │   ├── src/
│   │   │   ├── main.ts           # Application entry point
│   │   │   ├── app.module.ts     # Root module
│   │   │   ├── maps.controller.ts # Map generation endpoints
│   │   │   └── dto/              # API data transfer objects
│   │   └── test/                 # Integration tests
│   └── frontend/                 # React application  
│       ├── src/
│       │   ├── App.tsx           # Main React component
│       │   ├── main.tsx          # Application entry
│       │   └── assets/           # Static assets
│       └── public/               # Public files
├── packages/                     # Clean Architecture layers
│   ├── domain/                   # @lazy-map/domain
│   │   └── src/
│   │       ├── common/           # Shared kernel
│   │       │   ├── entities/     # Cross-context entities
│   │       │   ├── value-objects/# Common values
│   │       │   ├── services/     # Domain services
│   │       │   └── repositories/ # Repository interfaces
│   │       ├── contexts/         # Bounded contexts
│   │       │   ├── relief/       # Terrain & elevation
│   │       │   ├── natural/      # Forests, rivers, lakes
│   │       │   ├── artificial/   # Buildings, roads
│   │       │   └── cultural/     # Settlements, regions
│   │       ├── map/              # Map aggregate root
│   │       │   ├── entities/     # GridMap, MapTile
│   │       │   ├── services/     # Map generation
│   │       │   └── repositories/ # Map persistence
│   │       └── shared/           # Constants, utilities
│   ├── application/              # @lazy-map/application
│   │   └── src/
│   │       ├── common/           # Shared application logic
│   │       │   ├── ports/        # Output port interfaces
│   │       │   ├── adapters/     # Input port adapters
│   │       │   └── use-cases/    # Common use cases
│   │       ├── contexts/         # Context-specific use cases
│   │       │   └── natural/      # Forest/water use cases
│   │       └── map/              # Map-related use cases
│   │           ├── commands/     # Map generation commands
│   │           ├── queries/      # Map query operations
│   │           └── use-cases/    # Core map use cases
│   └── infrastructure/           # @lazy-map/infrastructure
│       └── src/
│           ├── adapters/         # Port implementations
│           ├── common/           # Shared infrastructure
│           ├── contexts/         # Context implementations
│           └── map/              # Map persistence
└── Configuration files (package.json, turbo.json, etc.)
```

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

### 🏗️ Recent Architecture Refactoring

This project has been refactored to follow **Clean Architecture** and **Domain-Driven Design** principles:

**✅ What was done:**
- **Context-based organization** - Domain logic organized by bounded contexts (relief, natural, artificial, cultural)
- **Clean dependency boundaries** - Each layer only depends on inner layers
- **Monorepo structure** - Separate packages for each architectural layer
- **Seeded generation** - Deterministic map generation with coordinated randomization
- **Removed obsolete folders** - Cleaned up old structure artifacts

**🎯 Current Architecture Benefits:**
- **Domain-First** - Business rules are independent and testable
- **Context Boundaries** - Clear separation of concerns by domain area  
- **Type Safety** - Full TypeScript coverage with strict configuration
- **Testability** - Each layer can be tested in isolation
- **Maintainability** - Clear structure makes changes predictable

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

## 🗄️ Database Setup

The project uses **PostgreSQL** for data persistence and **Redis** for caching. The quickest way to get started is with Docker:

```bash
# Start database services only
docker-compose up -d

# Or start full application stack (with apps)
docker-compose -f docker-compose.app.yml up -d

# Run migrations (if any)
pnpm run migration:run
```

**Note:** There are two Docker configurations:
- `docker-compose.yml` - Database services only (PostgreSQL, Redis)
- `docker-compose.app.yml` - Full stack including backend and frontend applications

**📖 For detailed database setup, configuration, and production deployment, see [DATABASE_SETUP.md](./docs/DATABASE_SETUP.md)**

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [CLAUDE.md](./CLAUDE.md) | **Complete architecture guide** |
| [DATABASE_SETUP.md](./docs/DATABASE_SETUP.md) | **Database configuration and deployment** |
| [NAMING_CONVENTIONS.md](./docs/NAMING_CONVENTIONS.md) | **File naming standards and patterns** |
| [GOOGLE_OAUTH_INTEGRATION_PLAN.md](./docs/GOOGLE_OAUTH_INTEGRATION_PLAN.md) | **Google Sign-In integration blueprint** |
| [ENVIRONMENT_STRATEGY.md](./docs/ENVIRONMENT_STRATEGY.md) | **Environment file separation strategy** |
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

Environment files are separated by application for better security and deployment flexibility:

**Backend** (`apps/backend/.env`):
```env
# Application
NODE_ENV=development
PORT=3000

# JWT Authentication
JWT_SECRET=your-secret-key-here-change-in-production

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

**Frontend** (`apps/frontend/.env`):
```env
# Currently no environment variables in use
# The frontend will use configuration when OAuth is integrated:
# VITE_API_URL=http://localhost:3000/api
# VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

**Note**: The application currently uses in-memory persistence. Database configuration (PostgreSQL) will be added when persistence is implemented.

## 🤝 Contributing

1. **Follow Clean Architecture** - Respect dependency boundaries
2. **Domain-First Development** - Start with business concepts
3. **Test Coverage** - Maintain comprehensive testing
4. **Type Safety** - Leverage TypeScript fully
5. **Documentation** - Update docs with changes
6. **Naming Conventions** - Follow patterns in [NAMING_CONVENTIONS.md](./docs/NAMING_CONVENTIONS.md)

### Code Style
- **ESLint + Prettier** - Automated formatting
- **Conventional Commits** - Structured commit messages
- **TypeScript Strict** - No `any` types allowed

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details.

---

**Built with Clean Architecture principles for maintainable, testable, and scalable battlemap generation** ⚔️