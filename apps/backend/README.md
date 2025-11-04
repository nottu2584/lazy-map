# Backend - Lazy Map API

NestJS delivery layer for the tactical battlemap generation system.

## What This Does

Provides REST API endpoints for generating tactical-scale battlemaps. This is **just the delivery mechanism** - all business logic lives in the `packages/` directory following Clean Architecture.

## Quick Start

```bash
# From project root
pnpm dev:backend

# Or standalone
cd apps/backend
pnpm start:dev
```

**Access:**
- API: http://localhost:3000
- Swagger Docs: http://localhost:3000/api/docs

## Architecture Role

This backend is the **delivery layer** in Clean Architecture:

```
Frontend (React)
    ↓ HTTP
Backend (NestJS) ← You are here
    ↓ Injects
Use Cases (packages/application)
    ↓ Uses
Domain (packages/domain)
```

**Key Principle:** NO business logic here - only HTTP handling and dependency injection.

## API Endpoints

### Generate Tactical Map
```http
POST /api/maps/tactical
{
  "seed": "goblin-ambush",
  "context": {
    "biome": "forest",
    "elevation": "midland",
    "development": "rural",
    "season": "summer"
  }
}
```

### Get Map
```http
GET /api/maps/:id
```

### Health Check
```http
GET /health
```

## Module Structure

```
src/
├── modules/           # Feature modules
│   ├── maps/         # Map generation endpoints
│   ├── admin/        # Admin endpoints
│   └── health/       # Health checks
├── common/           # Shared utilities
├── application.module.ts    # Wires use cases
├── infrastructure.module.ts # Wires services
└── main.ts          # Entry point
```

## Environment Setup

Copy `.env.example` to `.env`:

```env
NODE_ENV=development
PORT=3000
USE_DATABASE=false  # In-memory by default
```

## Development

```bash
# Tests
pnpm test
pnpm test:e2e
pnpm test:watch

# Code quality
pnpm lint
pnpm format
```

## Important Notes

1. **Controllers use @Inject** - Never instantiate services directly
2. **Controllers call Use Cases** - Not services or repositories
3. **No business logic** - Just HTTP request/response handling
4. **Modules are organizational** - Business logic is in packages/

## Related Docs

- [Project Overview](../../README.md)
- [Architecture Guide](../../CLAUDE.md)
- [API Documentation](http://localhost:3000/api/docs) (when running)