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

- **Node.js 20.11.0 or higher**
- **pnpm 8.0.0 or higher** (required - npm/yarn will not work)
- **Docker** (optional, for PostgreSQL)

### Installation

```bash
# Install pnpm globally if you haven't already (version 8.0.0+)
npm install -g pnpm

# Clone the repository
git clone https://github.com/nottu2584/lazy-map.git
cd lazy-map

# Install dependencies and build packages
pnpm install

# Set up environment files
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env

# Start development servers (frontend + backend)
pnpm dev
```

**Access Points:**
- 🎨 **Frontend**: http://localhost:5173
- 🔧 **Backend API**: http://localhost:3000
- 📚 **API Docs**: http://localhost:3000/api/docs

## 📖 Usage

### Basic Map Generation

```bash
# Generate via API (POST /api/maps/generate)
curl -X POST http://localhost:3000/api/maps/generate \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Tavern Brawl",
    "seed": "tavern-brawl-01",
    "biome": "forest",
    "elevation": "lowland",
    "hydrology": "stream",
    "development": "settled",
    "season": "summer",
    "width": 50,
    "height": 50
  }'
```

### Available Options

**Biome Types**: `forest`, `mountain`, `plains`, `swamp`, `desert`, `coastal`, `underground`
**Elevation Zones**: `lowland`, `foothills`, `highland`, `alpine`
**Hydrology Types**: `arid`, `seasonal`, `stream`, `river`, `lake`, `coastal`, `wetland`
**Development Levels**: `wilderness`, `frontier`, `rural`, `settled`, `urban`, `ruins`
**Seasons**: `spring`, `summer`, `autumn`, `winter`

### Configuration Multipliers

Fine-tune map generation with optional multipliers:

```json
{
  "seed": "goblin-ambush",
  "biome": "forest",
  "terrainRuggedness": 1.5,     // 0.5-2.0 (default: 1.0)
  "waterAbundance": 0.8,         // 0.5-2.0 (default: 1.0)
  "vegetationMultiplier": 1.2   // 0.0-2.0 (default: 1.0)
}
```

- **terrainRuggedness**: Controls elevation variance (0.5 = smooth, 2.0 = extreme)
- **waterAbundance**: Controls frequency of water features (0.5 = arid, 2.0 = abundant)
- **vegetationMultiplier**: Controls forest coverage (0.0 = none, 2.0 = maximum density)

### Deterministic Seeds

```typescript
// String seeds for memorable, shareable maps
const map1 = await fetch('/api/maps/generate', {
  body: JSON.stringify({ seed: "dragon-lair" })
});
const map2 = await fetch('/api/maps/generate', {
  body: JSON.stringify({ seed: "dragon-lair" })
});
// map1 and map2 are identical

// Numeric seeds for testing
const testMap = await fetch('/api/maps/generate', {
  body: JSON.stringify({ seed: 12345 })
});
```

### Saving Maps (Authenticated Users Only)

```bash
# Save a generated map (requires JWT token)
curl -X POST http://localhost:3000/api/maps/save \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "map-uuid",
    "name": "My Tavern Fight",
    "seed": "tavern-01",
    "width": 50,
    "height": 50,
    "tiles": [...]
  }'

# Get your saved maps
curl -X GET http://localhost:3000/api/maps/my-maps \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🏗️ Architecture

This project follows **Clean Architecture** principles with **Domain-Driven Design** for maximum maintainability and testability.

### Layer Structure

```
┌─────────────────────────────────────────┐
│         Interface Layer                 │
│   (Controllers, React Components)       │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│         Application Layer               │
│   (Use Cases, Commands, Queries)        │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│           Domain Layer                  │
│   (Entities, Value Objects, Rules)      │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│        Infrastructure Layer             │
│   (Database, External APIs, Adapters)   │
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
│       │   ├── components/      # UI components (shadcn/ui)
│       │   ├── hooks/           # Custom React hooks
│       │   ├── contexts/        # React Context providers
│       │   ├── services/        # API client
│       │   ├── types/           # TypeScript types
│       │   └── lib/             # Utilities
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
│   ├── infrastructure/    # External integrations
│   │   └── src/
│   │       ├── adapters/         # Port implementations
│   │       ├── persistence/      # Database
│   │       └── services/         # External services
│   │
│   └── api-contracts/     # Auto-generated API types
│       ├── src/
│       │   ├── generated/        # Generated from OpenAPI spec
│       │   └── index.ts          # Re-exports
│       └── package.json
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

### OpenAPI Type Generation

Frontend types are automatically generated from the backend's OpenAPI specification, ensuring end-to-end type safety:

```bash
# Generate types (run after backend API changes)
pnpm generate

# Watch mode (auto-regenerate on openapi.json changes)
pnpm generate:watch
```

**How it works:**
1. Backend exports `openapi.json` on startup (development mode)
2. `openapi-typescript` generates TypeScript types in `packages/api-contracts`
3. Frontend imports types from `@lazy-map/api-contracts`
4. Compile-time errors catch API changes

**Benefits:**
- ✅ Single source of truth (backend schema)
- ✅ Zero manual type duplication
- ✅ Catch breaking API changes at build time
- ✅ Full autocomplete for API requests/responses

See [api-contracts README](./packages/api-contracts/README.md) for full documentation.

## 🛠️ Development

### Commands

```bash
# Development
pnpm dev              # Start frontend + backend with Turbo
pnpm dev:backend      # Backend only (port 3000)
pnpm dev:frontend     # Frontend only (port 5173)

# Type Generation
pnpm generate         # Generate TypeScript types from OpenAPI spec
pnpm generate:watch   # Auto-regenerate on openapi.json changes

# Testing
pnpm test             # Run all tests across all packages

# Per-package testing
pnpm --filter @lazy-map/domain test          # Domain unit tests (pure)
pnpm --filter @lazy-map/application test     # Application tests
pnpm --filter @lazy-map/infrastructure test  # Infrastructure tests

# Building
pnpm build            # Build all packages with Turbo
pnpm setup            # Install deps + build all packages

# Code Quality
pnpm lint             # ESLint + oxlint
pnpm lint:fix         # Auto-fix lint issues
pnpm format           # Auto-format with Prettier
```

### Database Options

The application uses a **hybrid persistence strategy**:
- **Anonymous users**: Always use in-memory storage (ephemeral, never persists)
- **Authenticated users**: Use database storage when `USE_DATABASE=true`

This approach respects privacy (anonymous data is temporary) while providing persistence for authenticated users.

#### Option 1: In-Memory Only (Default)
```bash
# No setup needed - just run the app
# All users use in-memory storage (data lost on restart)
pnpm dev
```

#### Option 2: PostgreSQL for Authenticated Users
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

With `USE_DATABASE=true`:
- Anonymous users: Still use in-memory storage (no DB pollution)
- Authenticated users: Maps persist to PostgreSQL

### Frontend Styling

This project uses **Tailwind CSS v4** with the new simplified import system:

```css
/* apps/frontend/src/index.css */
@import "tailwindcss";  /* New v4 syntax - no PostCSS config needed */
```

Tailwind v4 handles PostCSS internally through Vite - no separate `postcss.config.js` required.

### Environment Variables

**Backend** (`apps/backend/.env`):
```env
# Application
NODE_ENV=development
PORT=3000
API_PREFIX=api

# Database
USE_DATABASE=false  # Set true for PostgreSQL

# JWT Authentication (required)
JWT_SECRET=your-secret-key-here-change-in-production

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# Discord OAuth (optional)
DISCORD_CLIENT_ID=your-discord-client-id
DISCORD_CLIENT_SECRET=your-discord-client-secret
DISCORD_OAUTH_REDIRECT_URI=http://localhost:3000/api/auth/discord/callback

# OAuth Configuration
ALLOWED_FRONTEND_URLS=http://localhost:5173,http://localhost:3001
OAUTH_TOKEN_ENCRYPTION_KEY=your-64-character-hex-string-here

# PostgreSQL (when USE_DATABASE=true)
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=lazy_map
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
- Tests: Value objects, entities, domain services

### Application Tests
```bash
pnpm --filter @lazy-map/application test
```
- Mock repositories
- Test use case orchestration
- Verify workflows
- Tests: Use cases, determinism validation

### Infrastructure Tests
```bash
pnpm --filter @lazy-map/infrastructure test
```
- Test layer generation services
- Test repository adapters
- Validate external integrations
- Tests: Layer generation, integrated scenarios

### Run All Tests
```bash
pnpm test   # Runs tests across all packages via Turbo
```

## 📚 Documentation

Full documentation available in [`/docs`](./docs/README.md):

### Getting Started
- **[Installation](./docs/getting-started/installation.md)** - Setup and run your first map
- **[Configuration](./docs/getting-started/configuration.md)** - Environment variables and options
- **[First Map](./docs/getting-started/first-map.md)** - Generate your first tactical map

### Architecture
- **[Overview](./docs/architecture/overview.md)** - Clean Architecture and system design
- **[Map Generation](./docs/architecture/map-generation.md)** - 6-layer generation system explained
- **[Conventions](./docs/architecture/conventions.md)** - Code style and naming guidelines
- **[Security](./docs/architecture/security.md)** - Security practices and considerations

### Guides
- **[Geological Formations](./docs/guides/geological-formations.md)** - Rock types and terrain features
- **[Database Setup](./docs/guides/database-setup.md)** - PostgreSQL configuration
- **[OAuth Setup](./docs/guides/oauth-setup.md)** - Google and Discord authentication
- **[Commit Message Standards](./docs/guides/commit-message-generation.md)** - Conventional commits with AI

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
- ❌ No `Math.random()` in domain layer
- ❌ No direct service usage in controllers

See [CLAUDE.md](./CLAUDE.md) for detailed architecture rules and patterns.

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details.

---

**Built with Clean Architecture for maintainable, testable map generation** ⚔️