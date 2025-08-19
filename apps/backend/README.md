# Lazy Map Backend

NestJS API server for the Lazy Map battlemap generation system.

## Overview

This backend application serves as the **Infrastructure and Interface layers** in our Clean Architecture setup, providing:

- **REST API** endpoints for map generation and management
- **Map Generation Services** implementation using the domain layer
- **Persistence** for generated maps and user data
- **External Integrations** for export formats and cloud storage

## Architecture Role

```
┌─────────────────┐
│   Frontend      │ (React App)
└─────────────────┘
         │ HTTP/REST
         ▼
┌─────────────────┐
│   Backend       │ ◄── YOU ARE HERE
│   (NestJS)      │ 
└─────────────────┘
         │
         ▼
┌─────────────────┐
│   Packages      │
│   - Domain      │ (Business Logic)
│   - Application │ (Use Cases) 
│   - Infra       │ (Implementations)
└─────────────────┘
```

## Key Features

### Map Generation API
- **POST /maps/generate** - Create new battlemaps with customizable settings
- **GET /maps/:id** - Retrieve existing maps
- **GET /maps** - List maps with filtering and pagination
- **Seeded Generation** - Deterministic map creation for reproducible results

### Export Capabilities
- **PNG/JPEG** - Raster image exports for immediate use
- **SVG** - Vector graphics for scalable printing
- **JSON** - Raw map data for external tools
- **PDF** - Print-ready formats with grid overlays

## Quick Start

```bash
# Install dependencies (from project root)
pnpm install

# Start in development mode
pnpm --filter backend start:dev

# Or from this directory
cd apps/backend
pnpm start:dev
```

The API will be available at `http://localhost:3000` with Swagger documentation at `/api/docs`.

## API Endpoints

### Map Generation
```http
POST /maps/generate
Content-Type: application/json

{
  "name": "Forest Encounter",
  "width": 20,
  "height": 15,
  "seed": "forest-battle-01",
  "generateForests": true,
  "forestSettings": {
    "forestDensity": 0.3,
    "treeDensity": 0.7
  }
}
```

### Health Check
```http
GET /health
```

## Development

### Running Tests
```bash
# Unit tests
pnpm test

# End-to-end tests
pnpm test:e2e

# Test coverage
pnpm test:cov

# Watch mode
pnpm test:watch
```

### Code Quality
```bash
# Lint
pnpm lint

# Format
pnpm format

# Type checking
pnpm build
```

## Configuration

The backend uses environment-based configuration:

```env
# Port
PORT=3000

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/lazymap

# External APIs
CLOUD_STORAGE_BUCKET=lazy-map-exports
```

## Dependencies

- **@lazy-map/domain** - Core business logic and entities
- **@lazy-map/application** - Use cases and application services  
- **@lazy-map/infrastructure** - Infrastructure implementations
- **NestJS** - Progressive Node.js framework
- **class-validator** - Validation decorators
- **Swagger** - API documentation

## Related Documentation

- [Main Project Documentation](../../CLAUDE.md) - Architecture overview
- [Frontend Documentation](../frontend/README.md) - React application
- [Domain Package](../../packages/domain/) - Business logic
- [API Documentation](http://localhost:3000/api/docs) - Interactive Swagger docs (when running)